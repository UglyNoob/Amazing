import * as mc from '@minecraft/server';

import { getGameMode } from './utility.js';

const PLATFORM_ITEM = (function () {
    const item = new mc.ItemStack("minecraft:blaze_rod", 1);
    item.nameTag = "§r§2Rescue Platform";
    item.setLore(["", "§r§eSave you from the void"]);
    return item;
})();
(globalThis as any).getI = (player: mc.Player) => player.getComponent("minecraft:inventory")!.container!.addItem(PLATFORM_ITEM); // DEBUG

const PLATFORM_COOLDOWN = 350; // in ticks
const PLATFORM_MAX_AGE = 300; // in ticks
const platformCooldownSymbol = Symbol("cooldown");
const RESCUE_PLATFORM_PERM = mc.BlockPermutation.resolve("minecraft:slime");
const AIR_PERM = mc.BlockPermutation.resolve("minecraft:air");

declare module '@minecraft/server' {
    interface Player {
        [platformCooldownSymbol]: number
    }
}

const alivePlatforms: Array<{ location: mc.Vector3; dimension: mc.Dimension; timeStamp: number; }> = [];

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
export function isLocationPartOfAnyPlatforms(location: mc.Vector3, dimension: mc.Dimension) {
    for (const platform of alivePlatforms) {
        if (dimension != platform.dimension) continue;
        if (!isPartOfPlatform(platform.location, location)) continue;
        if (dimension.getBlock(location)?.permutation == RESCUE_PLATFORM_PERM) // Wohoo this works
            return true;
    }
    return false;
}

/**
 * @returns returns whether platform adding succeeds
 */
function tryAddingPlatform(location: mc.Vector3, dimension: mc.Dimension) {
    let begin = { x: location.x, y: location.y, z: location.z + 1 };
    let end = { x: location.x, y: location.y, z: location.z + 3 };
    let blockPlaced = 0;
    blockPlaced += dimension.fillBlocks(begin, end, RESCUE_PLATFORM_PERM, { matchingBlock: AIR_PERM });

    begin = { x: location.x + 1, y: location.y, z: location.z };
    end = { x: location.x + 3, y: location.y, z: location.z + 4 };
    blockPlaced += dimension.fillBlocks(begin, end, RESCUE_PLATFORM_PERM, { matchingBlock: AIR_PERM });

    begin = { x: location.x + 4, y: location.y, z: location.z + 1 };
    end = { x: location.x + 4, y: location.y, z: location.z + 3 };
    blockPlaced += dimension.fillBlocks(begin, end, RESCUE_PLATFORM_PERM, { matchingBlock: AIR_PERM });
    return blockPlaced > 0;
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
    const player = event.source;
    const cooldown = player[platformCooldownSymbol];
    if (cooldown > 0) {
        mc.system.run(() => {
            player.onScreenDisplay.setActionBar(`§cPlease wait for §g${(cooldown / 20).toFixed(1)} §cseconds`);
        });
        return;
    }
    const platformLoc = player.location;
    platformLoc.x = Math.floor(platformLoc.x) - 2;
    platformLoc.y = Math.floor(platformLoc.y) - 1;
    platformLoc.z = Math.floor(platformLoc.z) - 2;
    const toLocation = player.location;
    const playerGameMode = getGameMode(player);
    mc.system.run(() => {
        if (!tryAddingPlatform(platformLoc, player.dimension)) {
            player.onScreenDisplay.setActionBar("§cCannot deploy platform here");
            return;
        }
        player.teleport(toLocation);
        if (playerGameMode == mc.GameMode.survival || playerGameMode == mc.GameMode.adventure) {
            const container = player.getComponent("minecraft:inventory")!.container!;
            if (event.itemStack.amount > 1) {
                event.itemStack.amount -= 1;
                container.setItem(player.selectedSlot, event.itemStack);
            } else {
                container.setItem(player.selectedSlot);
            }
        }

        alivePlatforms.push({ location: platformLoc, dimension: player.dimension, timeStamp: mc.system.currentTick });
        player[platformCooldownSymbol] = PLATFORM_COOLDOWN;
    });
});

mc.world.beforeEvents.playerBreakBlock.subscribe(event => {
    for (const platform of alivePlatforms) {
        if (event.dimension != platform.dimension) continue;
        if (!isPartOfPlatform(platform.location, event.block.location)) continue;
        if (event.block.permutation == RESCUE_PLATFORM_PERM)
            event.cancel = true;
    }
});

mc.system.runInterval(() => {
    for (const player of mc.world.getAllPlayers()) {
        if (!player[platformCooldownSymbol]) player[platformCooldownSymbol] = 0;
        if (player[platformCooldownSymbol] > 0) --player[platformCooldownSymbol];
    }
    const current = mc.system.currentTick;
    const deadPlatformIndices: number[] = [];
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
