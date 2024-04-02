import { Vector3Utils as v3 } from '@minecraft/math';
import * as mc from '@minecraft/server';
import { itemEqual, Area, sleep, vectorAdd, vectorWithinArea, containerIterator, capitalize, getPlayerByName } from './utility.js';
import { setupGameTest } from './GameTest.js';
import { MinecraftBlockTypes, MinecraftEffectTypes, MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data';

import { sprintf, vsprintf } from 'sprintf-js';
import { openShop, TokenValue } from './BedwarsShop.js';
import { isLocationPartOfAnyPlatforms } from './RescuePlatform.js';
import {SimulatedPlayer} from '@minecraft/server-gametest';

const RESPAWN_TIME = 100; // in ticks
const IRONGOLD_GENERATOR_INTERVAL = 60;
const DIAMOND_GENERATOR_INTERVAL = 600;
const EMERLAD_GENERATOR_INTERVAL = 1200;
export const IRON_ITEM_STACK = new mc.ItemStack(MinecraftItemTypes.IronIngot);
IRON_ITEM_STACK.nameTag = "Iron Token";
export const GOLD_ITEM_STACK = new mc.ItemStack(MinecraftItemTypes.GoldIngot);
GOLD_ITEM_STACK.nameTag = "Gold Token";
export const DIAMOND_ITEM_STACK = new mc.ItemStack(MinecraftItemTypes.Diamond);
DIAMOND_ITEM_STACK.nameTag = "Diamond Token";
export const EMERALD_ITEM_STACK = new mc.ItemStack(MinecraftItemTypes.Emerald);
EMERALD_ITEM_STACK.nameTag = "Emerald Token";

const PROTECTED_AREA_IRONGOLD: Area = [{ x: 0, y: 0, z: 0 }, { x: 3, y: 3, z: 3 }];
const PROTECTED_AREA_DIAMOND: Area = [{ x: 0, y: 0, z: 0 }, { x: 1, y: 3, z: 1 }];
const PROTECTED_AREA_EMERALD: Area = [{ x: 0, y: 0, z: 0 }, { x: 1, y: 3, z: 1 }];
const PRODUCING_AREA_IRONGOLD: Area = [{ x: 0, y: 0, z: 0 }, { x: 3, y: 1, z: 3 }];
const PRODUCING_AREA_DIAMOND: Area = [{ x: 0, y: 1, z: 0 }, { x: 1, y: 2, z: 1 }];
const PRODUCING_AREA_EMERALD: Area = [{ x: 0, y: 1, z: 0 }, { x: 1, y: 2, z: 1 }];

const DEATH_TITLE = "§cYOU DIED!";
const DEATH_SUBTITLE = "§eYou will respawn in §c%d §eseconds!";
const SPECTATE_TITLE = "SPECTATING!"
const SPECTATE_SUBTITLE = "Your bed has been destroyed";
const RESPAWN_TITLE = "§aRESPAWNED!";
const BED_DESTROYED_TITLE = "§cBED DESTROYED!";
const BED_DESTROYED_SUBTITLE = "You will no longer respawn!";
const TEAM_BED_DESTROYED_MESSAGE = "§lBED DESTRUCTION > §r%s%s Bed §7was destroyed by %s%s§7!";
const TEAM_ELIMINATION_MESSAGE = "§lTEAM ELIMINATED > §r%s%s §chas been eliminated!"
const FINAL_KILL_MESSAGE = "%(victimColor)s%(victim)s §7was killed by %(killerColor)s%(killer)s§7. §b§lFINAL KILL!";
const BREAKING_BLOCK_INVALID_MESSAGE = "§cYou cannot break blocks that are not placed by players.";
const KILL_NOTIFICATION = "KILL: %s%s";
const FINAL_KILL_NOTIFICATION = "FINAL KILL: %s%s";
const DISCONNECTED_MESSAGE = "%s%s §7has disconnected.";
const RECONNECTION_MESSAGE = "%s%s §7has reconnected.";
const PLACING_BLOCK_ILLAGEL_MESSAGE = "§cYou can't place blocks here!";
const GAME_ENDED_MESSAGE = "§lGAME ENDED > §r%s%s §7is the winner!"
export const PURCHASE_MESSAGE = "§aYou purchased §6%s";

enum GeneratorType {
    IronGold,
    Diamond,
    Emerald
}
enum TeamType {
    Red,
    Blue,
    Yellow,
    Green
}
interface GeneratorInformation {
    type: GeneratorType;
    spawnLocation: mc.Vector3;
    location: mc.Vector3; // the bottom-north-west location
    defaultInterval: number;
    defaultCapacity: number; // 0 means no limit
}
interface TeamInformation {
    type: TeamType;
    shopLocation: mc.Vector3;
    teamGenerator: GeneratorInformation;
    bedLocation: [mc.Vector3, mc.Vector3];
    teamChestLocation: mc.Vector3;
    playerSpawn: mc.Vector3;
    playerSpawnViewDirection: mc.Vector3;
}
interface MapInformation {
    teams: TeamInformation[];
    voidY: number;
    extraGenerators: GeneratorInformation[];
    size: mc.Vector3;
    /**
     * Used to detect respawning player
     */
    fallbackRespawnPoint: mc.Vector3;
}
export const TEAM_CONSTANTS: Record<TeamType, {
    name: string;
    colorPrefix: string;
    woolName: string;
    woolIconPath: string;
    // hardenedClayName: string;
    // hardenedClayIconPath: string;
    leatherHelmet: mc.ItemStack;
    leatherChestplate: mc.ItemStack;
    leatherLeggings: mc.ItemStack;
    leatherBoots: mc.ItemStack;
}> = Object.create(null);

{
    function setupItem(type: MinecraftItemTypes, team: TeamType) {
        const i = new mc.ItemStack(type);
        i.lockMode = mc.ItemLockMode.slot;
        /*i.getComponent("enchantable")!.addEnchantment({
            level: 3,
            type: MinecraftEnchantmentTypes.Unbreaking
        });*/
        return i;
    }

    TEAM_CONSTANTS[TeamType.Blue] = {
        name: "blue",
        colorPrefix: "§9",
        woolName: MinecraftItemTypes.BlueWool,
        woolIconPath: "textures/blocks/wool_colored_blue.png",
        leatherHelmet: setupItem(MinecraftItemTypes.LeatherHelmet, TeamType.Blue),
        leatherChestplate: setupItem(MinecraftItemTypes.LeatherChestplate, TeamType.Blue),
        leatherLeggings: setupItem(MinecraftItemTypes.LeatherLeggings, TeamType.Blue),
        leatherBoots: setupItem(MinecraftItemTypes.LeatherBoots, TeamType.Blue)
    }
    TEAM_CONSTANTS[TeamType.Green] = {
        name: "green",
        colorPrefix: "§a",
        woolName: MinecraftItemTypes.GreenWool,
        woolIconPath: "textures/blocks/wool_colored_green.png",
        leatherHelmet: setupItem(MinecraftItemTypes.LeatherHelmet, TeamType.Green),
        leatherChestplate: setupItem(MinecraftItemTypes.LeatherChestplate, TeamType.Green),
        leatherLeggings: setupItem(MinecraftItemTypes.LeatherLeggings, TeamType.Green),
        leatherBoots: setupItem(MinecraftItemTypes.LeatherBoots, TeamType.Green)
    }
    TEAM_CONSTANTS[TeamType.Red] = {
        name: "red",
        colorPrefix: "§c",
        woolName: MinecraftItemTypes.RedWool,
        woolIconPath: "textures/blocks/wool_colored_red.png",
        leatherHelmet: setupItem(MinecraftItemTypes.LeatherHelmet, TeamType.Red),
        leatherChestplate: setupItem(MinecraftItemTypes.LeatherChestplate, TeamType.Red),
        leatherLeggings: setupItem(MinecraftItemTypes.LeatherLeggings, TeamType.Red),
        leatherBoots: setupItem(MinecraftItemTypes.LeatherBoots, TeamType.Red)
    }
    TEAM_CONSTANTS[TeamType.Yellow] = {
        name: "yellow",
        colorPrefix: "§g",
        woolName: MinecraftItemTypes.YellowWool,
        woolIconPath: "textures/blocks/wool_colored_yellow.png",
        leatherHelmet: setupItem(MinecraftItemTypes.LeatherHelmet, TeamType.Yellow),
        leatherChestplate: setupItem(MinecraftItemTypes.LeatherChestplate, TeamType.Yellow),
        leatherLeggings: setupItem(MinecraftItemTypes.LeatherLeggings, TeamType.Yellow),
        leatherBoots: setupItem(MinecraftItemTypes.LeatherBoots, TeamType.Yellow)
    }
}

interface SwordLevel {
    level: number;
    name: string;
    icon: string;
    item: mc.ItemStack;
    toNextLevelCost: TokenValue;
}

export const SWORD_LEVELS: SwordLevel[] = (() => {
    function setupItem(type: MinecraftItemTypes) {
        const i = new mc.ItemStack(type);
        i.lockMode = mc.ItemLockMode.inventory;
        return i;
    }

    return [
        {
            level: 0,
            name: "Wooden Sword",
            icon: "textures/items/wood_sword.png",
            item: setupItem(MinecraftItemTypes.WoodenSword),
            toNextLevelCost: { ironAmount: 10, goldAmount: 0, diamondAmount: 0, emeraldAmount: 0 }
        }, {
            level: 1,
            name: "Stone Sword",
            icon: "textures/items/stone_sword.png",
            item: setupItem(MinecraftItemTypes.StoneSword),
            toNextLevelCost: { ironAmount: 0, goldAmount: 7, diamondAmount: 0, emeraldAmount: 0 }
        }, {
            level: 2,
            name: "Iron Sword",
            icon: "textures/items/iron_sword.png",
            item: setupItem(MinecraftItemTypes.IronSword),
            toNextLevelCost: { ironAmount: 0, goldAmount: 0, diamondAmount: 0, emeraldAmount: 4 }
        }, {
            level: 3,
            name: "Diamond Sword",
            icon: "textures/items/diamond_sword.png",
            item: setupItem(MinecraftItemTypes.DiamondSword),
            toNextLevelCost: { ironAmount: 0, goldAmount: 0, diamondAmount: 0, emeraldAmount: 0 }
        }
    ];
})();

export function hasNextSwordLevel(level: SwordLevel) {
    return level.level != SWORD_LEVELS.length - 1;
}
export function hasPrevSwordLevel(level: SwordLevel) {
    return level.level != 0;
}

export interface ArmorLevel {
    level: number;
    name: string;
    icon: string;
    leggings: mc.ItemStack;
    boots: mc.ItemStack;
    cost: TokenValue;
}

export const ARMOR_LEVELS: ArmorLevel[] = (() => {
    function setupItem(type: MinecraftItemTypes) {
        const i = new mc.ItemStack(type);
        i.lockMode = mc.ItemLockMode.slot;
        return i;
    }

    return [
        {
            level: 0,
            name: "Leather Armor",
            icon: "textures/items/leather_boots.tga",
            leggings: setupItem(MinecraftItemTypes.LeatherLeggings),
            boots: setupItem(MinecraftItemTypes.LeatherBoots),
            cost: { ironAmount: 0, goldAmount: 0, diamondAmount: 0, emeraldAmount: 0 }
        }, {
            level: 1,
            name: "Chainmail Armor",
            icon: "textures/items/chainmail_boots.png",
            leggings: setupItem(MinecraftItemTypes.ChainmailLeggings),
            boots: setupItem(MinecraftItemTypes.ChainmailBoots),
            cost: { ironAmount: 30, goldAmount: 0, diamondAmount: 0, emeraldAmount: 0 }
        }, {
            level: 2,
            name: "Iron Armor",
            icon: "textures/items/iron_boots.png",
            leggings: setupItem(MinecraftItemTypes.IronLeggings),
            boots: setupItem(MinecraftItemTypes.IronBoots),
            cost: { ironAmount: 0, goldAmount: 12, diamondAmount: 0, emeraldAmount: 0 }
        }, {
            level: 3,
            name: "Diamond Armor",
            icon: "textures/items/diamond_boots.png",
            leggings: setupItem(MinecraftItemTypes.DiamondLeggings),
            boots: setupItem(MinecraftItemTypes.DiamondBoots),
            cost: { ironAmount: 0, goldAmount: 0, diamondAmount: 0, emeraldAmount: 6 }
        }
    ];
})();

/*const testMap: MapInformation = {
    size: { x: 21, y: 3, z: 5 },
    fallbackRespawnPoint: { x: 0, y: 50, z: 0 },
    voidY: -48,
    teams: [
        {
            type: TeamType.Red,
            shopLocation: { x: 6, y: 2, z: 4 },
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 1.5, y: 1.5, z: 2.5 },
                location: { x: 0, y: 1, z: 1 },
                defaultInterval: IRONGOLD_GENERATOR_INTERVAL,
                defaultCapacity: 48
            },
            bedLocation: [{ x: 4, y: 1, z: 2 }, { x: 5, y: 1, z: 2 }],
            playerSpawn: { x: 3.5, y: 1, z: 2.5 },
            playerSpawnViewDirection: { x: 1, y: 0, z: 0 }
        },
        {
            type: TeamType.Blue,
            shopLocation: { x: 14, y: 2, z: 0 },
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 19.5, y: 1.5, z: 2.5 },
                location: { x: 18, y: 1, z: 1 },
                defaultInterval: IRONGOLD_GENERATOR_INTERVAL,
                defaultCapacity: 48
            },
            bedLocation: [{ x: 16, y: 1, z: 2 }, { x: 15, y: 1, z: 2 }],
            playerSpawn: { x: 17.5, y: 1, z: 2.5 },
            playerSpawnViewDirection: { x: -1, y: 0, z: 0 }
        }
    ],
    extraGenerators: [
        {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 10.5, y: 1, z: 0.5 },
            location: { x: 10, y: 0, z: 0 },
            defaultInterval: DIAMOND_GENERATOR_INTERVAL,
            defaultCapacity: 32
        },
        {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 10.5, y: 1, z: 4.5 },
            location: { x: 10, y: 0, z: 4 },
            defaultInterval: DIAMOND_GENERATOR_INTERVAL,
            defaultCapacity: 32
        },
        {
            type: GeneratorType.Emerald,
            spawnLocation: { x: 10.5, y: 1, z: 2.5 },
            location: { x: 10, y: 0, z: 2 },
            defaultInterval: EMERLAD_GENERATOR_INTERVAL,
            defaultCapacity: 32
        }
    ]
};*/
const testMap2: MapInformation = {
    size: { x: 21, y: 3, z: 5 },
    fallbackRespawnPoint: { x: 0+104, y: 149-54, z: 0 +65},
    voidY: -64,
    teams: [
        {
            type: TeamType.Red,
            shopLocation: { x: 95+104, y: 80-54, z: 8 +65},
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 98.5+104, y: 78.5-54, z: 0.5 +65},
                location: { x: 97+104, y: 78-54, z: -1 +65},
                defaultInterval: IRONGOLD_GENERATOR_INTERVAL,
                defaultCapacity: 48
            },
            bedLocation: [{ x: 80+104, y: 77-54, z: 0 +65}, { x: 79+104, y: 77-54, z: 0 +65}],
            playerSpawn: { x: 94.5+104, y: 79-54, z: 0.5 +65},
            playerSpawnViewDirection: { x: -1, y: 0, z: 0 },
            teamChestLocation: { x: 91+104, y: 79-54, z: 4 +65},
        },
        {
            type: TeamType.Blue,
            shopLocation: { x: -95+104, y: 80-54, z: -8 +65},
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: -97.5+104, y: 78.5-54, z: 0.5 +65},
                location: { x: -99+104, y: 78-54, z: -1 +65},
                defaultInterval: IRONGOLD_GENERATOR_INTERVAL,
                defaultCapacity: 48
            },
            bedLocation: [{ x: -80+104, y: 77-54, z: 0 +65}, { x: -79+104, y: 77-54, z: 0 +65}],
            playerSpawn: { x: -93.5+104, y: 79-54, z: 0.5 +65},
            playerSpawnViewDirection: { x: 1, y: 0, z: 0 },
            teamChestLocation: { x: -91+104, y: 79-54, z: 4 +65},
        }
    ],
    extraGenerators: [
        {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 0.5+104, y: 78-54, z: -51.5 +65},
            location: { x: 0+104, y: 77-54, z: -52 +65},
            defaultInterval: DIAMOND_GENERATOR_INTERVAL,
            defaultCapacity: 32
        },
        {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 0.5+104, y: 78-54, z: 52.5 +65},
            location: { x: 0+104, y: 77-54, z: 52 +65},
            defaultInterval: DIAMOND_GENERATOR_INTERVAL,
            defaultCapacity: 32
        },
        {
            type: GeneratorType.Emerald,
            spawnLocation: { x: -20.5+104, y: 77-54, z: -20.5 +65},
            location: { x: -21+104, y: 76-54, z: -21 +65},
            defaultInterval: EMERLAD_GENERATOR_INTERVAL,
            defaultCapacity: 32
        },
        {
            type: GeneratorType.Emerald,
            spawnLocation: { x: 21.5+104, y: 77-54, z: 21.5 +65},
            location: { x: 21+104, y: 76-54, z: 21 +65},
            defaultInterval: EMERLAD_GENERATOR_INTERVAL,
            defaultCapacity: 32
        }
    ]
};

export enum PlayerState {
    Alive/* = "alive"*/,
    Offline/* = "offline"*/,
    dead/* = "dead"*/, // When the player haven't clicked the "respawn" button
    Respawning/* = "respawning"*/,
    Spectating/* = "spectating"*/
}
enum TeamState {
    BedAlive/* = "bedAlive"*/,
    BedDestoryed/* = "bedDestroyed"*/,
    Dead/* = "dead"*/
}

enum GameState {
    waiting,
    started,
    ended
}

type GeneratorGameInformation = {
    spawnLocation: mc.Vector3;
    location: mc.Vector3;
    type: GeneratorType;
    capacity: number;
    interval: number;
    remainingCooldown: number;
    tokensGeneratedCount: number;
} & ({
    belongToTeam: true;
    team: TeamType;
} | {
    belongToTeam: false;
})

export interface PlayerGameInformation {
    name: string;
    team: TeamType;
    state: PlayerState;
    player: mc.Player;
    killCount: number;
    deathCount: number;
    finalKillCount: number;
    deathTime: number; // global tick
    deathLocation: mc.Vector3;
    deathRotaion: mc.Vector2;
    /**
     * Cleared when the player opens menu or press the back button,
     * set when the player perform an action
     */
    lastActionResults: boolean[];
    /**
     * Stores the attacker.
     * this field is cleared on death
     */
    lastHurtBy?: PlayerGameInformation;
    placement: BlockPlacementTracker;
    swordLevel: SwordLevel;
    armorLevel: ArmorLevel;
    hasShear: boolean;
}
export class BedWarsGame {
    private map: MapInformation;
    private players: Map<string, PlayerGameInformation>;
    private teamStates: Map<TeamType, TeamState>;
    private originPos: mc.Vector3;
    private state: GameState;
    private dimension: mc.Dimension;
    private generators: GeneratorGameInformation[];
    private scoreObj: mc.ScoreboardObjective;
    private startTime: number;

    constructor({ map, originLocation, dimension, scoreboardObjective }: {
        map: MapInformation,
        originLocation: mc.Vector3,
        dimension: mc.Dimension,
        scoreboardObjective: mc.ScoreboardObjective
    }) {
        this.map = map;
        this.originPos = originLocation;
        this.state = GameState.waiting;
        this.players = new Map();
        this.dimension = dimension;
        this.startTime = 0;
        this.scoreObj = scoreboardObjective;
        this.teamStates = new Map();
        for (const team of this.map.teams) {
            this.teamStates.set(team.type, TeamState.BedAlive);
        }
        this.generators = [];
        for (const teamInfo of this.map.teams) {
            const genInfo = teamInfo.teamGenerator;
            this.generators.push({
                spawnLocation: genInfo.spawnLocation,
                location: genInfo.location,
                type: genInfo.type,
                interval: genInfo.defaultInterval,
                capacity: genInfo.defaultCapacity,
                remainingCooldown: 0,
                tokensGeneratedCount: 0,
                belongToTeam: true,
                team: teamInfo.type
            });
        }
        for (const genInfo of this.map.extraGenerators) {
            this.generators.push({
                spawnLocation: genInfo.spawnLocation,
                location: genInfo.location,
                type: genInfo.type,
                interval: genInfo.defaultInterval,
                capacity: genInfo.defaultCapacity,
                remainingCooldown: 0,
                tokensGeneratedCount: 0,
                belongToTeam: false
            });
        }
    }

    setPlayer(player: mc.Player, teamType: TeamType) {
        if (!this.map.teams.find(t => t.type == teamType)) throw new Error("No such team");

        const playerInfo = this.players.get(player.name);
        if (playerInfo) {
            playerInfo.team = teamType;
            return;
        }
        this.players.set(player.name, {
            name: player.name,
            state: PlayerState.Alive,
            player,
            team: teamType,
            killCount: 0,
            deathCount: 0,
            finalKillCount: 0,
            deathLocation: { x: 0, y: 0, z: 0 },
            deathTime: 0,
            deathRotaion: { x: 0, y: 0 },
            lastActionResults: [],
            placement: new BlockPlacementTracker(),
            swordLevel: SWORD_LEVELS[0],
            armorLevel: ARMOR_LEVELS[0],
            hasShear: false
        });
    }

    start() {
        this.state = GameState.started;
        this.startTime = mc.system.currentTick;
        for (const playerInfo of this.players.values()) {
            if (!playerInfo.player.isValid()) {
                playerInfo.state = PlayerState.Offline;
                continue;
            }
            playerInfo.player.getComponent("inventory")!.container!.clearAll();
            this.respawnPlayer(playerInfo);
            this.setupSpawnPoint(playerInfo.player);
        }
        for (const gen of this.generators) {
            gen.remainingCooldown = gen.interval;
        }
        for(const {teamChestLocation} of this.map.teams) {
            this.dimension.getBlock(v3.add(teamChestLocation, this.originPos))?.getComponent("inventory")?.container?.clearAll();
        }

        mc.world.scoreboard.setObjectiveAtDisplaySlot(mc.DisplaySlotId.Sidebar, {
            objective: this.scoreObj
        });
        this.updateScoreboard();
    }

    private updateScoreboard() {
        this.scoreObj.getParticipants().forEach(p => this.scoreObj.removeParticipant(p));
        this.scoreObj.setScore("§eminecraft.net", 1);
        this.scoreObj.setScore("", 2);
        let index = 2;
        for(const [teamType, state] of this.teamStates) {
            ++index;
            const t = TEAM_CONSTANTS[teamType];
            let result = `${t.colorPrefix}${t.name.charAt(0).toUpperCase()} §r${capitalize(t.name)}: `;
            switch(state) {
                case TeamState.BedAlive:
                    // result += "§a✔";
                    result += "§aV"; // Mojangles will be broke by unicode characters
                    break;
                case TeamState.Dead:
                    // result += "§c✘";
                    result += "§cX"; // Mojangles will be broke by unicode characters
                    break;
                case TeamState.BedDestoryed:
                    let aliveCount = 0;
                    for(const playerInfo of this.players.values()) {
                        if(playerInfo.team != teamType) continue;
                        if(this.isPlayerInGame(playerInfo)) ++aliveCount;
                    }
                    result += `§a${aliveCount}`;
            }
            this.scoreObj.setScore(result, index);
        }
        ++index;
        this.scoreObj.setScore(" ", index);
        ++index;
        const date = new Date((mc.system.currentTick - this.startTime) * 50);
        let seconds = date.getSeconds().toString();
        if(seconds.length == 1) seconds = "0" + seconds;
        let minutes = date.getMinutes().toString();
        if(minutes.length == 1) minutes = "0" + minutes;
        this.scoreObj.setScore(`  §a${minutes}:${seconds}`, index);
    }

    private respawnPlayer(playerInfo: PlayerGameInformation) {
        const teamInfo = this.map.teams.find(ele => ele.type === playerInfo.team)!;
        const spawnPoint = v3.add(teamInfo.playerSpawn, this.originPos);
        playerInfo.player.teleport(spawnPoint, { facingLocation: v3.add(spawnPoint, teamInfo.playerSpawnViewDirection) });
        playerInfo.player.runCommand("gamemode survival");
        playerInfo.player.getComponent("minecraft:health")!.resetToMaxValue();
        playerInfo.player.addEffect(MinecraftEffectTypes.Saturation, 100000, {
            amplifier: 127,
            showParticles: false
        });
        playerInfo.player.addEffect(MinecraftEffectTypes.Resistance, 3 * 20, {
            amplifier: 127,
            showParticles: true
        });
        playerInfo.player.extinguishFire();
        this.resetInventory(playerInfo);
        playerInfo.lastHurtBy = undefined;

        playerInfo.state = PlayerState.Alive;
    }

    private resetInventory(playerInfo: PlayerGameInformation) {
        const equipment = playerInfo.player.getComponent("minecraft:equippable")!;
        const t = TEAM_CONSTANTS[playerInfo.team];
        equipment.setEquipment(mc.EquipmentSlot.Head, t.leatherHelmet);
        equipment.setEquipment(mc.EquipmentSlot.Chest, t.leatherChestplate);
        if(playerInfo.armorLevel.level == 0) {
            equipment.setEquipment(mc.EquipmentSlot.Legs, t.leatherLeggings);
            equipment.setEquipment(mc.EquipmentSlot.Feet, t.leatherBoots);
        } else {
            equipment.setEquipment(mc.EquipmentSlot.Legs, playerInfo.armorLevel.leggings);
            equipment.setEquipment(mc.EquipmentSlot.Feet, playerInfo.armorLevel.boots);
        }
        const container = playerInfo.player.getComponent("inventory")!.container!;
        playerInfo.swordLevel = SWORD_LEVELS[0];
        let hasSword = false;
        let foundShear = false;
        for (const { item, index } of containerIterator(container)) {
            if (!item) continue;
            if (item.hasTag("is_sword") && !hasSword) {
                hasSword = true;
                container.setItem(index, playerInfo.swordLevel.item);
                continue;
            }
            if (item.typeId == MinecraftItemTypes.Shears) {
                foundShear = true;
                if(playerInfo.hasShear) continue;
            }
            container.setItem(index);
        }
        if (!hasSword) {
            container.addItem(playerInfo.swordLevel.item);
        }
        if(!foundShear && playerInfo.hasShear) {
            container.addItem(new mc.ItemStack(MinecraftItemTypes.Shears));
        }
    }
    private setupSpawnPoint(player: mc.Player) {
        player.setSpawnPoint(Object.assign({ dimension: player.dimension }, v3.add(this.originPos, this.map.fallbackRespawnPoint)));
    }

    private isPlayerInGame(playerInfo: PlayerGameInformation) {
        const teamState = this.teamStates.get(playerInfo.team);
        if (teamState == TeamState.BedAlive) {
            if (playerInfo.state == PlayerState.Alive ||
                playerInfo.state == PlayerState.dead ||
                playerInfo.state == PlayerState.Respawning) {
                return true;
            }
        } else if (teamState == TeamState.BedDestoryed) {
            if (playerInfo.state == PlayerState.Alive ||
                playerInfo.state == PlayerState.Respawning) {
                return true;
            }
        }
        return false;
    }
    private checkTeamPlayers() {
        const remainingPlayerCounts = new Map<TeamType, number>();
        for (const { type: teamType } of this.map.teams) {
            if (this.teamStates.get(teamType) == TeamState.Dead) continue;
            remainingPlayerCounts.set(teamType, 0);
        }

        for (const playerInfo of this.players.values()) {
            if (this.isPlayerInGame(playerInfo)) {
                remainingPlayerCounts.set(playerInfo.team, 1 + remainingPlayerCounts.get(playerInfo.team)!);
            }
        }

        for (const [teamType, aliveCount] of remainingPlayerCounts) {
            if (aliveCount == 0) {
                this.teamStates.set(teamType, TeamState.Dead);
                const { name, colorPrefix } = TEAM_CONSTANTS[teamType];
                this.broadcast(TEAM_ELIMINATION_MESSAGE,
                    colorPrefix, capitalize(name));
            }
        }

        // detect whether the game ends
        let aliveTeam: TeamType | null = null;
        for (const [team, state] of this.teamStates) {
            if (state != TeamState.Dead) {
                if (aliveTeam == null) {
                    aliveTeam = team;
                } else { // There are more than one teams alive, so break it
                    aliveTeam = null;
                    break;
                }
            }
        }
        if (aliveTeam != null) { // the game ends
            this.state = GameState.ended;

            const t = TEAM_CONSTANTS[aliveTeam];
            const message = sprintf(GAME_ENDED_MESSAGE,
                t.colorPrefix, capitalize(t.name));
            for (const playerInfo of this.players.values()) {
                if (playerInfo.state == PlayerState.Offline) continue;
                playerInfo.player.sendMessage(message);
                if (playerInfo.team != aliveTeam) continue;

                playerInfo.player.onScreenDisplay.setTitle("§a§lVICTORY!", {
                    fadeInDuration: 0,
                    stayDuration: 100,
                    fadeOutDuration: 20
                });
            }
            for(const playerInfo of this.players.values()) {
                for(const loc of playerInfo.placement) {
                    this.dimension.fillBlocks(loc, loc, MinecraftBlockTypes.Air);
                }
            }
        }
    }

    private broadcast(content: any, ...params: any[]) {
        for (const playerInfo of this.players.values()) {
            if (playerInfo.state == PlayerState.Offline) continue;
            playerInfo.player.sendMessage(vsprintf(String(content), params));
        }
    }

    tickEvent() {
        if (this.state != GameState.started) return;

        for (const playerInfo of this.players.values()) {
            if (playerInfo.state == PlayerState.Offline) {
                const player = getPlayerByName(playerInfo.name);
                if (!player) continue;
                // the player comes online
                playerInfo.player = player;
                player.runCommand("gamemode spectator");
                player.teleport(playerInfo.deathLocation, { rotation: playerInfo.deathRotaion });
                playerInfo.deathTime = mc.system.currentTick;

                const teamState = this.teamStates.get(playerInfo.team);
                switch (teamState) {
                    case TeamState.BedAlive:
                        playerInfo.state = PlayerState.Respawning;
                        player.onScreenDisplay.setTitle(DEATH_TITLE, {
                            subtitle: sprintf(DEATH_SUBTITLE, RESPAWN_TIME / 20),
                            fadeInDuration: 0,
                            stayDuration: 30,
                            fadeOutDuration: 20,
                        });
                        break;
                    case TeamState.BedDestoryed:
                    case TeamState.Dead:
                        playerInfo.state = PlayerState.Spectating;
                        player.onScreenDisplay.setTitle(SPECTATE_TITLE, {
                            subtitle: SPECTATE_SUBTITLE,
                            fadeInDuration: 0,
                            stayDuration: 50,
                            fadeOutDuration: 10
                        });
                        break;
                }
                this.broadcast(RECONNECTION_MESSAGE,
                    TEAM_CONSTANTS[playerInfo.team].colorPrefix,
                    playerInfo.name);
            }
            const player = playerInfo.player;
            if (!player.isValid()) {
                playerInfo.state = PlayerState.Offline; // the player comes offline
                this.broadcast(DISCONNECTED_MESSAGE,
                    TEAM_CONSTANTS[playerInfo.team].colorPrefix,
                    playerInfo.name);
                this.playerDieOrOffline(playerInfo, playerInfo.lastHurtBy);
                continue;
            }

            if (playerInfo.state == PlayerState.dead &&
                v3.distance(v3.add(this.originPos, this.map.fallbackRespawnPoint), player.location) <= 1) {
                player.runCommand("gamemode spectator");
                player.teleport(playerInfo.deathLocation, { rotation: playerInfo.deathRotaion });
                const isTeamBedAlive = this.teamStates.get(playerInfo.team) == TeamState.BedAlive;
                player.onScreenDisplay.setTitle(DEATH_TITLE, {
                    subtitle: isTeamBedAlive ? sprintf(DEATH_SUBTITLE, RESPAWN_TIME / 20) : undefined,
                    fadeInDuration: 0,
                    stayDuration: 30,
                    fadeOutDuration: 20
                });
                if (isTeamBedAlive) {
                    playerInfo.state = PlayerState.Respawning;
                } else {
                    playerInfo.state = PlayerState.Spectating;
                }
            }

            if (playerInfo.state == PlayerState.Respawning) {
                const remainingTicks = RESPAWN_TIME + playerInfo.deathTime - mc.system.currentTick;
                if (remainingTicks <= 0) {
                    this.respawnPlayer(playerInfo);
                    player.onScreenDisplay.setTitle(RESPAWN_TITLE, {
                        fadeInDuration: 0,
                        stayDuration: 10,
                        fadeOutDuration: 20,
                    });
                } else if (remainingTicks % 20 == 0) {
                    player.onScreenDisplay.setTitle(DEATH_TITLE, {
                        subtitle: sprintf(DEATH_SUBTITLE, remainingTicks / 20),
                        fadeInDuration: 0,
                        stayDuration: 30,
                        fadeOutDuration: 20,
                    });
                }
            } else if (playerInfo.state == PlayerState.Alive) {
                if (player.location.y <= this.originPos.y + this.map.voidY) { // The player falls to the void
                    player.runCommand("gamemode spectator");
                    this.playerDieOrOffline(playerInfo, playerInfo.lastHurtBy);

                    const isTeamBedAlive = this.teamStates.get(playerInfo.team) == TeamState.BedAlive;
                    player.onScreenDisplay.setTitle(DEATH_TITLE, {
                        subtitle: isTeamBedAlive ? sprintf(DEATH_SUBTITLE, RESPAWN_TIME / 20) : undefined,
                        fadeInDuration: 0,
                        stayDuration: 30,
                        fadeOutDuration: 20
                    });
                    if (isTeamBedAlive) {
                        playerInfo.state = PlayerState.Respawning;
                    } else {
                        playerInfo.state = PlayerState.Spectating;
                    }
                    player.dimension.spawnEntity(MinecraftEntityTypes.LightningBolt, player.location);
                    continue;
                }
                const equipment = player.getComponent("equippable")!;
                [mc.EquipmentSlot.Head, mc.EquipmentSlot.Chest, mc.EquipmentSlot.Legs, mc.EquipmentSlot.Feet, mc.EquipmentSlot.Mainhand].forEach(slotName => {
                    const item = equipment.getEquipment(slotName);
                    if (!item) return;
                    if(slotName == mc.EquipmentSlot.Mainhand) {
                        let erase = false;
                        // detects illeagl items
                        if([MinecraftItemTypes.CraftingTable,
                            MinecraftItemTypes.WoodenButton,
                            MinecraftItemTypes.IronNugget,
                            MinecraftItemTypes.GoldNugget,
                            MinecraftItemTypes.WoodenPressurePlate,
                            MinecraftItemTypes.HeavyWeightedPressurePlate,
                            MinecraftItemTypes.LightWeightedPressurePlate].includes(item.typeId as MinecraftItemTypes)) {
                            erase = true;
                        }
                        if(item.typeId == MinecraftItemTypes.Shears && !playerInfo.hasShear) {
                            erase = true;
                        }
                        if(erase) {
                            equipment.getEquipmentSlot(slotName).setItem();
                            return;
                        }
                    }
                    const com = item.getComponent("durability");
                    if (!com) return;
                    if (com.damage > 20) {
                        com.damage = 0;
                        equipment.setEquipment(slotName, item);
                    }
                });
            }
        }
        for (const gen of this.generators) {
            --gen.remainingCooldown;
            if (gen.remainingCooldown > 0) continue;

            gen.remainingCooldown = gen.interval;
            const spawnLocation = v3.add(gen.spawnLocation, this.originPos);

            // Detect if it reaches capacity
            if (gen.capacity != 0) {
                let producingArea: Area;
                let original_producing_area: Area;
                switch (gen.type) {
                    case GeneratorType.IronGold:
                        original_producing_area = PRODUCING_AREA_IRONGOLD;
                        break;
                    case GeneratorType.Diamond:
                        original_producing_area = PRODUCING_AREA_DIAMOND;
                        break;
                    case GeneratorType.Emerald:
                        original_producing_area = PRODUCING_AREA_EMERALD;
                        break;
                }
                producingArea = original_producing_area.map(
                    vec => vectorAdd(vec, gen.location, this.originPos)) as Area;
                let existingTokens = 0;
                for (const entity of this.dimension.getEntities({ type: "minecraft:item" })) {
                    if (!vectorWithinArea(entity.location, producingArea)) continue;
                    const itemStack = entity.getComponent("minecraft:item")!.itemStack;
                    switch (gen.type) {
                        case GeneratorType.IronGold:
                            if (itemEqual(itemStack, IRON_ITEM_STACK) || itemEqual(itemStack, GOLD_ITEM_STACK)) {
                                existingTokens += itemStack.amount;
                            }
                            continue;
                        case GeneratorType.Diamond:
                            if (itemEqual(itemStack, DIAMOND_ITEM_STACK)) {
                                existingTokens += itemStack.amount;
                            }
                            continue;
                        case GeneratorType.Emerald:
                            if (itemEqual(itemStack, EMERALD_ITEM_STACK)) {
                                existingTokens += itemStack.amount;
                            }
                            continue;
                    }
                }
                if (existingTokens >= gen.capacity) continue;
            }

            ++gen.tokensGeneratedCount;

            // Generate token item
            let itemEntity: mc.Entity;
            switch (gen.type) {
                case GeneratorType.IronGold:
                    if (gen.tokensGeneratedCount % 4 == 0) {
                        this.dimension.spawnItem(GOLD_ITEM_STACK, spawnLocation);
                    }
                    itemEntity = this.dimension.spawnItem(IRON_ITEM_STACK, spawnLocation);
                    break;
                case GeneratorType.Diamond:
                    itemEntity = this.dimension.spawnItem(DIAMOND_ITEM_STACK, spawnLocation);
                    break;
                case GeneratorType.Emerald:
                    itemEntity = this.dimension.spawnItem(EMERALD_ITEM_STACK, spawnLocation);
                    break;
            }
            if (gen.type == GeneratorType.IronGold) continue;
            const v = itemEntity.getVelocity();
            v.x = -v.x;
            v.y = 0;
            v.z = -v.z;
            itemEntity.applyImpulse(v);
        }
        if((mc.system.currentTick - this.startTime) % 20 == 0) {
            this.updateScoreboard();
        }
    }

    private playerDieOrOffline(victimInfo: PlayerGameInformation, killerInfo?: PlayerGameInformation) {
        victimInfo.deathTime = mc.system.currentTick;
        ++victimInfo.deathCount;
        victimInfo.lastHurtBy = undefined;
        let victimOffline = false;
        if (victimInfo.state == PlayerState.Offline) {
            victimOffline = true;
            const teamInfo = this.map.teams.find(ele => ele.type === victimInfo.team)!;
            victimInfo.deathLocation = v3.add(this.originPos, teamInfo.playerSpawn);
            victimInfo.deathRotaion = teamInfo.playerSpawnViewDirection;
        } else {
            victimInfo.deathLocation = victimInfo.player.location;
            victimInfo.deathRotaion = victimInfo.player.getRotation();
            victimInfo.state = PlayerState.dead;
        }

        if (this.teamStates.get(victimInfo.team) == TeamState.BedAlive) {
            if (killerInfo) {
                ++killerInfo.killCount;
                killerInfo.player.onScreenDisplay.setActionBar(sprintf(
                    KILL_NOTIFICATION,
                    TEAM_CONSTANTS[victimInfo.team].colorPrefix,
                    victimInfo.name));
            }
        } else { // FINAL KILL
            if (killerInfo) {
                ++killerInfo.finalKillCount;
                this.broadcast(sprintf(FINAL_KILL_MESSAGE, {
                    killerColor: TEAM_CONSTANTS[killerInfo.team].colorPrefix,
                    killer: killerInfo.name,
                    victimColor: TEAM_CONSTANTS[victimInfo.team].colorPrefix,
                    victim: victimInfo.name
                }));
                killerInfo.player.onScreenDisplay.setActionBar(sprintf(
                    FINAL_KILL_NOTIFICATION,
                    TEAM_CONSTANTS[victimInfo.team].colorPrefix,
                    victimInfo.name));
            }
            if (!victimOffline) victimInfo.player.onScreenDisplay.setTitle(SPECTATE_TITLE, {
                subtitle: SPECTATE_SUBTITLE,
                fadeInDuration: 0,
                stayDuration: 50,
                fadeOutDuration: 10
            });
        }

        if (!victimOffline) this.setupSpawnPoint(victimInfo.player);

        this.checkTeamPlayers();
    }

    beforeExplosion(event: mc.ExplosionBeforeEvent) {
        if (this.state != GameState.started) return;

        const impactedBlocks = event.getImpactedBlocks();
        const playerPlacedBlocks = Array.from(impactedBlocks);
        for (let index = impactedBlocks.length - 1; index >= 0; --index) {
            const block = impactedBlocks[index];
            if (block.typeId == MinecraftBlockTypes.EndStone) {
                playerPlacedBlocks.splice(index, 1);
            } else if (!this.removeBlockFromRecord(block)) {
                playerPlacedBlocks.splice(index, 1);
            }
        }
        event.setImpactedBlocks(playerPlacedBlocks);
    }
    afterEntityDie(event: mc.EntityDieAfterEvent) {
        if (this.state != GameState.started) return;
        if (!(event.deadEntity instanceof mc.Player)) return;
        const victim = event.deadEntity;
        const victimInfo = this.players.get(victim.name);
        if (!victimInfo) return;

        let killerInfo: PlayerGameInformation | undefined;
        if (event.damageSource.cause == mc.EntityDamageCause.entityAttack &&
            event.damageSource.damagingEntity instanceof mc.Player) {
            killerInfo = this.players.get(event.damageSource.damagingEntity.name);
        } else if (victimInfo.lastHurtBy) {
            killerInfo = victimInfo.lastHurtBy;
        }
        this.playerDieOrOffline(victimInfo, killerInfo);
    }

    afterEntityHurt(event: mc.EntityHurtAfterEvent) {
        if (this.state != GameState.started) return;

        if(!(event.hurtEntity instanceof mc.Player)) return;
        if(!(event.damageSource.damagingEntity instanceof mc.Player)) return;
        const victim = event.hurtEntity;
        const hurter = event.damageSource.damagingEntity;
        const victimInfo = this.players.get(victim.name);
        const hurterInfo = this.players.get(hurter.name);
        if(!victimInfo) return;
        if(!hurterInfo) return;
        if(victimInfo.team == hurterInfo.team) {
            // workaround for disabling in-team damage
            const health = victim.getComponent("health")!;
            health.setCurrentValue(health.currentValue + event.damage);
        }
    }
    afterEntityHitEntity(event: mc.EntityHitEntityAfterEvent) {
        if (this.state != GameState.started) return;

        if (!(event.hitEntity instanceof mc.Player)) return;
        const victimInfo = this.players.get(event.hitEntity.name);
        if (!victimInfo) return;

        if (event.damagingEntity instanceof mc.Player) {
            const hurterInfo = this.players.get(event.damagingEntity.name);
            if (hurterInfo) {
                if(hurterInfo.team == victimInfo.team) {
                    // TOWAIT TODO
                    return;
                }
                victimInfo.lastHurtBy = hurterInfo;
            } else {
                victimInfo.lastHurtBy = undefined;
            }
            return;
        }
    }
    afterProjectileHitEntity(event: mc.ProjectileHitEntityAfterEvent) {
        if(event.dimension != this.dimension) return;
        const victim = event.getEntityHit().entity;
        if(!victim) return;
        if(!(victim instanceof mc.Player)) return;
        const victimInfo = this.players.get(victim.name);
        if(!victimInfo) return;
        if(event.source) {
            if(event.source instanceof mc.Player) {
                const hurterInfo = this.players.get(event.source.name);
                if(hurterInfo) {
                    if(hurterInfo.team == victimInfo.team) {
                        // TOWAIT TODO
                    } else {
                        victimInfo.lastHurtBy = hurterInfo;
                        return;
                    }
                }
            }
            victimInfo.lastHurtBy = undefined;
        }
    }
    async beforePlayerInteractWithBlock(event: mc.PlayerInteractWithBlockBeforeEvent) {
        if (this.state != GameState.started) return;

        if (event.block.dimension != this.dimension) return;
        const playerInfo = this.players.get(event.player.name);
        if (!playerInfo) return;

        if (event.block.typeId == MinecraftBlockTypes.Bed ||
            event.block.typeId == MinecraftBlockTypes.RespawnAnchor) {
            if (!playerInfo.player.isSneaking) {
                event.cancel = true;
            }
            return;
        }
        if(event.block.typeId == MinecraftBlockTypes.Chest) {
            for(const team of this.map.teams) {
                if(v3.equals(event.block.location, v3.add(team.teamChestLocation, this.originPos))) {
                    if(playerInfo.team != team.type) {
                        playerInfo.player.sendMessage("§cYou can't open enemy's chest.");
                        event.cancel = true;
                    }
                    break;
                }
            }
            return;
        }

        for (const { shopLocation } of this.map.teams) {
            if (v3.equals(v3.add(this.originPos, shopLocation), event.block.location)) {
                await sleep(0);
                openShop(playerInfo, this);
                return;
            }
        }
    }
    beforePlayerInteractWithEntity(event: mc.PlayerInteractWithEntityBeforeEvent) {
        if (this.state != GameState.started) return;
    }
    private removeBlockFromRecord(block: mc.Block) {
        for (const { placement } of this.players.values()) {
            if (!placement.remove(block.location)) continue;
            // the location appears in the tracker.
            const location = Object.assign({}, block.location);

            let bit = block.permutation.getState("upper_block_bit");
            if (bit != null) {
                if (bit) { --location.y; } else { ++location.y; }
                placement.remove(location);
            }

            bit = block.permutation.getState("head_piece_bit");
            checkBed: if (bit != null) {
                const modifier = bit ? -1 : 1;
                const direction = block.permutation.getState("direction");
                if (direction == null) break checkBed;
                switch (direction) {
                    case 0: location.z += modifier; break; // SOUTH
                    case 1: location.x -= modifier; break; // WEST
                    case 2: location.z -= modifier; break; // NORTH
                    case 3: location.x += modifier; break; // EAST
                }
                placement.remove(location);
            }

            return true;
        }
        return false;
    }
    async beforePlayerBreakBlock(event: mc.PlayerBreakBlockBeforeEvent) {
        if (this.state != GameState.started) return;
        if (event.dimension != this.dimension) return;
        const destroyerInfo = this.players.get(event.player.name);
        TeamBedDestroyed: if (event.block.typeId == "minecraft:bed") {
            const destroyedTeam = this.map.teams.find(team =>
                team.bedLocation.findIndex(pos =>
                    v3.equals(v3.add(pos, this.originPos), event.block.location)) != -1);
            if (!destroyedTeam) {
                break TeamBedDestroyed;
            }
            event.cancel = true;

            if (!destroyerInfo) return;
            if (destroyedTeam.type == destroyerInfo.team) return;
            await sleep(0);

            /* Clear the bed */
            event.dimension.fillBlocks(v3.add(destroyedTeam.bedLocation[0], this.originPos),
                v3.add(destroyedTeam.bedLocation[1], this.originPos), "minecraft:air");

            if (this.teamStates.get(destroyedTeam.type) == TeamState.Dead) return;

            /* Inform all the players */
            for (const playerInfo of this.players.values()) {
                if (playerInfo.state == PlayerState.Offline) continue;

                if (playerInfo.team == destroyedTeam.type) {
                    playerInfo.player.playSound("mob.wither.death");
                    playerInfo.player.onScreenDisplay.setTitle(BED_DESTROYED_TITLE, {
                        subtitle: BED_DESTROYED_SUBTITLE,
                        fadeInDuration: 5,
                        stayDuration: 40,
                        fadeOutDuration: 10
                    });
                } else {
                    playerInfo.player.playSound("mob.enderdragon.growl", { volume: 0.1 });
                }
                const t = TEAM_CONSTANTS[destroyedTeam.type];
                playerInfo.player.sendMessage(sprintf(TEAM_BED_DESTROYED_MESSAGE,
                    t.colorPrefix, capitalize(t.name),
                    TEAM_CONSTANTS[destroyerInfo.team].colorPrefix, destroyerInfo.name));
            }
            this.teamStates.set(destroyedTeam.type, TeamState.BedDestoryed);
            return;
        }

        if (!destroyerInfo) return;
        if (isLocationPartOfAnyPlatforms(event.block.location, this.dimension)) return;
        if (!this.removeBlockFromRecord(event.block)) {
            // The location doesn't appear in the tracker.
            event.cancel = true;
            destroyerInfo.player.sendMessage(BREAKING_BLOCK_INVALID_MESSAGE);
        }
    }

    async beforePlayerPlaceBlock(event: mc.PlayerPlaceBlockBeforeEvent) {
        if (this.state != GameState.started) return;

        const playerInfo = this.players.get(event.player.name);
        if (!playerInfo) return;

        if (event.permutationBeingPlaced.type.id == MinecraftBlockTypes.Tnt) {
            event.cancel = true;
            await sleep(0);
            playerInfo.player.dimension.spawnEntity(MinecraftEntityTypes.Tnt, event.block.bottomCenter());
            // consume tnt
            const slot = playerInfo.player.getComponent("equippable")!.getEquipmentSlot(mc.EquipmentSlot.Mainhand);
            if (slot.amount >= 2) {
                --slot.amount;
            } else {
                slot.setItem();
            }
            return;
        } else if(event.permutationBeingPlaced.type.id == MinecraftBlockTypes.CraftingTable) {
            // disallow the player to place crafting table
            // and then clear it
            event.cancel = true;
            await sleep(0);
            playerInfo.player.getComponent("equippable")!.getEquipmentSlot(mc.EquipmentSlot.Mainhand).setItem();
        }
        // disallow the player to place blocks near generators
        for (const gen of this.generators) {
            let protected_area: Area;
            let original_protected_area: Area;
            switch (gen.type) {
                case GeneratorType.IronGold:
                    original_protected_area = PROTECTED_AREA_IRONGOLD;
                    break;
                case GeneratorType.Diamond:
                    original_protected_area = PROTECTED_AREA_DIAMOND;
                    break;
                case GeneratorType.Emerald:
                    original_protected_area = PROTECTED_AREA_EMERALD;
                    break;
            }
            protected_area = original_protected_area.map(
                vec => vectorAdd(vec, gen.location, this.originPos)) as Area;
            if (vectorWithinArea(event.block.location, protected_area)) {
                event.cancel = true;
                playerInfo.player.sendMessage(PLACING_BLOCK_ILLAGEL_MESSAGE);
                return;
            }
        }
        // Allow the player to place block
        playerInfo.placement.push(event.block.location);

        if (event.permutationBeingPlaced.getState("upper_block_bit") != null) { // DOOR
            const location = Object.assign({}, event.block.location);
            ++location.y;
            playerInfo.placement.push(location);
        }

        checkBed: if (event.permutationBeingPlaced.getState("head_piece_bit") != null) { // BED
            const location = Object.assign({}, event.block.location);
            await sleep(0);
            /* Instead of directly using event.permutaionBeingPlaced, I have to do it this way to get the right direction */
            const direction = this.dimension.getBlock(location)?.permutation.getState("direction");
            if (direction == null) break checkBed;
            switch (direction) {
                case 0: location.z += 1; break; // SOUTH
                case 1: location.x -= 1; break; // WEST
                case 2: location.z -= 1; break; // NORTH
                case 3: location.x += 1; break; // EAST
            }
            playerInfo.placement.push(location);
        }
    }
};

class BlockPlacementTracker {
    static readonly DEFAULT_BUCKET_SIZE = 25;
    private data: mc.Vector3[][];
    private readonly bucketSize: number;

    constructor(bucketSize = BlockPlacementTracker.DEFAULT_BUCKET_SIZE) {
        this.data = [];
        this.bucketSize = bucketSize;
        for (let i = 0; i < bucketSize; ++i) this.data.push([]);
    }
    private hash(loc: mc.Vector3) {
        return Math.abs(loc.x + loc.y + loc.z);
    }
    /**
     * Push a location into the tracker.
     * Would remove overlaping record if it exists
     */
    push(loc: mc.Vector3) {
        const bucketIndex = this.hash(loc) % this.bucketSize;
        let index = 0;
        for (const existedLoc of this.data[bucketIndex]) {
            if (v3.equals(loc, existedLoc)) {
                this.data[bucketIndex].splice(index, 1);
                break;
            }
            ++index;
        }

        this.data[bucketIndex].push(loc);
    }
    has(loc: mc.Vector3) {
        const bucketIndex = this.hash(loc) % this.bucketSize;
        for (const existedLoc of this.data[bucketIndex]) {
            if (v3.equals(loc, existedLoc)) {
                return true;
            }
        }
        return false;
    }
    /**
     * @returns {Boolean} Whether the operation succeeds
     */
    remove(loc: mc.Vector3): boolean {
        const bucketIndex = this.hash(loc) % this.bucketSize;
        let index = 0;
        for (const existedLoc of this.data[bucketIndex]) {
            if (v3.equals(loc, existedLoc)) {
                this.data[bucketIndex].splice(index, 1);
                return true;
            }
            ++index;
        }
        return false;
    }

    *[Symbol.iterator]() {
        for(const bucket of this.data) {
            yield* bucket;
        }
    }
}

let game: BedWarsGame;

mc.world.beforeEvents.chatSend.subscribe(async event => {
    if (event.message == "start") {
        event.cancel = true;
        await sleep(0); // get out of read-only mode

        const switchTeam = (t:TeamType)=>t==TeamType.Blue?TeamType.Red:TeamType.Blue;

        if (!globalThis.test) setupGameTest(event.sender.location.x, event.sender.location.z, event.sender.dimension);
        while (!globalThis.test) {
            await sleep(0);
        }

        const players = mc.world.getAllPlayers();
        game = new BedWarsGame({
            map: testMap2,
            originLocation: { x: -104, y: 54, z: -65 },
            dimension: players[0].dimension,
            scoreboardObjective: mc.world.scoreboard.getObjective("GAME") ?? mc.world.scoreboard.addObjective("GAME", "§e§lBED WARS")
        });
        const realPlayers = players.filter(p=>!(p instanceof SimulatedPlayer));
        const fakePlayers = players.filter(p=>p instanceof SimulatedPlayer);
        let team = TeamType.Blue;
        let redCount = 0;
        let blueCount = 0;
        if(Math.random() >= 0.5) team = switchTeam(team);
        for(const p of realPlayers) {
            game.setPlayer(p, team);
            if(team == TeamType.Blue) ++blueCount;
            else ++redCount;
            team = switchTeam(team);
        }
        for(const p of fakePlayers) {
            game.setPlayer(p, team);
            if(team == TeamType.Blue) ++blueCount;
            else ++redCount;
            team = switchTeam(team);
        }
        const maxPlayer = Math.max(2, Math.max(redCount, blueCount));
        for(let i = maxPlayer - redCount - 1; i >= 0; --i) {
            const p = globalThis.test.spawnSimulatedPlayer(event.sender.location as any, "a");
            game.setPlayer(p as any, TeamType.Red);
        }
        for(let i = maxPlayer - blueCount - 1; i >= 0; --i) {
            const p = globalThis.test.spawnSimulatedPlayer(event.sender.location as any, "a");
            game.setPlayer(p as any, TeamType.Blue);
        }
        game.start();
        globalThis.game = game;
    }
})

mc.world.afterEvents.entityDie.subscribe(event => {
    if (game) {
        game.afterEntityDie(event);
    }
});
mc.world.afterEvents.entityHitEntity.subscribe(event => {
    if (game) {
        game.afterEntityHitEntity(event);
    }
});
mc.world.beforeEvents.playerBreakBlock.subscribe(event => {
    if (game) {
        game.beforePlayerBreakBlock(event);
    }
});
mc.world.beforeEvents.playerPlaceBlock.subscribe(event => {
    if (game) {
        game.beforePlayerPlaceBlock(event);
    }
});
mc.world.beforeEvents.explosion.subscribe(event => {
    if (game) {
        game.beforeExplosion(event);
    }
});
mc.world.beforeEvents.itemUse.subscribe(event => {
    if (game) {
    }
});
mc.world.beforeEvents.playerInteractWithBlock.subscribe(event => {
    if (game) {
        game.beforePlayerInteractWithBlock(event);
    }
})
mc.world.beforeEvents.playerInteractWithEntity.subscribe(event => {
    if (game) {
        game.beforePlayerInteractWithEntity(event);
    }
});
mc.world.afterEvents.projectileHitEntity.subscribe(event => {
    if(game) {
        game.afterProjectileHitEntity(event);
    }
});
mc.world.afterEvents.entityHurt.subscribe(event => {
    if(game) {
        game.afterEntityHurt(event);
    }
})
mc.system.runInterval(() => {
    if (game) game.tickEvent();
});

(globalThis as any).me = mc.world.getAllPlayers().filter(p => p.name == "SkeletonSquid12")[0];
