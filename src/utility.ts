import * as mc from '@minecraft/server';
import * as ui from '@minecraft/server-ui';

export type Area = [mc.Vector3, mc.Vector3]

export function itemEqual(a: mc.ItemStack, b: mc.ItemStack, compareAmount = false) {
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
export function getPlayerByName(name: string): mc.Player | undefined {
    return mc.world.getPlayers({ name })[0];
}

export function calculateDistance(vector1: mc.Vector3, vector2: mc.Vector3) {
    let dx = vector1.x - vector2.x;
    let dy = vector1.y - vector2.y;
    let dz = vector1.z - vector2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function realTypeof(value: any) {
    return value === null ? 'null' : typeof value;
}

export function getGameMode(player: mc.Player): mc.GameMode {
    for (let gameMode of Object.values(mc.GameMode)) {
        if (player.matches({ gameMode: gameMode })) return gameMode;
    }
    throw new Error("Player's gamemode doesn't match");
}

export function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * @param {mc.Player} player The player to show the object to
 * @param {any} object The value to show
 */
export function showObjectToPlayer(player: mc.Player, object: any) {
    /**
     * @returns {Promise<Boolean>} returning true means that the player cancelled.
     */
    async function _showObjectToPlayer(player: mc.Player, object: any, derived: any): Promise<boolean> {
        let data = new ui.ActionFormData();
        let type = realTypeof(object);
        if (type !== 'object' && type !== 'function') {
            data.title(`Primitive ${type}`);
            data.body(`§b${object}`);
            data.button("§m§lBack");
            let response = await data.show(player);
            return response.canceled;
        }

        let getObjectName = (obj: any) => obj?.constructor?.name ?? "Object";
        let objectName = getObjectName(object);
        data.title(objectName);

        data.button("§1See Prototype");
        let hasBackButton = !!derived;
        hasBackButton && data.button("§m§lBack→");

        let bodyText = `§pContent of §n${objectName}§p:`;
        let childObjects = [];
        let childFunctions: Function[] = [];
        let childFunctionNames: string[] = [];
        for (let key of Object.getOwnPropertyNames(object)) {
            let value = Reflect.get(object, key, derived ?? object);
            let valueType = realTypeof(value);
            if (valueType == "function") { // handle functions
                childFunctionNames.push(key);
                childFunctions.push(value);
            } else if (valueType != "object") { // handle primitives
                bodyText = bodyText.concat(`\n§6Property §e${key}§6 as §a${valueType}§6: §b${value}`);
            } else { // handle objects
                childObjects.push(value);
                data.button(`§n${getObjectName(value)} §e${key}`);
            }
        }
        for (let name of childFunctionNames) {
            data.button(`§sFunction §e${name}`);
        }
        data.body(bodyText);

        while (true) {
            let response = await data.show(player);
            if (response.canceled) return true;
            if (response.selection == 0) { // Show the prototype
                let result = await _showObjectToPlayer(player, Object.getPrototypeOf(object), derived ?? object);
                if (result) return true;
            } else if (response.selection == 1 && hasBackButton) { // Go back
                return false;
            } else { // Child objects and functions
                let selection = response.selection as number;
                let childIndex = hasBackButton ? selection - 2 : selection - 1;
                if (childIndex >= childObjects.length) { // Child function
                    let child = childFunctions[childIndex - childObjects.length];
                    let result = await _showObjectToPlayer(player, child.prototype, child.prototype);
                    if (result) return true;
                } else { // Child object
                    let child = childObjects[childIndex];
                    let result = await _showObjectToPlayer(player, child, child);
                    if (result) return true;
                }
            }
        }
    }
    _showObjectToPlayer(player, object, null);
}

export function vectorWithinArea(vec: mc.Vector3, area: [mc.Vector3, mc.Vector3]) {
    const minX = Math.min(area[0].x, area[1].x);
    const minY = Math.min(area[0].y, area[1].y);
    const minZ = Math.min(area[0].z, area[1].z);
    const maxX = Math.max(area[0].x, area[1].x);
    const maxY = Math.max(area[0].y, area[1].y);
    const maxZ = Math.max(area[0].z, area[1].z);
    if (vec.x >= minX && vec.x < maxX &&
        vec.y >= minY && vec.y < maxY &&
        vec.z >= minZ && vec.z < maxZ) return true;
    return false;
}
export function vectorAdd(...vecs: mc.Vector3[]): mc.Vector3 {
    const result = { x: 0, y: 0, z: 0 };
    for (const vec of vecs) {
        result.x += vec.x;
        result.y += vec.y;
        result.z += vec.z;
    }
    return result;
}

export function* containerIterator(container: mc.Container) {
    for (let i = 0; i < container.size; ++i) {
        yield {
            index: i,
            item: container.getItem(i)
        };
    }
}

export function assert(predicate: boolean, message?: string) {
    if (!predicate) throw new Error(message);
}

export function sleep(ticks: number): Promise<void> {
    return new Promise(resolve => mc.system.runTimeout(resolve, ticks));
}