import * as mc from '@minecraft/server';
import {
    Vector3Builder
} from '@minecraft/math';
import {
    MinecraftEntityTypes,
    MinecraftItemTypes
} from '@minecraft/vanilla-data';

export const SUMO_STICK_ITEM = (() => {
    const item = new mc.ItemStack(MinecraftItemTypes.Stick, 1);
    item.nameTag = "§r§fSumo Stick";
    item.setLore(["", "§r§bPush everyone"]);
    return item;
})();

const CONVERT_ITEM_ID = MinecraftItemTypes.NetheriteBlock;
const CONVERT_DISTANCE = 0.35; // in blocks
const POWER_COOLDOWN = 50; // in ticks
const POWER_EFFECTS_RAMGE = 5; // in blocks
const POWER_SLOWNESS_EFFECT_DURATION = 15; // in ticks
export const sumoStickCooldownSym = Symbol("powerCooldown");
declare module '@minecraft/server' {
    interface Player {
        [sumoStickCooldownSym]: number;
    }
}

const POWER_TARGET_EXCLUDES = [
    "item",
    "leash_knot",
    "evocation_fang",
    MinecraftEntityTypes.Agent,
    MinecraftEntityTypes.AreaEffectCloud,
    MinecraftEntityTypes.EnderCrystal,
    MinecraftEntityTypes.EyeOfEnderSignal,
    MinecraftEntityTypes.LightningBolt,
    MinecraftEntityTypes.Npc,
    MinecraftEntityTypes.ThrownTrident,
    MinecraftEntityTypes.TripodCamera,
    MinecraftEntityTypes.XpOrb
].map(type => "minecraft:" + type);

export function isItemSumoStick(item: mc.ItemStack) {
    return item.getLore()[1] == SUMO_STICK_ITEM.getLore()[1];
}

function performPower(player: mc.Player) {
    const dimension = player.dimension;
    // Entities within range
    const entities = player.dimension.getEntities({
        location: player.location,
        maxDistance: POWER_EFFECTS_RAMGE
    }).filter(entity => entity != player && !POWER_TARGET_EXCLUDES.includes(entity.typeId));
    for (let entity of entities) {
        let success = false;
        try {
            const vector = new Vector3Builder({
                x: entity.location.x - player.location.x,
                y: entity.location.y - player.location.y + 0.4,
                z: entity.location.z - player.location.z
            }).normalize().scale(1.75);
            entity.applyImpulse(vector);
            success = true;
        } catch {
            try {
                const { x, z } = new Vector3Builder({
                    x: entity.location.x - player.location.x,
                    y: 0,
                    z: entity.location.z - player.location.z
                }).normalize();
                entity.applyKnockback(x, z, 4, 0.7);
                success = true;
            } catch { }
        }
        if (success) {
            let times = 5;
            mc.system.run(function temp() {
                if (!entity.isValid()) return;
                let location;
                // entity object may be released by the game engine
                location = entity.location;
                location.y += 0.2;
                dimension.spawnParticle("minecraft:large_explosion", location);
                if (--times != 0) mc.system.runTimeout(temp, 2);
            });
        }
    }
}

mc.world.beforeEvents.itemUse.subscribe((event) => {
    if (!isItemSumoStick(event.itemStack)) return;
    mc.system.run(() => {
        const player = event.source;
        const cooldown = player[sumoStickCooldownSym];
        if (cooldown === undefined) return;
        if (cooldown != 0) {
            player.onScreenDisplay.setActionBar(`§1§lEmerging... ${(cooldown / 20).toFixed(1)}s`);
            return;
        }

        performPower(player);
        player.addEffect("slowness", POWER_SLOWNESS_EFFECT_DURATION, { amplifier: 1, showParticles: false });
        mc.world.playSound("mob.enderdragon.flap", player.location);

        player.onScreenDisplay.setTitle(" ", {
            stayDuration: 5,
            fadeInDuration: 0,
            fadeOutDuration: 10,
            subtitle: "§c§lPower released!"
        });

        player[sumoStickCooldownSym] = POWER_COOLDOWN;
    });
});

mc.system.runInterval(() => {
    const dimensions: Set<mc.Dimension> = new Set();
    for (const player of mc.world.getAllPlayers()) {
        if (player.getGameMode() == mc.GameMode.spectator) continue;
        dimensions.add(player.dimension);

        if (player[sumoStickCooldownSym] === undefined) {
            player[sumoStickCooldownSym] = 0;
        }
        if (player[sumoStickCooldownSym] > 0) --player[sumoStickCooldownSym];

        if (mc.system.currentTick % 4 == 0) {
            const inventory = player.getComponent("minecraft:inventory")!.container!;
            const selectedItem = inventory.getItem(player.selectedSlotIndex);
            if (selectedItem && isItemSumoStick(selectedItem)) {
                if (player[sumoStickCooldownSym] == 0)
                    player.onScreenDisplay.setActionBar("§l§eSumo Stick §bis ready");
                else
                    player.onScreenDisplay.setActionBar(`§1§lEmerging... ${(player[sumoStickCooldownSym] / 20).toFixed(1)}s`);
            }
        }
    }
    for (const dimension of dimensions) {
        const convertItemEntities = dimension.getEntities({ type: "minecraft:item" }).
            filter(i => i.getComponent("minecraft:item")!.itemStack.typeId == CONVERT_ITEM_ID);
        for (const convertItemEntity of convertItemEntities) {
            const convertItem = convertItemEntity.getComponent("minecraft:item")!.itemStack;
            let convertItemAmount = convertItem.amount;
            const itemEntitiesToConvert = dimension.getEntities({
                type: "minecraft:item",
                location: convertItemEntity.location,
                maxDistance: CONVERT_DISTANCE
            }).filter(entity => {
                const itemStack = entity.getComponent("minecraft:item")!.itemStack;
                return itemStack.typeId == SUMO_STICK_ITEM.typeId &&
                    !isItemSumoStick(itemStack);
            });
            if (itemEntitiesToConvert.length == 0) continue;
            for (const itemEntityToConvert of itemEntitiesToConvert) {
                const itemToConvert = itemEntityToConvert.getComponent("minecraft:item")!.itemStack;
                const convertedItemStack = SUMO_STICK_ITEM.clone();
                let convertAmount = Math.min(convertItem.amount, itemToConvert.amount);
                convertedItemStack.amount = convertAmount;

                dimension.spawnItem(convertedItemStack, itemEntityToConvert.location);
                itemEntityToConvert.kill();
                convertItemAmount -= convertAmount;
                if (convertItemAmount == 0) break;
            }
            if (convertItemAmount >= 1) {
                convertItem.amount = convertItemAmount;
                dimension.spawnItem(convertItem, convertItemEntity.location);
            }
            convertItemEntity.kill();
        }
    }
});
