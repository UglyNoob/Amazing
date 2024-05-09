import * as mc from '@minecraft/server';

import { consumeMainHandItem } from './utility.js';
import { MinecraftBlockTypes } from '@minecraft/vanilla-data';
import { Vector3Utils as v3 } from '@minecraft/math';
import { sprintf } from 'sprintf-js';
import { getPlayerLang, strings } from './Lang.js';

export const PLATFORM_ITEM = (function () {
    const item = new mc.ItemStack("minecraft:blaze_rod", 1);
    item.nameTag = "§r§2Rescue Platform";
    item.setLore(["", "§r§eSave you from the void"]);
    return item;
})();
(globalThis as any).getI = (player: mc.Player) => player.getComponent("minecraft:inventory")!.container!.addItem(PLATFORM_ITEM); // DEBUG

const PLATFORM_COOLDOWN = 350; // in ticks
const PLATFORM_MAX_AGE = 300; // in ticks
const platformCooldownSymbol = Symbol("cooldown");

declare module '@minecraft/server' {
    interface Player {
        [platformCooldownSymbol]: number;
    }
}

interface AlivePlatform {
    location: mc.Vector3;
    dimension: mc.Dimension;
    timeStamp: number;
    blocks: boolean[];
}

const alivePlatforms: AlivePlatform[] = [];

function isItemRescuePlatform(item: mc.ItemStack) {
    return item.getLore()[1] == PLATFORM_ITEM.getLore()[1];
}

function isPartOfPlatform(platform: AlivePlatform, blockLoc: mc.Vector3) {
    const loc = v3.subtract(blockLoc, platform.location);
    if (loc.y != 0 || loc.x < 0 || loc.x > 4 || loc.z < 0 || loc.z > 4)
        return false;
    return platform.blocks[loc.x + loc.z * 5];
}
export function isLocationPartOfAnyPlatforms(location: mc.Vector3, dimension: mc.Dimension) {
    for (const platform of alivePlatforms) {
        if (dimension != platform.dimension) continue;
        if (isPartOfPlatform(platform, location)) {
            return true;
        }
    }
    return false;
}

/**
 * @returns if succeeds, return an AlivePlatform instance, otherwise null
 */
function tryAddingPlatform(location: mc.Vector3, dimension: mc.Dimension) {
    const cactusLocs = dimension.getBlocks(new mc.BlockVolume({
        x: location.x - 1,
        y: location.y,
        z: location.z - 1
    }, {
        x: location.x + 5,
        y: location.y,
        z: location.z + 5
    }), { includeTypes: [MinecraftBlockTypes.Cactus] });
    const existingBlockLocs = dimension.getBlocks(new mc.BlockVolume(location, {
        x: location.x + 4,
        y: location.y,
        z: location.z + 4
    }), { excludeTypes: [MinecraftBlockTypes.Air] });
    const blocks = [
        false, true, true, true, false,
        true, true, true, true, true,
        true, true, true, true, true,
        true, true, true, true, true,
        false, true, true, true, false
    ];
    for (const cactusLoc of cactusLocs.getBlockLocationIterator()) {
        const reletiveLoc = v3.subtract(cactusLoc, location);
        for (const offset of [
            { x: -1, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 0, z: -1 },
            { x: 0, y: 0, z: 1 },
        ]) {
            const loc = v3.add(reletiveLoc, offset);
            if (loc.x < 0 || loc.x > 4 || loc.z < 0 || loc.z > 4) continue;
            blocks[loc.x + loc.z * 5] = false;
        }
    }
    for (const existingLoc of existingBlockLocs.getBlockLocationIterator()) {
        const reletiveLoc = v3.subtract(existingLoc, location);
        blocks[reletiveLoc.x + reletiveLoc.z * 5] = false;
    }
    let succeed = false;
    for (let i = 0; i < blocks.length; ++i) {
        if (!blocks[i]) continue;
        succeed = true;
        const loc = {
            x: location.x + i % 5,
            y: location.y,
            z: location.z + Math.floor(i / 5)
        };
        dimension.fillBlocks(loc, loc, MinecraftBlockTypes.Slime);
    }
    return succeed ? {
        location,
        dimension,
        timeStamp: mc.system.currentTick,
        blocks
    } : null;
}

function removePlatform(platform: AlivePlatform) {
    const loc = { x: 0, y: platform.location.y, z: 0 };
    for (let x = 0; x < 5; ++x) {
        for (let z = 0; z < 5; ++z) {
            if (!platform.blocks[x + z * 5]) continue;
            loc.x = platform.location.x + x;
            loc.z = platform.location.z + z;
            platform.dimension.fillBlocks(loc, loc, MinecraftBlockTypes.Air);
        }
    }
}

mc.world.beforeEvents.itemUse.subscribe(event => {
    if (!isItemRescuePlatform(event.itemStack)) return;
    const player = event.source;
    const cooldown = player[platformCooldownSymbol];

    if (cooldown > 0) {
        mc.system.run(() => {
            player.onScreenDisplay.setActionBar(sprintf(strings[getPlayerLang(player)].platformCooldownNotification, (cooldown / 20).toFixed(1)));
        });
        return;
    }
    const platformLoc = player.location;
    platformLoc.x = Math.floor(platformLoc.x) - 2;
    platformLoc.y = Math.floor(platformLoc.y) - 1;
    platformLoc.z = Math.floor(platformLoc.z) - 2;
    const toLocation = player.location;
    mc.system.run(() => {
        const alivePlatform = tryAddingPlatform(platformLoc, player.dimension);
        if (!alivePlatform) {
            player.onScreenDisplay.setActionBar(sprintf(strings[getPlayerLang(player)].platformFailedToDeployNotification));
            return;
        }
        player.teleport(toLocation);
        consumeMainHandItem(player);

        alivePlatforms.push(alivePlatform);
        player[platformCooldownSymbol] = PLATFORM_COOLDOWN;
    });
});

mc.world.beforeEvents.playerBreakBlock.subscribe(event => {
    if (isLocationPartOfAnyPlatforms(event.block.location, event.block.dimension)) {
        event.cancel = true;
    }
});

mc.system.runInterval(() => {
    for (const player of mc.world.getAllPlayers()) {
        if (player[platformCooldownSymbol] == null) player[platformCooldownSymbol] = 0;
        if (player[platformCooldownSymbol] > 0) --player[platformCooldownSymbol];
    }
    for (let i = alivePlatforms.length - 1; i >= 0; --i) {
        const platform = alivePlatforms[i];
        if (mc.system.currentTick - platform.timeStamp >= PLATFORM_MAX_AGE) {
            removePlatform(platform);
            alivePlatforms.splice(i, 1);
        }
    }
});
