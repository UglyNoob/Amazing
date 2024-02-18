import * as mc from '@minecraft/server';
import {
    MinecraftEntityTypes,
    MinecraftItemTypes
} from '@minecraft/vanilla-data';
function log(s) {
    mc.world.sendMessage(String(s)); // DEBUG USE
}
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
    MinecraftEntityTypes.XpOrb
].map(type => "minecraft:" + type);

/**
 * @param {mc.ItemStack} item
 */
function upgradeFireSword(item) {
    if(isFireSword(item)) {
        item.setLore(["", FIRESOWRD_LORE_DESCRIPTION, `§r§6Level: §l${getFireSwordLevel(item) + 1}`]);
        return;
    }
    item.setLore(["", FIRESOWRD_LORE_DESCRIPTION, "§r§6Level: §l1"]);
    item.nameTag = FIRESWORD_NAMETAG;
}

/**
 * @param {mc.ItemStack} item
 */
function isFireSword(item) {
    return item.getLore()[1] == FIRESOWRD_LORE_DESCRIPTION;
}
/**
 * @param {mc.ItemStack} swordItem
 */
function getFireSwordLevel(swordItem) {
    if(!isFireSword(swordItem)) return 0;
    return +swordItem.getLore()[2].slice(13);
}

/**
 * @param {number} level
 */
function getFireSwordPower(level) {
    return {
        range: 7 + (-4/level),
        damage: 7 + (-5/level),
        cooldown: Math.floor(100 + (-70/level)),
        fireLasts: 5.5 + (-3/level)
    };
}

mc.world.beforeEvents.itemUse.subscribe(event => {
    let player = event.source;
    let level = getFireSwordLevel(event.itemStack);
    let power = getFireSwordPower(level);
    if(level == 0) return;
    if(player[fireSwordCooldownSymbol] > 0) return;

    mc.system.run(() => {
        let entities = player.dimension.getEntities({location: player.location, maxDistance: power.range});
        for(let entity of entities) {
            if(entity == player) continue;
            if(FIRESWORD_TARGET_EXCLUDE.includes(entity.typeId)) continue;

            entity.setOnFire(power.fireLasts);
            entity.applyDamage(power.damage, {cause: "fire", damagingEntity: player});
        }
        mc.world.playSound("fire.fire", player.location);
        mc.world.playSound("fire.ignite", player.location);
        mc.world.playSound("mob.ghast.fireball", player.location);

        player[fireSwordCooldownSymbol] = power.cooldown;
        player[fireSwordMaxCooldownSymbol] = power.cooldown;
    });
});

/**
 * @param {mc.Player} player
 */
function showPlayerFireSwordCooldownStatus(player) {
    if(player[fireSwordCooldownSymbol] == 0) {
        player.onScreenDisplay.setActionBar(`§b§lThe §cFire Sword §bis ready`);
        return;
    }
    const length = 30;
    let redCount = Math.floor(player[fireSwordCooldownSymbol] / player[fireSwordMaxCooldownSymbol] * length);
    if(redCount < 0) redCount = 0;
    if(redCount > length) redCount = length;
    let greenCount = length - redCount;
    player.onScreenDisplay.setActionBar(`§a${'|'.repeat(greenCount)}§c${'|'.repeat(redCount)}`);
}

mc.system.runInterval(() => { // Runs every tick
    /** @type Set<mc.Dimension> */
    let dimensions = new Set();
    for(let player of mc.world.getAllPlayers()) {
        dimensions.add(player.dimension);

        if(player[fireSwordCooldownSymbol] === undefined) {
            player[fireSwordCooldownSymbol] = 0;
            player[fireSwordMaxCooldownSymbol] = 10; // a random positive infinie number is okay.
        }
        if(player[fireSwordCooldownSymbol] > 0) --player[fireSwordCooldownSymbol];

        if(mc.system.currentTick % 4 == 0) {
            /** @type mc.Container */
            let inventory = player.getComponent("minecraft:inventory").container;
            let selectedItem = inventory.getItem(player.selectedSlot);
            if(selectedItem && isFireSword(selectedItem)) {
                showPlayerFireSwordCooldownStatus(player);
            }
        }
    }

    for(let dimension of dimensions) {
        let itemEntities = dimension.getEntities({type: "minecraft:item"});
        let netherStarEntities = itemEntities.filter(entity => entity.getComponent("minecraft:item").itemStack.typeId == CONVERT_ITEM_ID);
        for(let star of netherStarEntities) {
            /** @type mc.Entity*/
            let swordEntity = dimension.getEntities({type: "minecraft:item", location: star.location, maxDistance: CONVERT_DISTANCE})
                .filter(entity => entity.getComponent("minecraft:item").itemStack.hasTag("minecraft:is_sword"))[0];
            if(!swordEntity) continue;
            /** @type mc.ItemStack */
            let swordItem = swordEntity.getComponent("minecraft:item").itemStack;

            upgradeFireSword(swordItem);

            dimension.spawnItem(swordItem, swordEntity.location);
            swordEntity.kill();
            /** @type mc.ItemStack */
            let starItem = star.getComponent("minecraft:item").itemStack;
            if(starItem.amount >= 2) {
                --starItem.amount;
                dimension.spawnItem(starItem, star.location);
            }
            star.kill();
        }
    }
});
