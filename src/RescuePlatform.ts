import * as mc from '@minecraft/server';

import { getGameMode } from './utility.js';

const PLATFORM_ITEM = (function() {
    let item = new mc.ItemStack("minecraft:blaze_rod", 1);
    item.nameTag = "§r§2Rescue Platform";
    item.setLore(["", "§r§eSave you from the void"]);
    return item;
})();
(globalThis as any).getI = (player: mc.Player) => player.getComponent("minecraft:inventory")?.container?.addItem(PLATFORM_ITEM);

const PLATFORM_COOLDOWN = 200; // in ticks
const PLATFORM_MAX_AGE = 200; // in ticks
const platformCooldownSymbol = Symbol("cooldown");
const RESCUE_PLATFORM_PERM = mc.BlockPermutation.resolve("minecraft:slime");
const AIR_PERM = mc.BlockPermutation.resolve("minecraft:air");

type Player = mc.Player & {
    [platformCooldownSymbol]: number
};

/**
 * @type Array<{location: mc.Vector3, dimension: mc.Dimension, timeStamp: number}> Records alive platform
 */
let alivePlatforms: Array<{ location: mc.Vector3; dimension: mc.Dimension; timeStamp: number; }> = [];

function isItemRescuePlatform(item: mc.ItemStack) {
    return item.getLore()[1] == PLATFORM_ITEM.getLore()[1];
}

function isPartOfPlatform(platformLoc: mc.Vector3, blockLoc: mc.Vector3) {
    if (!(blockLoc.x >= platformLoc.x &&
        blockLoc.z >= platformLoc.z &&
        blockLoc.y == platformLoc.y &&
        blockLoc.x <= platformLoc.x + 4 &&
        blockLoc.z <= platformLoc.z + 4)) return false;
    if ((blockLoc.x == platformLoc.x || blockLoc.x == platformLoc.x + 4)
        && (blockLoc.z == platformLoc.z || blockLoc.z == platformLoc.z + 4)) return false;
    return true;
}

function addPlatform(location: mc.Vector3, dimension: mc.Dimension) {
    let begin = { x: location.x, y: location.y, z: location.z + 1 };
    let end = { x: location.x, y: location.y, z: location.z + 3 };
    dimension.fillBlocks(begin, end, RESCUE_PLATFORM_PERM, { matchingBlock: AIR_PERM });

    begin = { x: location.x + 1, y: location.y, z: location.z };
    end = { x: location.x + 3, y: location.y, z: location.z + 4 };
    dimension.fillBlocks(begin, end, RESCUE_PLATFORM_PERM, { matchingBlock: AIR_PERM });

    begin = { x: location.x + 4, y: location.y, z: location.z + 1 };
    end = { x: location.x + 4, y: location.y, z: location.z + 3 };
    dimension.fillBlocks(begin, end, RESCUE_PLATFORM_PERM, { matchingBlock: AIR_PERM });
}

function removePlatform(location: mc.Vector3, dimension: mc.Dimension) {
    let begin = { x: location.x, y: location.y, z: location.z + 1 };
    let end = { x: location.x, y: location.y, z: location.z + 3 };
    dimension.fillBlocks(begin, end, AIR_PERM, { matchingBlock: RESCUE_PLATFORM_PERM });

    begin = { x: location.x + 1, y: location.y, z: location.z };
    end = { x: location.x + 3, y: location.y, z: location.z + 4 };
    dimension.fillBlocks(begin, end, AIR_PERM, { matchingBlock: RESCUE_PLATFORM_PERM });

    begin = { x: location.x + 4, y: location.y, z: location.z + 1 };
    end = { x: location.x + 4, y: location.y, z: location.z + 3 };
    dimension.fillBlocks(begin, end, AIR_PERM, { matchingBlock: RESCUE_PLATFORM_PERM });
}

mc.world.beforeEvents.itemUse.subscribe(event => {
    if (!isItemRescuePlatform(event.itemStack)) return;
    let player = event.source as Player;
    let cooldown = player[platformCooldownSymbol];
    if (cooldown > 0) {
        mc.system.run(() => {
            player.onScreenDisplay.setActionBar(`§cPlease wait §4${(cooldown / 20).toFixed(1)} seconds`);
        });
        return;
    }
    let platformLoc = player.location;
    platformLoc.x = Math.floor(platformLoc.x) - 2;
    platformLoc.y = Math.floor(platformLoc.y) - 1;
    platformLoc.z = Math.floor(platformLoc.z) - 2;
    let toLocation = player.location;
    let playerGameMode = getGameMode(player);
    mc.system.run(() => {
        addPlatform(platformLoc, player.dimension);
        player.teleport(toLocation);
        if (playerGameMode == mc.GameMode.survival || playerGameMode == mc.GameMode.adventure) {
            let container = player.getComponent("minecraft:inventory")?.container as mc.Container;
            if (event.itemStack.amount > 1) {
                event.itemStack.amount -= 1;
                container.setItem(player.selectedSlot, event.itemStack);
            } else {
                container.setItem(player.selectedSlot);
            }
        }
    });

    alivePlatforms.push({ location: platformLoc, dimension: player.dimension, timeStamp: mc.system.currentTick });
    player[platformCooldownSymbol] = PLATFORM_COOLDOWN;
});

mc.world.beforeEvents.playerBreakBlock.subscribe(event => {
    for (let platform of alivePlatforms) {
        if (event.dimension != platform.dimension) continue;
        if (!isPartOfPlatform(platform.location, event.block.location)) continue;
        if (event.block.permutation == RESCUE_PLATFORM_PERM)
            event.cancel = true;
    }
});

mc.system.runInterval(() => {
    for (let player of mc.world.getAllPlayers() as Iterable<Player>) {
        if (!player[platformCooldownSymbol]) player[platformCooldownSymbol] = 0;
        if (player[platformCooldownSymbol] > 0) --player[platformCooldownSymbol];
    }
    let current = mc.system.currentTick;
    let deadPlatformIndices: number[] = [];
    let index = 0;
    for (let platform of alivePlatforms) {
        if (current - platform.timeStamp >= PLATFORM_MAX_AGE) {
            removePlatform(platform.location, platform.dimension);
            deadPlatformIndices.push(index);
        }
        ++index;
    }
    for (let i = deadPlatformIndices.length - 1; i >= 0; --i) {
        alivePlatforms.splice(deadPlatformIndices[i], 1);
    }
});
