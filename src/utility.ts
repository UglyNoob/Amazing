import { Vector3Utils as v3 } from '@minecraft/math';
import * as mc from '@minecraft/server';
import * as ui from '@minecraft/server-ui';

export type Area = [mc.Vector3, mc.Vector3];

/**
 * Compares types, lores and name tags.
 * Won't compare enchantment and other things.
 */
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
    if (player.getGameMode) return player.getGameMode();
    for (let gameMode of Object.values(mc.GameMode)) {
        if (player.matches({ gameMode: gameMode })) return gameMode;
    }
    throw new Error("Player's gamemode doesn't match");
}

export function setGameMode(player: mc.Player, gameMode: mc.GameMode) {
    if (player.setGameMode) return player.setGameMode(gameMode);
    player.runCommand(`gamemode ${ gameMode }`);
}

export function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function isPrimitive(value: any) {
    return value === null || (typeof value != "object" && typeof value != "function");
}
function getObjectName(obj: object) {
    return obj?.constructor?.name ?? "Object";
}

/**
 * @param {mc.Player} player The player to show the object to
 * @param {any} object The value to show
 */
export function showObjectToPlayer(player: mc.Player, object: any) {
    /**
     * @returns {Promise<Boolean>} returning true means that the player cancelled.
     */
    async function _showObjectToPlayer(player: mc.Player, object: any, deriving: any): Promise<boolean> {
        const data = new ui.ActionFormData();
        if (isPrimitive(object)) {
            data.title(`Primitive ${ realTypeof(object) }`);
            data.body(`§b${ object }`);
            data.button("§m§lBack");
            let response = await data.show(player);
            return response.canceled;
        }
        let hasCallButton = false;
        if (typeof object == "function") {
            hasCallButton = true;
        }

        const objectName = getObjectName(object);
        data.title(objectName);

        data.button("§1See Prototype");
        const hasBackButton = !!deriving;
        hasBackButton && data.button("§m§lBack→");
        hasCallButton && data.button("§sCall with No Argument");

        let bodyText = `§pContent of §n${ objectName }§p:`;
        const childObjects = [];
        const childFunctions: Function[] = [];
        const childFunctionNames: string[] = [];
        for (let key of Object.getOwnPropertyNames(object)) {
            const value = Reflect.get(object, key, deriving ?? object);
            if (isPrimitive(value)) {
                bodyText += `\n§6Property §e${ key }§6 as §a${ typeof value }§6: §b${ value }\n`;
            } else if (typeof value == "function") {
                childFunctionNames.push(key);
                childFunctions.push(value);
            } else { // handle non-function object
                childObjects.push(value);
                data.button(`§n${ getObjectName(value) } §e${ key }`);
            }
        }
        for (let name of childFunctionNames) {
            data.button(`§sFunction §e${ name }`);
        }
        data.body(bodyText);


        while (true) {
            let response = await data.show(player);
            if (response.canceled) return true;
            const selection = response.selection!;

            let specialButton: "Proto" | "Back" | "Call" | undefined;
            let fixedIndex: number;
            {
                const buttonList: ("Proto" | "Back" | "Call")[] = ["Proto"];
                let offset = 1;
                if (hasBackButton) {
                    buttonList.push("Back");
                    ++offset;
                }
                if (hasCallButton) {
                    buttonList.push("Call");
                    ++offset;
                }
                specialButton = buttonList[selection];
                fixedIndex = selection - offset;
            }
            if (specialButton == "Proto") { // Show the prototype
                let result = await _showObjectToPlayer(player, Object.getPrototypeOf(object), deriving ?? object);
                if (result) return true;
            } else if (specialButton == "Back") { // Go back
                return false;
            } else if (specialButton == "Call") {
                let value: any;
                try {
                    value = object.call(deriving);
                } catch (e) {
                    if (e instanceof Error) {
                        value = `§c${ e.name }: ${ e.message }\n${ e?.stack }`;
                    } else {
                        value = e;
                    }
                }
                const result = await _showObjectToPlayer(player, value, value);
                if (result) return true;
            } else { // Child objects and functions
                let child: object;
                if (fixedIndex >= childObjects.length) { // Child function
                    child = childFunctions[fixedIndex - childObjects.length];
                    const result = await _showObjectToPlayer(player, child, deriving ?? object);
                    if (result) return true;
                } else { // Child object
                    child = childObjects[fixedIndex];
                    const result = await _showObjectToPlayer(player, child, child);
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
export function vectorSize(vec: mc.Vector3) {
    return Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
}

export function makeItem(item: mc.ItemStack, newAmount: number): mc.ItemStack;
export function makeItem(itemType: string, amount: number): mc.ItemStack;

export function makeItem(item: mc.ItemStack | string, newAmount: number) {
    if (typeof item == 'string') {
        return new mc.ItemStack(item, newAmount);
    }
    const i = item.clone();
    i.amount = newAmount;
    return i;
}

export function* containerIterator(container: mc.Container) {
    for (let i = 0; i < container.size; ++i) {
        yield {
            index: i,
            item: container.getItem(i)
        };
    }
}
export function* containerSlotIterator(container: mc.Container) {
    for (let i = 0; i < container.size; ++i) {
        yield {
            index: i,
            slot: container.getSlot(i)
        };
    }
}

export function consumeMainHandItem(player: mc.Player, consumeOnCreative = false) {
    let consume: boolean;
    if (consumeOnCreative) {
        consume = true;
    } else {
        const gameMode = getGameMode(player);
        switch (gameMode) {
            case mc.GameMode.adventure:
            case mc.GameMode.survival:
                consume = true;
                break;
            case mc.GameMode.creative:
            case mc.GameMode.spectator:
                consume = false;
                break;
        }
    }
    if (consume) {
        const equip = player.getComponent("equippable")!;
        const slot = equip.getEquipmentSlot(mc.EquipmentSlot.Mainhand);
        if (slot.amount >= 2) {
            --slot.amount;
        } else {
            slot.setItem();
        }
    }
}

export function stackFirstContainerAdd(container: mc.Container, item: mc.ItemStack) {
    if (!item.isStackable) {
        return container.addItem(item);
    }
    let amount = item.amount;
    for (const { index, item: contItem } of containerIterator(container)) {
        if (!contItem) continue;
        if (item.isStackableWith(contItem)) {
            const slot = container.getSlot(index);
            const increment = Math.min(amount, slot.maxAmount - slot.amount);
            slot.amount += increment;
            amount -= increment;
            if (amount == 0) return;
        }
    }
    const tempItem = item.clone();
    tempItem.amount = amount;
    return container.addItem(tempItem);
}

export function sleep(ticks: number): Promise<void> {
    if (ticks)
        return new Promise(resolve => mc.system.runTimeout(resolve, ticks));
    return new Promise(resolve => mc.system.run(resolve));
}

/**
 * @returns An integer of range [a, b]
 */
export function randomInt(a: number, b: number) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
}

export function shuffle(array: any[]) {
    for (let i = array.length - 1; i >= 1; --i) {
        let swapIndex = randomInt(0, i);
        let temp = array[swapIndex];
        array[swapIndex] = array[i];
        array[i] = temp;
    }
}

export function analyzeTime(ms: number) {
    ms -= ms % 1000;
    ms /= 1000; // number is double in js
    const seconds = ms % 60;
    const minutes = (ms - seconds) / 60;
    return {
        minutes,
        seconds
    };
}

export function vectorCompare(a: mc.Vector3, b: mc.Vector3) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    if (dx > 0) {
        return 1;
    } else if (dx < 0) {
        return -1;
    }
    if (dy > 0) {
        return 1;
    } else if (dy < 0) {
        return -1;
    }
    if (dz > 0) {
        return 1;
    } else if (dz < 0) {
        return -1;
    }
    return 0;
}

export function closestLocationOnBlock(location: mc.Vector3, blockLoc: mc.Vector3) {
    const reletiveVec = v3.subtract(location, blockLoc);
    const closestReletive: mc.Vector3 = { x: 0, y: 0, z: 0 };
    closestReletive.x = Math.max(0, Math.min(1, reletiveVec.x));
    closestReletive.y = Math.max(0, Math.min(1, reletiveVec.y));
    closestReletive.z = Math.max(0, Math.min(1, reletiveVec.z));
    return v3.add(blockLoc, closestReletive);
}

enum BlockFace {
    Up,
    Down,
    East,
    West,
    North,
    South
}

export function* raycastHits(loc: mc.Vector3, direction: mc.Vector3) {
    const possibleColidingFaces: BlockFace[] = [];
    if (direction.x > 0) possibleColidingFaces.push(BlockFace.East);
    if (direction.x < 0) possibleColidingFaces.push(BlockFace.West);
    if (direction.y > 0) possibleColidingFaces.push(BlockFace.Up);
    if (direction.y < 0) possibleColidingFaces.push(BlockFace.Down);
    if (direction.z > 0) possibleColidingFaces.push(BlockFace.South);
    if (direction.z < 0) possibleColidingFaces.push(BlockFace.North);
    if (possibleColidingFaces.length == 0) return;

    const blockLoc = v3.floor(loc);
    yield Object.assign({}, blockLoc);
    while (true) {
        const reletaiveLoc = v3.subtract(loc, blockLoc);
        let success = false;
        let hit: mc.Vector3;
        for (const face of possibleColidingFaces) {
            switch (face) {
                case BlockFace.Up:
                    hit = v3.add(reletaiveLoc, v3.scale(direction, (1 - reletaiveLoc.y) / direction.y));
                    if (hit.x > 0 && hit.x < 1 && hit.z > 0 && hit.z < 1) {
                        success = true;
                        loc = v3.add(blockLoc, hit);
                        ++blockLoc.y;
                    }
                    break;
                case BlockFace.Down:
                    hit = v3.add(reletaiveLoc, v3.scale(direction, (-reletaiveLoc.y) / direction.y));
                    if (hit.x > 0 && hit.x < 1 && hit.z > 0 && hit.z < 1) {
                        success = true;
                        loc = v3.add(blockLoc, hit);
                        --blockLoc.y;
                    }
                    break;
                case BlockFace.East:
                    hit = v3.add(reletaiveLoc, v3.scale(direction, (1 - reletaiveLoc.x) / direction.x));
                    if (hit.y > 0 && hit.y < 1 && hit.z > 0 && hit.z < 1) {
                        success = true;
                        loc = v3.add(blockLoc, hit);
                        ++blockLoc.x;
                    }
                    break;
                case BlockFace.West:
                    hit = v3.add(reletaiveLoc, v3.scale(direction, (-reletaiveLoc.x) / direction.x));
                    if (hit.y > 0 && hit.y < 1 && hit.z > 0 && hit.z < 1) {
                        success = true;
                        loc = v3.add(blockLoc, hit);
                        --blockLoc.x;
                    }
                    break;
                case BlockFace.North:
                    hit = v3.add(reletaiveLoc, v3.scale(direction, (-reletaiveLoc.z) / direction.z));
                    if (hit.y > 0 && hit.y < 1 && hit.x > 0 && hit.x < 1) {
                        success = true;
                        loc = v3.add(blockLoc, hit);
                        --blockLoc.z;
                    }
                    break;
                case BlockFace.South:
                    hit = v3.add(reletaiveLoc, v3.scale(direction, (1 - reletaiveLoc.z) / direction.z));
                    if (hit.y > 0 && hit.y < 1 && hit.x > 0 && hit.x < 1) {
                        success = true;
                        loc = v3.add(blockLoc, hit);
                        ++blockLoc.z;
                    }
                    break;
            }
            if (success) {
                break;
            }
        }
        if (success) {
            // mc.world.sendMessage(v3.toString(blockLoc, { decimals: 0 })); // DEBUG
            yield Object.assign({}, blockLoc);
        } else {
            return;
        }
    }
}

/**
 * Find element with in a sorted array.
 * @returns Return the element if found, otherwise null
 * */
export function quickFind<T>(array: T[], element: T, compareFn: (a: T, b: T) => number) {
    if (array.length == 0) return null;

    let left = 0;
    let right = array.length - 1;
    while (right >= left) {
        const mid = Math.floor((left + right) / 2);
        const compareResult = compareFn(array[mid], element);
        if (compareResult == 0) return array[mid];
        if (compareResult < 0) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return null;
}
