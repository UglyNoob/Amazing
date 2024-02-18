import {
    normalize
} from './utility.js'

import * as mc from '@minecraft/server';
import {
    MinecraftEntityTypes,
    MinecraftItemTypes
} from '@minecraft/vanilla-data';

function log(s) {
    mc.world.sendMessage(String(s)); // FOR DEBUG USE
}

const THE_STICK_ITEM = (() => {
    let item = new mc.ItemStack(MinecraftItemTypes.Stick, 1);
    item.nameTag = "§r§eA Regular Stick";
    item.setLore(["", "§r§bThe stick of §g§oNETHERITE§r§b."]);
    return item;
})();

const CONVERT_ITEM_ID = MinecraftItemTypes.NetheriteBlock;
const CONVERT_DISTANCE = 0.35; // in blocks
const POWER_COOLDOWN = 50; // in ticks
const POWER_EFFECTS_RAMGE = 5; // in blocks
const POWER_SLOWNESS_EFFECT_DURATION = 15; // in ticks
const powerCooldownSymbol = Symbol("powerCooldown");
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

/**
 * @param {mc.ItemStack} item
 */
function isTheStick(item) {
    return item.getLore()[1] == THE_STICK_ITEM.getLore()[1];
}

/**
 * @param {mc.Player} player
 */
function performPower(player) {
    let dimension = player.dimension;
    // Entities within range
    let entities = player.dimension.getEntities({
        location: player.location,
        maxDistance: POWER_EFFECTS_RAMGE
    }).filter(entity => entity != player && !POWER_TARGET_EXCLUDES.includes(entity.typeId));
    for(let entity of entities) {
        let success = false;
        try {
            let vector = normalize({
                x: entity.location.x - player.location.x,
                y: entity.location.y - player.location.y + 0.4,
                z: entity.location.z - player.location.z
            });
            for(let i in vector) vector[i] *= 2.5;
            entity.applyImpulse(vector);
            success = true;
        } catch {
            try{
                let {x, z} = normalize({
                    x: entity.location.x - player.location.x,
                    z: entity.location.z - player.location.z
                });
                entity.applyKnockback(x, z, 4, 0.7);
                success = true;
            } catch {}
        }
        if(success) {
            let times = 5;
            mc.system.run(function temp() {
                let location;
                try {
                    // entity object may be released by the game engine
                    location = entity.location;
                } catch { return; }
                location.y += 0.2;
                dimension.spawnParticle("minecraft:large_explosion", location);
                if(--times != 0) mc.system.runTimeout(temp, 2);
            });
        }
    }
}

mc.world.beforeEvents.itemUse.subscribe((event) => {
    if(!isTheStick(event.itemStack)) return;
    mc.system.run(() => {
        let player = event.source;
        let cooldown = player[powerCooldownSymbol];
        if(cooldown === undefined) return;
        if(cooldown != 0) {
            player.onScreenDisplay.setActionBar(`§1§lThe power is still under emerging... ${(cooldown / 20).toFixed(1)}s`);
            return;
        }

        performPower(player);
        player.addEffect("slowness", POWER_SLOWNESS_EFFECT_DURATION, {amplifier: 1, showParticles: false});
        mc.world.playSound("mob.enderdragon.flap", player.location);

        player.onScreenDisplay.setTitle(" ", {
            stayDuration: 5,
            fadeInDuration: 0,
            fadeOutDuration: 10,
            subtitle: "§c§lYou have released the power!"
        });

        player[powerCooldownSymbol] = POWER_COOLDOWN;
    });
});

mc.system.runInterval(() => {
    /** @type Set<mc.Dimension> */
    let dimensions = new Set();
    for(let player of mc.world.getAllPlayers()) {
        dimensions.add(player.dimension);

        if(player[powerCooldownSymbol] === undefined) {
            player[powerCooldownSymbol] = 0;
        }
        if(player[powerCooldownSymbol] > 0) --player[powerCooldownSymbol];

        if(mc.system.currentTick % 4 == 0) {
            let inventory = player.getComponent("minecraft:inventory").container;
            let selectedItem = inventory.getItem(player.selectedSlot);
            if(selectedItem && isTheStick(selectedItem)) {
                if(player[powerCooldownSymbol] == 0)
                    player.onScreenDisplay.setActionBar("§b§lThe §mpower §bis ready");
                else
                    player.onScreenDisplay.setActionBar(`§1§lThe power is still under emerging... ${(player[powerCooldownSymbol] / 20).toFixed(1)}s`);
            }
        }
    }
    for(let dimension of dimensions) {
        const convertItemEntities = dimension.getEntities({type: "minecraft:item"}).filter(i => i.getComponent("minecraft:item").itemStack.typeId == CONVERT_ITEM_ID);
        for(let convertItemEntity of convertItemEntities) {
            /** @type mc.ItemStack */
            let convertItem = convertItemEntity.getComponent("minecraft:item").itemStack;
            let convertItemAmount = convertItem.amount;
            let itemEntitiesToConvert = dimension.getEntities({
                type: "minecraft:item",
                location: convertItemEntity.location,
                maxDistance: CONVERT_DISTANCE
            }).filter(entity => {
                /** @type mc.ItemStack */
                let itemStack = entity.getComponent("minecraft:item").itemStack;
                return itemStack.typeId == THE_STICK_ITEM.typeId &&
                       !isTheStick(itemStack);
            });
            if(itemEntitiesToConvert.length == 0) continue;
            for(let itemEntityToConvert of itemEntitiesToConvert) {
                /** @type mc.ItemStack */
                let itemToConvert = itemEntityToConvert.getComponent("minecraft:item").itemStack;
                let convertAmount = Math.min(convertItem.amount, itemToConvert.amount);
                let convertedItemStack = THE_STICK_ITEM.clone();
                convertedItemStack.amount = convertAmount;

                dimension.spawnItem(convertedItemStack, itemEntityToConvert.location);
                itemEntityToConvert.kill();
                convertItemAmount -= convertAmount;
                if(convertItemAmount == 0) break;
            }
            if(convertItemAmount >= 1) {
                convertItem.amount = convertItemAmount;
                dimension.spawnItem(convertItem, convertItemEntity.location);
            }
            convertItemEntity.kill();
        }
    }
});
