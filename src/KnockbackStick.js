import {
    normalize
} from './utility.js'

import * as mc from '@minecraft/server';

function log(s) {
    mc.world.sendMessage(String(s)); // DEBUG USE
}

const THE_STICK_ITEM = (() => {
    let item = new mc.ItemStack("minecraft:stick", 1);
    item.nameTag = "§r§eA Regular Stick";
    item.setLore(["", "§r§bThis stick has §g§oSUPER POWER§r§b.", "§rDon't craft with it! Try using it on somewhere."]);
    return item;
})();

/**
 * @param {mc.ItemStack} item
 */
function isTheStick(item) {
    return item.getLore()[1] == THE_STICK_ITEM.getLore()[1];
}

const POWER_COOLDOWN = 50; // in ticks
const POWER_EFFECTS_RAMGE = 5; // in blocks
const POWER_SLOWNESS_EFFECT_DURATION = 15; // in ticks
const powerCooldownSymbol = Symbol("powerCooldown");
const POWER_IGNORES = [
    "minecraft:leash_knot",
    "minecraft:thrown_trident",
    "minecraft:small_fireball",
    "minecraft:fireball",
    "minecraft:evocation_fang"
];

/**
 * @param {mc.Player} player
 */
function performPower(player) {
    let dimension = player.dimension;
    // Entities within range
    let entities = player.dimension.getEntities({
        location: player.location,
        maxDistance: POWER_EFFECTS_RAMGE
    }).filter(entity => entity != player && !POWER_IGNORES.includes(entity.typeId));
    for(let entity of entities) {
        let isApplied = false;
        try {
            let vector = normalize({
                x: entity.location.x - player.location.x,
                y: entity.location.y - player.location.y + 0.4,
                z: entity.location.z - player.location.z
            });
            for(let i in vector) vector[i] *= 2.5;
            entity.applyImpulse(vector);
            isApplied = true;
        } catch {
            try{
                let {x, z} = normalize({
                    x: entity.location.x - player.location.x,
                    z: entity.location.z - player.location.z
                });
                entity.applyKnockback(x, z, 4, 0.7);
                isApplied = true;
            } catch {}
        }
        if(isApplied) {
            let times = 5;
            mc.system.run(function temp() {
                let location;
                try {
                    location = entity.location;
                } catch { return; }
                location.y += 0.2;
                dimension.spawnParticle("minecraft:large_explosion", location);
                if(--times != 0) mc.system.runTimeout(temp, 2);
            });
        }
    }
    player.addEffect("slowness", POWER_SLOWNESS_EFFECT_DURATION, {amplifier: 1, showParticles: false});
    mc.world.playSound("mob.enderdragon.flap", player.location);
}

mc.world.beforeEvents.itemUse.subscribe((event) => {
    switch(event.itemStack.typeId) {
        case "minecraft:diamond":
            /** @type mc.Container */
            let inventory = event.source.getComponent("minecraft:inventory").container;
            for(let item of inventory) {
                if(!item) continue;
                if(isTheStick(item)) return;
            }
            mc.system.run(() => inventory.addItem(THE_STICK_ITEM));
            break;
        case "minecraft:stick":
            if(isTheStick(event.itemStack)) mc.system.run(() => {
                let player = event.source;
                let cooldown = player[powerCooldownSymbol];
                if(cooldown === undefined) return;
                if(cooldown != 0) {
                    player.onScreenDisplay.setActionBar(`§1§lThe power is still under emerging... ${(cooldown / 20).toFixed(1)}s`);
                    return;
                }

                performPower(player);

                player.onScreenDisplay.setTitle(" ", {
                    stayDuration: 5,
                    fadeInDuration: 0,
                    fadeOutDuration: 10,
                    subtitle: "§c§lYou have released the power!"
                });

                // Unknown bug
                /*let preexistedSlowness = player.getEffect("slowness");
                if(preexistedSlowness) {
                    mc.system.runTimeout(() => player.addEffect("slowness", preexistedSlowness.duration - POWER_SLOWNESS_EFFECT_DURATION), POWER_SLOWNESS_EFFECT_DURATION);
                }*/


                player[powerCooldownSymbol] = POWER_COOLDOWN;
            });
            break;
    }
});

// mc.system.runInterval(() => mc.world.getDimension("overworld").runCommand("execute as @p at @s run fill ~-29 -61 ~-29 ~29 -61 ~29 iron_block replace grass"));

mc.system.runInterval(() => {
    for(let player of mc.world.getAllPlayers()) {
        if(player[powerCooldownSymbol] === undefined) {
            player[powerCooldownSymbol] = 0;
            player.sendMessage("§gGrab a diamond and use it. Feel if there is some power inside.");
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
});
