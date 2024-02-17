import * as mc from '@minecraft/server';
import * as ui from '@minecraft/server-ui';

/**
 * @param {mc.ItemStack} a
 * @param {mc.ItemStack} b
 */
export function itemEqual(a, b, compareAmount = false) {
    let loreA = a.getLore(), loreB = b.getLore();
    return loreA.length == loreB.length &&
           (compareAmount ? a.amount == b.amount : true) &&
           a.typeId == b.typeId &&
           a?.nameTag === b?.nameTag &&
           loreA.every((str, index) => str == loreB[index]);
}
/**
 * @param {string} name
 */
export function getPlayerByName(name) {
    return mc.world.getPlayers({name: name})[0];
}
/**
 * @param {mc.Vector3} vector1
 * @param {mc.Vector3} vector2
 */
export function calculateDistance(vector1, vector2) {
    let dx = vector1.x - vector2.x;
    let dy = vector1.y - vector2.y;
    let dz = vector1.z - vector2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function normalize({x = 0, y = 0, z = 0}) {
    let mod = Math.sqrt(x * x + y * y + z * z);
    return { x: x/mod, y: y/mod, z: z/mod };
}

export function realTypeof(value) {
    return value === null ? 'null' : typeof value;
}

/**
 * @param {mc.Player} player
 */
export function getGameMode(player) {
    for(let gameMode of Object.values(mc.GameMode)) {
        if(player.matches({gameMode: gameMode})) return gameMode;
    }
}

/**
 * @param {mc.Player} player The player to show the object to
 * @param {Object} object The object to show
 */
export function showObjectToPlayer(player, object) {
    /**
    * @param {mc.Player} player
    * @param {Object} object
    *
    * @returns {Promise<Boolean>} returning true means that the player cancelled.
    */
    async function _showObjectToPlayer(player, object, derivedObject) {
        let data = new ui.ActionFormData();
        let type = realTypeof(object);
        if(type != 'object' && type != 'function') {
            data.title(`Primitive ${type}`);
            data.body(`§b${object}`);
            data.button("§mBack→");
            let response = await data.show(player);
            return response.canceled;
        }

        let getObjectName = obj => obj?.constructor?.name ?? "Object";
        let objectName = getObjectName(object);
        data.title(objectName);

        data.button("§1See Prototype");
        let hasBackButton = !!derivedObject;
        hasBackButton && data.button("§mBack→");

        let bodyText = `§pContent of §n${objectName}§p:`;
        let childObjects = [];
        let childFunctions = [];
        let childFunctionNames = [];
        for(let key of Object.getOwnPropertyNames(object)) {
            let value = Reflect.get(object, key, derivedObject ?? object);
            let valueType = realTypeof(value);
            if(valueType == "function") { // handle functions
                childFunctionNames.push(key);
                childFunctions.push(value);
            } else if(valueType != "object") { // handle primitives
                bodyText = bodyText.concat(`\n§6Property §e${key}§6 as §a${valueType}§6: §b${value}`);
            } else { // handle objects
                childObjects.push(value);
                data.button(`§n${getObjectName(value)} §e${key}`);
            }
        }
        for(let name of childFunctionNames) {
            data.button(`§sFunction §e${name}`);
        }
        data.body(bodyText);

        while(true) {
            let response = await data.show(player);
            if(response.canceled) return true;
            if(response.selection == 0) { // Show the prototype
                let result = await _showObjectToPlayer(player, Object.getPrototypeOf(object), derivedObject ?? object);
                if(result) return true;
            } else if (response.selection == 1 && hasBackButton) { // Go back
                return false;
            } else { // Child objects and functions
                let childIndex = hasBackButton ? response.selection - 2 : response.selection - 1;
                if(childIndex >= childObjects.length) { // Child function
                    let child = childFunctions[childIndex - childObjects.length];
                    let result = await _showObjectToPlayer(player, child?.prototype, child?.prototype);
                    if(result) return true;
                } else { // Child object
                    let child = childObjects[childIndex];
                    let result = await _showObjectToPlayer(player, child, child);
                    if(result) return true;
                }
            }
        }
    }
    _showObjectToPlayer(player, object, null);
}

/**
 * @param {string[]} elements Array of elements
 */
export function defineEnum(elements) {
    return elements.reduce((result, value, index) => {
        result[result[index] = value] = index;
        return result;
    }, {});
}
