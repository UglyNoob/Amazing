import * as mc from '@minecraft/server';

const PLATFORM_ITEM = (function() {
    let item = new mc.ItemStack("minecraft:blaze_rod", 1);
    item.nameTag = "§r§2Rescue Platform";
    item.setLore(["", "§r§eSave you from the void"]);
    return item;
})();

const PLATFORM_COOLDOWN = 200; // in ticks
const PLATFORM_MAX_AGE = 200; // in ticks
const platformCooldownSymbol = Symbol("cooldown");
const RESCUE_PLATFORM_PERM = mc.BlockPermutation.resolve("minecraft:slime");
const AIR_PERM = mc.BlockPermutation.resolve("minecraft:air");

/**
 * @type Array<{location: mc.Vector3, dimension: mc.Dimension, timeStamp: number}> Records alive platform
 */
let alivePlatforms = [];

/**
 * @param {mc.ItemStack} item
 */
function isItemRescuePlatform(item) {
    return item.getLore()[1] == PLATFORM_ITEM.getLore()[1];
}

/**
 * @param {mc.Vector3} location
 * @param {mc.Dimension} dimension
 */
function addPlatform(location, dimension) {
    let begin = {x: location.x, y: location.y, z: location.z + 1};
    let end = {x: location.x, y: location.y, z: location.z + 3};
    dimension.fillBlocks(begin, end, RESCUE_PLATFORM_PERM, {matchingBlock: AIR_PERM});

    begin = {x: location.x + 1, y: location.y, z: location.z};
    end = {x: location.x + 3, y: location.y, z: location.z + 4};
    dimension.fillBlocks(begin, end, RESCUE_PLATFORM_PERM, {matchingBlock: AIR_PERM});

    begin = {x: location.x + 4, y: location.y, z: location.z + 1};
    end = {x: location.x + 4, y: location.y, z: location.z + 3};
    dimension.fillBlocks(begin, end, RESCUE_PLATFORM_PERM, {matchingBlock: AIR_PERM});
}

/**
 * @param {mc.Vector3} location
 * @param {mc.Dimension} dimension
 */
function removePlatform(location, dimension) {
    let begin = {x: location.x, y: location.y, z: location.z + 1};
    let end = {x: location.x, y: location.y, z: location.z + 3};
    dimension.fillBlocks(begin, end, AIR_PERM, {matchingBlock: RESCUE_PLATFORM_PERM});

    begin = {x: location.x + 1, y: location.y, z: location.z};
    end = {x: location.x + 3, y: location.y, z: location.z + 4};
    dimension.fillBlocks(begin, end, AIR_PERM, {matchingBlock: RESCUE_PLATFORM_PERM});

    begin = {x: location.x + 4, y: location.y, z: location.z + 1};
    end = {x: location.x + 4, y: location.y, z: location.z + 3};
    dimension.fillBlocks(begin, end, AIR_PERM, {matchingBlock: RESCUE_PLATFORM_PERM});
}

mc.world.beforeEvents.itemUse.subscribe(event => {
    if(!isItemRescuePlatform(event.itemStack)) return;
    let cooldown = event.source[platformCooldownSymbol];
    if(cooldown > 0) {
        mc.system.run(() => {
            event.source.onScreenDisplay.setActionBar(`§2Rescue Platform §cis not available before ${(cooldown / 20).toFixed(1)} seconds.`);
        });
        return;
    }
    let platformLoc = event.source.location;
    platformLoc.x = Math.floor(platformLoc.x) - 2;
    platformLoc.y = Math.floor(platformLoc.y) - 1;
    platformLoc.z = Math.floor(platformLoc.z) - 2;
    let toLocation = event.source.location;
    mc.system.run(() => {
        addPlatform(platformLoc, event.source.dimension);
        event.source.teleport(toLocation);
    });

    alivePlatforms.push({location: platformLoc, dimension: event.source.dimension, timeStamp: mc.system.currentTick});
    event.source[platformCooldownSymbol] = PLATFORM_COOLDOWN;
});

/**
 * @param {mc.Vector3} platformLoc
 * @param {mc.Vector3} blockLoc
 */
function isPartOfPlatform(platformLoc, blockLoc) {
    if(!(blockLoc.x >= platformLoc.x &&
        blockLoc.z >= platformLoc.z &&
        blockLoc.y == platformLoc.y &&
        blockLoc.x <= platformLoc.x + 4 &&
        blockLoc.z <= platformLoc.z + 4)) return false;
    if((blockLoc.x == platformLoc.x ||blockLoc.x == platformLoc.x + 4)
        && (blockLoc.z == platformLoc.z || blockLoc.z == platformLoc.z + 4)) return false;
    return true;
}

mc.world.beforeEvents.playerBreakBlock.subscribe(event => {
    for(let platform of alivePlatforms) {
        if(event.dimension != platform.dimension) continue;
        if(!isPartOfPlatform(platform.location, event.block.location)) continue;
        if(event.block.permutation == RESCUE_PLATFORM_PERM)
            event.cancel = true;
    }
});

mc.system.runInterval(() => {
    for(let player of mc.world.getAllPlayers()) {
        if(!player[platformCooldownSymbol]) player[platformCooldownSymbol] = 0;
        if(player[platformCooldownSymbol] > 0) -- player[platformCooldownSymbol];
    }
    let current = mc.system.currentTick;
    let deadPlatformIndices = [];
    let index = 0;
    for(let platform of alivePlatforms) {
        if(current - platform.timeStamp >= PLATFORM_MAX_AGE) {
            removePlatform(platform.location, platform.dimension);
            deadPlatformIndices.push(index);
        }
        ++index;
    }
    for(let i = deadPlatformIndices.length - 1; i >= 0; --i) {
        alivePlatforms.splice(i, 1);
    }
});
