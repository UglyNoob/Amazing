import * as mc from '@minecraft/server';
import {
    MinecraftEntityTypes,
    MinecraftItemTypes
} from '@minecraft/vanilla-data';
/*
 * Fire swords have levels. The third element of a fire sword's lore represents the level of it in the following syntax:
 * §r§6Level: §l[Level Number](Starting with 1)
 */

const FIRESOWRD_LORE_DESCRIPTION = "§r§4This sword understands fire.";
const CONVERT_ITEM_ID = MinecraftItemTypes.NetherStar;
const CONVERT_DISTANCE = 0.35; // in blocks
const FIRESWORD_NAMETAG = "§r§c§lFire Sword";

const fireSwordCooldownSymbol = Symbol("cooldown");
const fireSwordMaxCooldownSymbol = Symbol("cd");

declare module '@minecraft/server' {
    interface Player {
        [fireSwordCooldownSymbol]: number;
        [fireSwordMaxCooldownSymbol]: number;
    }
}

const FIRESWORD_TARGET_EXCLUDE = [
    "item",
    "leash_knot",
    "evocation_fang",
    MinecraftEntityTypes.Agent,
    MinecraftEntityTypes.AreaEffectCloud,
    MinecraftEntityTypes.ArmorStand,
    MinecraftEntityTypes.Arrow,
    MinecraftEntityTypes.Boat,
    MinecraftEntityTypes.ChestBoat,
    MinecraftEntityTypes.ChestMinecart,
    MinecraftEntityTypes.CommandBlockMinecart,
    MinecraftEntityTypes.DragonFireball,
    MinecraftEntityTypes.Egg,
    MinecraftEntityTypes.EnderCrystal,
    MinecraftEntityTypes.EnderPearl,
    MinecraftEntityTypes.EyeOfEnderSignal,
    MinecraftEntityTypes.Fireball,
    MinecraftEntityTypes.FireworksRocket,
    MinecraftEntityTypes.FishingHook,
    MinecraftEntityTypes.HopperMinecart,
    MinecraftEntityTypes.LightningBolt,
    MinecraftEntityTypes.LingeringPotion,
    MinecraftEntityTypes.LlamaSpit,
    MinecraftEntityTypes.Minecart,
    MinecraftEntityTypes.Npc,
    MinecraftEntityTypes.Snowball,
    MinecraftEntityTypes.SplashPotion,
    MinecraftEntityTypes.SmallFireball,
    MinecraftEntityTypes.ThrownTrident,
    MinecraftEntityTypes.Tnt,
    MinecraftEntityTypes.TntMinecart,
    MinecraftEntityTypes.TripodCamera,
    MinecraftEntityTypes.WindChargeProjectile,
    MinecraftEntityTypes.XpOrb,
].map(type => "minecraft:" + type);

function upgradeFireSword(item: mc.ItemStack) {
    if (isFireSword(item)) {
        item.setLore(["", FIRESOWRD_LORE_DESCRIPTION, `§r§6Level: §l${getFireSwordLevel(item) + 1}`]);
        return;
    }
    item.setLore(["", FIRESOWRD_LORE_DESCRIPTION, "§r§6Level: §l1"]);
    item.nameTag = FIRESWORD_NAMETAG;
}

function isFireSword(item: mc.ItemStack) {
    return item.getLore()[1] == FIRESOWRD_LORE_DESCRIPTION;
}

function getFireSwordLevel(swordItem: mc.ItemStack) {
    if (!isFireSword(swordItem)) return 0;
    return +swordItem.getLore()[2].slice(13);
}

function getFireSwordPower(level: number) {
    return {
        range: 7 + (-4 / level),
        damage: 7 + (-5 / level),
        cooldown: Math.floor(100 + (-70 / level)),
        fireLasts: 5.5 + (-3 / level)
    };
}

mc.world.beforeEvents.itemUse.subscribe(event => {
    const player = event.source;
    const level = getFireSwordLevel(event.itemStack);
    const power = getFireSwordPower(level);
    if (level == 0) return;
    if (player[fireSwordCooldownSymbol] > 0) return;

    mc.system.run(() => {
        const entities = player.dimension.getEntities({ location: player.location, maxDistance: power.range });
        for (const entity of entities) {
            if (entity == player) continue;
            if (FIRESWORD_TARGET_EXCLUDE.includes(entity.typeId)) continue;

            entity.setOnFire(power.fireLasts);
            entity.applyDamage(power.damage, { cause: mc.EntityDamageCause.fire, damagingEntity: player });
        }
        mc.world.playSound("fire.fire", player.location);
        mc.world.playSound("fire.ignite", player.location);
        mc.world.playSound("mob.ghast.fireball", player.location);

        player[fireSwordCooldownSymbol] = power.cooldown;
        player[fireSwordMaxCooldownSymbol] = power.cooldown;
    });
});

function showPlayerFireSwordCooldownStatus(player: mc.Player) {
    if (player[fireSwordCooldownSymbol] == 0) {
        player.onScreenDisplay.setActionBar(`§c§lFire Sword §bis ready`);
        return;
    }
    const length = 30;
    let redCount = Math.floor(player[fireSwordCooldownSymbol] / player[fireSwordMaxCooldownSymbol] * length);
    if (redCount < 0) redCount = 0;
    if (redCount > length) redCount = length;
    const greenCount = length - redCount;
    player.onScreenDisplay.setActionBar(`§a${'|'.repeat(greenCount)}§c${'|'.repeat(redCount)}`);
}

mc.system.runInterval(() => { // Runs every tick
    const dimensions: Set<mc.Dimension> = new Set();
    for (const player of mc.world.getAllPlayers()) {
        if (player.getGameMode() == mc.GameMode.spectator) continue;
        dimensions.add(player.dimension);

        if (player[fireSwordCooldownSymbol] === undefined) {
            player[fireSwordCooldownSymbol] = 0;
            player[fireSwordMaxCooldownSymbol] = 10; // a random positive infinie number is okay.
        }
        if (player[fireSwordCooldownSymbol] > 0) --player[fireSwordCooldownSymbol];

        const inventory = player.getComponent("minecraft:inventory")!.container!;
        const selectedItem = inventory.getItem(player.selectedSlotIndex);
        if (selectedItem && isFireSword(selectedItem)) {
            if (mc.system.currentTick % 4 == 0) {
                showPlayerFireSwordCooldownStatus(player);
            }
            if (player[fireSwordCooldownSymbol] == 0) { // Show flame particle effect
                const loc = Object.assign({}, player.location);
                const tick = mc.system.currentTick;
                loc.x += Math.sin(tick / 5);
                loc.y += tick % 60 / 30;
                loc.z += Math.cos(tick / 5);
                player.dimension.spawnParticle("minecraft:basic_flame_particle", loc);

                Object.assign(loc, player.location);
                loc.x += Math.sin(tick / 5 + Math.PI);
                loc.y += (tick + 30) % 60 / 30
                loc.z += Math.cos(tick / 5 + Math.PI);
                player.dimension.spawnParticle("minecraft:basic_flame_particle", loc);
            }
        }
    }

    for (const dimension of dimensions) {
        const itemEntities = dimension.getEntities({ type: "minecraft:item" });
        const netherStarEntities = itemEntities.filter(entity => entity.getComponent("minecraft:item")!.itemStack.typeId == CONVERT_ITEM_ID);
        for (const star of netherStarEntities) {
            const swordEntity = dimension.getEntities({ type: "minecraft:item", location: star.location, maxDistance: CONVERT_DISTANCE })
                .filter(entity => entity.getComponent("minecraft:item")!.itemStack.hasTag("minecraft:is_sword"))[0];
            if (!swordEntity) continue;
            const swordItem = swordEntity.getComponent("minecraft:item")!.itemStack;

            upgradeFireSword(swordItem);

            dimension.spawnItem(swordItem, swordEntity.location);
            swordEntity.kill();
            const starItem = star.getComponent("minecraft:item")!.itemStack;
            if (starItem.amount >= 2) {
                --starItem.amount;
                dimension.spawnItem(starItem, star.location);
            }
            star.kill();
        }
    }
});
