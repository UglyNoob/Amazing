import { Vector3Utils } from '@minecraft/math';
const {
    subtract,
    normalize,
    toString,
    floor,
    magnitude,
    distance: vecDistance,
    scale,
    equals
} = Vector3Utils;
import * as mc from '@minecraft/server';
import { itemEqual, Area, sleep, add, vectorWithinArea, containerIterator, capitalize, getPlayerByName, consumeMainHandItem, shuffle, randomInt, analyzeTime, vectorCompare, raycastHits, quickFind, getAngle, smallest, containerSlotIterator, timeToString, givePlayerItems, makeItem } from './utility.js';
import { setupGameTest } from './GameTest.js';
import { MinecraftBlockTypes, MinecraftEffectTypes, MinecraftEnchantmentTypes, MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data';

import { sprintf, vsprintf } from 'sprintf-js';
import { calculateTokens, openItemShop, openTeamShop, TokenValue } from './BedwarsShop.js';
import { isLocationPartOfAnyPlatforms } from './RescuePlatform.js';
import { SimulatedPlayer } from '@minecraft/server-gametest';
import { mapGardens, mapSteamPunk, mapWaterfall, mapEastwood, mapVaryth, mapInvasion, mapJurassic } from './BedwarsMaps.js';
import { ActionFormData, ActionFormResponse, FormCancelationReason, ModalFormData } from '@minecraft/server-ui';
import { Strings, Lang, fixPlayerSettings, getPlayerLang, setPlayerLang, strings } from './Lang.js';

const RESPAWN_TIME = 100; // in ticks
const TRACKER_CHANGE_TARGET_COOLDOWN = 10; // in ticks
export const IRON_TOKEN_ITEM = new mc.ItemStack("amazing:iron_token");
export const GOLD_TOKEN_ITEM = new mc.ItemStack("amazing:gold_token");
export const DIAMOND_TOKEN_ITEM = new mc.ItemStack("amazing:diamond_token");
export const EMERALD_TOKEN_ITEM = new mc.ItemStack("amazing:emerald_token");

export const BRIDGE_EGG_ITEM = new mc.ItemStack("minecraft:egg");
BRIDGE_EGG_ITEM.nameTag = "§r§2Bridge Egg";
BRIDGE_EGG_ITEM.setLore(["", "§rBuild a bridge!"]);
const BRIDGE_EGG_COOLDOWN = 20; // in ticks

export const FIRE_BALL_ITEM = new mc.ItemStack("amazing:fireball");
const FIRE_BALL_COOLDOWN = 5; // in ticks

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

function isInvisiblilityPotionItem(item: mc.ItemStack) {
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

export const KNOCKBACK_STICK_ITEM = new mc.ItemStack("amazing:knockback_stick");

export const TRACKER_ITEM = new mc.ItemStack("amazing:player_tracker");

const SETTINGS_ITEM = new mc.ItemStack("amazing:bedwars_settings");
SETTINGS_ITEM.lockMode = mc.ItemLockMode.inventory;

const OWNER_SYM = Symbol("owner of the entity");
const SITTING_SYM = Symbol("is wolf sitting");
const SHOP_TYPE_SYM = Symbol("type of the shop the villager is");
const CREATED_LOC_SYM = Symbol("birth location");
const BEDWARS_GAMEID_PROP = "BEDWARSID";

const WOLF_GUARDING_DISTANCE = 10;
const WOLF_GUARDING_INTERVAL = 60; // in ticks

declare module '@minecraft/server' {
    interface Entity {
        [OWNER_SYM]?: PlayerGameInformation;
        [SITTING_SYM]?: boolean;
        [SHOP_TYPE_SYM]?: "item" | "team";
        [CREATED_LOC_SYM]?: mc.Vector3;
    }
}
declare module '@minecraft/server-gametest' {
    interface SimulatedPlayer {
        attackTarget?: PlayerGameInformation;
        previousOnGround: boolean;
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
/**
 * In case there will be more teams
 * remember to modify player.json
 */
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
    localName: keyof Strings;
    colorPrefix: string;
    color: mc.PaletteColor;
    woolName: string;
    woolIconPath: string;
    glassName: string;
    glassIconPath: string;
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
        localName: "blueName",
        colorPrefix: "§9",
        color: mc.PaletteColor.Blue,
        woolName: MinecraftItemTypes.BlueWool,
        woolIconPath: "textures/blocks/wool_colored_blue.png",
        glassName: MinecraftBlockTypes.BlueStainedGlass,
        glassIconPath: "textures/blocks/glass_blue.png",
        leatherHelmet: setupItem(MinecraftItemTypes.LeatherHelmet, TeamType.Blue),
        leatherChestplate: setupItem(MinecraftItemTypes.LeatherChestplate, TeamType.Blue),
        leatherLeggings: setupItem(MinecraftItemTypes.LeatherLeggings, TeamType.Blue),
        leatherBoots: setupItem(MinecraftItemTypes.LeatherBoots, TeamType.Blue)
    };
    TEAM_CONSTANTS[TeamType.Green] = {
        name: "green",
        localName: "greenName",
        colorPrefix: "§a",
        color: mc.PaletteColor.Green,
        woolName: MinecraftItemTypes.GreenWool,
        woolIconPath: "textures/blocks/wool_colored_green.png",
        glassName: MinecraftBlockTypes.GreenStainedGlass,
        glassIconPath: "textures/blocks/glass_green.png",
        leatherHelmet: setupItem(MinecraftItemTypes.LeatherHelmet, TeamType.Green),
        leatherChestplate: setupItem(MinecraftItemTypes.LeatherChestplate, TeamType.Green),
        leatherLeggings: setupItem(MinecraftItemTypes.LeatherLeggings, TeamType.Green),
        leatherBoots: setupItem(MinecraftItemTypes.LeatherBoots, TeamType.Green)
    };
    TEAM_CONSTANTS[TeamType.Red] = {
        name: "red",
        localName: "redName",
        colorPrefix: "§c",
        color: mc.PaletteColor.Red,
        woolName: MinecraftItemTypes.RedWool,
        woolIconPath: "textures/blocks/wool_colored_red.png",
        glassName: MinecraftBlockTypes.RedStainedGlass,
        glassIconPath: "textures/blocks/glass_red.png",
        leatherHelmet: setupItem(MinecraftItemTypes.LeatherHelmet, TeamType.Red),
        leatherChestplate: setupItem(MinecraftItemTypes.LeatherChestplate, TeamType.Red),
        leatherLeggings: setupItem(MinecraftItemTypes.LeatherLeggings, TeamType.Red),
        leatherBoots: setupItem(MinecraftItemTypes.LeatherBoots, TeamType.Red)
    };
    TEAM_CONSTANTS[TeamType.Yellow] = {
        name: "yellow",
        localName: "yellowName",
        colorPrefix: "§e",
        color: mc.PaletteColor.Yellow,
        woolName: MinecraftItemTypes.YellowWool,
        woolIconPath: "textures/blocks/wool_colored_yellow.png",
        glassName: MinecraftBlockTypes.YellowStainedGlass,
        glassIconPath: "textures/blocks/glass_yellow.png",
        leatherHelmet: setupItem(MinecraftItemTypes.LeatherHelmet, TeamType.Yellow),
        leatherChestplate: setupItem(MinecraftItemTypes.LeatherChestplate, TeamType.Yellow),
        leatherLeggings: setupItem(MinecraftItemTypes.LeatherLeggings, TeamType.Yellow),
        leatherBoots: setupItem(MinecraftItemTypes.LeatherBoots, TeamType.Yellow)
    };
    TEAM_CONSTANTS[TeamType.Pink] = {
        name: "pink",
        localName: "pinkName",
        colorPrefix: "§d",
        color: mc.PaletteColor.Pink,
        woolName: MinecraftItemTypes.PinkWool,
        woolIconPath: "textures/blocks/wool_colored_pink.png",
        glassName: MinecraftBlockTypes.PinkStainedGlass,
        glassIconPath: "textures/blocks/glass_pink.png",
        leatherHelmet: setupItem(MinecraftItemTypes.LeatherHelmet, TeamType.Pink),
        leatherChestplate: setupItem(MinecraftItemTypes.LeatherChestplate, TeamType.Pink),
        leatherLeggings: setupItem(MinecraftItemTypes.LeatherLeggings, TeamType.Pink),
        leatherBoots: setupItem(MinecraftItemTypes.LeatherBoots, TeamType.Pink)
    };
    TEAM_CONSTANTS[TeamType.Gray] = {
        name: "gray",
        localName: "grayName",
        colorPrefix: "§8",
        color: mc.PaletteColor.Gray,
        woolName: MinecraftItemTypes.GrayWool,
        woolIconPath: "textures/blocks/wool_colored_gray.png",
        glassName: MinecraftBlockTypes.GrayStainedGlass,
        glassIconPath: "textures/blocks/glass_gray.png",
        leatherHelmet: setupItem(MinecraftItemTypes.LeatherHelmet, TeamType.Gray),
        leatherChestplate: setupItem(MinecraftItemTypes.LeatherChestplate, TeamType.Gray),
        leatherLeggings: setupItem(MinecraftItemTypes.LeatherLeggings, TeamType.Gray),
        leatherBoots: setupItem(MinecraftItemTypes.LeatherBoots, TeamType.Gray)
    };
    TEAM_CONSTANTS[TeamType.Cyan] = {
        name: "cyan",
        localName: "cyanName",
        colorPrefix: "§3",
        color: mc.PaletteColor.Cyan,
        woolName: MinecraftItemTypes.CyanWool,
        woolIconPath: "textures/blocks/wool_colored_cyan.png",
        glassName: MinecraftBlockTypes.CyanStainedGlass,
        glassIconPath: "textures/blocks/glass_cyan.png",
        leatherHelmet: setupItem(MinecraftItemTypes.LeatherHelmet, TeamType.Cyan),
        leatherChestplate: setupItem(MinecraftItemTypes.LeatherChestplate, TeamType.Cyan),
        leatherLeggings: setupItem(MinecraftItemTypes.LeatherLeggings, TeamType.Cyan),
        leatherBoots: setupItem(MinecraftItemTypes.LeatherBoots, TeamType.Cyan)
    };
    TEAM_CONSTANTS[TeamType.White] = {
        name: "white",
        localName: "whiteName",
        colorPrefix: "§f",
        color: mc.PaletteColor.White,
        woolName: MinecraftItemTypes.WhiteWool,
        woolIconPath: "textures/blocks/wool_colored_white.png",
        glassName: MinecraftBlockTypes.WhiteStainedGlass,
        glassIconPath: "textures/blocks/glass_white.png",
        leatherHelmet: setupItem(MinecraftItemTypes.LeatherHelmet, TeamType.White),
        leatherChestplate: setupItem(MinecraftItemTypes.LeatherChestplate, TeamType.White),
        leatherLeggings: setupItem(MinecraftItemTypes.LeatherLeggings, TeamType.White),
        leatherBoots: setupItem(MinecraftItemTypes.LeatherBoots, TeamType.White)
    };
}
enum PlayerDieCause {
    killed, disconnected, void, shot
}
interface GeneratorInformation {
    type: GeneratorType;
    spawnLocation: mc.Vector3;
    location: mc.Vector3; // the bottom-north-west location
    initialInterval: number;
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
    playerSpawn: mc.Vector3;
    playerSpawnViewDirection: mc.Vector3;
    protectedArea?: Area;
    islandArea: Area;
}
export interface MapInformation {
    teams: TeamInformation[];
    voidY: number;
    extraGenerators: GeneratorInformation[];
    playableArea: Area;
    /**
     * Used to detect respawned player
     */
    fallbackRespawnPoint: mc.Vector3;
    teamExtraEmeraldGenInterval: number;
}

export interface SwordLevel {
    level: number;
    name: keyof Strings;
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
            name: "woodenSwordName",
            icon: "textures/items/wood_sword.png",
            item: setupItem(MinecraftItemTypes.WoodenSword)
        }, {
            level: 1,
            name: "stoneSwordName",
            icon: "textures/items/stone_sword.png",
            item: setupItem(MinecraftItemTypes.StoneSword)
        }, {
            level: 2,
            name: "ironSwordName",
            icon: "textures/items/iron_sword.png",
            item: setupItem(MinecraftItemTypes.IronSword)
        }, {
            level: 3,
            name: "diamondSwordName",
            icon: "textures/items/diamond_sword.png",
            item: setupItem(MinecraftItemTypes.DiamondSword)
        }
    ];
})();

export interface PickaxeLevel {
    level: number;
    name: keyof Strings;
    icon: string;
    item: mc.ItemStack;
    toCurrentLevelCost: TokenValue;
}

export const PICKAXE_LEVELS: PickaxeLevel[] = (() => {
    function setupItem(type: MinecraftItemTypes, enchantments: {
        type: MinecraftEnchantmentTypes;
        level: number;
    }[]) {
        const i = new mc.ItemStack(type);
        i.lockMode = mc.ItemLockMode.inventory;
        const e = i.getComponent("enchantable")!;
        e.addEnchantments(enchantments.map(e => ({
            type: mc.EnchantmentTypes.get(e.type)!,
            level: e.level
        })));
        return i;
    }

    return [
        {
            level: 0,
            name: "woodenPickaxeName",
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
            name: "ironPickaxeName",
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
            name: "goldenPickaxeName",
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
            name: "diamondPickaxeName",
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
    name: keyof Strings;
    icon: string;
    item: mc.ItemStack;
    toCurrentLevelCost: TokenValue;
}
export const AXE_LEVELS: AxeLevel[] = (() => {
    function setupItem(type: MinecraftItemTypes, enchantments: {
        type: MinecraftEnchantmentTypes;
        level: number;
    }[]) {
        const i = new mc.ItemStack(type);
        i.lockMode = mc.ItemLockMode.inventory;
        const e = i.getComponent("enchantable")!;
        e.addEnchantments(enchantments.map(e => ({
            type: mc.EnchantmentTypes.get(e.type)!,
            level: e.level
        })));
        return i;
    }

    return [
        {
            level: 0,
            name: "woodenAxeName",
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
            name: "stoneAxeName",
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
            name: "ironAxeName",
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
            name: "diamondAxeName",
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
    name: keyof Strings;
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
            name: "leatherArmorName",
            icon: "textures/items/leather_boots.tga",
            leggings: setupItem(MinecraftItemTypes.LeatherLeggings),
            boots: setupItem(MinecraftItemTypes.LeatherBoots)
        }, {
            level: 1,
            name: "chainmailArmorName",
            icon: "textures/items/chainmail_boots.png",
            leggings: setupItem(MinecraftItemTypes.ChainmailLeggings),
            boots: setupItem(MinecraftItemTypes.ChainmailBoots)
        }, {
            level: 2,
            name: "ironArmorName",
            icon: "textures/items/iron_boots.png",
            leggings: setupItem(MinecraftItemTypes.IronLeggings),
            boots: setupItem(MinecraftItemTypes.IronBoots)
        }, {
            level: 3,
            name: "diamondArmorName",
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
    name: keyof Strings;
    description: keyof Strings;
    iconPath: string;
}> = Object.create(null);

TRAP_CONSTANTS[TrapType.NegativeEffect] = {
    name: "negativeEffectTrapName",
    description: "negativeEffectTrapDescription",
    iconPath: "textures/blocks/trip_wire_source.png"
};
TRAP_CONSTANTS[TrapType.Defensive] = {
    name: "defensiveTrapName",
    description: "defensiveTrapDescription",
    iconPath: "textures/items/feather.png"
};
TRAP_CONSTANTS[TrapType.Alarm] = {
    name: "alarmTrapName",
    description: "alarmTrapDescription",
    iconPath: "textures/blocks/redstone_torch_on.png"
};
TRAP_CONSTANTS[TrapType.MinerFatigue] = {
    name: "minerFatigueTrapName",
    description: "minerFatigueTrapDescription",
    iconPath: "textures/items/gold_pickaxe.png"
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
    mapInfo: GeneratorInformation;
    spawnLocation: mc.Vector3;
    location: mc.Vector3;
    type: GeneratorType;
    interval: number;
    remainingCooldown: number;
    tokensGeneratedCount: number;
    /**
     * Used to evenly distribute tokens when there are multiple receiver
     * True means could receive
     */
    recevierCollects: Map<string, boolean>;
    indicator?: mc.Entity;
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
    bedDestroyedCount: number;
    deathTime: number; // global tick
    deathLocation: mc.Vector3;
    deathRotaion: mc.Vector2;
    invulnerableTime: number;
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
    restoreTotemAfterRevealed: boolean;
    armorToEnablingTicks: number;
    teamAreaEntered?: TeamType;
    trackerChangeTargetCooldown: number;
    trackingTarget?: PlayerGameInformation;
    actionbar: ActionbarManager;
    basicNotificationD: number;
    trackerNotificationD?: number;
}

const RESPAWN_INVULNERABLE_TIME = 60; // in ticks

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

enum EventAction {
    disableBedProtection
}

interface Event {
    activateTime: number;
    action: EventAction;
}

export class BedWarsGame {
    private readonly map: MapInformation;
    private players: Map<string, PlayerGameInformation>;
    private teams: Map<TeamType, TeamGameInformation>;
    private readonly originPos: mc.Vector3;
    private state: GameState;
    private bedProtected: boolean;
    private dimension: mc.Dimension;
    private generators: GeneratorGameInformation[];
    private scoreObj: mc.ScoreboardObjective;
    private startTime: number;
    private events: Event[];
    private readonly id: number;

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
        this.events = [];
        this.scoreObj = scoreboardObjective;
        this.teams = new Map();
        this.id = Math.random();
        this.bedProtected = false;
        for (const team of this.map.teams) {
            this.teams.set(team.type, {
                type: team.type,
                state: TeamState.Dead,
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
            const mapGenInfo = teamInfo.teamGenerator;
            this.generators.push({
                mapInfo: mapGenInfo,
                spawnLocation: mapGenInfo.spawnLocation,
                location: mapGenInfo.location,
                type: mapGenInfo.type,
                interval: mapGenInfo.initialInterval,
                remainingCooldown: 0,
                tokensGeneratedCount: 0,
                recevierCollects: new Map(),
                belongToTeam: true,
                team: teamInfo.type,
                spawnExtraEmerald: false,
                extraEmeraldInterval: map.teamExtraEmeraldGenInterval,
                extraEmeraldRemainingCooldown: map.teamExtraEmeraldGenInterval
            });
        }
        for (const mapGenInfo of map.extraGenerators) {
            this.generators.push({
                mapInfo: mapGenInfo,
                spawnLocation: mapGenInfo.spawnLocation,
                location: mapGenInfo.location,
                type: mapGenInfo.type,
                interval: mapGenInfo.initialInterval,
                remainingCooldown: 0,
                tokensGeneratedCount: 0,
                recevierCollects: new Map(),
                belongToTeam: false
            });
        }
    }

    setPlayer(player: mc.Player, teamType: TeamType) {
        if (this.map.teams.find(t => t.type == teamType) == undefined) throw new Error(`No such team(${TEAM_CONSTANTS[teamType].name}).`);

        player.getTags().filter(s => s.startsWith("team")).forEach(s => player.removeTag(s));
        player.addTag(`team${teamType}`);
        let playerInfo = this.players.get(player.name);
        if (playerInfo) {
            playerInfo.team = teamType;
            return;
        }
        playerInfo = {
            name: player.name,
            state: PlayerState.Alive,
            player,
            team: teamType,
            killCount: 0,
            deathCount: 0,
            finalKillCount: 0,
            bedDestroyedCount: 0,
            deathLocation: { x: 0, y: 0, z: 0 },
            deathTime: 0,
            deathRotaion: { x: 0, y: 0 },
            invulnerableTime: 0,
            lastActionSucceed: null,
            placement: new BlockPlacementTracker(),
            swordLevel: SWORD_LEVELS[0],
            armorLevel: ARMOR_LEVELS[0],
            hasShear: false,
            bridgeEggCooldown: 0,
            fireBallCooldown: 0,
            armorDisabled: false,
            restoreTotemAfterRevealed: false,
            armorToEnablingTicks: 0,
            trackerChangeTargetCooldown: 0,
            actionbar: new ActionbarManager(),
            basicNotificationD: 0
        };
        this.players.set(player.name, playerInfo);
        playerInfo.basicNotificationD = playerInfo.actionbar.add("");
    }

    start({
        bedProtected = false,
        events = null
    }: {
        bedProtected?: boolean;
        events?: null | Event[];
    }) {
        this.state = GameState.started;
        this.bedProtected = bedProtected;
        this.startTime = mc.system.currentTick;
        if (events) this.events = events;
        for (const playerInfo of this.players.values()) {
            if (!playerInfo.player.isValid()) {
                playerInfo.state = PlayerState.Offline;
                continue;
            }
            this.teams.get(playerInfo.team)!.state = TeamState.BedAlive;
            const container = playerInfo.player.getComponent("inventory")!.container!;
            container.clearAll();
            container.setItem(8, SETTINGS_ITEM);
            this.respawnPlayer(playerInfo);
            this.setupSpawnPoint(playerInfo.player);
            fixPlayerSettings(playerInfo.player);
        }
        const textDisplays: mc.Entity[] = [];
        const neededTextDisplaysCount = this.generators.reduce((v, ele) => ele.mapInfo.indicatorLocation ? v + 2 : v, 0);
        for (const textDisplay of this.dimension.getEntities({ type: "amazing:text_display" })) {
            if (!vectorWithinArea(textDisplay.location, this.fixOrigin(this.map.playableArea))) continue;
            if (textDisplay.getDynamicProperty(BEDWARS_GAMEID_PROP) == null) continue;
            if (textDisplays.length == neededTextDisplaysCount) {
                textDisplay.remove();
                continue;
            }
            textDisplay.setDynamicProperty(BEDWARS_GAMEID_PROP, this.id);
            textDisplays.push(textDisplay);
        }
        const spawnTextDisplaysCount = neededTextDisplaysCount - textDisplays.length;
        for (let i = 0; i < spawnTextDisplaysCount; ++i) {
            const textDisplay = this.dimension.spawnEntity("amazing:text_display", this.originPos);
            textDisplay.setDynamicProperty(BEDWARS_GAMEID_PROP, this.id);
            textDisplays.push(textDisplay);
        }
        let index = 0;
        for (const gen of this.generators) {
            gen.remainingCooldown = gen.interval;
            if (gen.mapInfo.indicatorLocation) {
                gen.indicator = textDisplays[index++];
                let loc = this.fixOrigin(gen.mapInfo.indicatorLocation);
                gen.indicator.teleport(loc);
                gen.indicator[CREATED_LOC_SYM] = loc;

                const textDisplay = textDisplays[index++];
                loc = add(loc, { x: 0, y: 0.4, z: 0 });
                textDisplay.teleport(loc);
                textDisplay[CREATED_LOC_SYM] = loc;
                let text: string;
                switch (gen.type) {
                    case GeneratorType.IronGold:
                        text = "§7§lIrons";
                        break;
                    case GeneratorType.Diamond:
                        text = "§b§lDiamonds";
                        break;
                    case GeneratorType.Emerald:
                        text = "§a§lEmeralds";
                        break;
                }
                textDisplay.nameTag = text;
            }
        }
        // Prepare shop villagers
        const villagers: mc.Entity[] = [];
        for (const villager of this.dimension.getEntities({ type: "minecraft:villager" })) {
            if (!vectorWithinArea(villager.location, this.fixOrigin(this.map.playableArea))) continue;
            if (villager.getDynamicProperty(BEDWARS_GAMEID_PROP) == null) continue;
            if (villagers.length == this.map.teams.length * 2) {
                villager.remove();
                continue;
            }
            villager.setDynamicProperty(BEDWARS_GAMEID_PROP, this.id);
            villagers.push(villager);
        }
        const spawnVillagerCount = this.map.teams.length * 2 - villagers.length;
        for (let i = 0; i < spawnVillagerCount; ++i) {
            const villager = this.dimension.spawnEntity("minecraft:villager_v2", this.originPos);
            villager.triggerEvent("Amazing:entity_spawn");
            villager.triggerEvent("minecraft:ageable_grow_up");
            villager.setDynamicProperty(BEDWARS_GAMEID_PROP, this.id);
            villagers.push(villager);
        }
        index = 0;
        for (let { itemShopLocation, teamShopLocation, type, playerSpawnViewDirection } of this.map.teams) {
            itemShopLocation = this.fixOrigin(itemShopLocation);
            teamShopLocation = this.fixOrigin(teamShopLocation);
            const t = TEAM_CONSTANTS[type];
            const itemShopVillager = villagers[index++];
            const teamShopVillager = villagers[index++];

            itemShopVillager.teleport(itemShopLocation, {
                dimension: this.dimension,
                facingLocation: playerSpawnViewDirection,
                keepVelocity: false,
                checkForBlocks: false
            });
            itemShopVillager[CREATED_LOC_SYM] = itemShopLocation;
            itemShopVillager.nameTag = `§6§lItem Shop\n§r§7of ${t.colorPrefix + capitalize(t.name)}`;
            itemShopVillager[SHOP_TYPE_SYM] = "item";

            teamShopVillager.teleport(teamShopLocation, {
                dimension: this.dimension,
                facingLocation: playerSpawnViewDirection,
                keepVelocity: false,
                checkForBlocks: false
            });
            teamShopVillager[CREATED_LOC_SYM] = teamShopLocation;
            teamShopVillager.nameTag = `§3§lTeam Upgrade\n§r§7of ${t.colorPrefix + capitalize(t.name)}`;
            teamShopVillager[SHOP_TYPE_SYM] = "team";
        }
        for (const { teamChestLocation, bedLocation: mapBedLocation, type: teamType } of this.map.teams) {
            { // Clear the team chest
                const teamChestContainer = this.dimension.getBlock(this.fixOrigin(teamChestLocation))?.getComponent("inventory")?.container;
                if (teamChestContainer) {
                    teamChestContainer.clearAll();
                } else {
                    throw new Error(`Team chest of team ${TEAM_CONSTANTS[teamType].name} does not exist at ${toString(teamChestLocation)}`);
                }
            }

            // Place the bed
            const bedLocation = this.fixOrigin(mapBedLocation);
            if (this.teams.get(teamType)!.state != TeamState.BedAlive) {
                this.dimension.fillBlocks(new mc.BlockVolume(bedLocation[0], bedLocation[1]), MinecraftBlockTypes.Air);
                continue;
            }
            const directionVector = subtract(bedLocation[1], bedLocation[0]);
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
            this.dimension.fillBlocks(new mc.BlockVolume(bedLocation[1], bedLocation[1]), permutation);
        }

        const mapArea = this.fixOrigin(this.map.playableArea);
        for (const type of ["minecraft:item", "minecraft:wolf"]) {
            this.dimension.getEntities({ type }).forEach(e => {
                if (vectorWithinArea(e.location, mapArea)) e.kill();
            });
        }
        mc.world.scoreboard.setObjectiveAtDisplaySlot(mc.DisplaySlotId.Sidebar, {
            objective: this.scoreObj
        });
        this.updateScoreboard();

        // mc.world.gameRules.recipesUnlock = true;
        // mc.world.gameRules.showRecipeMessages = false;
        // mc.world.gameRules.doLimitedCrafting = true;
        // mc.world.gameRules.doWeatherCycle = false;
        // mc.world.gameRules.showDeathMessages = false;
        this.dimension.runCommand("gamerule recipesunlock true");
        this.dimension.runCommand("gamerule showrecipemessages false");
        this.dimension.runCommand("gamerule dolimitedcrafting true");
        this.dimension.runCommand("gamerule doweathercycle false");
        this.dimension.runCommand("gamerule showdeathmessages false")
    }

    private updateScoreboard() {
        this.scoreObj.getParticipants().forEach(p => this.scoreObj.removeParticipant(p));
        this.scoreObj.setScore("§eminecraft.net", 1);
        this.scoreObj.setScore("", 2);
        let index = 2;
        for (const [teamType, { state }] of this.teams) {
            const t = TEAM_CONSTANTS[teamType];
            let result = `${t.colorPrefix}${t.name.charAt(0).toUpperCase()} §r${capitalize(t.name)}: `;
            switch (state) {
                case TeamState.BedAlive:
                    // result += "§a✔";
                    result += "§a§lV"; // Mojangles will be broken by unicode characters
                    break;
                case TeamState.Dead:
                    // result += "§c✘";
                    result += "§c§lX"; // Mojangles will be broken by unicode characters
                    break;
                case TeamState.BedDestoryed:
                    let aliveCount = 0;
                    for (const playerInfo of this.players.values()) {
                        if (playerInfo.team != teamType) continue;
                        if (this.isPlayerPlaying(playerInfo)) ++aliveCount;
                    }
                    result += `§a${aliveCount}`;
            }
            this.scoreObj.setScore(result, ++index);
        }
        this.scoreObj.setScore(" ", ++index);

        const gameLastTicks = mc.system.currentTick - this.startTime;
        const event = smallest(this.events.filter(e => e.activateTime > gameLastTicks), (a, b) => a.activateTime - b.activateTime);
        if (event) {
            this.scoreObj.setScore(`   §a${timeToString(analyzeTime((event.activateTime - gameLastTicks) * 50))}`, ++index);
            let eventName: string;
            switch (event.action) {
                case EventAction.disableBedProtection:
                    eventName = "Beds Breakable";
                    break;
            }
            this.scoreObj.setScore(`§7${eventName}:`, ++index);
            this.scoreObj.setScore("  ", ++index);
        }

        this.scoreObj.setScore(`§a${timeToString(analyzeTime(gameLastTicks * 50))}`, ++index);
    }

    private respawnPlayer(playerInfo: PlayerGameInformation) {
        const teamInfo = this.teams.get(playerInfo.team)!;
        const teamMapInfo = this.map.teams.find(ele => ele.type === playerInfo.team)!;
        const spawnPoint = this.fixOrigin(teamMapInfo.playerSpawn);
        const player = playerInfo.player;
        player.teleport(spawnPoint, { facingLocation: add(spawnPoint, teamMapInfo.playerSpawnViewDirection) });
        player.setGameMode(mc.GameMode.survival);
        player.getComponent("minecraft:health")!.resetToMaxValue();
        player.runCommand("effect @s clear");
        player.addEffect(MinecraftEffectTypes.Saturation, 1000000, {
            amplifier: 100,
            showParticles: false
        });
        if (playerInfo.armorLevel.level >= 1) {
            player.addEffect(MinecraftEffectTypes.Resistance, 1000000, {
                amplifier: 0,
                showParticles: false
            });
        }
        playerInfo.invulnerableTime = RESPAWN_INVULNERABLE_TIME;
        player.addTag("invulnerable");
        if (teamInfo.hasteLevel > 0) {
            player.addEffect(MinecraftEffectTypes.Haste, 1000000, {
                amplifier: teamInfo.hasteLevel - 1,
                showParticles: false
            });
        }
        player.extinguishFire();
        playerInfo.armorDisabled = false;
        playerInfo.armorToEnablingTicks = 0;
        playerInfo.bridgeEggCooldown = 0;
        playerInfo.fireBallCooldown = 0;
        this.resetInventory(playerInfo);
        playerInfo.lastHurtBy = undefined;
        this.resetNameTag(playerInfo);

        playerInfo.state = PlayerState.Alive;
    }

    private revealInvisiblePlayer(playerInfo: PlayerGameInformation) {
        playerInfo.armorDisabled = false;
        playerInfo.armorToEnablingTicks = 0;
        playerInfo.player.removeEffect(MinecraftEffectTypes.Resistance);
        if (playerInfo.armorLevel.level >= 1) {
            playerInfo.player.addEffect(MinecraftEffectTypes.Resistance, 1000000, {
                showParticles: false,
                amplifier: 0
            });
        }
        if (playerInfo.restoreTotemAfterRevealed) {
            playerInfo.restoreTotemAfterRevealed = false;
            playerInfo.player.getComponent("equippable")!.setEquipment(mc.EquipmentSlot.Offhand, new mc.ItemStack(MinecraftItemTypes.TotemOfUndying));
        }
        this.resetArmor(playerInfo);
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
                    type: mc.EnchantmentTypes.get(MinecraftEnchantmentTypes.Protection)!,
                    level: teamInfo.protectionLevel
                });
                equipment.setEquipment(slotName, item);
            });
        }
    }
    private resetInventory(playerInfo: PlayerGameInformation) {
        this.resetArmor(playerInfo);
        const container = playerInfo.player.getComponent("inventory")!.container!;
        const equipment = playerInfo.player.getComponent("minecraft:equippable")!;
        equipment.setEquipment(mc.EquipmentSlot.Offhand);
        let hasSword = false;
        let foundShear = false;
        let foundPickaxe = false;
        let foundAxe = false;
        let foundSettingsItem = false;
        playerInfo.swordLevel = SWORD_LEVELS[0];
        let swordItem = playerInfo.swordLevel.item;
        const teamInfo = this.teams.get(playerInfo.team)!;
        if (teamInfo.hasSharpness) {
            swordItem = swordItem.clone();
            swordItem.getComponent("enchantable")!.addEnchantment({
                type: mc.EnchantmentTypes.get(MinecraftEnchantmentTypes.Sharpness)!,
                level: SHARPNESS_ENCHANMENT_LEVEL
            });
        }
        for (const { item, index } of containerIterator(container)) {
            if (!item) continue;
            if (itemEqual(playerInfo.swordLevel.item, item)) {
                hasSword = true;
                container.setItem(index, swordItem);
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
            if (itemEqual(item, SETTINGS_ITEM)) {
                foundSettingsItem = true;
                continue;
            }
            container.setItem(index);
        }
        if (!hasSword) {
            container.addItem(swordItem);
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
        if (!foundSettingsItem) {
            container.addItem(SETTINGS_ITEM);
        }
    }
    private setupSpawnPoint(player: mc.Player) {
        player.setSpawnPoint(Object.assign({ dimension: player.dimension }, this.fixOrigin(this.map.fallbackRespawnPoint)));
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
        const trapType = teamInfo.traps.shift();
        if (trapType == null) return;
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
                this.revealInvisiblePlayer(playerInfo);
                isAlarmTrap = true;
                break;
            case TrapType.MinerFatigue:
                player.addEffect(MinecraftEffectTypes.MiningFatigue, 200);
                break;
        }
        const teamMapInfo = this.map.teams.filter(t => t.type == teamInfo.type)[0];
        for (const teamPlayerInfo of this.players.values()) {
            if (teamPlayerInfo.state == PlayerState.Offline) continue;
            if (teamPlayerInfo.team != teamInfo.type) continue;
            const islandArea = this.fixOrigin(teamMapInfo.islandArea);
            if (isDefensiveTrap && vectorWithinArea(teamPlayerInfo.player.location, islandArea)) {
                teamPlayerInfo.player.addEffect(MinecraftEffectTypes.Speed, 300, { amplifier: 1 });
                teamPlayerInfo.player.addEffect(MinecraftEffectTypes.JumpBoost, 300, { amplifier: 1 });
            }
            const strs = strings[getPlayerLang(teamPlayerInfo.player)];
            const {
                trapActivatedTitle,
                alarmTrapSubtitle,
                trapActivatedMessage
            } = strs;

            teamPlayerInfo.player.onScreenDisplay.setTitle(trapActivatedTitle, {
                subtitle: isAlarmTrap ? sprintf(alarmTrapSubtitle, TEAM_CONSTANTS[playerInfo.team].colorPrefix, player.name) : undefined,
                fadeInDuration: 10,
                stayDuration: 60,
                fadeOutDuration: 20
            });
            teamPlayerInfo.player.playSound("mob.wither.spawn");
            teamPlayerInfo.player.sendMessage(sprintf(trapActivatedMessage, strs[TRAP_CONSTANTS[trapType].name]));
        }
        player.playSound("mob.wither.spawn");
        const strs = strings[getPlayerLang(player)];
        player.sendMessage(sprintf(strs.activatingTrapWarning, strs[TRAP_CONSTANTS[trapType].name]));
    }
    /**
     * Adjust team generator based on its iron forge level
     */
    applyTeamIronForge(teamType: TeamType) {
        const teamInfo = this.teams.get(teamType)!;
        const teamGenInfo = this.generators.filter(g => g.belongToTeam && g.team == teamType)[0];
        const teamGenMapInfo = teamGenInfo.mapInfo;
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
                const { localName, colorPrefix } = TEAM_CONSTANTS[teamType];
                for (const { player, state } of this.players.values()) {
                    if (state == PlayerState.Offline) continue;
                    const strs = strings[getPlayerLang(player)];

                    player.sendMessage(sprintf(strs.teamEliminationMessage, colorPrefix, capitalize(strs[localName])));
                }
                const teamMapInfo = this.map.teams.find(t => t.type == teamType)!;
                const bedLocation = this.fixOrigin(teamMapInfo.bedLocation);
                this.dimension.fillBlocks(new mc.BlockVolume(bedLocation[0], bedLocation[1]), MinecraftBlockTypes.Air);
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
            for (const playerInfo of this.players.values()) {
                if (playerInfo.state == PlayerState.Offline) continue;
                const str = strings[getPlayerLang(playerInfo.player)];
                const { gameEndedMessage, victoryTitle } = str;
                playerInfo.player.sendMessage(sprintf(gameEndedMessage, t.colorPrefix, capitalize(str[t.localName])));
                if (playerInfo.team != aliveTeam) continue;

                playerInfo.player.onScreenDisplay.setTitle(victoryTitle, {
                    fadeInDuration: 0,
                    stayDuration: 100,
                    fadeOutDuration: 20
                });
            }
            for (const playerInfo of this.players.values()) {
                for (const loc of playerInfo.placement) {
                    this.dimension.fillBlocks(new mc.BlockVolume(loc, loc), MinecraftBlockTypes.Air);
                }
            }
        }
    }
    private broadcast(stringName: keyof Strings, ...params: any[]) {
        for (const { player, state } of this.players.values()) {
            if (state == PlayerState.Offline) continue;
            const string = strings[getPlayerLang(player)][stringName];

            player.sendMessage(vsprintf(string, params));
        }
    }

    teamBroadcast(teamType: TeamType, stringName: keyof Strings, ...params: any[]) {
        for (const playerInfo of this.players.values()) {
            if (playerInfo.team != teamType) continue;
            if (playerInfo.state == PlayerState.Offline) continue;
            const string = strings[getPlayerLang(playerInfo.player)][stringName];

            playerInfo.player.sendMessage(vsprintf(string, params));
        }
    }

    private fixOrigin(vector: mc.Vector3): mc.Vector3;
    private fixOrigin(area: Area): Area;
    private fixOrigin(vectors: mc.Vector3[]): mc.Vector3[];
    private fixOrigin(vector: mc.Vector3 | mc.Vector3[]) {
        if (Array.isArray(vector)) {
            return vector.map(v => add(this.originPos, v));
        } else {
            return add(this.originPos, vector);
        }
    }

    private makePlayerSpectator(playerInfo: PlayerGameInformation) {
        const {
            spectateTitle,
            spectateSubtitle,
            teleportCommandNotification
        } = strings[getPlayerLang(playerInfo.player)];
        playerInfo.state = PlayerState.Spectating;
        playerInfo.actionbar.add(teleportCommandNotification);
        playerInfo.player.onScreenDisplay.setTitle(spectateTitle, {
            subtitle: spectateSubtitle,
            fadeInDuration: 0,
            stayDuration: 50,
            fadeOutDuration: 10
        });
        playerInfo.player.nameTag = `${TEAM_CONSTANTS[playerInfo.team].colorPrefix}${playerInfo.player.name}`;
    }

    private activateEvent(action: EventAction) {
        switch (action) {
            case EventAction.disableBedProtection:
                this.bedProtected = false;
                this.broadcast("bedProtectionDisabledMessage");
                break;
        }
    }

    tickEvent() {
        if (this.state != GameState.started) return;

        const gameLastTicks = mc.system.currentTick - this.startTime;
        if (this.events.length != 0) {
            const resultEvents = [];
            for (const event of this.events) {
                if (event.activateTime < gameLastTicks) continue;
                if (event.activateTime == gameLastTicks) {
                    this.activateEvent(event.action);
                } else resultEvents.push(event);
            }
            this.events = resultEvents;
        }
        for (const playerInfo of this.players.values()) {
            const teamInfo = this.teams.get(playerInfo.team)!;
            if (playerInfo.state == PlayerState.Offline) {
                const player = getPlayerByName(playerInfo.name);
                if (!player) continue;
                // the player comes online
                playerInfo.player = player;
                player.setGameMode(mc.GameMode.spectator);
                player.teleport(playerInfo.deathLocation, { rotation: playerInfo.deathRotaion });
                playerInfo.deathTime = mc.system.currentTick;

                if (teamInfo.state == TeamState.BedAlive) {
                    playerInfo.state = PlayerState.Respawning;
                } else {
                    this.makePlayerSpectator(playerInfo); //TODO
                }
                this.broadcast("reconnectionMessage", TEAM_CONSTANTS[playerInfo.team].colorPrefix, playerInfo.name);
            }
            const player = playerInfo.player;
            if (!player.isValid()) { // the player comes offline
                this.onPlayerDieOrOffline(playerInfo, PlayerDieCause.disconnected, playerInfo.lastHurtBy);
                this.broadcast("disconnectedMessage", TEAM_CONSTANTS[playerInfo.team].colorPrefix, playerInfo.name);
                continue;
            }
            const strs = strings[getPlayerLang(playerInfo.player)];
            const {
                deathTitle,
                deathSubtitle,
                respawnTitle,
                respawnMessage,
                trackerTrackingNotification,
                teamInformationNotification,
                killCountNotification,
                finalKillCountNotification,
                bedDestroyedCountNotification
            } = strs;
            player.runCommandAsync("recipe take @s *");
            this.setupSpawnPoint(player);

            if (player.dimension != this.dimension) {
                player.setGameMode(mc.GameMode.spectator);
                this.onPlayerDieOrOffline(playerInfo, PlayerDieCause.killed, playerInfo.lastHurtBy);
                const teamMapInfo = this.map.teams.find(t => t.type == playerInfo.team)!;
                playerInfo.player.teleport(this.fixOrigin(teamMapInfo.playerSpawn), {
                    dimension: this.dimension,
                    facingLocation: add(this.originPos, teamMapInfo.playerSpawn, teamMapInfo.playerSpawnViewDirection)
                });
                if (teamInfo.state == TeamState.BedAlive) {
                    playerInfo.state = PlayerState.Respawning;
                } else {
                    this.makePlayerSpectator(playerInfo);
                }
            }

            if (playerInfo.state == PlayerState.dead &&
                vecDistance(this.fixOrigin(this.map.fallbackRespawnPoint), player.location) <= 1) {
                player.setGameMode(mc.GameMode.spectator);
                player.teleport(playerInfo.deathLocation, { rotation: playerInfo.deathRotaion });
                if (teamInfo.state == TeamState.BedAlive) {
                    playerInfo.state = PlayerState.Respawning;
                    player.onScreenDisplay.setTitle(deathTitle, {
                        subtitle: sprintf(deathSubtitle, Math.ceil((RESPAWN_TIME - mc.system.currentTick + playerInfo.deathTime) / 20)),
                        fadeInDuration: 0,
                        stayDuration: 30,
                        fadeOutDuration: 20,
                    });
                } else {
                    this.makePlayerSpectator(playerInfo);
                }
            }
            if (playerInfo.state == PlayerState.Alive &&
                player.location.y < this.originPos.y + this.map.voidY) {
                // The player falls to the void
                player.setGameMode(mc.GameMode.spectator);
                this.onPlayerDieOrOffline(playerInfo, PlayerDieCause.void, playerInfo.lastHurtBy);
                if (teamInfo.state == TeamState.BedAlive) {
                    playerInfo.state = PlayerState.Respawning;
                } else {
                    this.makePlayerSpectator(playerInfo);
                }
                player.dimension.spawnEntity(MinecraftEntityTypes.LightningBolt, player.location);
            }

            if (playerInfo.state == PlayerState.Respawning) {
                const remainingTicks = RESPAWN_TIME + playerInfo.deathTime - mc.system.currentTick;
                if (remainingTicks <= 0) {
                    this.respawnPlayer(playerInfo);
                    player.onScreenDisplay.setTitle(respawnTitle, {
                        fadeInDuration: 0,
                        stayDuration: 10,
                        fadeOutDuration: 20,
                    });
                    player.sendMessage(respawnMessage);
                } else if (remainingTicks % 20 == 0) {
                    player.onScreenDisplay.setTitle(deathTitle, {
                        subtitle: sprintf(deathSubtitle, remainingTicks / 20),
                        fadeInDuration: 0,
                        stayDuration: 30,
                        fadeOutDuration: 20,
                    });
                }
            }
            if (playerInfo.state == PlayerState.Alive) {
                // player.onScreenDisplay.setActionBar(String(TEAM_CONSTANTS[playerInfo.teamAreaEntered!]?.name)); // DEBUG
                let trackerWorking = false;

                if (gameLastTicks % 20 == 0) {
                    this.resetNameTag(playerInfo);
                }
                const equipment = player.getComponent("equippable")!;
                for (const slotName of [mc.EquipmentSlot.Head, mc.EquipmentSlot.Chest, mc.EquipmentSlot.Legs, mc.EquipmentSlot.Feet, mc.EquipmentSlot.Mainhand]) {
                    const item = equipment.getEquipment(slotName);
                    if (!item) continue;
                    if (slotName == mc.EquipmentSlot.Mainhand) {
                        // clean items
                        if ([
                            MinecraftItemTypes.GlassBottle,
                            MinecraftItemTypes.CraftingTable,
                        ].includes(item.typeId as MinecraftItemTypes)) {
                            equipment.getEquipmentSlot(slotName).setItem();
                            continue;
                        }
                        if (playerInfo.trackingTarget && itemEqual(TRACKER_ITEM, item)) {
                            trackerWorking = true;
                            if (gameLastTicks % 5 == 0) {
                                const distanceVec = subtract(playerInfo.trackingTarget.player.location, player.location);
                                const viewDirection = player.getViewDirection();
                                const PI = Math.PI;
                                let angle = getAngle(distanceVec.x, distanceVec.z) - getAngle(viewDirection.x, viewDirection.z);
                                if (angle < 0) angle += PI * 2;
                                let directionString: string;
                                if (angle <= PI / 8 || angle >= PI * 15 / 8) {
                                    directionString = "↑";
                                } else if (angle <= PI * 3 / 8) {
                                    directionString = "↗";
                                } else if (angle <= PI * 5 / 8) {
                                    directionString = "→";
                                } else if (angle <= PI * 7 / 8) {
                                    directionString = "↘";
                                } else if (angle <= PI * 9 / 8) {
                                    directionString = "↓";
                                } else if (angle <= PI * 11 / 8) {
                                    directionString = "↙";
                                } else if (angle <= PI * 13 / 8) {
                                    directionString = "←";
                                } else {
                                    directionString = "↖";
                                }
                                if (playerInfo.trackerNotificationD == null) {
                                    playerInfo.trackerNotificationD = playerInfo.actionbar.add("");
                                }
                                playerInfo.actionbar.changeText(
                                    playerInfo.trackerNotificationD,
                                    sprintf(trackerTrackingNotification,
                                        TEAM_CONSTANTS[playerInfo.trackingTarget.team].colorPrefix,
                                        playerInfo.trackingTarget.name,
                                        magnitude(distanceVec).toFixed(0),
                                        directionString)
                                );
                            }
                        }
                    }
                    const com = item.getComponent("durability");
                    if (!com) continue;
                    if (com.damage > 20) {
                        com.damage = 0;
                        equipment.setEquipment(slotName, item);
                    }
                };
                if (playerInfo.bridgeEggCooldown > 0) --playerInfo.bridgeEggCooldown;
                if (playerInfo.fireBallCooldown > 0) --playerInfo.fireBallCooldown;
                if (playerInfo.trackerChangeTargetCooldown > 0) --playerInfo.trackerChangeTargetCooldown;
                if (playerInfo.armorToEnablingTicks > 0) {
                    --playerInfo.armorToEnablingTicks;
                } else { // enable the armor
                    if (playerInfo.armorDisabled) {
                        this.revealInvisiblePlayer(playerInfo);
                    }
                }
                if (playerInfo.invulnerableTime == 0) {
                    player.removeTag("invulnerable");
                } else --playerInfo.invulnerableTime;

                let playerWithinTeamArea = false;
                for (const iTeamInfo of this.teams.values()) {
                    const teamMapInfo = this.map.teams.find(t => t.type == iTeamInfo.type)!;
                    const islandArea = this.fixOrigin(teamMapInfo.islandArea);
                    if (!vectorWithinArea(player.location, islandArea)) continue;

                    playerWithinTeamArea = true;
                    if (playerInfo.team == iTeamInfo.type) {
                        playerInfo.teamAreaEntered = playerInfo.team;
                        if (iTeamInfo.healPoolEnabled) {
                            playerInfo.player.addEffect(MinecraftEffectTypes.Regeneration, 20, {
                                amplifier: 0,
                                showParticles: false
                            });
                        }
                        continue;
                    } else {
                        if (playerInfo.teamAreaEntered == iTeamInfo.type) continue;
                        playerInfo.teamAreaEntered = iTeamInfo.type;
                        if (iTeamInfo.state == TeamState.Dead) continue;

                        // the player activates a team's trap
                        this.activateTrap(playerInfo, iTeamInfo);
                    }

                }
                if (!playerWithinTeamArea) {
                    playerInfo.teamAreaEntered = undefined;
                }
                if (!trackerWorking && playerInfo.trackerNotificationD != null) {
                    playerInfo.actionbar.remove(playerInfo.trackerNotificationD);
                    playerInfo.trackerNotificationD = undefined;
                }
            }
            if (gameLastTicks % 80 == 0) {
                // totem of undying may flush the effect
                playerInfo.player.addEffect(MinecraftEffectTypes.Saturation, 1000000, {
                    amplifier: 100,
                    showParticles: false
                });
                const t = TEAM_CONSTANTS[playerInfo.team];
                let result = sprintf(teamInformationNotification, t.colorPrefix, capitalize(strs[t.localName])) + " ";
                switch (gameLastTicks % 240) {
                    case 0:
                        result += sprintf(killCountNotification, playerInfo.killCount);
                        playerInfo.actionbar.changeText(playerInfo.basicNotificationD, result);
                        break;
                    case 80:
                        result += sprintf(finalKillCountNotification, playerInfo.finalKillCount);
                        playerInfo.actionbar.changeText(playerInfo.basicNotificationD, result);
                        break;
                    case 160:
                        result += sprintf(bedDestroyedCountNotification, playerInfo.bedDestroyedCount);
                        playerInfo.actionbar.changeText(playerInfo.basicNotificationD, result);
                        break;
                }
            }
            playerInfo.actionbar.tick(player);

        }
        for (const gen of this.generators) {
            const spawnLocation = this.fixOrigin(gen.spawnLocation);
            let spawnEmerald = false;
            detectIfSpawnEmerald: if (gen.belongToTeam && gen.spawnExtraEmerald) {
                if (gen.extraEmeraldRemainingCooldown > 0) {
                    --gen.extraEmeraldRemainingCooldown;
                    break detectIfSpawnEmerald;
                }
                spawnEmerald = true;
                gen.extraEmeraldRemainingCooldown = gen.extraEmeraldInterval;
            }

            // update indicator
            if (gen.indicator && gen.remainingCooldown % 20 == 0) {
                if (!gen.indicator.isValid()) {
                    const loc = this.fixOrigin(gen.mapInfo.indicatorLocation!);
                    gen.indicator = this.dimension.spawnEntity("amazing:text_display", loc);
                    gen.indicator[CREATED_LOC_SYM] = loc;
                    gen.indicator.setDynamicProperty(BEDWARS_GAMEID_PROP, this.id);
                }
                gen.indicator.nameTag = `§eSpawns in §c${gen.remainingCooldown / 20} §eseconds`;
            }

            if (gen.remainingCooldown > 0) {
                --gen.remainingCooldown;
                continue;
            }

            gen.remainingCooldown = gen.interval;

            // Detect if it reaches capacity
            let { producingArea, capacity } = GENERATOR_CONSTANTS[gen.type];
            producingArea = producingArea.map(
                vec => add(vec, gen.location, this.originPos)) as Area;
            let existingTokens = 0;
            for (const entity of this.dimension.getEntities({ type: "minecraft:item" })) {
                if (!vectorWithinArea(entity.location, producingArea)) continue;
                const itemStack = entity.getComponent("minecraft:item")!.itemStack;
                switch (gen.type) {
                    case GeneratorType.IronGold:
                        if (itemEqual(itemStack, IRON_TOKEN_ITEM) || itemEqual(itemStack, GOLD_TOKEN_ITEM)) {
                            existingTokens += itemStack.amount;
                        }
                        continue;
                    case GeneratorType.Diamond:
                        if (itemEqual(itemStack, DIAMOND_TOKEN_ITEM)) {
                            existingTokens += itemStack.amount;
                        }
                        continue;
                    case GeneratorType.Emerald:
                        if (itemEqual(itemStack, EMERALD_TOKEN_ITEM)) {
                            existingTokens += itemStack.amount;
                        }
                        continue;
                }
            }
            if (existingTokens >= capacity) continue;

            ++gen.tokensGeneratedCount;

            // Generate token item
            const items: mc.ItemStack[] = [];
            switch (gen.type) {
                case GeneratorType.IronGold:
                    if (gen.tokensGeneratedCount % 4 == 0) {
                        items.push(GOLD_TOKEN_ITEM);
                    }
                    items.push(IRON_TOKEN_ITEM);
                    break;
                case GeneratorType.Diamond:
                    items.push(DIAMOND_TOKEN_ITEM);
                    break;
                case GeneratorType.Emerald:
                    items.push(EMERALD_TOKEN_ITEM);
                    break;
            }
            if (spawnEmerald) items.push(EMERALD_TOKEN_ITEM);
            const receivers: PlayerGameInformation[] = [];
            for (const playerInfo of this.players.values()) {
                if (playerInfo.state != PlayerState.Alive) continue;
                if (vectorWithinArea(playerInfo.player.location, producingArea)) receivers.push(playerInfo);
            }
            if (receivers.length == 0) {
                gen.recevierCollects.clear();
                for (const item of items) {
                    const itemEntity = this.dimension.spawnItem(item, spawnLocation);
                    if (gen.type != GeneratorType.IronGold) {
                        const v = itemEntity.getVelocity();
                        v.x = -v.x;
                        v.y = 0;
                        v.z = -v.z;
                        itemEntity.applyImpulse(v);
                    }
                }
            } else {
                // synchornize receivers
                for (const receiverName of gen.recevierCollects.keys()) {
                    const index = receivers.findIndex(({ name }) => name == receiverName);
                    if (index == -1) {
                        gen.recevierCollects.delete(receiverName);
                    } else {
                        receivers.splice(index, 1);
                    }
                }
                for (const receiver of receivers) {
                    gen.recevierCollects.set(receiver.name, true);
                }

                // distribute resources
                outer: for (const item of items) {
                    for (const [name, collect] of gen.recevierCollects.entries()) {
                        if (collect) {
                            const player = getPlayerByName(name)!;
                            this.dimension.playSound("random.pop", player.location);
                            givePlayerItems(player, item);
                            gen.recevierCollects.set(name, false);
                            continue outer;
                        }
                    }

                    // nobody has been given the item, clears the state
                    let first = true;
                    for (const name of gen.recevierCollects.keys()) {
                        if (first) {
                            first = false;
                            const player = getPlayerByName(name)!;
                            this.dimension.playSound("random.pop", player.location);
                            givePlayerItems(player, item);
                        } else {
                            gen.recevierCollects.set(name, true);
                        }
                    }
                }
            }
        }

        // Ensure text_displays and villagers are in the right position
        for (const textDisplay of this.dimension.getEntities({ type: "amazing:text_display" })) {
            if (textDisplay[CREATED_LOC_SYM] && vecDistance(textDisplay.location, textDisplay[CREATED_LOC_SYM]) >= 0.01) {
                textDisplay.teleport(textDisplay[CREATED_LOC_SYM]);
            }
        }
        for (const villager of this.dimension.getEntities({ type: "minecraft:villager_v2" })) {
            if (villager[CREATED_LOC_SYM] && vecDistance(villager.location, villager[CREATED_LOC_SYM]) >= 0.01) {
                villager.teleport(villager[CREATED_LOC_SYM]);
            }
        }

        if (gameLastTicks % 20 == 0) {
            this.updateScoreboard();
        }
        for (const eggEntity of this.dimension.getEntities({ type: "minecraft:egg" })) {
            const ownerInfo = eggEntity[OWNER_SYM];
            if (!ownerInfo) continue;
            if (!vectorWithinArea(eggEntity.location, this.fixOrigin(this.map.playableArea))) {
                eggEntity.kill();
                continue;
            }
            const baseLocation = floor(eggEntity.location);
            baseLocation.y -= 2;
            [
                { x: 0, y: 0, z: 0 },
                { x: -1, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 },
                { x: 0, y: 0, z: -1 },
                { x: 0, y: 0, z: 1 },
            ].forEach(_pos => {
                const location = add(baseLocation, _pos);
                const existingBlock = this.dimension.getBlock(location);
                if (this.checkBlockLocation(location).placeable &&
                    existingBlock && existingBlock.type.id == MinecraftBlockTypes.Air) {
                    this.dimension.fillBlocks(new mc.BlockVolume(location, location), TEAM_CONSTANTS[ownerInfo.team].woolName);
                    ownerInfo.placement.push(location);
                }
            });

        }
        for (const fireBall of this.dimension.getEntities({
            type: "minecraft:fireball"
        })) {
            const id = fireBall.getDynamicProperty(BEDWARS_GAMEID_PROP);
            if (!id) continue;
            if (id != this.id) {
                fireBall.kill();
                continue;
            }
            if (!vectorWithinArea(fireBall.location, this.fixOrigin(this.map.playableArea))) {
                fireBall.kill();
            }
        }
        for (const windCharge of this.dimension.getEntities({
            type: "minecraft:wind_charge_projectile"
        })) {
            if (!vectorWithinArea(windCharge.location, this.fixOrigin(this.map.playableArea))) {
                windCharge.kill();
            }
        }
        if (gameLastTicks % WOLF_GUARDING_INTERVAL == 0) {
            for (const wolf of this.dimension.getEntities({ type: "minecraft:wolf" })) {
                if (!wolf[OWNER_SYM]) continue;
                const ownerInfo = wolf[OWNER_SYM];
                const sitting = wolf[SITTING_SYM]!;
                if (!sitting) continue;

                const launchLocation = Object.assign({}, wolf.location);
                launchLocation.y += 0.5;
                const targetInfo = smallest(Array.from(this.players.values()).filter(p => p.state == PlayerState.Alive && p.team != ownerInfo.team), (a, b) => {
                    return vecDistance(a.player.getHeadLocation(), launchLocation) - vecDistance(b.player.getHeadLocation(), launchLocation);
                });
                if (targetInfo && vecDistance(targetInfo.player.getHeadLocation(), launchLocation) <= WOLF_GUARDING_DISTANCE) {
                    const arrow = this.dimension.spawnEntity(MinecraftEntityTypes.Arrow, launchLocation);
                    const projectile = arrow.getComponent("projectile")!;
                    projectile.owner = wolf;
                    arrow.addTag(`team${ownerInfo.team}`);
                    arrow[OWNER_SYM] = ownerInfo;
                    projectile.shoot(scale(normalize(subtract(targetInfo.player.getHeadLocation(), launchLocation)), 1.5));
                }
            }
        }
        for (const arrow of this.dimension.getEntities({ type: "minecraft:arrow" })) {
            if (arrow.isOnGround) {
                for (const rider of arrow.getComponent("rideable")!.getRiders()) {
                    let { x, y, z } = arrow.location;
                    ++y;
                    rider.teleport({ x, y, z });
                }
                arrow.kill();
            }
        }

        // Simulated players AI
        const teamIslandEnemies: Map<TeamType, PlayerGameInformation[]> = new Map();
        for (const playerInfo of this.players.values()) {
            if (playerInfo.state != PlayerState.Alive) continue;

            const teamAreaEntered = playerInfo.teamAreaEntered;
            if (teamAreaEntered != undefined && teamAreaEntered != playerInfo.team) {
                const players = teamIslandEnemies.get(teamAreaEntered);
                if (players) {
                    players.push(playerInfo);
                } else {
                    teamIslandEnemies.set(teamAreaEntered, [playerInfo]);
                }
            }
        }
        for (const fakePlayerInfo of this.players.values()) {
            if (fakePlayerInfo.state == PlayerState.Offline) continue;
            if (!(fakePlayerInfo.player instanceof SimulatedPlayer)) continue;
            const fakePlayer = fakePlayerInfo.player;
            const victims = teamIslandEnemies.get(fakePlayerInfo.team)?.sort((a, b) =>
                vecDistance(a.player.location, fakePlayer.location) - vecDistance(b.player.location, fakePlayer.location)
            );
            let updateTarget = false;
            if (!fakePlayer.attackTarget ||
                (vecDistance(fakePlayer.location, fakePlayer.attackTarget.player.location) >= 30 ||
                    fakePlayer.attackTarget.state != PlayerState.Alive)) {
                updateTarget = true;
            }
            if (!victims || victims.length == 0) {
                if (updateTarget) {
                    fakePlayer.attackTarget = undefined;
                    fakePlayer.previousOnGround = fakePlayer.isOnGround;
                    continue;
                }
            } else {
                if (updateTarget || (fakePlayer && vecDistance(fakePlayer.location, victims[0].player.location) < 3)) {
                    fakePlayer.attackTarget = victims[0];
                }
            }

            if (!fakePlayer.attackTarget) continue;
            if (!fakePlayer.previousOnGround && fakePlayer.isOnGround || gameLastTicks % randomInt(7, 10) == 0) {
                fakePlayer.navigateToEntity(fakePlayer.attackTarget.player as any);
            }
            if (vecDistance(fakePlayer.location, fakePlayer.attackTarget.player.location) < 2.95) {
                if (gameLastTicks % randomInt(2, 3) == 0) {
                    fakePlayer.stopMoving();
                    const location = Object.assign({}, fakePlayer.attackTarget.player.getHeadLocation());
                    fakePlayer.lookAtLocation(test.relativeLocation(location as any));
                    let attack = true;
                    // TODO
                    // const entityDistance = mc.Player.prototype.getEntitiesFromViewDirection()[0]?.distance;
                    // const blockRayCastHit = mc.Player.prototype.getBlockFromViewDirection({
                    //     includeLiquidBlocks: false,
                    //     includePassableBlocks: false
                    // });
                    // if (entityDistance != null && blockRayCastHit) {
                    //     const blockDistance = vecDistance(fakePlayer.getHeadLocation(), add(blockRayCastHit.block.location, blockRayCastHit.faceLocation));
                    //     if (blockDistance < entityDistance) attack = false;
                    // }
                    if (attack) fakePlayer.attack();
                }
            }
            fakePlayer.previousOnGround = fakePlayer.isOnGround;
        }
    }

    /**
     * This method defines actions to be performed right after the player dies or come offline
     * , and does not include all actions to get the player back into the game
     */
    private onPlayerDieOrOffline(victimInfo: PlayerGameInformation, cause: PlayerDieCause, killerInfo?: PlayerGameInformation) {
        victimInfo.deathTime = mc.system.currentTick;
        ++victimInfo.deathCount;
        victimInfo.lastHurtBy = undefined;
        victimInfo.teamAreaEntered = undefined;
        if (cause == PlayerDieCause.disconnected) {
            const teamInfo = this.map.teams.find(ele => ele.type === victimInfo.team)!;
            victimInfo.deathLocation = this.fixOrigin(teamInfo.playerSpawn);
            victimInfo.state = PlayerState.Offline;
        } else {
            victimInfo.deathLocation = victimInfo.player.location;
            victimInfo.deathRotaion = victimInfo.player.getRotation();
            victimInfo.state = PlayerState.dead;
        }
        let killerStrings: Strings | null = null;
        if (killerInfo && killerInfo.state != PlayerState.Offline) {
            killerStrings = strings[getPlayerLang(killerInfo.player)];
        }

        let finalKill = false;
        if (killerInfo) {
            if (this.teams.get(victimInfo.team)!.state == TeamState.BedAlive) {
                ++killerInfo.killCount;
                if (killerStrings) {
                    killerInfo.actionbar.add(sprintf(
                        killerStrings.killNotification,
                        TEAM_CONSTANTS[victimInfo.team].colorPrefix,
                        victimInfo.name), 60);
                }
            } else { // FINAL KILL
                finalKill = true;
                ++killerInfo.finalKillCount;
                if (killerStrings) {
                    killerInfo.actionbar.add(sprintf(
                        killerStrings.finalKillNotification,
                        TEAM_CONSTANTS[victimInfo.team].colorPrefix,
                        victimInfo.name), 60);
                }
            }
        }
        const information = {
            killerColor: killerInfo && TEAM_CONSTANTS[killerInfo.team].colorPrefix,
            killer: killerInfo && killerInfo.name,
            victimColor: TEAM_CONSTANTS[victimInfo.team].colorPrefix,
            victim: victimInfo.name
        };
        for (const playerInfo of this.players.values()) {
            if (playerInfo.state == PlayerState.Offline) continue;

            const strs = strings[getPlayerLang(playerInfo.player)];
            let deathMessage = "";
            if (cause == PlayerDieCause.killed || cause == PlayerDieCause.disconnected) {
                deathMessage += sprintf(killerInfo ? strs.killedByPlayerString : strs.killedString, information);
            } else if (cause == PlayerDieCause.shot) {
                deathMessage += sprintf(killerInfo ? strs.shotByPlayerString : strs.shotString, information);
            } else if (cause == PlayerDieCause.void) {
                deathMessage += sprintf(killerInfo ? strs.fallToVoidByPlayerString : strs.fallToVoidString, information);
            }
            if (finalKill) deathMessage += strs.finalKillString;
            playerInfo.player.sendMessage(deathMessage);
        }
        if (killerInfo && killerInfo.state != PlayerState.Offline) {
            killerInfo.player.playSound("random.orb");
            if (killerInfo.state == PlayerState.Alive && victimInfo.state != PlayerState.Offline) {
                const {
                    ironAmount,
                    goldAmount,
                    diamondAmount,
                    emeraldAmount
                } = calculateTokens(victimInfo.player.getComponent("inventory")!.container!);
                const items = [];
                for (const [amount, item, name, color] of [
                    [ironAmount, IRON_TOKEN_ITEM, killerStrings!.ironName, "§r"],
                    [goldAmount, GOLD_TOKEN_ITEM, killerStrings!.goldName, "§6"],
                    [diamondAmount, DIAMOND_TOKEN_ITEM, killerStrings!.diamondName, "§b"],
                    [emeraldAmount, EMERALD_TOKEN_ITEM, killerStrings!.emeraldName, "§2"]
                ] as const) {
                    if (amount == 0) continue;

                    const left = amount % 64;
                    const stackCount = (amount - left) / 64;
                    for (let i = 0; i < stackCount; ++i) {
                        items.push(makeItem(item, 64));
                    }
                    if (left != 0) items.push(makeItem(item, left));
                    killerInfo.player.sendMessage(`${color}+${amount}${name}`); // no space between
                }
                givePlayerItems(killerInfo.player, items);
            }
        }
        for (const playerInfo of this.players.values()) {
            if (playerInfo.trackingTarget == victimInfo) {
                playerInfo.trackingTarget = undefined;
            }
        }

        this.checkTeamPlayers();
    }

    beforeExplosion(event: mc.ExplosionBeforeEvent) {
        if (this.state != GameState.started) return;

        const stainedGlassTypes = Object.values(TEAM_CONSTANTS).map(teamInfo => teamInfo.glassName);

        const impactedBlocks = event.getImpactedBlocks().sort(vectorCompare);
        const unprotectedBlocks: mc.Block[] = [];
        const protectedBlocks: mc.Block[] = [];
        for (const block of impactedBlocks) {
            let isProtected = false;
            if (stainedGlassTypes.includes(block.typeId)) {
                isProtected = true;
            } else {
                let existInRecord = false;
                for (const { placement } of this.players.values()) {
                    if (placement.has(block.location)) {
                        existInRecord = true;
                        break;
                    }
                }
                if (!existInRecord) isProtected = true;
            }
            if (isProtected) {
                protectedBlocks.push(block);
            } else {
                unprotectedBlocks.push(block);
            }
        }
        let explosionLocation: mc.Vector3 | undefined = undefined;
        if (event.source) {
            if (event.source.typeId == "minecraft:tnt") {
                explosionLocation = Object.assign({}, event.source.location);
                explosionLocation.y += 0.5;
            } else explosionLocation = event.source.location;
        }
        for (let index = unprotectedBlocks.length - 1; index >= 0; --index) {
            const block = unprotectedBlocks[index];
            if (explosionLocation) {
                let protect = false;
                for (const raycastLoc of raycastHits(explosionLocation, subtract(block.center(), explosionLocation))) {
                    if (equals(raycastLoc, block.location)) break;
                    if (quickFind(protectedBlocks, raycastLoc, vectorCompare)) {
                        protect = true;
                        //mc.system.run(() => this.dimension.fillBlocks(raycastLoc, raycastLoc, MinecraftBlockTypes.Glowstone)); // DEBUG
                        break;
                    }
                }
                if (protect) {
                    unprotectedBlocks.splice(index, 1);
                    continue;
                }
            }
            this.removeBlockFromRecord(unprotectedBlocks[index]);
        }
        event.setImpactedBlocks(unprotectedBlocks);
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
            if (killerInfo && killerInfo.team == victimInfo.team) {
                killerInfo = undefined;
            }
        } else if (victimInfo.lastHurtBy) {
            killerInfo = victimInfo.lastHurtBy;
        }
        this.onPlayerDieOrOffline(victimInfo, PlayerDieCause.killed, killerInfo);
    }

    private resetNameTag(playerInfo: PlayerGameInformation) {
        const health = playerInfo.player.getComponent("health")!.currentValue.toFixed(0);
        playerInfo.player.nameTag = `${TEAM_CONSTANTS[playerInfo.team].colorPrefix}${playerInfo.name}\n§c${health}`;
    }

    afterEntityHurt(event: mc.EntityHurtAfterEvent) {
        if (this.state != GameState.started) return;

        const victim = event.hurtEntity;
        if (!(victim instanceof mc.Player)) return;
        const victimInfo = this.players.get(victim.name);
        if (!victimInfo) return;
        this.resetNameTag(victimInfo);

        const hurter = event.damageSource.damagingEntity;
        if (!hurter) return;
        if (!(hurter instanceof mc.Player)) {
            const ownerInfo = hurter[OWNER_SYM];
            if (ownerInfo) {
                if (ownerInfo.team != victimInfo.team) {
                    victimInfo.lastHurtBy = ownerInfo;
                }
            } else {
                victimInfo.lastHurtBy = undefined;
            }
            return;
        }
        const hurterInfo = this.players.get(hurter.name);
        if (!hurterInfo) return;

        victimInfo.lastHurtBy = hurterInfo;
        if (hurterInfo.armorDisabled) {
            this.revealInvisiblePlayer(hurterInfo);
        }
        if (victimInfo.armorDisabled) {
            this.revealInvisiblePlayer(victimInfo);
        }

        const attackingItem = hurter.getComponent("equippable")!.getEquipment(mc.EquipmentSlot.Mainhand);
        if (attackingItem && itemEqual(KNOCKBACK_STICK_ITEM, attackingItem)) {
            const x = victim.location.x - hurter.location.x;
            const z = victim.location.z - hurter.location.z;
            victim.applyKnockback(x, z, 1.5, 0.5);
        }
        if (victim instanceof SimulatedPlayer) {
            if (!victim.attackTarget && victimInfo.team != hurterInfo.team) {
                victim.attackTarget = hurterInfo;
            }
        }
    }
    afterEntityHitEntity(event: mc.EntityHitEntityAfterEvent) {
    }
    afterProjectileHitEntity(event: mc.ProjectileHitEntityAfterEvent) {
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
        if (event.block.typeId == MinecraftBlockTypes.BrewingStand ||
            event.block.typeId == MinecraftBlockTypes.Dispenser ||
            event.block.typeId == MinecraftBlockTypes.Dropper ||
            event.block.typeId == MinecraftBlockTypes.Hopper ||
            event.block.typeId == MinecraftBlockTypes.FlowerPot) {
            event.cancel = true;
            return;
        }
        if (event.block.typeId == MinecraftBlockTypes.Chest) {
            for (const team of this.map.teams) {
                if (equals(event.block.location, this.fixOrigin(team.teamChestLocation))) {
                    if (playerInfo.team != team.type && this.teams.get(team.type)!.state != TeamState.Dead) {
                        playerInfo.player.sendMessage(strings[getPlayerLang(playerInfo.player)].openEnemyChestMessage);
                        event.cancel = true;
                    }
                    break;
                }
            }
            return;
        }
    }
    async beforePlayerInteractWithEntity(event: mc.PlayerInteractWithEntityBeforeEvent) {
        if (this.state != GameState.started) return;

        const playerInfo = this.players.get(event.player.name);
        if (!playerInfo) return;
        if (event.target.typeId == "minecraft:villager_v2" &&
            event.target.getDynamicProperty(BEDWARS_GAMEID_PROP) == this.id) { // open the shop for player
            const shopType = event.target[SHOP_TYPE_SYM]!;
            await sleep(0);
            if (shopType == "item") {
                openItemShop(playerInfo, this.teams.get(playerInfo.team)!, this);
            } else if (shopType == "team") {
                openTeamShop(playerInfo, this.teams.get(playerInfo.team)!, this);
            }
        }
    }
    private removeBlockFromRecord(block: mc.Block) {
        let existsInRecord = false;
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

            if (block.isSolid) {
                for (const [attachingBlock, facingDir] of [
                    [block.north(), 2],
                    [block.south(), 3],
                    [block.west(), 4],
                    [block.east(), 5]
                ] as const) {
                    if (!attachingBlock) continue;

                    if (attachingBlock.typeId == MinecraftBlockTypes.Ladder && attachingBlock.permutation.getState("facing_direction") == facingDir) {
                        this.removeBlockFromRecord(attachingBlock);
                    }
                }
            }

            // One record may appear in different instances
            existsInRecord = true;
        }
        return existsInRecord;
    }
    async beforePlayerBreakBlock(event: mc.PlayerBreakBlockBeforeEvent) {
        if (this.state != GameState.started) return;
        if (event.dimension != this.dimension) return;
        const destroyerInfo = this.players.get(event.player.name);
        TeamBedDestroyed: if (event.block.typeId == "minecraft:bed") {
            const destroyedTeam = this.map.teams.find(team =>
                team.bedLocation.findIndex(pos =>
                    equals(this.fixOrigin(pos), event.block.location)) != -1);
            if (!destroyedTeam) {
                break TeamBedDestroyed;
            }
            const destroyedTeamInfo = this.teams.get(destroyedTeam.type)!;
            if (destroyedTeamInfo.state != TeamState.BedAlive) break TeamBedDestroyed;
            event.cancel = true;

            if (!destroyerInfo) return;
            if (destroyedTeam.type == destroyerInfo.team) return;
            if (this.bedProtected) {
                destroyerInfo.player.sendMessage(strings[getPlayerLang(destroyerInfo.player)].bedAreProtectedMessage);
                return;
            }
            destroyedTeamInfo.state = TeamState.BedDestoryed;
            ++destroyerInfo.bedDestroyedCount;
            await sleep(0);

            /* Clear the bed */
            const bedLocations = this.fixOrigin(destroyedTeam.bedLocation);
            event.dimension.fillBlocks(new mc.BlockVolume(...bedLocations), "minecraft:air");

            const t = TEAM_CONSTANTS[destroyedTeam.type];

            const loc = add(bedLocations[0], { x: 0.5, y: 0.2, z: 0.5 });
            const textDisplay = this.dimension.spawnEntity("amazing:text_display", loc);
            textDisplay.setDynamicProperty(BEDWARS_GAMEID_PROP, this.id);
            textDisplay[CREATED_LOC_SYM] = loc;
            textDisplay.nameTag = `${t.colorPrefix}${capitalize(t.name)} Bed §7was destroyed by \n${TEAM_CONSTANTS[destroyerInfo.team].colorPrefix}${destroyerInfo.name} §7at §e${timeToString(analyzeTime((mc.system.currentTick - this.startTime) * 50))}`;

            if (destroyerInfo.armorDisabled) {
                this.revealInvisiblePlayer(destroyerInfo);
            }

            /* Inform all the players */
            for (const playerInfo of this.players.values()) {
                if (playerInfo.state == PlayerState.Offline) continue;
                const str = strings[getPlayerLang(playerInfo.player)];
                const {
                    bedDestroyedSubtitle,
                    bedDestroyedTitle,
                    teamBedDestroyedMessage
                } = str;

                if (playerInfo.team == destroyedTeam.type) {
                    playerInfo.player.playSound("mob.wither.death");
                    playerInfo.player.onScreenDisplay.setTitle(bedDestroyedTitle, {
                        subtitle: bedDestroyedSubtitle,
                        fadeInDuration: 5,
                        stayDuration: 40,
                        fadeOutDuration: 10
                    });
                } else {
                    playerInfo.player.playSound("mob.enderdragon.growl", { volume: 0.1 });
                }
                playerInfo.player.sendMessage(sprintf(teamBedDestroyedMessage,
                    t.colorPrefix, capitalize(str[t.localName]),
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

            destroyerInfo.player.sendMessage(strings[getPlayerLang(destroyerInfo.player)].breakingBlockInvalidMessage);
        }
    }

    private checkBlockLocation(location: mc.Vector3) {
        const result = {
            placeable: false,
            outOfMap: false
        };

        if (location.y < this.map.voidY + this.originPos.y) {
            result.outOfMap = true;
            return result;
        };
        for (const gen of this.generators) {
            const protectedArea = GENERATOR_CONSTANTS[gen.type].protectedArea.map(
                vec => add(vec, gen.location, this.originPos)) as Area;
            if (vectorWithinArea(location, protectedArea)) {
                return result;
            }
        }
        for (const teamMapInfo of this.map.teams) {
            if (!teamMapInfo.protectedArea) continue;
            if (vectorWithinArea(location, this.fixOrigin(teamMapInfo.protectedArea))) {
                return result;
            }
        }
        // disallow the player to place block outside playable area
        if (!vectorWithinArea(location, this.fixOrigin(this.map.playableArea))) {
            result.outOfMap = true;
            return result;
        }
        const block = this.dimension.getBlock(location);
        if (!block) return result;
        if (block.typeId != MinecraftBlockTypes.Air &&
            block.typeId != MinecraftBlockTypes.Fire &&
            Array.from(this.players.values()).every(({ placement }) => !placement.has(location))) return result;
        // disallow the player to place block near cactus
        for (const offset of [
            { x: 1, y: 0, z: 0 },
            { x: -1, y: 0, z: 0 },
            { x: 0, y: 0, z: 1 },
            { x: 0, y: 0, z: -1 }
        ]) {
            const block = this.dimension.getBlock(add(location, offset));
            if (!block) continue;
            // Maybe I need to look up the record
            if (block.typeId == MinecraftBlockTypes.Cactus) {
                return result;
            }
        }
        result.placeable = true;
        return result;
    }

    async beforePlayerPlaceBlock(event: mc.PlayerPlaceBlockBeforeEvent) {
        if (this.state != GameState.started) return;

        const playerInfo = this.players.get(event.player.name);
        if (!playerInfo) return;

        if (event.permutationBeingPlaced.type.id == MinecraftBlockTypes.Tnt) {
            event.cancel = true;
            await sleep(0);
            playerInfo.player.dimension.spawnEntity(MinecraftEntityTypes.Tnt, event.block.bottomCenter())[OWNER_SYM] = playerInfo;
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
        // disallow the player to place block at some cases
        const checkResult = this.checkBlockLocation(event.block.location);
        if (!checkResult.placeable) {
            event.cancel = true;
            const strs = strings[getPlayerLang(playerInfo.player)];
            if (checkResult.outOfMap) {
                playerInfo.player.sendMessage(strs.placeBlockOutOfMapMessage);
            } else {
                playerInfo.player.sendMessage(strs.placeBlockIllagelMessage);
            }
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

        if (itemEqual(BRIDGE_EGG_ITEM, event.itemStack)) {
            if (playerInfo.bridgeEggCooldown > 0) {
                event.cancel = true;
                return;
            }
            await sleep(0);

            const eggEntity = this.dimension.getEntities({
                type: "minecraft:egg"
            }).filter(entity => entity.getComponent("projectile")?.owner == playerInfo.player && entity[OWNER_SYM] == undefined)[0];
            if (!eggEntity) return;

            eggEntity[OWNER_SYM] = playerInfo;
            playerInfo.bridgeEggCooldown = BRIDGE_EGG_COOLDOWN;
        } else if (itemEqual(FIRE_BALL_ITEM, event.itemStack)) {
            event.cancel = true;
            if (playerInfo.fireBallCooldown > 0) {
                return;
            }
            await sleep(0);

            const launchVelocity = normalize(playerInfo.player.getViewDirection());
            const location = add(playerInfo.player.getHeadLocation(), scale(launchVelocity, 0.5));
            const fireball = this.dimension.spawnEntity(MinecraftEntityTypes.Fireball, location);
            const projectile = fireball.getComponent("projectile")!;
            fireball.addTag(`team${playerInfo.team}`);
            projectile.owner = playerInfo.player;
            fireball[OWNER_SYM] = playerInfo;
            projectile.shoot(launchVelocity);
            fireball.setDynamicProperty(BEDWARS_GAMEID_PROP, this.id);
            consumeMainHandItem(playerInfo.player);
            playerInfo.fireBallCooldown = FIRE_BALL_COOLDOWN;
        } else if (itemEqual(SETTINGS_ITEM, event.itemStack)) {
            event.cancel = true;
            await sleep(0);

            this.openSettingsMenu(playerInfo.player);
        } else if (itemEqual(TRACKER_ITEM, event.itemStack)) {
            event.cancel = true;

            if (playerInfo.trackerChangeTargetCooldown > 0) return;

            let newTarget: PlayerGameInformation | null = null;
            let minDistance = Infinity;
            for (const potentialInfo of this.players.values()) {
                if (playerInfo.team == potentialInfo.team) continue;
                if (potentialInfo.state != PlayerState.Alive) continue;

                const distance = vecDistance(potentialInfo.player.location, playerInfo.player.location);
                if (distance < minDistance) {
                    minDistance = distance;
                    newTarget = potentialInfo;
                }
            }
            const strs = strings[getPlayerLang(playerInfo.player)];
            let soundEffect: string;
            if (newTarget) {
                soundEffect = "random.orb";
                playerInfo.player.sendMessage(sprintf(strs.trackerChangeTargetMessage, TEAM_CONSTANTS[newTarget.team].colorPrefix, newTarget.name));
                playerInfo.trackingTarget = newTarget;
            } else {
                soundEffect = "note.bass";
                playerInfo.player.sendMessage(strs.trackerFailedToFindTargetMessage);
            }
            playerInfo.trackerChangeTargetCooldown = TRACKER_CHANGE_TARGET_COOLDOWN;
            await sleep(0);
            playerInfo.player.playSound(soundEffect);
        }
    }
    private async openSettingsMenu(player: mc.Player) {
        const menu = new ModalFormData();

        const pervLang = getPlayerLang(player);
        menu.title(strings[pervLang].bedwarsSettingTitle);
        menu.dropdown("Languages", ["English", "简体中文"], pervLang);
        const response = await menu.show(player);

        if (response.canceled) return;
        const chosenLang = response.formValues![0] as Lang;
        if (chosenLang != pervLang) {
            setPlayerLang(player, chosenLang);
            player.playSound("note.banjo");
            player.sendMessage(strings[chosenLang].languageChangedMessage);
        }
    }
    async beforeItemUseOn(event: mc.ItemUseOnBeforeEvent) {
        if (this.state != GameState.started) return;
        if (!(event.source instanceof mc.Player)) return;
        const playerInfo = this.players.get(event.source.name);
        if (!playerInfo) return;

        if (event.itemStack.typeId == MinecraftItemTypes.WolfSpawnEgg) {
            await sleep(0);

            const wolfLocation = add(event.block.location, event.faceLocation);
            const wolf = smallest(this.dimension.getEntities({ type: "minecraft:wolf" }).filter(e => !e[OWNER_SYM]), ({ location: a }, { location: b }) => {
                return vecDistance(a, wolfLocation) - vecDistance(b, wolfLocation);
            });
            if (!wolf) return;
            wolf.getComponent("tameable")!.tame(playerInfo.player);

            wolf.triggerEvent("Amazing:wolf_spawned");
            wolf.triggerEvent("minecraft:ageable_grow_up");
            wolf.addTag(`team${playerInfo.team}`);
            wolf.nameTag = `${TEAM_CONSTANTS[playerInfo.team].colorPrefix + playerInfo.name}§7's Wolf`;
            wolf[OWNER_SYM] = playerInfo;
            wolf[SITTING_SYM] = false;
            await sleep(0);
            wolf.getComponent("color")!.value = TEAM_CONSTANTS[playerInfo.team].color;
        } else if (itemEqual(TRACKER_ITEM, event.itemStack)) {
            event.cancel = true;
        }
    }
    async afterItemCompleteUse(event: mc.ItemCompleteUseAfterEvent) {
        if (this.state != GameState.started) return;

        if (!(event.source instanceof mc.Player)) return;
        const playerInfo = this.players.get(event.source.name);
        if (!playerInfo) return;

        if (isInvisiblilityPotionItem(event.itemStack)) {
            playerInfo.player.addEffect(MinecraftEffectTypes.Invisibility, INVISIBLILITY_DURATION, {
                showParticles: false
            });
            playerInfo.player.addEffect(MinecraftEffectTypes.Resistance, INVISIBLILITY_DURATION, {
                showParticles: false,
                amplifier: 3
            });
            playerInfo.armorDisabled = true;
            playerInfo.armorToEnablingTicks = INVISIBLILITY_DURATION;
            const equip = playerInfo.player.getComponent('equippable')!;
            playerInfo.restoreTotemAfterRevealed = equip.getEquipment(mc.EquipmentSlot.Offhand)?.typeId == MinecraftItemTypes.TotemOfUndying;
            [mc.EquipmentSlot.Head, mc.EquipmentSlot.Chest, mc.EquipmentSlot.Legs, mc.EquipmentSlot.Feet, mc.EquipmentSlot.Offhand].forEach(slotName => {
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

    async afterItemReleaseUse(event: mc.ItemReleaseUseAfterEvent) {
        if (this.state != GameState.started) return;

        if (!(event.source instanceof mc.Player)) return;
        const playerInfo = this.players.get(event.source.name);
        if (!playerInfo) return;
        if (event.itemStack?.typeId == MinecraftItemTypes.Bow) {
            await sleep(0);
            // find the array shot
            const arrowEntity = smallest(this.dimension.getEntities({ type: "arrow" })
                .filter(e => e.getComponent("projectile")!.owner == playerInfo.player && !e[OWNER_SYM]), (a, b) => {
                    return vecDistance(playerInfo.player.location, a.location) - vecDistance(playerInfo.player.location, b.location);
                });
            if (!arrowEntity) return;
            arrowEntity[OWNER_SYM] = playerInfo;
            arrowEntity.addTag(`team${playerInfo.team}`);
            // arrowEntity.getComponent("rideable")!.addRider(playerInfo.player);
        }
    }

    updateTeamPlayerBuffs(teamInfo: TeamGameInformation) {
        for (const playerInfo of this.players.values()) {
            if (playerInfo.state != PlayerState.Alive) continue;
            if (playerInfo.team != teamInfo.type) continue;
            for (const { slot } of containerSlotIterator(playerInfo.player.getComponent("inventory")!.container!)) {
                const item = slot.getItem();
                if (!item) continue;
                if (teamInfo.hasSharpness &&
                    itemEqual(playerInfo.swordLevel.item, item)) {
                    item.getComponent("enchantable")!.addEnchantment({
                        type: mc.EnchantmentTypes.get(MinecraftEnchantmentTypes.Sharpness)!,
                        level: SHARPNESS_ENCHANMENT_LEVEL
                    });
                    slot.setItem(item);
                }
            }
            if (playerInfo.armorLevel.level >= 1) {
                playerInfo.player.addEffect(MinecraftEffectTypes.Resistance, 1000000, {
                    amplifier: 0,
                    showParticles: false
                });
            }
            if (teamInfo.protectionLevel >= 1) {
                const equippable = playerInfo.player.getComponent("equippable")!;
                for (const slotName of [
                    mc.EquipmentSlot.Head,
                    mc.EquipmentSlot.Chest,
                    mc.EquipmentSlot.Legs,
                    mc.EquipmentSlot.Feet
                ]) {
                    const slot = equippable.getEquipmentSlot(slotName);
                    const item = slot.getItem();
                    if (!item) continue;
                    const enchantable = item.getComponent("enchantable")!;
                    const protection = mc.EnchantmentTypes.get(MinecraftEnchantmentTypes.Protection)!;
                    if (enchantable.getEnchantment(protection)?.level != teamInfo.protectionLevel) {
                        enchantable.addEnchantment({
                            type: protection,
                            level: teamInfo.protectionLevel
                        });
                        slot.setItem(item);
                    }
                }
            }
        }
    }

    afterScriptEventReceive(event: mc.ScriptEventCommandMessageAfterEvent) {
        if (game.state != GameState.started) return;

        if (event.id == "Amazing:Wolf") {
            const wolf = event.sourceEntity!;
            const ownerInfo = wolf[OWNER_SYM]!;
            const strs = strings[getPlayerLang(ownerInfo.player)];
            if (event.message == "wolf_sit") {
                ownerInfo.actionbar.add(strs.wolfStartGuardingNotification, 20);
                wolf[SITTING_SYM] = true;
            } else if (event.message == "wolf_stand") {
                ownerInfo.actionbar.add(strs.wolfStopGuardingNotification, 20);
                wolf[SITTING_SYM] = false;
            }
        }
    }

    afterWeatherChange(_: mc.WeatherChangeAfterEvent) {
        if (this.state != GameState.started) return;
        this.dimension.setWeather(mc.WeatherType.Clear);
    }

    private async openTeleportMenu(playerInfo: PlayerGameInformation) {
        const form = new ActionFormData();
        const players = Array.from(this.players.values())
            .filter(({ state }) => state == PlayerState.Alive)
            .sort(({ team: a }, { team: b }) => a == b ? 0 : a == playerInfo.team ? -1 : b == playerInfo.team ? 1 : a - b);
        const {
            noAvailablePlayerToTeleportMessage,
            teleportMenuTitle,
            teleportMenuBody,
            closeChatMenuMessage,
            teleportTargetDeadMessage
        } = strings[getPlayerLang(playerInfo.player)];

        if (players.length == 0) {
            playerInfo.player.sendMessage(noAvailablePlayerToTeleportMessage);
            return;
        }
        form.title(teleportMenuTitle);
        form.body(teleportMenuBody);
        for (const iPlayerInfo of players) {
            form.button(`${TEAM_CONSTANTS[iPlayerInfo.team].colorPrefix}${iPlayerInfo.name}`);
        }
        playerInfo.player.sendMessage(closeChatMenuMessage);
        let response: ActionFormResponse;
        while (true) {
            response = await form.show(playerInfo.player);
            if (response.cancelationReason != FormCancelationReason.UserBusy) break;
            await sleep(5);
        }
        if (response.canceled) return;
        const {
            player: selectedPlayer,
            state,
            team,
            deathLocation,
            deathRotaion
        } = players[response.selection!];
        if (state == PlayerState.Alive) {
            playerInfo.player.teleport(selectedPlayer.location, { rotation: selectedPlayer.getRotation() });
        } else {
            playerInfo.player.sendMessage(sprintf(teleportTargetDeadMessage, TEAM_CONSTANTS[team].colorPrefix + selectedPlayer.name));
            playerInfo.player.teleport(deathLocation, { rotation: deathRotaion });
        }
    }

    beforeChatSend(event: mc.ChatSendBeforeEvent) {
        if (this.state != GameState.started) return;
        const sender = event.sender;
        const senderInfo = this.players.get(sender.name);
        if (!senderInfo) return;

        const {
            unableToUseTeleportMenuMessage
        } = strings[getPlayerLang(sender)];

        event.cancel = true;
        if (event.message == "#tp") {
            if (senderInfo.state != PlayerState.Spectating) {
                sender.sendMessage(unableToUseTeleportMenuMessage);
                return;
            }
            mc.system.run(() => this.openTeleportMenu(senderInfo));
            return;
        } else if (event.message == "DESTROY BED") { //DEBUG
            const loc = this.map.teams.filter(t => t.type == senderInfo.team)[0].bedLocation[0];
            let destroyer: mc.Player | null = null;
            for (const playerInfo of this.players.values()) {
                if (playerInfo.team == senderInfo.team) continue;
                if (playerInfo.state == PlayerState.Offline) continue;

                destroyer = playerInfo.player;
                break;
            }
            if (destroyer) {
                this.beforePlayerBreakBlock({
                    block: this.dimension.getBlock(loc)!,
                    cancel: false,
                    dimension: this.dimension,
                    player: destroyer
                });
            }
        }
        let teamPlayerCount = 0;
        for (const playerInfo of this.players.values()) {
            if (playerInfo.team == senderInfo.team) ++teamPlayerCount;
        }
        let spectate = false;
        let globalChat = false;
        if (senderInfo.state == PlayerState.Spectating) {
            spectate = true;
        }
        let message = event.message;
        if (teamPlayerCount == 1) {
            globalChat = true;
        } else if (message.startsWith("!") || message.startsWith("！")) {
            globalChat = true;
            message = message.slice(1);
        }

        message = `<${TEAM_CONSTANTS[senderInfo.team].colorPrefix}${sender.name}§r> ${message}`;
        for (const playerInfo of this.players.values()) {
            if (!globalChat && playerInfo.team != senderInfo.team) continue;
            if (playerInfo.state == PlayerState.Offline) continue;

            const {
                teamChatPrefix,
                globalChatPrefix,
                spectatorChatPrefix
            } = strings[getPlayerLang(playerInfo.player)];
            playerInfo.player.sendMessage(`${spectate ? spectatorChatPrefix : ""}${globalChat ? globalChatPrefix : teamChatPrefix}${message}`);
        }
    }
};

class ActionbarManager {
    private instances: Map<number, {
        text: string;
        lifeTime?: number;
    }>;
    private flushCooldown: number;

    constructor() {
        this.instances = new Map();
        this.flushCooldown = 0;
    }

    private getInstance(descriptor: number) {
        const instance = this.instances.get(descriptor);
        if (!instance) {
            throw new Error(`Can't find the instance of descriptor "${descriptor}".`);
        }
        return instance;
    }

    add(text: string, lifeTime?: number) {
        let newd = 0;
        while (this.instances.get(newd)) {
            ++newd;
        }
        this.instances.set(newd, {
            text,
            lifeTime
        });
        this.flushCooldown = 0;
        return newd;
    }

    changeText(descriptor: number, text: string) {
        this.getInstance(descriptor).text = text;
        this.flushCooldown = 0;
    }

    remove(descriptor: number) {
        this.getInstance(descriptor).lifeTime = 0;
    }

    tick(player: mc.Player) {
        let flush = false;
        if (this.flushCooldown == 0) {
            flush = true;
        } else {
            --this.flushCooldown;
        }
        for (const [descriptor, instance] of this.instances) {
            if (instance.lifeTime != null) {
                if (instance.lifeTime == 0) {
                    this.instances.delete(descriptor);
                    flush = true;
                    continue;
                }
                --instance.lifeTime;
            }
        }

        if (!flush) return;
        let result = "";
        for (const instance of this.instances.values()) {
            if (result == "") {
                result = instance.text;
            } else {
                result += "\n" + instance.text;
            }
        }
        player.onScreenDisplay.setActionBar(result);
        this.flushCooldown = 20;
    }
}

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
            if (equals(loc, existedLoc)) {
                return;
            }
            ++index;
        }

        this.data[bucketIndex].push(loc);
    }
    has(loc: mc.Vector3) {
        const bucketIndex = this.hash(loc) % this.bucketSize;
        for (const existedLoc of this.data[bucketIndex]) {
            if (equals(loc, existedLoc)) {
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
            if (equals(loc, existedLoc)) {
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

const maps: [string, MapInformation, mc.Vector3][] = [
    ["Gardens", mapGardens, { x: 0, y: 0, z: 0 }],
    ["Steampunk", mapSteamPunk, { x: 0, y: 0, z: 0 }],
    ["Waterfall", mapWaterfall, { x: 0, y: 0, z: 0 }],
    ["Eastwood", mapEastwood, { x: 0, y: 0, z: 0 }],
    ["Invasion", mapInvasion, { x: 0, y: 0, z: 0 }],
    ["Jurassic", mapJurassic, { x: 0, y: 0, z: 0 }],
    ["Varyth(voidless)", mapVaryth, { x: 0, y: 0, z: 0 }]
];
let game: BedWarsGame;

mc.world.beforeEvents.chatSend.subscribe(async event => {
    if (game) {
        game.beforeChatSend(event);
    }
    let map: MapInformation;
    let originLocation: mc.Vector3;
    let minimalPlayer: number;
    let fillBlankTeams: boolean;
    let bedBreakableMinutes: number;
    let teams: TeamType[];
    if (event.message == "start") {
        if (!event.sender.isOp()) return;
        await sleep(0);

        const form = new ActionFormData();
        form.body("Choose the map you are in.");
        for (const [name] of maps) {
            form.button(name);
        }

        event.sender.sendMessage("Please close the chat menu to see the bedwars wizard.");
        let response: ActionFormResponse;
        while (true) {
            response = await form.show(event.sender);
            if (response.cancelationReason != FormCancelationReason.UserBusy) break;
            await sleep(5);
        }
        if (response.canceled) return;
        let title: string;
        [title, map, originLocation] = maps[response.selection!];
        teams = map.teams.map(team => team.type);

        const settingForm = new ModalFormData();
        settingForm.title(title);
        settingForm.textField("Minimal players of each team:", "Players count...", "1");
        settingForm.toggle("Fill blank teams with simulated players", true);
        settingForm.slider("Minutes until the bed is breakable", 0, 12, 1, 0);
        for (const teamType of teams) {
            const t = TEAM_CONSTANTS[teamType];
            settingForm.toggle(t.colorPrefix + capitalize(t.name), true);
        }
        const settingResponse = await settingForm.show(event.sender);
        if (settingResponse.canceled) return;

        minimalPlayer = Number(settingResponse.formValues![0]);
        if (minimalPlayer < 0 || !Number.isInteger(minimalPlayer)) {
            event.sender.sendMessage(`§c"${settingResponse.formValues![0]}" is not a valid number, or a valid player count.`);
            return;
        }
        fillBlankTeams = settingResponse.formValues![1] as boolean;
        bedBreakableMinutes = settingResponse.formValues![2] as number;
        teams = teams.filter((_, index) => settingResponse.formValues![index + 3]);
        if (teams.length <= 1) {
            event.sender.sendMessage("§cToo few teams are selected.");
            return;
        }
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
    shuffle(realPlayers);
    const fakePlayers = players.filter(p => p instanceof SimulatedPlayer);
    let teamPlayerCount: number[] = [];
    for (let i = 0; i < teams.length; ++i) teamPlayerCount.push(0);

    let teamIndex = randomInt(0, teams.length - 1);
    for (const p of [...realPlayers, ...fakePlayers]) {
        game.setPlayer(p, teams[teamIndex]);
        ++teamPlayerCount[teamIndex];
        teamIndex = switchTeam(teamIndex);
    }
    const maxPlayer = Math.max(minimalPlayer, ...teamPlayerCount);
    let spawnIndex = 0;
    for (teamIndex = 0; teamIndex < teams.length; ++teamIndex) {
        if (!fillBlankTeams && teamPlayerCount[teamIndex] == 0) continue;
        for (let i = 0; i < maxPlayer - teamPlayerCount[teamIndex]; ++i) {
            const p = globalThis.test.spawnSimulatedPlayer(event.sender.location as any, "Bot" + (spawnIndex++));
            game.setPlayer(p as any, teams[teamIndex]);
        }
    }
    game.start(bedBreakableMinutes == 0 ? { bedProtected: false } : {
        bedProtected: true,
        events: [{
            activateTime: bedBreakableMinutes * 1200,
            action: EventAction.disableBedProtection
        }]
    });
    (globalThis as any).game = game;
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
mc.world.afterEvents.itemReleaseUse.subscribe(event => {
    if (game) {
        game.afterItemReleaseUse(event);
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
mc.system.afterEvents.scriptEventReceive.subscribe(event => {
    if (game) {
        game.afterScriptEventReceive(event);
    }
    if (event.id == "Amazing:fireball" && event.message == "explode") {
        const fireball = event.sourceEntity!;
        // the script event might be called twice
        // for the same fireball
        if (!fireball.isValid()) return;
        const explosionLocation = fireball.location;

        fireball.dimension.createExplosion(explosionLocation, 1.8, {
            source: fireball,
            breaksBlocks: true,
            causesFire: true
        });
        for (const player of mc.world.getAllPlayers()) {
            if (player.dimension != fireball.dimension) continue;

            const d = vecDistance(player.location, explosionLocation);
            const multiplier = -d * d + 25;
            if (multiplier > 0) {
                const { x, z } = subtract(player.location, explosionLocation);
                player.applyKnockback(x, z, multiplier / 12.5, multiplier / 25);
            }
        }
        fireball.kill();
    }
});
mc.system.runInterval(() => {
    if (game) game.tickEvent();
});
