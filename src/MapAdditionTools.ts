import * as mc from '@minecraft/server';
import { GeneratorType, TEAM_CONSTANTS, TeamType } from './Bedwars.js';
import { add, Area, capitalize, containerIterator, itemEqual, sleep, smallest, transform } from './utility.js';
import { ActionFormData, FormCancelationReason, ModalFormData } from '@minecraft/server-ui';
import { MinecraftItemTypes } from '@minecraft/vanilla-data';
import { Vector3Utils } from '@minecraft/math';

const {
    toString,
    scale,
    equals,
    subtract
} = Vector3Utils;

const CONFIRM_ITEM = new mc.ItemStack(MinecraftItemTypes.BreezeRod);
CONFIRM_ITEM.nameTag = "Confirm";

const SELECT_ITEM = new mc.ItemStack(MinecraftItemTypes.Stick);
SELECT_ITEM.nameTag = "Select";

const MENU_ITEM = new mc.ItemStack(MinecraftItemTypes.FishingRod);
MENU_ITEM.nameTag = "Open Menu";


function sort(a: number, b: number) { return a > b ? [b, a] : [a, b]; }

function renderArea(player: mc.Player, [pointA, pointB]: Area, baseInterval: number, specialFace?: mc.Direction) {
    const [minX, maxX] = sort(pointA.x, pointB.x);
    const [minY, maxY] = sort(pointA.y, pointB.y);
    const [minZ, maxZ] = sort(pointA.z, pointB.z);
    const xExtraPointCounts = Math.ceil((maxX - minX) / baseInterval);
    const xInterval = (maxX - minX) / xExtraPointCounts;
    const yExtraPointCounts = Math.ceil((maxY - minY) / baseInterval);
    const yInterval = (maxY - minY) / yExtraPointCounts;
    const zExtraPointCounts = Math.ceil((maxZ - minZ) / baseInterval);
    const zInterval = (maxZ - minZ) / zExtraPointCounts;

    for (let x = 0; x < xExtraPointCounts + 1; ++x) {
        for (let y = 0; y < yExtraPointCounts + 1; ++y) {
            for (let z = 0; z < zExtraPointCounts + 1; ++z) {
                if ((x > 0 && x < xExtraPointCounts) &&
                    (y > 0 && y < yExtraPointCounts) &&
                    (z > 0 && z < zExtraPointCounts)) continue;
                let special = false;
                if (specialFace) {
                    switch (specialFace) {
                        case mc.Direction.Down: if (y == 0) special = true; break;
                        case mc.Direction.Up: if (y == yExtraPointCounts) special = true; break;
                        case mc.Direction.North: if (z == 0) special = true; break;
                        case mc.Direction.South: if (z == zExtraPointCounts) special = true; break;
                        case mc.Direction.West: if (x == 0) special = true; break;
                        case mc.Direction.East: if (x == xExtraPointCounts) special = true; break;
                    }
                }
                player.spawnParticle(special ? "minecraft:blue_flame_particle" : "minecraft:basic_flame_particle", {
                    x: minX + x * xInterval,
                    y: minY + y * yInterval,
                    z: minZ + z * zInterval
                });
            }
        }
    }
}

enum ResponseType {
    select, selectLocation, tick, confirm
}

interface SelectResponse {
    type: ResponseType.select;
}

interface SelectLocationResponse {
    type: ResponseType.selectLocation;
    value: mc.Vector3;
}

interface TickResponse {
    type: ResponseType.tick;
}

interface ConfirmResponse {
    type: ResponseType.confirm;
}
type Response = SelectResponse |
    SelectLocationResponse |
    TickResponse |
    ConfirmResponse;

function* editBlockLoc(operator: mc.Player, name: string, onConfirm: (pos: mc.Vector3) => void) {
    let response: Response;
    let pos: mc.Vector3 | null = null;

    while (response = yield) {
        if (response.type == ResponseType.selectLocation) {
            pos = response.value;
        } else if (response.type == ResponseType.tick) {
            operator.onScreenDisplay.setActionBar(`${name}: ${pos ? toString(pos, { decimals: 0 }) : "Select a block location"}`);
        } else if (response.type == ResponseType.confirm) {
            if (pos != null) {
                onConfirm(pos);
                operator.sendMessage(`${name} set to ${toString(pos, { decimals: 0 })}.`);
                return;
            }
        }
    }
}

function* editVoidY(operator: mc.Player, map: MapInformation) {
    let response: Response;
    let y: number | null = null;
    let locationY: number | null = null;

    while (response = yield) {
        if (response.type == ResponseType.selectLocation) {
            y = response.value.y;
        } else if (response.type == ResponseType.tick) {
            const newLocationY = Math.floor(operator.location.y);
            if (newLocationY != locationY) {
                locationY = newLocationY;
                y = locationY;
            }

            operator.onScreenDisplay.setActionBar(`voidY: ${y}`);
        } else if (response.type == ResponseType.confirm) {
            if (y != null) {
                map.voidY = y;
                operator.sendMessage(`voidY set to ${y}.`);
                return;
            }
        }
    }
}

/**
  * Ensures this first element of the output area is always smaller than the second element on every field.
  * */
function* editArea(operator: mc.Player, name: string, onConfirm: (area: Area) => void, renderBaseInterval: number) {
    let pointA: mc.Vector3 | null = null;
    let pointB: mc.Vector3 | null = null;
    let response: Response;

    yield* editBlockLoc(operator, `${name}: Point A`, pos => pointA = pos);
    yield* editBlockLoc(operator, `${name}: Point B`, pos => pointB = pos);

    let [minX, maxX] = sort(pointA!.x, pointB!.x);
    let [minY, maxY] = sort(pointA!.y, pointB!.y);
    let [minZ, maxZ] = sort(pointA!.z, pointB!.z);
    ++maxX; ++maxY; ++maxZ;

    let updateTicks = 0;
    let selectCooldown = 5;
    let selectingFace: mc.Direction | null = null;
    let lastLoc: mc.Vector3 | null = null;
    while (response = yield) {
        if (response.type == ResponseType.tick) {
            if (selectCooldown > 0) --selectCooldown;
            if (selectingFace) {
                const headLocation = operator.getHeadLocation();
                const x = Math.round(headLocation.x);
                const y = Math.round(headLocation.y);
                const z = Math.round(headLocation.z);
                switch (selectingFace) {
                    case mc.Direction.Up:
                        if (y < minY) {
                            selectingFace = mc.Direction.Down;
                            maxY = minY;
                            minY = y;
                        } else if (y > minY) maxY = y;
                        break;
                    case mc.Direction.Down:
                        if (y > maxY) {
                            selectingFace = mc.Direction.Up;
                            minY = maxY;
                            maxY = y;
                        } else if (y < maxY) minY = y;
                        break;
                    case mc.Direction.North:
                        if (z > maxZ) {
                            selectingFace = mc.Direction.South;
                            minZ = maxZ;
                            maxZ = z;
                        } else if (z < maxZ) minZ = z;
                        break;
                    case mc.Direction.South:
                        if (z < minZ) {
                            selectingFace = mc.Direction.North;
                            maxZ = minZ;
                            minZ = z;
                        } else if (z > minZ) maxZ = z;
                        break;
                    case mc.Direction.West:
                        if (x > maxX) {
                            selectingFace = mc.Direction.East;
                            minX = maxX;
                            maxX = x;
                        } else if (x < maxX) minX = x;
                        break;
                    case mc.Direction.East:
                        if (x < minX) {
                            selectingFace = mc.Direction.West;
                            maxX = minX;
                            minX = x;
                        } else if (x > minX) maxX = x;
                        break;
                }
                const currentLoc = { x, y, z };
                if (lastLoc != null && !equals(lastLoc, currentLoc)) {
                    updateTicks = 0;
                }
                lastLoc = currentLoc;
                operator.onScreenDisplay.setActionBar(`${name}: Editing Face: ${selectingFace}`);
            }

            if (updateTicks == 0) {
                renderArea(operator!, [{ x: minX, y: minY, z: minZ }, { x: maxX, y: maxY, z: maxZ }], renderBaseInterval, selectingFace ?? undefined);
                updateTicks = 10;
            } else {
                --updateTicks;
            }
        } else if (response.type == ResponseType.select) {
            if (selectingFace != null) continue;
            if (selectCooldown == 0) selectCooldown = 5; else continue;
            const loc = operator!.getHeadLocation();
            const view = operator!.getViewDirection();
            const hitResults: [mc.Direction, number][] = [];

            if ((loc.y > maxY && view.y < 0) || (loc.y < maxY && loc.y > minY && view.y > 0)) {
                const s = (maxY - loc.y) / view.y;
                const v = add(loc, scale(view, s));
                if (v.x > minX && v.x < maxX && v.z > minZ && v.z < maxZ)
                    hitResults.push([mc.Direction.Up, s]);
            }
            if ((loc.y < minY && view.y > 0) || (loc.y < maxY && loc.y > minY && view.y < 0)) {
                const s = (minY - loc.y) / view.y;
                const v = add(loc, scale(view, s));
                if (v.x > minX && v.x < maxX && v.z > minZ && v.z < maxZ)
                    hitResults.push([mc.Direction.Down, s]);
            }
            if ((loc.z < minZ && view.z > 0) || (loc.z < maxZ && loc.z > minZ && view.z < 0)) {
                const s = (minZ - loc.z) / view.z;
                const v = add(loc, scale(view, s));
                if (v.x > minX && v.x < maxX && v.y > minY && v.y < maxY)
                    hitResults.push([mc.Direction.North, s]);
            }
            if ((loc.z > maxZ && view.z < 0) || (loc.z < maxZ && loc.z > minZ && view.z > 0)) {
                const s = (maxZ - loc.z) / view.z;
                const v = add(loc, scale(view, s));
                if (v.x > minX && v.x < maxX && v.y > minY && v.y < maxY)
                    hitResults.push([mc.Direction.South, s]);
            }
            if ((loc.x < minX && view.x > 0) || (loc.x < maxX && loc.x > minX && view.x < 0)) {
                const s = (minX - loc.x) / view.x;
                const v = add(loc, scale(view, s));
                if (v.z > minZ && v.z < maxZ && v.y > minY && v.y < maxY)
                    hitResults.push([mc.Direction.West, s]);
            }
            if ((loc.x > maxX && view.x < 0) || (loc.x < maxX && loc.x > minX && view.x > 0)) {
                const s = (maxX - loc.x) / view.x;
                const v = add(loc, scale(view, s));
                if (v.z > minZ && v.z < maxZ && v.y > minY && v.y < maxY)
                    hitResults.push([mc.Direction.East, s]);
            }

            const hitResult = smallest(hitResults, (a, b) => a[1] - b[1]);
            if (hitResult) {
                selectingFace = hitResult[0];
                operator!.sendMessage(`${name}: Selected Face: ${selectingFace}`);
                updateTicks = 0;
            }
        } else if (response.type == ResponseType.confirm) {
            if (selectingFace) {
                operator!.onScreenDisplay.setActionBar(`${name}: Confirm Edition of Face ${selectingFace}`);
                selectingFace = null;
            } else {
                onConfirm([{ x: minX, y: minY, z: minZ }, { x: maxX, y: maxY, z: maxZ }]);
                return;
            }
        }
    }
}

function* editTeam(operator: mc.Player, teamType: TeamType, map: MapInformation) {
    const {
        colorPrefix, name
    } = TEAM_CONSTANTS[teamType];
    const teamName = `${colorPrefix}${capitalize(name)}§r`;

    let response: Response;

    let bedLocation_0: mc.Vector3;
    let bedLocation_1: mc.Vector3;
    yield* editBlockLoc(operator, `${teamName} Head of Bed`, pos => bedLocation_0 = pos);
    yield* editBlockLoc(operator, `${teamName} Back of Bed`, pos => bedLocation_1 = pos);

    let teamChestLocation: mc.Vector3;
    yield* editBlockLoc(operator, `${teamName} Chest`, pos => teamChestLocation = pos);

    let itemShopLocation_0: mc.Vector3;
    let itemShopLocation_1: mc.Vector3 | null = null;
    yield* editBlockLoc(operator, `${teamName} The Block Beneath Item Shop Villager`, pos => itemShopLocation_0 = pos);
    while (response = yield) {
        if (response.type == ResponseType.selectLocation) {
            itemShopLocation_1 = response.value;
        } else if (response.type == ResponseType.tick) {
            operator.onScreenDisplay.setActionBar(`${teamName}: ${itemShopLocation_1 ? toString(itemShopLocation_1, { decimals: 0 }) : "Select another block beneath the item shop villager, or continue with §oConfirm"}`);
        } else if (response.type == ResponseType.confirm) {
            break;
        }
    }
    itemShopLocation_0 = add(itemShopLocation_0!, { x: 0.5, y: 1, z: 0.5 });
    if (itemShopLocation_1) {
        itemShopLocation_0 = scale(add(itemShopLocation_0, itemShopLocation_1, { x: 0.5, y: 1, z: 0.5 }), 0.5);
    }
    operator.sendMessage(`${teamName}: itemShopLocation set to ${toString(itemShopLocation_0, { decimals: 1 })}.`);

    let teamShopLocation_0: mc.Vector3;
    let teamShopLocation_1: mc.Vector3 | null = null;
    yield* editBlockLoc(operator, `${teamName} The Block Beneath Team Shop Villager`, pos => teamShopLocation_0 = pos);
    while (response = yield) {
        if (response.type == ResponseType.selectLocation) {
            teamShopLocation_1 = response.value;
        } else if (response.type == ResponseType.tick) {
            operator.onScreenDisplay.setActionBar(`${teamName}: ${teamShopLocation_1 ? toString(teamShopLocation_1, { decimals: 0 }) : "Select another block beneath the team shop villager, or continue with §oConfirm"}`);
        } else if (response.type == ResponseType.confirm) {
            break;
        }
    }
    teamShopLocation_0 = add(teamShopLocation_0!, { x: 0.5, y: 1, z: 0.5 });
    if (teamShopLocation_1) {
        teamShopLocation_0 = scale(add(teamShopLocation_0, teamShopLocation_1, { x: 0.5, y: 1, z: 0.5 }), 0.5);
    }
    operator.sendMessage(`${teamName}: teamShopLocation set to ${toString(teamShopLocation_0, { decimals: 1 })}.`);

    let generatorLocation: mc.Vector3 | null = null;
    while (response = yield) {
        if (response.type == ResponseType.selectLocation) {
            generatorLocation = response.value;
        } else if (response.type == ResponseType.tick) {
            operator.onScreenDisplay.setActionBar(`${teamName}: Generator: ${generatorLocation ? toString(generatorLocation, { decimals: 0 }) : "Select a Block Location"}`);
            if (generatorLocation) {
                renderArea(operator, [generatorLocation, add(generatorLocation, { x: 3, y: 1, z: 3 })], 1.5);
            }
        } else if (response.type == ResponseType.confirm) {
            if (generatorLocation) {
                operator.sendMessage(`${teamName}: Generator Location set to ${toString(generatorLocation, { decimals: 0 })}`);
                break;
            }
        }
    }

    let playerSpawn: mc.Vector3;
    yield* editBlockLoc(operator, `${teamName}: The Block Beneath Player Spawn`, pos => playerSpawn = pos);
    const hasCarpet = operator.dimension.getBlock(playerSpawn!)!.above()!.typeId.endsWith("carpet");
    playerSpawn = add(playerSpawn!, { x: 0.5, y: 1, z: 0.5 });

    let playerSpawnViewDirection: mc.Vector3 | null = null;
    while (response = yield) {
        if (response.type == ResponseType.tick) {
            let { x, z } = operator.getViewDirection();
            const mag = Math.sqrt(x * x + z * z);
            x /= mag;
            z /= mag;
            if (Math.abs(Math.abs(z) - Math.abs(x)) > 0.5) {
                playerSpawnViewDirection = {
                    x: Math.round(x),
                    y: 0,
                    z: Math.round(z)
                };
            } else {
                playerSpawnViewDirection = {
                    x: x > 0 ? 1 : -1,
                    y: 0,
                    z: z > 0 ? 1 : -1
                };
            }

            operator.onScreenDisplay.setActionBar(`${teamName}: playerSpawnViewDirection: ${toString(playerSpawnViewDirection, { decimals: 0 })}`);
        } else if (response.type == ResponseType.confirm) {
            if (playerSpawnViewDirection) {
                operator.sendMessage(`${teamName}: playerSpawnViewDirection set to ${toString(playerSpawnViewDirection, { decimals: 0 })}`);
                break;
            }
        }
    }

    let protectedArea: Area;
    yield* editArea(operator, `${teamName}: Protected Area`, area => protectedArea = area, 1);

    let islandArea: Area;
    yield* editArea(operator, `${teamName}: Island Area`, area => islandArea = area, 3);

    map.teams.push({
        type: teamType,
        bedLocation: [bedLocation_0!, bedLocation_1!] as [mc.Vector3, mc.Vector3],
        teamChestLocation: teamChestLocation!,
        itemShopLocation: itemShopLocation_0,
        teamShopLocation: teamShopLocation_0,
        teamGenerator: {
            type: GeneratorType.IronGold,
            location: generatorLocation!,
            spawnLocation: add(generatorLocation!, { x: 1.5, y: 0.5, z: 1.5 })
        },
        playerSpawn: { location: playerSpawn, carpet: hasCarpet },
        playerSpawnViewDirection: playerSpawnViewDirection!,
        protectedArea: protectedArea!,
        islandArea: islandArea!
    });
}

function* editTeamFromTemplate(operator: mc.Player, teamType: TeamType, map: MapInformation) {
    const {
        colorPrefix, name
    } = TEAM_CONSTANTS[teamType];
    const teamName = `${colorPrefix}${capitalize(name)}§r`;

    let response: Response;

    let bedLocation_0: mc.Vector3 = null as any;
    let bedLocation_1: mc.Vector3 = null as any;
    yield* editBlockLoc(operator, `${teamName} Head of Bed`, pos => bedLocation_0 = pos);
    yield* editBlockLoc(operator, `${teamName} Back of Bed`, pos => bedLocation_1 = pos);

    let teamChestLocation: mc.Vector3 = null as any;
    let itemShopLocation: mc.Vector3 = null as any;
    let teamShopLocation: mc.Vector3 = null as any;
    let generatorCentralBlockLocation: mc.Vector3 = null as any;
    let playerSpawn: mc.Vector3 = null as any;
    let playerSpawnViewDirection: mc.Vector3 = null as any;
    let protectedArea: Area = null as any;
    let islandArea: Area = null as any;

    const beforeTransform = subtract(map.teams[0].bedLocation[1], map.teams[0].bedLocation[0]);
    const transformResult = subtract(bedLocation_1, bedLocation_0);
    let xFlippable: boolean;
    let xAxis: mc.Vector3;
    let zAxis: mc.Vector3;
    if (Math.abs(beforeTransform.x - transformResult.x) == 1) {
        if (transformResult.x == 0) {
            xAxis = { x: 0, y: 0, z: transformResult.z / beforeTransform.x };
            zAxis = { x: 1, y: 0, z: 0 };
            xFlippable = false;
        } else {
            zAxis = { x: transformResult.x / beforeTransform.z, y: 0, z: 0 };
            xAxis = { x: 0, y: 0, z: 1 };
            xFlippable = true;
        }
    } else {
        if (transformResult.x == 0) {
            xAxis = { x: 1, y: 0, z: 0 };
            zAxis = { x: 0, y: 0, z: transformResult.z / beforeTransform.z };
            xFlippable = true;
        } else {
            xAxis = { x: transformResult.x / beforeTransform.x, y: 0, z: 0 };
            zAxis = { x: 0, y: 0, z: 1 };
            xFlippable = false;
        }
    }
    const yAxis = { x: 0, y: 1, z: 0 };
    const originBefore = map.teams[0].bedLocation[0];
    const originAfter = bedLocation_0;

    function calculate() {
        teamChestLocation = add(originAfter, transform(subtract(map.teams[0].teamChestLocation, originBefore), xAxis, yAxis, zAxis));
        itemShopLocation = add(originAfter, transform(subtract(map.teams[0].itemShopLocation, originBefore), xAxis, yAxis, zAxis));
        teamShopLocation = add(originAfter, transform(subtract(map.teams[0].teamShopLocation, originBefore), xAxis, yAxis, zAxis));
        generatorCentralBlockLocation = add(originAfter, transform(subtract(add({ x: 1, y: 0, z: 1 }, map.teams[0].teamGenerator.location), originBefore), xAxis, yAxis, zAxis));
        playerSpawn = add(originAfter, transform(subtract(map.teams[0].playerSpawn.location, originBefore), xAxis, yAxis, zAxis));
        playerSpawnViewDirection = transform(map.teams[0].playerSpawnViewDirection, xAxis, yAxis, zAxis);
        protectedArea = map.teams[0].protectedArea.map(v => add(originAfter, transform(subtract(v, originBefore), xAxis, yAxis, zAxis))) as Area;
        islandArea = map.teams[0].islandArea.map(v => add(originAfter, transform(subtract(v, originBefore), xAxis, yAxis, zAxis))) as Area;
    }
    calculate();

    while (response = yield) {
        if (response.type == ResponseType.tick) {
            operator.onScreenDisplay.setActionBar(`${teamName}: Use §oSelect§r to flip, or use §oConfrim§o to confirm`);
            // renderArea(operator, [bedLocation_0, bedLocation_1], 2);
            renderArea(operator, [teamChestLocation, add(teamChestLocation, { x: 1, y: 1, z: 1 })], 1);
            renderArea(operator, [add(generatorCentralBlockLocation, { x: -1, y: 0, z: -1 }), add(generatorCentralBlockLocation, { x: 1, y: 1, z: 1 })], 1.5);
            renderArea(operator, protectedArea, 2);
            renderArea(operator, islandArea, 4);
        } else if (response.type == ResponseType.select) {
            if (xFlippable) {
                if (xAxis.x == 0) xAxis.z = -xAxis.z;
                else xAxis.x = -xAxis.x;
            } else {
                if (zAxis.x == 0) zAxis.z = -zAxis.z;
                else zAxis.x = -zAxis.x;
            }
            calculate();
        } else if (response.type == ResponseType.confirm) {
            map.teams.push({
                type: teamType,
                bedLocation: [bedLocation_0, bedLocation_1] as [mc.Vector3, mc.Vector3],
                teamChestLocation,
                itemShopLocation,
                teamShopLocation,
                teamGenerator: {
                    type: GeneratorType.IronGold,
                    location: add(generatorCentralBlockLocation, { x: -1, y: 0, z: -1 }),
                    spawnLocation: add(generatorCentralBlockLocation, { x: 0.5, y: 0.5, z: 0.5 })
                },
                playerSpawn: { location: playerSpawn, carpet: map.teams[0].playerSpawn.carpet },
                playerSpawnViewDirection: playerSpawnViewDirection!,
                protectedArea,
                islandArea
            });
            return;
        }
    }
}

interface MapInformation {
    teams: TeamInformation[];
    extraGenerators: GeneratorInformation[];
    voidY?: number;
    playableArea?: Area;
    fallbackRespawnPoint?: mc.Vector3;
}
interface GeneratorInformation {
    type: GeneratorType;
    spawnLocation: mc.Vector3;
    location: mc.Vector3; // the bottom-north-west location
    indicatorLocation?: mc.Vector3;
}
interface TeamInformation {
    type: TeamType;
    itemShopLocation: mc.Vector3;
    teamShopLocation: mc.Vector3;
    teamGenerator: GeneratorInformation;
    /**
     * The first element should be the base,
     * the second element should be the head
     */
    bedLocation: [mc.Vector3, mc.Vector3];
    teamChestLocation: mc.Vector3;
    playerSpawn: { location: mc.Vector3; carpet: boolean; };
    playerSpawnViewDirection: mc.Vector3;
    protectedArea: Area;
    islandArea: Area;
}

type Task = Generator<undefined, void, Response>;

function addTools(player: mc.Player) {
    const container = player.getComponent("inventory")!.container!;
    let hasSelectItem = false;
    let hasConfirmItem = false;
    let hasMenuItem = false;
    for (const { item } of containerIterator(container)) {
        if (!item) continue;
        if (itemEqual(item, SELECT_ITEM)) hasSelectItem = true;
        else if (itemEqual(item, CONFIRM_ITEM)) hasConfirmItem = true;
        else if (itemEqual(item, MENU_ITEM)) hasMenuItem = true;
    }
    if (!hasSelectItem) container.addItem(SELECT_ITEM);
    if (!hasConfirmItem) container.addItem(CONFIRM_ITEM);
    if (!hasMenuItem) container.addItem(MENU_ITEM);
}

class MapEditter {
    private tasks: [Task, mc.Player][];
    private map: MapInformation;

    constructor() {
        this.tasks = [];
        this.map = {
            teams: [],
            extraGenerators: []
        };
    }

    async showEditMenu(operator: mc.Player) {
        if (this.tasks.find(([_, p]) => operator == p)) return;
        let form = new ActionFormData();
        form.title("Map Edit");
        form.body("Select an entry to enter edit mode");
        form.button("teams");
        form.button(`voidY\n${this.map.voidY ?? ""}`);
        form.button(`fallbackRespawnPoint\n${this.map.fallbackRespawnPoint ? toString(this.map.fallbackRespawnPoint, { decimals: 0 }) : ""}`);
        form.button(`mapArea`);
        form.button("§lOutput");

        let response = await form.show(operator);
        while (response.cancelationReason == FormCancelationReason.UserBusy) {
            await sleep(5);
            response = await form.show(operator);
        }
        if (response.canceled) return;
        const selection = response.selection!;

        let index = 0;
        let task: Task;
        if (selection == index++) {
            form = new ActionFormData();
            form.title("Teams");
            let bodyText = "Edit teams." + (this.map.teams.length ? `\n${this.map.teams.length} teams added: ` : "");
            for (const teamMapInfo of this.map.teams) {
                const t = TEAM_CONSTANTS[teamMapInfo.type];
                bodyText += `${t.colorPrefix}${t.name.toUpperCase()}`;
            }
            form.body(bodyText);
            form.button(this.map.teams.length == 0 ? "Add team" : "Add Team From Template");
            response = await form.show(operator);
            if (response.canceled) return;

            const settingForm = new ModalFormData();
            const teamList = [
                TeamType.Blue, TeamType.Cyan, TeamType.Gray, TeamType.Green,
                TeamType.Pink, TeamType.Red, TeamType.White, TeamType.Yellow
            ].filter(team => !this.map.teams.find(({ type }) => team == type));
            settingForm.dropdown("Select team type", teamList.map(team => {
                const t = TEAM_CONSTANTS[team];
                return t.colorPrefix + t.name.toUpperCase();
            }));
            const settingResponse = await settingForm.show(operator);
            if (settingResponse.canceled) return;

            task = (this.map.teams.length == 0 ? editTeam : editTeamFromTemplate)(operator, teamList[settingResponse.formValues![0] as number], this.map);
        } else if (selection == index++) {
            task = editVoidY(operator, this.map);
        } else if (selection == index++) {
            task = editBlockLoc(operator, "fallbackRespawnPoint", pos => this.map.fallbackRespawnPoint = pos);
        } else {
            task = editArea(operator, "Map Area", ([a, b]) => {
                this.map.playableArea = [{
                    x: a.x - 50, y: a.y - 50, z: a.z - 50
                }, {
                    x: b.x + 50, y: b.y + 50, z: b.z + 50
                }];
            }, 4);
        }
        this.tasks.push([task, operator]);
    }

    tickEvent() {
        for (const [task] of this.tasks) {
            task.next({ type: ResponseType.tick });
        }
    }

    async beforeItemUse(event: mc.ItemUseBeforeEvent) {
        for (let i = this.tasks.length - 1; i >= 0; --i) {
            const [task, operator] = this.tasks[i];
            if (event.source == operator) {
                if (itemEqual(event.itemStack, CONFIRM_ITEM)) {
                    event.cancel = true;
                    await sleep(0);
                    if (task.next({ type: ResponseType.confirm }).done) {
                        this.tasks.splice(i, 1);
                    }
                } else if (itemEqual(event.itemStack, SELECT_ITEM)) {
                    event.cancel = true;
                    await sleep(0);
                    task.next({
                        type: ResponseType.select
                    });
                }
                return;
            }
        }
    }

    async beforeItemUseOn(event: mc.ItemUseOnBeforeEvent) {
        for (let i = this.tasks.length - 1; i >= 0; --i) {
            const [task, operator] = this.tasks[i];
            if (event.source == operator) {
                if (itemEqual(event.itemStack, SELECT_ITEM)) {
                    event.cancel = true;
                    await sleep(0);
                    task.next({
                        type: ResponseType.selectLocation,
                        value: event.block.location
                    });
                }
                return;
            }
        }
    }
}
mc.system.runInterval(() => {
    if (mapEditter) mapEditter.tickEvent();
});

mc.world.beforeEvents.itemUse.subscribe(async event => {
    if (mapEditter) mapEditter.beforeItemUse(event);
    if (itemEqual(event.itemStack, MENU_ITEM) && event.source.isOp()) {
        if (!mapEditter) {
            mapEditter = new MapEditter();
        }
        event.cancel = true;
        await sleep(0);
        mapEditter.showEditMenu(event.source);
    }
});

mc.world.beforeEvents.itemUseOn.subscribe(async event => {
    if (mapEditter) mapEditter.beforeItemUseOn(event);
});

let mapEditter: MapEditter | null = null;

mc.world.beforeEvents.chatSend.subscribe(async event => {
    if (event.message == "#editmap") {
        if (!event.sender.isOp()) return;
        event.cancel = true;

        mc.system.run(() => addTools(event.sender));
    }
});
