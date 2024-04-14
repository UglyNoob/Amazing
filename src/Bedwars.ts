import { Vector3Utils as v3 } from '@minecraft/math';
import * as mc from '@minecraft/server';
import { itemEqual, Area, sleep, vectorAdd, vectorWithinArea, containerIterator, capitalize, getPlayerByName, consumeMainHandItem, makeItem, shuffle, randomInt, setGameMode, analyzeTime, vectorSize } from './utility.js';
import { setupGameTest } from './GameTest.js';
import { MinecraftBlockTypes, MinecraftEffectTypes, MinecraftEnchantmentTypes, MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data';

import { sprintf, vsprintf } from 'sprintf-js';
import { openShop, openTeamShop, TokenValue } from './BedwarsShop.js';
import { isLocationPartOfAnyPlatforms } from './RescuePlatform.js';
import { SimulatedPlayer } from '@minecraft/server-gametest';
import { testMap, mapGarden, mapSteamPunk, mapWaterfall } from './BedwarsMaps.js';

const RESPAWN_TIME = 100; // in ticks
export const IRON_ITEM_STACK = new mc.ItemStack(MinecraftItemTypes.IronIngot);
IRON_ITEM_STACK.nameTag = "Iron Token";
export const GOLD_ITEM_STACK = new mc.ItemStack(MinecraftItemTypes.GoldIngot);
GOLD_ITEM_STACK.nameTag = "Gold Token";
export const DIAMOND_ITEM_STACK = new mc.ItemStack(MinecraftItemTypes.Diamond);
DIAMOND_ITEM_STACK.nameTag = "Diamond Token";
export const EMERALD_ITEM_STACK = new mc.ItemStack(MinecraftItemTypes.Emerald);
EMERALD_ITEM_STACK.nameTag = "Emerald Token";

export const BRIDGE_EGG_ITEM = (() => {
    const i = new mc.ItemStack(MinecraftItemTypes.Egg);
    i.nameTag = "§r§2Bridge Egg";
    i.setLore(["", "§r§2Automatically builds a birdge for you"]);
    return i;
})();
const BRIDGE_EGG_OWNER_SYMBOL = Symbol('owner');
const BRIDGE_EGG_COOLDOWN = 20; // in ticks

function isBridgeEggItem(item: mc.ItemStack) {
    return item.getLore()[1] == BRIDGE_EGG_ITEM.getLore()[1];
}

export const FIRE_BALL_ITEM = (() => {
    const i = new mc.ItemStack(MinecraftItemTypes.FireCharge);
    i.nameTag = "§r§6Fire Ball";
    i.setLore(["", "§r§7Launch it!"]);
    return i;
})();
/**
 * Used to calculate how far it has travelled.
 */
const SPAWN_LOCATION_SYMBOL = Symbol('spawn location');
const FIRE_BALL_COOLDOWN = 20; // in ticks
const FIRE_BALL_MAX_TRAVEL_DISTANCE = 200; // in blocks
const FIREBALL_GAMEID_PROP = "BEDWARSID";

function isFireBallItem(item: mc.ItemStack) {
    return item.getLore()[1] == FIRE_BALL_ITEM.getLore()[1];
}

export const INVISIBLILITY_POTION_ITEM = (() => {
    const i = new mc.ItemStack(MinecraftItemTypes.Potion);
    i.nameTag = "§r§5Invisiblility Potion";
    i.setLore([
        '',
        '§r§9Complete Invisibility (0:30)',
    ]);
    return i;
})();
const INVISIBLILITY_DURATION = 600; // in ticks

function isInvisiblePotionItem(item: mc.ItemStack) {
    const loreA = item.getLore();
    const loreB = INVISIBLILITY_POTION_ITEM.getLore();
    return loreA.length == loreB.length &&
        loreA[1] == loreB[1];
}

export const JUMP_BOOST_POTION_ITEM = (() => {
    const i = new mc.ItemStack(MinecraftItemTypes.Potion);
    i.nameTag = "§r§aJump V Potion";
    i.setLore([
        '',
        '§r§9Jump Boost V (0:45)'
    ]);
    return i;
})();
const JUMP_BOOST_DURATION = 900; // in ticks

function isJumpBoostPotionItem(item: mc.ItemStack) {
    const loreA = item.getLore();
    const loreB = JUMP_BOOST_POTION_ITEM.getLore();
    return loreA.length == loreB.length &&
        loreA[1] == loreB[1];
}

export const SPEED_POTION_ITEM = (() => {
    const i = new mc.ItemStack(MinecraftItemTypes.Potion);
    i.nameTag = "§r§eSpeed II Potion";
    i.setLore([
        '',
        '§r§9Speed II (0:45)'
    ]);
    return i;
})();
const SPEED_DURATION = 900; // in ticks

function isSpeedPotionItem(item: mc.ItemStack) {
    const loreA = item.getLore();
    const loreB = SPEED_POTION_ITEM.getLore();
    return loreA.length == loreB.length &&
        loreA[1] == loreB[1];
}

const DEATH_TITLE = "§cYOU DIED!";
const DEATH_SUBTITLE = "§eYou will respawn in §c%d §eseconds!";
const SPECTATE_TITLE = "§cSPECTATING!";
const SPECTATE_SUBTITLE = "Your bed has been destroyed";
const RESPAWN_TITLE = "§aRESPAWNED!";
const RESPAWN_MESSAGE = "§eYou have respawned!";
const BED_DESTROYED_TITLE = "§cBED DESTROYED!";
const VICTORY_TITLE = "§6§lVICTORY!";
const BED_DESTROYED_SUBTITLE = "You will no longer respawn!";
const TEAM_BED_DESTROYED_MESSAGE = "\n§lBED DESTRUCTION > §r%s%s Bed §7was destroyed by %s%s§7!\n ";
const TEAM_ELIMINATION_MESSAGE = "\n§lTEAM ELIMINATED > §r%s%s §chas been eliminated!\n ";
const FINAL_KILL_MESSAGE = "%(victimColor)s%(victim)s §7was killed by %(killerColor)s%(killer)s§7. §b§lFINAL KILL!";
const BREAKING_BLOCK_INVALID_MESSAGE = "§cYou cannot break blocks that are not placed by players.";
const KILL_NOTIFICATION = "KILL: %s%s";
const FINAL_KILL_NOTIFICATION = "FINAL KILL: %s%s";
const DISCONNECTED_MESSAGE = "%s%s §7disconnected.";
const RECONNECTION_MESSAGE = "%s%s §ereconnected.";
const PLACING_BLOCK_ILLAGEL_MESSAGE = "§cYou can't place blocks here!";
const GAME_ENDED_MESSAGE = "§lGAME ENDED > §r%s%s §7is the winner!";
const OPEN_ENEMY_CHEST_MESSAGE = "§cYou can't open enemy's chest.";
export const TEAM_PURCHASE_MESSAGE = "%s%s §ahas purchased §6%s";
export const PURCHASE_MESSAGE = "§aYou purchased §6%s";

declare module '@minecraft/server' {
    interface Entity {
        [BRIDGE_EGG_OWNER_SYMBOL]?: PlayerGameInformation;
        [SPAWN_LOCATION_SYMBOL]?: mc.Vector3;
    }
}
declare module '@minecraft/server-gametest' {
    interface SimulatedPlayer {
        attackTarget?: PlayerGameInformation;
    }
}

export enum GeneratorType {
    IronGold,
    Diamond,
    Emerald
}
const GENERATOR_CONSTANTS: Record<GeneratorType, {
    capacity: number;
    protectedArea: Area;
    producingArea: Area;
}> = Object.create(null);

GENERATOR_CONSTANTS[GeneratorType.IronGold] = {
    capacity: 64,
    protectedArea: [{ x: 0, y: 0, z: 0 }, { x: 3, y: 3, z: 3 }],
    producingArea: [{ x: 0, y: 0, z: 0 }, { x: 3, y: 1, z: 3 }]
};
GENERATOR_CONSTANTS[GeneratorType.Diamond] = {
    capacity: 64,
    protectedArea: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 3, z: 1 }],
    producingArea: [{ x: 0, y: 1, z: 0 }, { x: 1, y: 2, z: 1 }]
};
GENERATOR_CONSTANTS[GeneratorType.Emerald] = {
    capacity: 64,
    protectedArea: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 3, z: 1 }],
    producingArea: [{ x: 0, y: 1, z: 0 }, { x: 1, y: 2, z: 1 }]
};
export enum TeamType {
    Red,
    Blue,
    Yellow,
    Green,
    Pink,
    Gray,
    Cyan,
    White
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
    };
    TEAM_CONSTANTS[TeamType.Green] = {
        name: "green",
        colorPrefix: "§a",
        woolName: MinecraftItemTypes.GreenWool,
        woolIconPath: "textures/blocks/wool_colored_green.png",
        leatherHelmet: setupItem(MinecraftItemTypes.LeatherHelmet, TeamType.Green),
        leatherChestplate: setupItem(MinecraftItemTypes.LeatherChestplate, TeamType.Green),
        leatherLeggings: setupItem(MinecraftItemTypes.LeatherLeggings, TeamType.Green),
        leatherBoots: setupItem(MinecraftItemTypes.LeatherBoots, TeamType.Green)
    };
    TEAM_CONSTANTS[TeamType.Red] = {
        name: "red",
        colorPrefix: "§c",
        woolName: MinecraftItemTypes.RedWool,
        woolIconPath: "textures/blocks/wool_colored_red.png",
        leatherHelmet: setupItem(MinecraftItemTypes.LeatherHelmet, TeamType.Red),
        leatherChestplate: setupItem(MinecraftItemTypes.LeatherChestplate, TeamType.Red),
        leatherLeggings: setupItem(MinecraftItemTypes.LeatherLeggings, TeamType.Red),
        leatherBoots: setupItem(MinecraftItemTypes.LeatherBoots, TeamType.Red)
    };
    TEAM_CONSTANTS[TeamType.Yellow] = {
        name: "yellow",
        colorPrefix: "§g",
        woolName: MinecraftItemTypes.YellowWool,
        woolIconPath: "textures/blocks/wool_colored_yellow.png",
        leatherHelmet: setupItem(MinecraftItemTypes.LeatherHelmet, TeamType.Yellow),
        leatherChestplate: setupItem(MinecraftItemTypes.LeatherChestplate, TeamType.Yellow),
        leatherLeggings: setupItem(MinecraftItemTypes.LeatherLeggings, TeamType.Yellow),
        leatherBoots: setupItem(MinecraftItemTypes.LeatherBoots, TeamType.Yellow)
    };
    TEAM_CONSTANTS[TeamType.Pink] = {
        name: "pink",
        colorPrefix: "§d",
        woolName: MinecraftItemTypes.PinkWool,
        woolIconPath: "textures/blocks/wool_colored_pink.png",
        leatherHelmet: setupItem(MinecraftItemTypes.LeatherHelmet, TeamType.Pink),
        leatherChestplate: setupItem(MinecraftItemTypes.LeatherChestplate, TeamType.Pink),
        leatherLeggings: setupItem(MinecraftItemTypes.LeatherLeggings, TeamType.Pink),
        leatherBoots: setupItem(MinecraftItemTypes.LeatherBoots, TeamType.Pink)
    };
    TEAM_CONSTANTS[TeamType.Gray] = {
        name: "gray",
        colorPrefix: "§8",
        woolName: MinecraftItemTypes.GrayWool,
        woolIconPath: "textures/blocks/wool_colored_gray.png",
        leatherHelmet: setupItem(MinecraftItemTypes.LeatherHelmet, TeamType.Gray),
        leatherChestplate: setupItem(MinecraftItemTypes.LeatherChestplate, TeamType.Gray),
        leatherLeggings: setupItem(MinecraftItemTypes.LeatherLeggings, TeamType.Gray),
        leatherBoots: setupItem(MinecraftItemTypes.LeatherBoots, TeamType.Gray)
    };
    TEAM_CONSTANTS[TeamType.Cyan] = {
        name: "cyan",
        colorPrefix: "§3",
        woolName: MinecraftItemTypes.CyanWool,
        woolIconPath: "textures/blocks/wool_colored_cyan.png",
        leatherHelmet: setupItem(MinecraftItemTypes.LeatherHelmet, TeamType.Cyan),
        leatherChestplate: setupItem(MinecraftItemTypes.LeatherChestplate, TeamType.Cyan),
        leatherLeggings: setupItem(MinecraftItemTypes.LeatherLeggings, TeamType.Cyan),
        leatherBoots: setupItem(MinecraftItemTypes.LeatherBoots, TeamType.Cyan)
    };
    TEAM_CONSTANTS[TeamType.White] = {
        name: "white",
        colorPrefix: "§f",
        woolName: MinecraftItemTypes.WhiteWool,
        woolIconPath: "textures/blocks/wool_colored_white.png",
        leatherHelmet: setupItem(MinecraftItemTypes.LeatherHelmet, TeamType.White),
        leatherChestplate: setupItem(MinecraftItemTypes.LeatherChestplate, TeamType.White),
        leatherLeggings: setupItem(MinecraftItemTypes.LeatherLeggings, TeamType.White),
        leatherBoots: setupItem(MinecraftItemTypes.LeatherBoots, TeamType.White)
    };
}
interface GeneratorInformation {
    type: GeneratorType;
    spawnLocation: mc.Vector3;
    location: mc.Vector3; // the bottom-north-west location
    initialInterval: number;
    indicatorLocations?: mc.Vector3[];
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
    playerSpawn: mc.Vector3;
    playerSpawnViewDirection: mc.Vector3;
    protectedArea?: Area;
    islandArea: Area;
}
export interface MapInformation {
    teams: TeamInformation[];
    voidY: number;
    extraGenerators: GeneratorInformation[];
    size: Area;
    /**
     * Used to detect respawned player
     */
    fallbackRespawnPoint: mc.Vector3;
    teamExtraEmeraldGenInterval: number;
}

export interface SwordLevel {
    level: number;
    name: string;
    icon: string;
    item: mc.ItemStack;
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
            item: setupItem(MinecraftItemTypes.WoodenSword)
        }, {
            level: 1,
            name: "Stone Sword",
            icon: "textures/items/stone_sword.png",
            item: setupItem(MinecraftItemTypes.StoneSword)
        }, {
            level: 2,
            name: "Iron Sword",
            icon: "textures/items/iron_sword.png",
            item: setupItem(MinecraftItemTypes.IronSword)
        }, {
            level: 3,
            name: "Diamond Sword",
            icon: "textures/items/diamond_sword.png",
            item: setupItem(MinecraftItemTypes.DiamondSword)
        }
    ];
})();

export interface PickaxeLevel {
    level: number;
    name: string;
    icon: string;
    item: mc.ItemStack;
    toCurrentLevelCost: TokenValue;
}

export const PICKAXE_LEVELS: PickaxeLevel[] = (() => {
    function setupItem(type: MinecraftItemTypes, enchantments: mc.Enchantment[]) {
        const i = new mc.ItemStack(type);
        i.lockMode = mc.ItemLockMode.inventory;
        const e = i.getComponent("enchantable")!;
        e.addEnchantments(enchantments);
        return i;
    }

    return [
        {
            level: 0,
            name: "Wooden Pickaxe",
            icon: "textures/items/wood_pickaxe.png",
            item: setupItem(MinecraftItemTypes.WoodenPickaxe, [
                {
                    type: MinecraftEnchantmentTypes.Efficiency,
                    level: 1
                }
            ]),
            toCurrentLevelCost: { ironAmount: 10, goldAmount: 0, diamondAmount: 0, emeraldAmount: 0 }
        }, {
            level: 1,
            name: "Iron Pickaxe",
            icon: "textures/items/iron_pickaxe.png",
            item: setupItem(MinecraftItemTypes.IronPickaxe, [
                {
                    type: MinecraftEnchantmentTypes.Efficiency,
                    level: 2
                }
            ]),
            toCurrentLevelCost: { ironAmount: 10, goldAmount: 0, diamondAmount: 0, emeraldAmount: 0 }
        }, {
            level: 2,
            name: "Golden Pickaxe",
            icon: "textures/items/gold_pickaxe.png",
            item: setupItem(MinecraftItemTypes.GoldenPickaxe, [
                {
                    type: MinecraftEnchantmentTypes.Efficiency,
                    level: 3
                }
            ]),
            toCurrentLevelCost: { ironAmount: 0, goldAmount: 3, diamondAmount: 0, emeraldAmount: 0 }
        }, {
            level: 3,
            name: "Diamond Pickaxe",
            icon: "textures/items/diamond_pickaxe.png",
            item: setupItem(MinecraftItemTypes.DiamondPickaxe, [
                {
                    type: MinecraftEnchantmentTypes.Efficiency,
                    level: 3
                }
            ]),
            toCurrentLevelCost: { ironAmount: 0, goldAmount: 6, diamondAmount: 0, emeraldAmount: 0 }
        }
    ];
})();
export function hasNextPickaxeLevel(level: PickaxeLevel) {
    return level.level != PICKAXE_LEVELS.length - 1;
}
export function hasPrevPickaxeLevel(level: PickaxeLevel) {
    return level.level != 0;
}

export interface AxeLevel {
    level: number;
    name: string;
    icon: string;
    item: mc.ItemStack;
    toCurrentLevelCost: TokenValue;
}
export const AXE_LEVELS: AxeLevel[] = (() => {
    function setupItem(type: MinecraftItemTypes, enchantments: mc.Enchantment[]) {
        const i = new mc.ItemStack(type);
        i.lockMode = mc.ItemLockMode.inventory;
        const e = i.getComponent("enchantable")!;
        e.addEnchantments(enchantments);
        return i;
    }

    return [
        {
            level: 0,
            name: "Wooden Axe",
            icon: "textures/items/wood_axe.png",
            item: setupItem(MinecraftItemTypes.WoodenAxe, [
                {
                    type: MinecraftEnchantmentTypes.Efficiency,
                    level: 1
                }
            ]),
            toCurrentLevelCost: { ironAmount: 10, goldAmount: 0, diamondAmount: 0, emeraldAmount: 0 }
        }, {
            level: 1,
            name: "Stone Axe",
            icon: "textures/items/stone_axe.png",
            item: setupItem(MinecraftItemTypes.StoneAxe, [
                {
                    type: MinecraftEnchantmentTypes.Efficiency,
                    level: 1
                }
            ]),
            toCurrentLevelCost: { ironAmount: 10, goldAmount: 0, diamondAmount: 0, emeraldAmount: 0 }
        }, {
            level: 2,
            name: "Iron Axe",
            icon: "textures/items/iron_axe.png",
            item: setupItem(MinecraftItemTypes.IronAxe, [
                {
                    type: MinecraftEnchantmentTypes.Efficiency,
                    level: 2
                }
            ]),
            toCurrentLevelCost: { ironAmount: 0, goldAmount: 3, diamondAmount: 0, emeraldAmount: 0 }
        }, {
            level: 3,
            name: "Diamond Axe",
            icon: "textures/items/diamond_axe.png",
            item: setupItem(MinecraftItemTypes.DiamondAxe, [
                {
                    type: MinecraftEnchantmentTypes.Efficiency,
                    level: 3
                }
            ]),
            toCurrentLevelCost: { ironAmount: 0, goldAmount: 6, diamondAmount: 0, emeraldAmount: 0 }
        }
    ];
})();
export function hasNextAxeLevel(level: AxeLevel) {
    return level.level != AXE_LEVELS.length - 1;
}
export function hasPrevAxeLevel(level: AxeLevel) {
    return level.level != 0;
}

export interface ArmorLevel {
    level: number;
    name: string;
    icon: string;
    leggings: mc.ItemStack;
    boots: mc.ItemStack;
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
            name: "Leather Armors",
            icon: "textures/items/leather_boots.tga",
            leggings: setupItem(MinecraftItemTypes.LeatherLeggings),
            boots: setupItem(MinecraftItemTypes.LeatherBoots)
        }, {
            level: 1,
            name: "Chainmail Armors",
            icon: "textures/items/chainmail_boots.png",
            leggings: setupItem(MinecraftItemTypes.ChainmailLeggings),
            boots: setupItem(MinecraftItemTypes.ChainmailBoots)
        }, {
            level: 2,
            name: "Iron Armors",
            icon: "textures/items/iron_boots.png",
            leggings: setupItem(MinecraftItemTypes.IronLeggings),
            boots: setupItem(MinecraftItemTypes.IronBoots)
        }, {
            level: 3,
            name: "Diamond Armors",
            icon: "textures/items/diamond_boots.png",
            leggings: setupItem(MinecraftItemTypes.DiamondLeggings),
            boots: setupItem(MinecraftItemTypes.DiamondBoots)
        }
    ];
})();

export const MAX_TRAP_COUNT = 3;

export enum TrapType {
    NegativeEffect,
    Defensive,
    Alarm,
    MinerFatigue
}

export const TRAP_CONSTANTS: Record<TrapType, {
    name: string;
    description: string;
    iconPath: string;
}> = Object.create(null);

{
    TRAP_CONSTANTS[TrapType.NegativeEffect] = {
        name: "It's a Trap!",
        description: "§7Inflicts Blindness and Slowness for 8 seconds.",
        iconPath: "textures/blocks/trip_wire_source.png"
    };
    TRAP_CONSTANTS[TrapType.Defensive] = {
        name: "Counter-Offensive Trap",
        description: "§7Grants Speed II and Jump Boost II for 15 seconds to allied players near your base.",
        iconPath: "textures/items/feather.png"
    };
    TRAP_CONSTANTS[TrapType.Alarm] = {
        name: "Alarm Trap",
        description: "§7Reveals invisible players as well as their name and team.",
        iconPath: "textures/blocks/redstone_torch_on.png"
    };
    TRAP_CONSTANTS[TrapType.MinerFatigue] = {
        name: "Miner Fatigue Trap",
        description: "§7Inflict Mining Fatigue for 10 seconds.",
        iconPath: "textures/items/gold_pickaxe.png"
    };
}

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
    interval: number;
    indicatorLocations?: mc.Vector3[];
    remainingCooldown: number;
    tokensGeneratedCount: number;
} & ({
    belongToTeam: true;
    team: TeamType;
    spawnExtraEmerald: boolean;
    extraEmeraldInterval: number;
    extraEmeraldRemainingCooldown: number;
} | {
    belongToTeam: false;
});

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
     * set when the player perform an action.
     */
    lastActionSucceed: boolean | null;
    /**
     * Stores the attacker.
     * This field is cleared on death.
     */
    lastHurtBy?: PlayerGameInformation;
    placement: BlockPlacementTracker;
    swordLevel: SwordLevel;
    armorLevel: ArmorLevel;
    pickaxeLevel?: PickaxeLevel;
    axeLevel?: AxeLevel;
    hasShear: boolean;
    bridgeEggCooldown: number;
    fireBallCooldown: number;
    armorDisabled: boolean;
    armorToEnablingTicks: number;
    teamAreaEntered?: TeamType;
}

export const MAX_IRON_FORGE_LEVEL = 4;
export const MAX_PROTECTION_LEVEL = 4;
export const MAX_HASTE_LEVEL = 2;
const SHARPNESS_ENCHANMENT_LEVEL = 1;
export interface TeamGameInformation {
    type: TeamType;
    state: TeamState;
    /**
     * This field defines the level of sharpness the team has.
     * Zero means no sharpness.
     */
    hasSharpness: boolean;
    /**
     * This field defines the level of protection the team has.
     * Zero means no protection.
     */
    protectionLevel: number;
    /**
     * This field defines the level of haste the team has.
     * Should minus 1 when applying to player.addEffect() method.
     * Zero means no haste.
     */
    hasteLevel: number;
    healPoolEnabled: boolean;
    ironForgeLevel: number;
    traps: TrapType[];
}

export class BedWarsGame {
    private map: MapInformation;
    private players: Map<string, PlayerGameInformation>;
    private teams: Map<TeamType, TeamGameInformation>;
    private originPos: mc.Vector3;
    private state: GameState;
    private dimension: mc.Dimension;
    private generators: GeneratorGameInformation[];
    private scoreObj: mc.ScoreboardObjective;
    private startTime: number;
    private id: number;

    constructor({ map, originLocation, dimension, scoreboardObjective }: {
        map: MapInformation;
        originLocation: mc.Vector3;
        dimension: mc.Dimension;
        scoreboardObjective: mc.ScoreboardObjective;
    }) {
        this.map = map;
        this.originPos = originLocation;
        this.state = GameState.waiting;
        this.players = new Map();
        this.dimension = dimension;
        this.startTime = 0;
        this.scoreObj = scoreboardObjective;
        this.teams = new Map();
        this.id = Math.random();
        for (const team of this.map.teams) {
            this.teams.set(team.type, {
                type: team.type,
                state: TeamState.BedAlive,
                hasSharpness: false,
                protectionLevel: 0,
                hasteLevel: 0,
                healPoolEnabled: false,
                ironForgeLevel: 0,
                traps: []
            });
        }
        this.generators = [];
        for (const teamInfo of map.teams) {
            const genInfo = teamInfo.teamGenerator;
            this.generators.push({
                spawnLocation: genInfo.spawnLocation,
                location: genInfo.location,
                type: genInfo.type,
                interval: genInfo.initialInterval,
                remainingCooldown: 0,
                tokensGeneratedCount: 0,
                indicatorLocations: genInfo.indicatorLocations?.map(v => v3.add(v, this.originPos)),
                belongToTeam: true,
                team: teamInfo.type,
                spawnExtraEmerald: false,
                extraEmeraldInterval: map.teamExtraEmeraldGenInterval,
                extraEmeraldRemainingCooldown: map.teamExtraEmeraldGenInterval
            });
        }
        for (const genInfo of map.extraGenerators) {
            this.generators.push({
                spawnLocation: genInfo.spawnLocation,
                location: genInfo.location,
                type: genInfo.type,
                interval: genInfo.initialInterval,
                remainingCooldown: 0,
                tokensGeneratedCount: 0,
                indicatorLocations: genInfo.indicatorLocations?.map(v => v3.add(v, this.originPos)),
                belongToTeam: false
            });
        }
    }

    setPlayer(player: mc.Player, teamType: TeamType) {
        if (this.map.teams.find(t => t.type == teamType) == undefined) throw new Error(`No such team(${TEAM_CONSTANTS[teamType].name}).`);

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
            lastActionSucceed: null,
            placement: new BlockPlacementTracker(),
            swordLevel: SWORD_LEVELS[0],
            armorLevel: ARMOR_LEVELS[0],
            hasShear: false,
            bridgeEggCooldown: 0,
            fireBallCooldown: 0,
            armorDisabled: false,
            armorToEnablingTicks: 0
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
        for (const { teamChestLocation, bedLocation: mapBedLocation, type: teamType } of this.map.teams) {
            { // Clear the team chest
                const teamChestContainer = this.dimension.getBlock(v3.add(teamChestLocation, this.originPos))?.getComponent("inventory")?.container;
                if (teamChestContainer) {
                    teamChestContainer.clearAll();
                } else {
                    throw new Error(`Team chest of team ${TEAM_CONSTANTS[teamType].name} does not exist at ${v3.toString(teamChestLocation)}`);
                }
            }

            // Place the bed
            const bedLocation = mapBedLocation.map(v => v3.add(this.originPos, v));
            const directionVector = v3.subtract(bedLocation[1], bedLocation[0]);
            let direction: number;
            if (directionVector.x == 1) {
                direction = 3; // east
            } else if (directionVector.x == -1) {
                direction = 1; // west
            } else if (directionVector.z == 1) {
                direction = 0; // south
            } else { // directionVector.z == -1
                direction = 2; // north
            }
            const permutation = mc.BlockPermutation.resolve(MinecraftBlockTypes.Bed, {
                direction
            });
            this.dimension.fillBlocks(bedLocation[1], bedLocation[1], permutation);
        }

        const mapArea = this.map.size.map(v => v3.add(this.originPos, v)) as Area;
        this.dimension.getEntities({ type: "minecraft:item" }).forEach(e => {
            if (vectorWithinArea(e.location, mapArea)) e.kill();
        });
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
        for (const [teamType, { state }] of this.teams) {
            ++index;
            const t = TEAM_CONSTANTS[teamType];
            let result = `${t.colorPrefix}${t.name.charAt(0).toUpperCase()} §r${capitalize(t.name)}: `;
            switch (state) {
                case TeamState.BedAlive:
                    // result += "§a✔";
                    result += "§aV"; // Mojangles will be broken by unicode characters
                    break;
                case TeamState.Dead:
                    // result += "§c✘";
                    result += "§cX"; // Mojangles will be broken by unicode characters
                    break;
                case TeamState.BedDestoryed:
                    let aliveCount = 0;
                    for (const playerInfo of this.players.values()) {
                        if (playerInfo.team != teamType) continue;
                        if (this.isPlayerPlaying(playerInfo)) ++aliveCount;
                    }
                    result += `§a${aliveCount}`;
            }
            this.scoreObj.setScore(result, index);
        }
        ++index;
        this.scoreObj.setScore(" ", index);
        ++index;
        const { minutes, seconds } = analyzeTime((mc.system.currentTick - this.startTime) * 50);
        let secondsStr = seconds.toString();
        if (secondsStr.length == 1) secondsStr = "0" + secondsStr;
        let minutesStr = minutes.toString();
        if (minutesStr.length == 1) minutesStr = "0" + minutesStr;
        this.scoreObj.setScore(`§a${minutesStr}:${secondsStr}`, index);
    }

    private respawnPlayer(playerInfo: PlayerGameInformation) {
        const teamInfo = this.map.teams.find(ele => ele.type === playerInfo.team)!;
        const teamGameInfo = this.teams.get(playerInfo.team)!;
        const spawnPoint = v3.add(teamInfo.playerSpawn, this.originPos);
        const player = playerInfo.player;
        player.teleport(spawnPoint, { facingLocation: v3.add(spawnPoint, teamInfo.playerSpawnViewDirection) });
        setGameMode(player, mc.GameMode.survival);
        player.getComponent("minecraft:health")!.resetToMaxValue();
        player.runCommand("effect @s clear");
        player.addEffect(MinecraftEffectTypes.Saturation, 1000000, {
            amplifier: 100,
            showParticles: false
        });
        player.addEffect(MinecraftEffectTypes.Resistance, 3 * 20, {
            amplifier: 5,
            showParticles: true
        });
        if (teamGameInfo.hasteLevel > 0) {
            player.addEffect(MinecraftEffectTypes.Haste, 1000000, {
                amplifier: teamGameInfo.hasteLevel - 1,
                showParticles: false
            });
        }
        player.extinguishFire();
        player.nameTag = `${TEAM_CONSTANTS[playerInfo.team].colorPrefix}${playerInfo.name}`;
        playerInfo.armorDisabled = false;
        playerInfo.armorToEnablingTicks = 0;
        playerInfo.bridgeEggCooldown = 0;
        playerInfo.fireBallCooldown = 0;
        this.resetInventory(playerInfo);
        playerInfo.lastHurtBy = undefined;

        playerInfo.state = PlayerState.Alive;
    }

    /**
     * This method won't check playerInfo.armorDisabled
     */
    resetArmor(playerInfo: PlayerGameInformation) {
        const t = TEAM_CONSTANTS[playerInfo.team];
        const equipment = playerInfo.player.getComponent("minecraft:equippable")!;
        equipment.setEquipment(mc.EquipmentSlot.Head, t.leatherHelmet);
        equipment.setEquipment(mc.EquipmentSlot.Chest, t.leatherChestplate);
        if (playerInfo.armorLevel.level == 0) {
            equipment.setEquipment(mc.EquipmentSlot.Legs, t.leatherLeggings);
            equipment.setEquipment(mc.EquipmentSlot.Feet, t.leatherBoots);
        } else {
            equipment.setEquipment(mc.EquipmentSlot.Legs, playerInfo.armorLevel.leggings);
            equipment.setEquipment(mc.EquipmentSlot.Feet, playerInfo.armorLevel.boots);
        }
        const teamInfo = this.teams.get(playerInfo.team)!;
        if (teamInfo.protectionLevel > 0) {
            [mc.EquipmentSlot.Head, mc.EquipmentSlot.Chest, mc.EquipmentSlot.Legs, mc.EquipmentSlot.Feet].forEach(slotName => {
                const item = equipment.getEquipment(slotName)!;
                const enchantment = item.getComponent("enchantable")!;
                enchantment.addEnchantment({
                    type: MinecraftEnchantmentTypes.Protection,
                    level: teamInfo.protectionLevel
                });
                equipment.setEquipment(slotName, item);
            });
        }
    }
    private resetInventory(playerInfo: PlayerGameInformation) {
        this.resetArmor(playerInfo);
        const container = playerInfo.player.getComponent("inventory")!.container!;
        let hasSword = false;
        let foundShear = false;
        let foundPickaxe = false;
        let foundAxe = false;
        playerInfo.swordLevel = SWORD_LEVELS[0];
        for (const { item, index } of containerIterator(container)) {
            if (!item) continue;
            if (itemEqual(playerInfo.swordLevel.item, item)) {
                hasSword = true;
                container.setItem(index, playerInfo.swordLevel.item);
                continue;
            } else if (item.typeId == MinecraftItemTypes.Shears) {
                foundShear = true;
                if (playerInfo.hasShear) continue;
            }
            if (playerInfo.pickaxeLevel && itemEqual(playerInfo.pickaxeLevel.item, item)) {
                foundPickaxe = true;
                if (hasPrevPickaxeLevel(playerInfo.pickaxeLevel)) {
                    playerInfo.pickaxeLevel = PICKAXE_LEVELS[playerInfo.pickaxeLevel.level - 1];
                    container.setItem(index, playerInfo.pickaxeLevel.item);
                }
                continue;
            }
            if (playerInfo.axeLevel && itemEqual(playerInfo.axeLevel.item, item)) {
                foundAxe = true;
                if (hasPrevAxeLevel(playerInfo.axeLevel)) {
                    playerInfo.axeLevel = AXE_LEVELS[playerInfo.axeLevel.level - 1];
                    container.setItem(index, playerInfo.axeLevel.item);
                }
                continue;
            }
            container.setItem(index);
        }
        if (!hasSword) {
            container.addItem(playerInfo.swordLevel.item);
        }
        if (!foundShear && playerInfo.hasShear) {
            container.addItem(new mc.ItemStack(MinecraftItemTypes.Shears));
        }
        if (!foundPickaxe && playerInfo.pickaxeLevel) {
            container.addItem(playerInfo.pickaxeLevel.item);
        }
        if (!foundAxe && playerInfo.axeLevel) {
            container.addItem(playerInfo.axeLevel.item);
        }
    }
    private setupSpawnPoint(player: mc.Player) {
        player.setSpawnPoint(Object.assign({ dimension: player.dimension }, v3.add(this.originPos, this.map.fallbackRespawnPoint)));
    }

    private isPlayerPlaying(playerInfo: PlayerGameInformation) {
        const teamState = this.teams.get(playerInfo.team)!.state;
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

    private activateTrap(playerInfo: PlayerGameInformation, teamInfo: TeamGameInformation) {
        if (teamInfo.traps.length == 0) return;

        const trapType = teamInfo.traps.shift()!;
        const player = playerInfo.player;
        let isDefensiveTrap = false;
        let isAlarmTrap = false;
        switch (trapType) {
            case TrapType.NegativeEffect:
                player.addEffect(MinecraftEffectTypes.Blindness, 160);
                player.addEffect(MinecraftEffectTypes.Slowness, 160);
                break;
            case TrapType.Defensive:
                isDefensiveTrap = true;
                break;
            case TrapType.Alarm:
                if (playerInfo.armorDisabled) {
                    playerInfo.armorDisabled = false;
                    playerInfo.armorToEnablingTicks = 0;
                    this.resetArmor(playerInfo);
                }
                isAlarmTrap = true;
                break;
            case TrapType.MinerFatigue:
                player.addEffect(MinecraftEffectTypes.MiningFatigue, 200);
                break;
        }
        const teamMapInfo = this.map.teams.filter(t => t.type == teamInfo.type)[0];
        for (const teamPlayerInfo of this.players.values()) {
            if (teamPlayerInfo.team != teamInfo.type) continue;
            const islandArea = teamMapInfo.islandArea.map(v => v3.add(v, this.originPos)) as Area;
            if (isDefensiveTrap && vectorWithinArea(teamPlayerInfo.player.location, islandArea)) {
                teamPlayerInfo.player.addEffect(MinecraftEffectTypes.Speed, 300, { amplifier: 1 });
                teamPlayerInfo.player.addEffect(MinecraftEffectTypes.JumpBoost, 300, { amplifier: 1 });
            }

            teamPlayerInfo.player.onScreenDisplay.setTitle("§cTRAP ACTIVATED!", {
                subtitle: isAlarmTrap ? `${TEAM_CONSTANTS[playerInfo.team].colorPrefix}${player.name} §7has entered your base!` : undefined,
                fadeInDuration: 10,
                stayDuration: 60,
                fadeOutDuration: 20
            });
            teamPlayerInfo.player.playSound("mob.wither.spawn");
            teamPlayerInfo.player.sendMessage(`§7${TRAP_CONSTANTS[trapType].name} §chas been activated!`);
        }
        player.playSound("mob.wither.spawn");
        player.sendMessage(`§7You have activated §e${TRAP_CONSTANTS[trapType].name}!`);
    }
    /**
     * Adjust team generator based on its iron forge level
     */
    applyTeamIronForge(teamType: TeamType) {
        const teamInfo = this.teams.get(teamType)!;
        const teamGenMapInfo = this.map.teams.filter(t => t.type == teamType)[0].teamGenerator;
        const teamGenInfo = this.generators.filter(g => g.belongToTeam && g.team == teamType)[0];
        if (!teamGenInfo.belongToTeam) return;
        switch (teamInfo.ironForgeLevel) {
            case 0:
                teamGenInfo.spawnExtraEmerald = false;
                teamGenInfo.interval = teamGenMapInfo.initialInterval;
                break;
            case 1:
                teamGenInfo.spawnExtraEmerald = false;
                teamGenInfo.interval = Math.ceil(teamGenMapInfo.initialInterval / 1.5);
                break;
            case 2:
                teamGenInfo.spawnExtraEmerald = false;
                teamGenInfo.interval = Math.ceil(teamGenMapInfo.initialInterval / 2);
                break;
            case 3:
                teamGenInfo.spawnExtraEmerald = true;
                teamGenInfo.extraEmeraldInterval = this.map.teamExtraEmeraldGenInterval;
                teamGenInfo.extraEmeraldRemainingCooldown = teamGenInfo.extraEmeraldInterval;
                teamGenInfo.interval = Math.ceil(teamGenMapInfo.initialInterval / 2);
            case 4:
                teamGenInfo.spawnExtraEmerald = true;
                teamGenInfo.extraEmeraldInterval = this.map.teamExtraEmeraldGenInterval;
                teamGenInfo.extraEmeraldRemainingCooldown = teamGenInfo.extraEmeraldInterval;
                teamGenInfo.interval = Math.ceil(teamGenMapInfo.initialInterval / 3);
                break;
        }
    }
    applyTeamHasteLevel(teamType: TeamType) {
        const level = this.teams.get(teamType)!.hasteLevel;
        if (level == 0) return;
        for (const playerInfo of this.players.values()) {
            if (playerInfo.team != teamType) continue;
            if (playerInfo.state != PlayerState.Alive) continue;
            playerInfo.player.addEffect(MinecraftEffectTypes.Haste, 1000000, {
                amplifier: level - 1,
                showParticles: false
            });
        }
    }
    private checkTeamPlayers() {
        const remainingPlayerCounts = new Map<TeamType, number>();
        for (const { type: teamType } of this.map.teams) {
            if (this.teams.get(teamType)!.state == TeamState.Dead) continue;
            remainingPlayerCounts.set(teamType, 0);
        }

        for (const playerInfo of this.players.values()) {
            if (this.isPlayerPlaying(playerInfo)) {
                remainingPlayerCounts.set(playerInfo.team, 1 + remainingPlayerCounts.get(playerInfo.team)!);
            }
        }

        for (const [teamType, aliveCount] of remainingPlayerCounts) {
            if (aliveCount == 0) {
                this.teams.get(teamType)!.state = TeamState.Dead;
                const { name, colorPrefix } = TEAM_CONSTANTS[teamType];
                this.broadcast(TEAM_ELIMINATION_MESSAGE,
                    colorPrefix, capitalize(name));
                const teamMapInfo = this.map.teams.find(t => t.type == teamType)!;
                const bedLocation = teamMapInfo.bedLocation.map(v => v3.add(v, this.originPos));
                this.dimension.fillBlocks(bedLocation[0], bedLocation[1], MinecraftBlockTypes.Air);
            }
        }

        // detect whether the game ends
        let aliveTeam: TeamType | null = null;
        for (const [team, { state }] of this.teams) {
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

                playerInfo.player.onScreenDisplay.setTitle(VICTORY_TITLE, {
                    fadeInDuration: 0,
                    stayDuration: 100,
                    fadeOutDuration: 20
                });
            }
            for (const playerInfo of this.players.values()) {
                for (const loc of playerInfo.placement) {
                    this.dimension.fillBlocks(loc, loc, MinecraftBlockTypes.Air);
                }
            }
        }
    }

    teamBroadcast(teamType: TeamType, format: any, ...params: any[]) {
        for (const playerInfo of this.players.values()) {
            if (playerInfo.team != teamType) continue;
            if (playerInfo.state == PlayerState.Offline) continue;

            playerInfo.player.sendMessage(vsprintf(format, params));
        }
    }
    private broadcast(format: any, ...params: any[]) {
        for (const playerInfo of this.players.values()) {
            if (playerInfo.state == PlayerState.Offline) continue;
            playerInfo.player.sendMessage(vsprintf(String(format), params));
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
                setGameMode(player, mc.GameMode.spectator);
                player.teleport(playerInfo.deathLocation, { rotation: playerInfo.deathRotaion });
                playerInfo.deathTime = mc.system.currentTick;

                const teamState = this.teams.get(playerInfo.team)!.state;
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
                this.onPlayerDieOrOffline(playerInfo, playerInfo.lastHurtBy);
                continue;
            }

            if (playerInfo.player.dimension != this.dimension) {
                setGameMode(player, mc.GameMode.spectator);
                this.onPlayerDieOrOffline(playerInfo, playerInfo.lastHurtBy);
                const team = this.map.teams.find(t => t.type == playerInfo.team)!;
                playerInfo.player.teleport(v3.add(team.playerSpawn, this.originPos), {
                    dimension: this.dimension,
                    facingLocation: vectorAdd(this.originPos, team.playerSpawn, team.playerSpawnViewDirection)
                });


                const isTeamBedAlive = this.teams.get(playerInfo.team)!.state == TeamState.BedAlive;
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

            if (playerInfo.state == PlayerState.dead &&
                v3.distance(v3.add(this.originPos, this.map.fallbackRespawnPoint), player.location) <= 1) {
                setGameMode(player, mc.GameMode.spectator);
                player.teleport(playerInfo.deathLocation, { rotation: playerInfo.deathRotaion });
                const isTeamBedAlive = this.teams.get(playerInfo.team)!.state == TeamState.BedAlive;
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
                    player.sendMessage(RESPAWN_MESSAGE);
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
                    setGameMode(player, mc.GameMode.spectator);
                    this.onPlayerDieOrOffline(playerInfo, playerInfo.lastHurtBy);

                    const isTeamBedAlive = this.teams.get(playerInfo.team)!.state == TeamState.BedAlive;
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
                // player.onScreenDisplay.setActionBar(String(TEAM_CONSTANTS[playerInfo.teamAreaEntered!]?.name)); // DEBUG
                const equipment = player.getComponent("equippable")!;
                [mc.EquipmentSlot.Head, mc.EquipmentSlot.Chest, mc.EquipmentSlot.Legs, mc.EquipmentSlot.Feet, mc.EquipmentSlot.Mainhand].forEach(slotName => {
                    const item = equipment.getEquipment(slotName);
                    if (!item) return;
                    if (slotName == mc.EquipmentSlot.Mainhand) {
                        let erase = false;
                        // clean items
                        if ([
                            MinecraftItemTypes.GlassBottle,
                            MinecraftItemTypes.CraftingTable,
                            MinecraftItemTypes.WoodenButton,
                            MinecraftItemTypes.IronNugget,
                            MinecraftItemTypes.GoldNugget,
                            MinecraftItemTypes.WoodenPressurePlate,
                            MinecraftItemTypes.HeavyWeightedPressurePlate,
                            MinecraftItemTypes.LightWeightedPressurePlate,
                            MinecraftItemTypes.BlueCarpet,
                            MinecraftItemTypes.RedCarpet,
                            MinecraftItemTypes.YellowCarpet,
                            MinecraftItemTypes.GreenCarpet
                        ].includes(item.typeId as MinecraftItemTypes)) {
                            erase = true;
                        }
                        if (item.typeId == MinecraftItemTypes.Shears && !playerInfo.hasShear) {
                            erase = true;
                        }
                        if (erase) {
                            equipment.getEquipmentSlot(slotName).setItem();
                            return;
                        }
                        if (itemEqual(item, playerInfo.swordLevel.item)) {
                            const teamInfo = this.teams.get(playerInfo.team)!;
                            if (teamInfo.hasSharpness) {
                                const enchantment = item.getComponent("enchantable")!;
                                const existedEnch = enchantment.getEnchantment(MinecraftEnchantmentTypes.Sharpness);
                                if (!existedEnch) {
                                    enchantment.addEnchantment({
                                        type: MinecraftEnchantmentTypes.Sharpness,
                                        level: SHARPNESS_ENCHANMENT_LEVEL
                                    });
                                    equipment.setEquipment(slotName, item);
                                    return;
                                }
                            }
                        }
                    } else { // Armors
                        const teamInfo = this.teams.get(playerInfo.team)!;
                        if (teamInfo.protectionLevel > 0) {
                            const enchantment = item.getComponent("enchantable")!;
                            const existedEnch = enchantment.getEnchantment(MinecraftEnchantmentTypes.Protection);
                            if (!existedEnch || existedEnch.level != teamInfo.protectionLevel) {
                                enchantment.addEnchantment({
                                    type: MinecraftEnchantmentTypes.Protection,
                                    level: teamInfo.protectionLevel
                                });
                                equipment.setEquipment(slotName, item);
                                return;
                            }
                        }
                    }
                    const com = item.getComponent("durability");
                    if (!com) return;
                    if (com.damage > 20) {
                        com.damage = 0;
                        equipment.setEquipment(slotName, item);
                    }
                });
                if (playerInfo.bridgeEggCooldown > 0) --playerInfo.bridgeEggCooldown;
                if (playerInfo.fireBallCooldown > 0) --playerInfo.fireBallCooldown;
                if (playerInfo.armorToEnablingTicks > 0) {
                    --playerInfo.armorToEnablingTicks;
                } else { // enable the armor
                    if (playerInfo.armorDisabled) {
                        playerInfo.armorDisabled = false;
                        this.resetArmor(playerInfo);
                    }
                }

                let playerWithinTeamArea = false;
                for (const teamInfo of this.teams.values()) {
                    const teamMapInfo = this.map.teams.filter(t => t.type == teamInfo.type)[0];
                    const islandArea = teamMapInfo.islandArea.map(v => v3.add(v, this.originPos)) as Area;
                    if (!vectorWithinArea(player.location, islandArea)) continue;
                    playerWithinTeamArea = true;
                    if (playerInfo.team == teamInfo.type) {
                        playerInfo.teamAreaEntered = playerInfo.team;
                        if (teamInfo.healPoolEnabled) {
                            playerInfo.player.addEffect(MinecraftEffectTypes.Regeneration, 20, {
                                amplifier: 0,
                                showParticles: false
                            });
                        }
                        continue;
                    } else {
                        if (playerInfo.teamAreaEntered == teamInfo.type) continue;
                        playerInfo.teamAreaEntered = teamInfo.type;
                        if (teamInfo.state == TeamState.Dead) continue;

                        // the player activates a team's trap
                        this.activateTrap(playerInfo, teamInfo);
                    }

                }
                if (!playerWithinTeamArea) {
                    playerInfo.teamAreaEntered = undefined;
                }
            }
        }
        for (const gen of this.generators) {
            if (gen.indicatorLocations && gen.remainingCooldown % 20 == 0) {
                for (const loc of gen.indicatorLocations) {
                    const sign = this.dimension.getBlock(loc)?.getComponent("sign");
                    if (!sign) {
                        throw new Error(`Generator indicator does not exist at ${v3.toString(loc)}.`);
                    }
                    sign.setWaxed(true);
                    [mc.SignSide.Front, mc.SignSide.Back].forEach(signSide => sign.setText(`§eSpawns in §c${gen.remainingCooldown / 20} §eseconds`, signSide));
                }
            }
            if (gen.remainingCooldown > 0) {
                --gen.remainingCooldown;
                continue;
            }

            gen.remainingCooldown = gen.interval;
            const spawnLocation = v3.add(gen.spawnLocation, this.originPos);

            // Detect if it reaches capacity
            let { producingArea, capacity } = GENERATOR_CONSTANTS[gen.type];
            producingArea = producingArea.map(
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
            if (existingTokens >= capacity) continue;

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
            if (gen.type != GeneratorType.IronGold) {
                const v = itemEntity.getVelocity();
                v.x = -v.x;
                v.y = 0;
                v.z = -v.z;
                itemEntity.applyImpulse(v);
            }
        }
        for (const gen of this.generators) {
            const spawnLocation = v3.add(gen.spawnLocation, this.originPos);
            if (gen.belongToTeam && gen.spawnExtraEmerald) {
                if (gen.extraEmeraldRemainingCooldown > 0) {
                    --gen.extraEmeraldRemainingCooldown;
                    continue;
                }
                this.dimension.spawnItem(EMERALD_ITEM_STACK, spawnLocation);
                gen.extraEmeraldRemainingCooldown = gen.extraEmeraldInterval;
            }
        }
        if ((mc.system.currentTick - this.startTime) % 20 == 0) {
            this.updateScoreboard();
        }
        for (const eggEntity of this.dimension.getEntities({ type: "minecraft:egg" })) {
            const ownerInfo = eggEntity[BRIDGE_EGG_OWNER_SYMBOL];
            if (!ownerInfo) continue;
            const baseLocation = v3.floor(eggEntity.location);
            baseLocation.y -= 2;
            [
                { x: 0, y: 0, z: 0 },
                { x: -1, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 },
                { x: 0, y: 0, z: -1 },
                { x: 0, y: 0, z: 1 },
            ].forEach(_pos => {
                const location = v3.add(baseLocation, _pos);
                const preExistingBlock = this.dimension.getBlock(location);
                if (this.isBlockLocationPlayerPlacable(location) &&
                    (!preExistingBlock || preExistingBlock.type.id == MinecraftBlockTypes.Air)) {
                    this.dimension.fillBlocks(location, location, TEAM_CONSTANTS[ownerInfo.team].woolName);
                    ownerInfo.placement.push(location);
                }
            });

        }
        for (const fireBall of this.dimension.getEntities({
            type: "minecraft:fireball"
        })) {
            const id = fireBall.getDynamicProperty(FIREBALL_GAMEID_PROP);
            if (!id) continue;
            if (id != this.id) {
                fireBall.kill();
                continue;
            }
            const location = fireBall[SPAWN_LOCATION_SYMBOL]!;
            if (v3.distance(fireBall.location, location) >= FIRE_BALL_MAX_TRAVEL_DISTANCE) {
                fireBall.kill();
            }
        }

        const teamIslandPlayers: Map<TeamType, PlayerGameInformation[]> = new Map();
        // Simulated players AI
        for (const playerInfo of this.players.values()) {
            const teamAreaEntered = playerInfo.teamAreaEntered;
            if (teamAreaEntered != undefined) {
                const players = teamIslandPlayers.get(teamAreaEntered);
                if (players) {
                    players.push(playerInfo);
                } else {
                    teamIslandPlayers.set(teamAreaEntered, [playerInfo]);
                }
            }
        }
        for (const fakePlayerInfo of this.players.values()) {
            if (!(fakePlayerInfo.player instanceof SimulatedPlayer)) continue;
            const fakePlayer = fakePlayerInfo.player;
            const victims = teamIslandPlayers.get(fakePlayerInfo.team)?.sort((a, b) =>
                v3.distance(a.player.location, fakePlayer.location) - v3.distance(b.player.location, fakePlayer.location)
            );
            victims?.shift();
            if (!victims || victims.length == 0) {
                fakePlayer.attackTarget = undefined;
                continue;
            }
            if (fakePlayer.attackTarget) {
                if (fakePlayer.attackTarget.teamAreaEntered == fakePlayerInfo.team) {
                    if (v3.distance(fakePlayer.location, victims[0].player.location) < 3) {
                        fakePlayer.attackTarget = victims[0];
                    }
                } else {
                    fakePlayer.attackTarget = undefined;
                }
            }
            if (!fakePlayer.attackTarget) {
                fakePlayer.attackTarget = victims[0];
            }

            if (mc.system.currentTick % 5 == 0) {
                fakePlayer.lookAtEntity(fakePlayer.attackTarget.player);
                fakePlayer.attack();
            }
            // fakePlayer.lookAtEntity(fakePlayer.attackTarget.player);
            if (mc.system.currentTick % 20 == 0) {
                fakePlayer.navigateToEntity(fakePlayer.attackTarget.player);
            }
            if(v3.distance(fakePlayer.location, fakePlayer.attackTarget.player.location) < 3) {
                fakePlayer.stopMoving();
            }
        }
    }

    /**
     * This method defines actions to be performed right after the player dies or come offline
     * , and does not include all actions to get the player back to the game
     */
    private onPlayerDieOrOffline(victimInfo: PlayerGameInformation, killerInfo?: PlayerGameInformation) {
        victimInfo.deathTime = mc.system.currentTick;
        ++victimInfo.deathCount;
        victimInfo.lastHurtBy = undefined;
        victimInfo.teamAreaEntered = undefined;
        let victimOffline = false;
        if (victimInfo.state == PlayerState.Offline) {
            victimOffline = true;
            const teamInfo = this.map.teams.find(ele => ele.type === victimInfo.team)!;
            victimInfo.deathLocation = v3.add(this.originPos, teamInfo.playerSpawn);
        } else {
            victimInfo.deathLocation = victimInfo.player.location;
            victimInfo.deathRotaion = victimInfo.player.getRotation();
            victimInfo.state = PlayerState.dead;
        }

        if (this.teams.get(victimInfo.team)!.state == TeamState.BedAlive) {
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
        this.onPlayerDieOrOffline(victimInfo, killerInfo);
    }

    afterEntityHurt(event: mc.EntityHurtAfterEvent) {
        if (this.state != GameState.started) return;

        if (!(event.hurtEntity instanceof mc.Player)) return;
        if (!(event.damageSource.damagingEntity instanceof mc.Player)) return;
        const victim = event.hurtEntity;
        const hurter = event.damageSource.damagingEntity;
        const victimInfo = this.players.get(victim.name);
        const hurterInfo = this.players.get(hurter.name);
        if (!victimInfo) return;
        if (!hurterInfo) return;
        if (victimInfo.team == hurterInfo.team) {
            // workaround for disabling in-team damage
            const health = victim.getComponent("health")!;
            health.setCurrentValue(health.currentValue + event.damage);
        }
    }
    afterEntityHitEntity(event: mc.EntityHitEntityAfterEvent) {
        if (this.state != GameState.started) return;
        let victimInfo: PlayerGameInformation | undefined;
        let hurterInfo: PlayerGameInformation | undefined;

        if (event.hitEntity instanceof mc.Player) {
            victimInfo = this.players.get(event.hitEntity.name);
        }
        if (event.damagingEntity instanceof mc.Player) {
            hurterInfo = this.players.get(event.damagingEntity.name);
        }

        if (victimInfo) {
            if (hurterInfo) {
                if (hurterInfo.team == victimInfo.team) {
                    // TOWAIT TODO
                    return;
                }
                victimInfo.lastHurtBy = hurterInfo;
            } else {
                victimInfo.lastHurtBy = undefined;
            }
        }
        if (hurterInfo) {
            if (hurterInfo.armorDisabled) {
                hurterInfo.armorDisabled = false;
                this.resetArmor(hurterInfo);
            }
        }
    }
    afterProjectileHitEntity(event: mc.ProjectileHitEntityAfterEvent) {
        if (event.dimension != this.dimension) return;
        const victim = event.getEntityHit().entity;
        if (!victim) return;
        if (!(victim instanceof mc.Player)) return;
        const victimInfo = this.players.get(victim.name);
        if (!victimInfo) return;
        if (event.source) {
            if (event.source instanceof mc.Player) {
                const hurterInfo = this.players.get(event.source.name);
                if (hurterInfo) {
                    if (hurterInfo.team == victimInfo.team) {
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
        if (event.block.typeId == MinecraftBlockTypes.Chest) {
            for (const team of this.map.teams) {
                if (v3.equals(event.block.location, v3.add(team.teamChestLocation, this.originPos))) {
                    if (playerInfo.team != team.type) {
                        playerInfo.player.sendMessage(OPEN_ENEMY_CHEST_MESSAGE);
                        event.cancel = true;
                    }
                    break;
                }
            }
            return;
        }

        for (const { itemShopLocation: shopLocation, teamShopLocation } of this.map.teams) {
            if (v3.equals(v3.add(this.originPos, shopLocation), event.block.location)) {
                await sleep(0);
                const teamInfo = this.teams.get(playerInfo.team)!;
                openShop(playerInfo, teamInfo, this);
                return;
            } else if (v3.equals(v3.add(this.originPos, teamShopLocation), event.block.location)) {
                await sleep(0);
                const teamInfo = this.teams.get(playerInfo.team)!;
                openTeamShop(playerInfo, teamInfo, this);
                return;
            }
        }
    }
    beforePlayerInteractWithEntity(event: mc.PlayerInteractWithEntityBeforeEvent) {
        if (this.state != GameState.started) return;
    }
    private removeBlockFromRecord(block: mc.Block) {
        let result = false;
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

            // One record may appear in different instances
            result = true;
        }
        return result;
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
            if (this.teams.get(destroyedTeam.type)!.state != TeamState.BedAlive) break TeamBedDestroyed;
            event.cancel = true;

            if (!destroyerInfo) return;
            if (destroyedTeam.type == destroyerInfo.team) return;
            this.teams.get(destroyedTeam.type)!.state = TeamState.BedDestoryed;
            await sleep(0);

            /* Clear the bed */
            event.dimension.fillBlocks(v3.add(destroyedTeam.bedLocation[0], this.originPos),
                v3.add(destroyedTeam.bedLocation[1], this.originPos), "minecraft:air");

            if (destroyerInfo.armorDisabled) {
                destroyerInfo.armorDisabled = false;
                destroyerInfo.armorToEnablingTicks = 0;
                this.resetArmor(destroyerInfo);
            }

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
            this.checkTeamPlayers();
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

    private isBlockLocationPlayerPlacable(location: mc.Vector3) {
        if (location.y < this.map.voidY + this.originPos.y) return false;
        for (const gen of this.generators) {
            const protectedArea = GENERATOR_CONSTANTS[gen.type].protectedArea.map(
                vec => vectorAdd(vec, gen.location, this.originPos)) as Area;
            if (vectorWithinArea(location, protectedArea)) {
                return false;
            }
        }
        for (const teamMapInfo of this.map.teams) {
            if (!teamMapInfo.protectedArea) continue;
            const protectedArea = teamMapInfo.protectedArea.map(v => v3.add(v, this.originPos)) as Area;
            if (vectorWithinArea(location, protectedArea)) {
                return false;
            }
        }
        return true;
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
            consumeMainHandItem(playerInfo.player);
            return;
        } else if (event.permutationBeingPlaced.type.id == MinecraftBlockTypes.CraftingTable) {
            // disallow the player to place crafting table
            // and then clear it
            event.cancel = true;
            await sleep(0);
            playerInfo.player.getComponent("equippable")!.getEquipmentSlot(mc.EquipmentSlot.Mainhand).setItem();
            return;
        }
        // disallow the player to place blocks in protected area
        if (!this.isBlockLocationPlayerPlacable(event.block.location)) {
            event.cancel = true;
            playerInfo.player.sendMessage(PLACING_BLOCK_ILLAGEL_MESSAGE);
            return;
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
    async beforeItemUse(event: mc.ItemUseBeforeEvent) {
        if (this.state != GameState.started) return;
        if (!(event.source instanceof mc.Player)) return;
        const playerInfo = this.players.get(event.source.name);
        if (!playerInfo) return;

        if (isBridgeEggItem(event.itemStack)) {
            if (playerInfo.bridgeEggCooldown > 0) {
                event.cancel = true;
                return;
            }
            await sleep(0);

            const eggEntity = this.dimension.getEntities({
                type: "minecraft:egg"
            }).filter(entity => entity.getComponent("projectile")?.owner == playerInfo.player && entity[BRIDGE_EGG_OWNER_SYMBOL] == undefined)[0];
            if (!eggEntity) return;

            eggEntity[BRIDGE_EGG_OWNER_SYMBOL] = playerInfo;
            playerInfo.bridgeEggCooldown = BRIDGE_EGG_COOLDOWN;
        } else if (isFireBallItem(event.itemStack)) {
            event.cancel = true;
            if (playerInfo.fireBallCooldown > 0) {
                return;
            }
            await sleep(0);

            const location = playerInfo.player.getHeadLocation();
            const fireBall = this.dimension.spawnEntity(MinecraftEntityTypes.Fireball, location);
            fireBall.getComponent("projectile")!.owner = playerInfo.player;
            fireBall.applyImpulse(v3.normalize(playerInfo.player.getViewDirection()));
            fireBall[SPAWN_LOCATION_SYMBOL] = fireBall.location;
            fireBall.setDynamicProperty(FIREBALL_GAMEID_PROP, this.id);

            consumeMainHandItem(playerInfo.player);
            playerInfo.fireBallCooldown = FIRE_BALL_COOLDOWN;
        }
    }
    beforeItemUseOn(event: mc.ItemUseOnBeforeEvent) {
        if (this.state != GameState.started) return;
        if (!(event.source instanceof mc.Player)) return;
        const playerInfo = this.players.get(event.source.name);
        if (!playerInfo) return;

        if (isFireBallItem(event.itemStack)) {
            event.cancel = true;
        }
    }
    afterItemCompleteUse(event: mc.ItemCompleteUseAfterEvent) {
        if (this.state != GameState.started) return;

        if (!(event.source instanceof mc.Player)) return;
        const playerInfo = this.players.get(event.source.name);
        if (!playerInfo) return;

        if (isInvisiblePotionItem(event.itemStack)) {
            playerInfo.player.addEffect(MinecraftEffectTypes.Invisibility, INVISIBLILITY_DURATION);
            playerInfo.armorDisabled = true;
            playerInfo.armorToEnablingTicks = INVISIBLILITY_DURATION;
            const equip = playerInfo.player.getComponent('equippable')!;
            [mc.EquipmentSlot.Head, mc.EquipmentSlot.Chest, mc.EquipmentSlot.Legs, mc.EquipmentSlot.Feet].forEach(slotName => {
                equip.getEquipmentSlot(slotName).setItem();
            });
        } else if (isJumpBoostPotionItem(event.itemStack)) {
            playerInfo.player.addEffect(MinecraftEffectTypes.JumpBoost, JUMP_BOOST_DURATION, {
                amplifier: 4
            });
        } else if (isSpeedPotionItem(event.itemStack)) {
            playerInfo.player.addEffect(MinecraftEffectTypes.Speed, SPEED_DURATION, {
                amplifier: 1
            });
        }
    }

    afterWeatherChange(event: mc.WeatherChangeAfterEvent) {
        if (this.state != GameState.started) return;
        if (mc.world.getDimension(event.dimension) != this.dimension) return;
        if (event.newWeather == mc.WeatherType.Thunder) {
            this.dimension.setWeather(mc.WeatherType.Rain);
        }
    }

    beforeChatSend(event: mc.ChatSendBeforeEvent) {
        if (this.state != GameState.started) return;
        const sender = event.sender;
        const senderInfo = this.players.get(sender.name);
        if (!senderInfo) return;

        event.cancel = true;
        mc.world.sendMessage(`<${sender.nameTag}§r> ${event.message}`);
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
        for (const bucket of this.data) {
            yield* bucket;
        }
    }
}

let game: BedWarsGame;

mc.world.beforeEvents.chatSend.subscribe(async event => {
    if (game) {
        game.beforeChatSend(event);
    }
    let map: MapInformation;
    let originLocation: mc.Vector3;
    if (event.message == "start") {
        map = testMap;
        originLocation = { x: -17, y: 5, z: 32 };
    } else if (event.message == "start2") {
        map = mapGarden;
        originLocation = { x: -104, y: 54, z: -65 };
    } else if (event.message == "start3") {
        map = mapSteamPunk;
        originLocation = { x: 0, y: 0, z: 0 };
    } else if (event.message == "start4") {
        map = mapWaterfall;
        originLocation = { x: 0, y: 0, z: 0 };
    } else if (event.message == "SPECIAL CODE") {
        await sleep(0);
        const container = event.sender.getComponent("inventory")!.container!;
        container.addItem(makeItem(IRON_ITEM_STACK, 64));
        container.addItem(makeItem(GOLD_ITEM_STACK, 64));
        container.addItem(makeItem(DIAMOND_ITEM_STACK, 64));
        container.addItem(makeItem(EMERALD_ITEM_STACK, 64));
        return;
    } else if (event.message == "DEBUG STICK") {
        await sleep(0);
        const container = event.sender.getComponent("inventory")!.container!;
        const i = new mc.ItemStack(MinecraftItemTypes.Stick);
        i.nameTag = "Debug Stick";
        container.addItem(i);
        return;
    } else {
        return;
    }
    const teams = map.teams.map(team => team.type);
    shuffle(teams);

    event.cancel = true;
    await sleep(0); // get out of read-only mode

    const switchTeam = (index: number) => index == teams.length - 1 ? 0 : index + 1;

    if (!globalThis.test) setupGameTest(event.sender.location.x, event.sender.location.z, event.sender.dimension);
    while (!globalThis.test) {
        await sleep(0);
    }

    const players = mc.world.getAllPlayers();
    game = new BedWarsGame({
        map,
        originLocation,
        dimension: players[0].dimension,
        scoreboardObjective: mc.world.scoreboard.getObjective("GAME") ?? mc.world.scoreboard.addObjective("GAME", "§e§lBED WARS")
    });
    const realPlayers = players.filter(p => !(p instanceof SimulatedPlayer));
    const fakePlayers = players.filter(p => p instanceof SimulatedPlayer);
    let teamPlayerCount: number[] = [];
    for (let i = 0; i < teams.length; ++i) teamPlayerCount.push(0);

    let teamIndex = randomInt(0, teams.length - 1);
    for (const p of [...realPlayers, ...fakePlayers]) {
        game.setPlayer(p, teams[teamIndex]);
        ++teamPlayerCount[teamIndex];
        teamIndex = switchTeam(teamIndex);
    }
    const maxPlayer = Math.max(1, ...teamPlayerCount);
    for (teamIndex = 0; teamIndex < teams.length; ++teamIndex) {
        for (let i = 0; i < maxPlayer - teamPlayerCount[teamIndex]; ++i) {
            const p = globalThis.test.spawnSimulatedPlayer(event.sender.location as any, "a");
            game.setPlayer(p as any, teams[teamIndex]);
        }
    }
    game.start();
    globalThis.game = game;
});

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
        game.beforeItemUse(event);
    }
});
mc.world.beforeEvents.itemUseOn.subscribe(event => {
    if (game) {
        game.beforeItemUseOn(event);
    }
});
mc.world.afterEvents.itemCompleteUse.subscribe(event => {
    if (game) {
        game.afterItemCompleteUse(event);
    }
});
mc.world.beforeEvents.playerInteractWithBlock.subscribe(event => {
    if (game) {
        game.beforePlayerInteractWithBlock(event);
    }
});
mc.world.beforeEvents.playerInteractWithEntity.subscribe(event => {
    if (game) {
        game.beforePlayerInteractWithEntity(event);
    }
});
mc.world.afterEvents.projectileHitEntity.subscribe(event => {
    if (game) {
        game.afterProjectileHitEntity(event);
    }
});
mc.world.afterEvents.entityHurt.subscribe(event => {
    if (game) {
        game.afterEntityHurt(event);
    }
});
mc.world.afterEvents.weatherChange.subscribe(event => {
    if (game) {
        game.afterWeatherChange(event);
    }
});
mc.system.runInterval(() => {
    if (game) game.tickEvent();
});
