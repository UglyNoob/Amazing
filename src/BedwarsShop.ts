import * as mc from "@minecraft/server";
import {
    IRON_ITEM_STACK,
    GOLD_ITEM_STACK,
    DIAMOND_ITEM_STACK,
    EMERALD_ITEM_STACK,
    BedWarsGame,
    PlayerGameInformation,
    PlayerState,
    TEAM_CONSTANTS,
    PURCHASE_MESSAGE,
    SWORD_LEVELS,
    ARMOR_LEVELS,
    PICKAXE_LEVELS,
    AXE_LEVELS,
    hasNextPickaxeLevel,
    hasNextAxeLevel,
    PickaxeLevel,
    AxeLevel,
    ArmorLevel,
    SwordLevel,
    BRIDGE_EGG_ITEM,
    FIRE_BALL_ITEM,
    INVISIBLILITY_POTION_ITEM,
    SPEED_POTION_ITEM,
    JUMP_BOOST_POTION_ITEM,
    TeamGameInformation,
    MAX_IRON_FORGE_LEVEL,
    TEAM_PURCHASE_MESSAGE,
    MAX_PROTECTION_LEVEL,
    MAX_HASTE_LEVEL,
    TRAP_CONSTANT,
    TrapType,
    MAX_TRAP_COUNT
} from "./Bedwars.js";
import { ActionFormData } from "@minecraft/server-ui";
import { containerIterator, containerSlotIterator, itemEqual, stackFirstContainerAdd } from './utility.js'
import { Vector3Utils as v3 } from "@minecraft/math";
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { PLATFORM_ITEM } from "./RescuePlatform.js";
import { sprintf } from "sprintf-js";

export interface TokenValue {
    ironAmount: number;
    goldAmount: number;
    diamondAmount: number;
    emeraldAmount: number;
}

enum ActionType {
    BuyNormalItem,
    BuyArmor,
    BuySword,
    UpgradePickaxe,
    UpgradeAxe,
    BuyShear,
    UpgradeHaste,
    BuySharpness,
    UpgradeProtection,
    UpgradeIronForge,
    BuyHealPool,
    BuyTrap
}

interface BuyNormalItemAction {
    type: ActionType.BuyNormalItem;
    cost: TokenValue;
    itemName: string;
    item: mc.ItemStack;
}
interface BuyArmorAction {
    type: ActionType.BuyArmor;
    toLevel: ArmorLevel;
    cost: TokenValue;
}
interface BuySwordAction {
    type: ActionType.BuySword;
    toLevel: SwordLevel;
    cost: TokenValue;
}
interface UpgradePickaxeAction {
    type: ActionType.UpgradePickaxe;
}
interface UpgradeAxeAction {
    type: ActionType.UpgradeAxe;
}
interface BuyShearAction {
    type: ActionType.BuyShear;
    cost: TokenValue;
}
interface BuySharpnessAction {
    type: ActionType.BuySharpness;
    cost: TokenValue;
}
interface UpgradeProtectionAction {
    type: ActionType.UpgradeProtection;
}
interface UpgradeIronForgeAction {
    type: ActionType.UpgradeIronForge;
}
interface UpgradeHasteAction {
    type: ActionType.UpgradeHaste;
}
interface BuyHealPoolAction {
    type: ActionType.BuyHealPool;
    cost: TokenValue;
}
interface BuyTrapAction {
    type: ActionType.BuyTrap;
    trapType: TrapType;
    cost: TokenValue;
}

type Action = BuyNormalItemAction |
    BuySwordAction |
    UpgradePickaxeAction |
    UpgradeAxeAction |
    BuyShearAction |
    BuyArmorAction |
    BuySharpnessAction |
    UpgradeProtectionAction |
    UpgradeIronForgeAction |
    UpgradeHasteAction |
    BuyHealPoolAction |
    BuyTrapAction;

type isUnion<T, K = T> = T extends any ? (Exclude<K, T> extends T ? false : true) : false;

type FieldOrFunction<PropName extends string, ValueType> = isUnion<PropName> extends true ? never : {
    [prop in PropName]: ValueType;
} | {
    [prop in PropName as `get${Capitalize<prop>}`]:
    (playerInfo: PlayerGameInformation, currentTokens: TokenValue, teamInfo: TeamGameInformation, game: BedWarsGame) => ValueType;
}

type Menu = FieldOrFunction<"display", string> & FieldOrFunction<"icon", string> &
    (
        ({ type: "entry"; }
            & FieldOrFunction<"body", string>
            & FieldOrFunction<"title", string>
            & FieldOrFunction<"subMenus", Menu[]>)
        |
        ({ type: "action"; }
            & FieldOrFunction<"action", Action>)
    );

function generateBuyOneItemMenu(
    name: string,
    getAction: (playerInfo: PlayerGameInformation) => BuyNormalItemAction,
    getIcon: (playerInfo: PlayerGameInformation) => string
): Menu {
    return {
        type: "action",
        getIcon,
        getDisplay(playerInfo, tokens) {
            const action = getAction(playerInfo);
            const cost = action.cost;
            const item = action.item;
            let color: string;
            if (isTokenSatisfying(tokens, cost)) {
                color = "§a§l";
            } else {
                color = "§4";
            }
            if (item.amount == 1) {
                return `${color}${name}\n${tokenToString(cost)}`;
            } else {
                return `${color}${name} * ${item.amount}\n${tokenToString(cost)}`;
            }
        },
        getAction
    };
}

function generateSecondMenuGetBody(defaultText: string) {
    return (playerInfo: PlayerGameInformation) => {
        if (playerInfo.lastActionSucceed == null) {
            return defaultText;
        } else {
            if (playerInfo.lastActionSucceed) {
                return "Success!";
            } else {
                return "Failed to perform action.";
            }
        }
    }
}
function generateBuySwordMenu(toLevel: SwordLevel, cost: TokenValue): Menu {
    return {
        type: "action",
        getDisplay(playerInfo, currentTokens) {
            if (playerInfo.swordLevel.level >= toLevel.level) {
                return "§h" + toLevel.name;
            }
            let color: string;
            if (isTokenSatisfying(currentTokens, cost)) {
                color = "§a§l";
            } else {
                color = "§4";
            }
            return `${color}${toLevel.name}\n${tokenToString(cost)}`;
        },
        icon: toLevel.icon,
        action: {
            type: ActionType.BuySword,
            toLevel,
            cost
        }
    };
}
function generateBuyArmorMenu(toLevel: ArmorLevel, cost: TokenValue): Menu {
    return {
        type: "action",
        getDisplay(playerInfo, currentTokens) {
            if (playerInfo.armorLevel.level >= toLevel.level) {
                return "§h" + toLevel.name;
            }
            let color: string;
            if (isTokenSatisfying(currentTokens, cost)) {
                color = "§a§l";
            } else {
                color = "§4";
            }
            return `${color}${toLevel.name}\n${tokenToString(cost)}`;
        },
        icon: toLevel.icon,
        action: {
            type: ActionType.BuyArmor,
            toLevel,
            cost
        }
    };
}

const SHEARS_COST: TokenValue = {
    ironAmount: 20,
    goldAmount: 0,
    diamondAmount: 0,
    emeraldAmount: 0
};
const IRON_FORGE_TO_NEXT_LEVEL_COSTS: TokenValue[] = [
    { ironAmount: 0, goldAmount: 0, diamondAmount: 2, emeraldAmount: 0 },
    { ironAmount: 0, goldAmount: 0, diamondAmount: 4, emeraldAmount: 0 },
    { ironAmount: 0, goldAmount: 0, diamondAmount: 6, emeraldAmount: 0 },
    { ironAmount: 0, goldAmount: 0, diamondAmount: 8, emeraldAmount: 0 }
];
const PROTECTION_TO_NEXT_LEVEL_COSTS: TokenValue[] = [
    { ironAmount: 0, goldAmount: 0, diamondAmount: 2, emeraldAmount: 0 },
    { ironAmount: 0, goldAmount: 0, diamondAmount: 4, emeraldAmount: 0 },
    { ironAmount: 0, goldAmount: 0, diamondAmount: 8, emeraldAmount: 0 },
    { ironAmount: 0, goldAmount: 0, diamondAmount: 16, emeraldAmount: 0 }
];
const HASTE_TO_NEXT_LEVEL_COSTS: TokenValue[] = [
    { ironAmount: 0, goldAmount: 0, diamondAmount: 2, emeraldAmount: 0 },
    { ironAmount: 0, goldAmount: 0, diamondAmount: 4, emeraldAmount: 0 }
];
const HEAL_POOL_COST: TokenValue = { ironAmount: 0, goldAmount: 0, diamondAmount: 2, emeraldAmount: 0 };

const TNT_ITEM = new mc.ItemStack(MinecraftItemTypes.Tnt);
const PLANKS_ITEM = new mc.ItemStack(MinecraftItemTypes.Planks, 8);
const ENDSTONE_ITEM = new mc.ItemStack(MinecraftItemTypes.EndStone, 12);
const BOW_ITEM = new mc.ItemStack(MinecraftItemTypes.Bow, 1);
const ARROW_ITEM = new mc.ItemStack(MinecraftItemTypes.Arrow, 6);
const GOLDEN_APPLE_ITEM = new mc.ItemStack(MinecraftItemTypes.GoldenApple, 1);
const ENDER_PEARL_ITEM = new mc.ItemStack(MinecraftItemTypes.EnderPearl, 1);
const HARDENED_CLAY_ITEM = new mc.ItemStack(MinecraftItemTypes.HardenedClay, 16);
const BOW_POWERI_ITEM = (() => {
    const i = new mc.ItemStack(MinecraftItemTypes.Bow);
    i.getComponent("enchantable")!.addEnchantment({
        level: 1,
        type: MinecraftEnchantmentTypes.Power
    });
    return i;
})();
const BOW_POWERI_PUNCHI_ITEM = (() => {
    const i = new mc.ItemStack(MinecraftItemTypes.Bow);
    const e = i.getComponent("enchantable")!;
    e.addEnchantment({
        level: 1,
        type: MinecraftEnchantmentTypes.Punch
    });
    e.addEnchantment({
        level: 1,
        type: MinecraftEnchantmentTypes.Power
    });
    return i;
})();

let itemShopData: Menu | null = null;
// SHOP_DATA relies on global variable ARMOR_LEVELS and SWORD_LEVELS
// so it has to be initialized afterwards
const generateItemShopData: () => Menu = () => ({
    type: "entry",
    body: "",
    icon: "",
    display: "Bedwars shop",
    title: "Bedwars Shop",
    subMenus: [
        {
            type: "entry",
            display: "Blocks",
            icon: "textures/blocks/wool_colored_white.png",
            title: "Blocks Shop",
            getBody: generateSecondMenuGetBody("Buy blocks"),
            subMenus: [
                generateBuyOneItemMenu("Wool", playerInfo => ({
                    type: ActionType.BuyNormalItem,
                    itemName: "Wool",
                    cost: { ironAmount: 4, goldAmount: 0, emeraldAmount: 0, diamondAmount: 0 },
                    item: new mc.ItemStack(TEAM_CONSTANTS[playerInfo.team].woolName, 16)
                }), playerInfo => TEAM_CONSTANTS[playerInfo.team].woolIconPath),
                generateBuyOneItemMenu("Hardened Clay", () => ({
                    type: ActionType.BuyNormalItem,
                    itemName: "Hardened Clay",
                    cost: { ironAmount: 12, goldAmount: 0, emeraldAmount: 0, diamondAmount: 0 },
                    item: HARDENED_CLAY_ITEM
                }), () => "textures/blocks/hardened_clay.png"),
                generateBuyOneItemMenu("Plank", () => ({
                    type: ActionType.BuyNormalItem,
                    itemName: "Plank",
                    cost: { ironAmount: 0, goldAmount: 4, emeraldAmount: 0, diamondAmount: 0 },
                    item: PLANKS_ITEM
                }), () => "textures/blocks/planks_oak.png"),
                generateBuyOneItemMenu("End Stone", () => ({
                    type: ActionType.BuyNormalItem,
                    itemName: "End Stone",
                    cost: { ironAmount: 24, goldAmount: 0, emeraldAmount: 0, diamondAmount: 0 },
                    item: ENDSTONE_ITEM
                }), () => "textures/blocks/end_stone.png"),
            ]
        }, {
            type: "entry",
            display: "Weapons",
            icon: "textures/items/iron_sword.png",
            title: "Weapon Shop",
            getBody: generateSecondMenuGetBody("Buy weapons"),
            subMenus: [
                generateBuySwordMenu(SWORD_LEVELS[1], { ironAmount: 10, goldAmount: 0, diamondAmount: 0, emeraldAmount: 0 }),
                generateBuySwordMenu(SWORD_LEVELS[2], { ironAmount: 0, goldAmount: 7, diamondAmount: 0, emeraldAmount: 0 }),
                generateBuySwordMenu(SWORD_LEVELS[3], { ironAmount: 0, goldAmount: 0, diamondAmount: 0, emeraldAmount: 4 })
            ]
        }, {
            type: "entry",
            display: "Armors",
            icon: "textures/items/iron_boots.png",
            title: "Armor Shop",
            getBody: generateSecondMenuGetBody("Buy armors"),
            subMenus: [
                generateBuyArmorMenu(ARMOR_LEVELS[1], { ironAmount: 30, goldAmount: 0, diamondAmount: 0, emeraldAmount: 0 }),
                generateBuyArmorMenu(ARMOR_LEVELS[2], { ironAmount: 0, goldAmount: 12, diamondAmount: 0, emeraldAmount: 0 }),
                generateBuyArmorMenu(ARMOR_LEVELS[3], { ironAmount: 0, goldAmount: 0, diamondAmount: 0, emeraldAmount: 6 })
            ]
        }, {
            type: "entry",
            display: "Tools",
            icon: "textures/items/stone_pickaxe.png",
            title: "Tool Shop",
            getBody: generateSecondMenuGetBody("Buy tools"),
            subMenus: [
                {
                    type: "action",
                    getDisplay(playerInfo, tokens) {
                        if (playerInfo.hasShear) {
                            return "§hYou already have this item.";
                        }
                        const cost = SHEARS_COST;
                        let color: string;
                        if (isTokenSatisfying(tokens, cost)) {
                            color = "§a§l";
                        } else {
                            color = "§4";
                        }
                        return `${color}Shears\n${tokenToString(cost)}`;
                    },
                    icon: "textures/items/shears.png",
                    action: {
                        type: ActionType.BuyShear,
                        cost: SHEARS_COST
                    }
                }, {
                    type: "action",
                    getDisplay(playerInfo, currentTokens) {
                        let toLevel: PickaxeLevel;
                        if (playerInfo.pickaxeLevel) {
                            if (!hasNextPickaxeLevel(playerInfo.pickaxeLevel)) {
                                return "§hYour pickaxe is\nof the max level."
                            }
                            toLevel = PICKAXE_LEVELS[playerInfo.pickaxeLevel.level + 1];
                        } else {
                            toLevel = PICKAXE_LEVELS[0];
                        }

                        const cost = toLevel.toCurrentLevelCost;
                        let color: string;
                        if (isTokenSatisfying(currentTokens, cost)) {
                            color = "§a§l";
                        } else {
                            color = "§4";
                        }
                        return `${color}${toLevel.name}\n${tokenToString(cost)}`;
                    },
                    getIcon(playerInfo) {
                        let toLevel: PickaxeLevel;
                        if (playerInfo.pickaxeLevel) {
                            if (!hasNextPickaxeLevel(playerInfo.pickaxeLevel)) {
                                toLevel = playerInfo.pickaxeLevel;
                            } else {
                                toLevel = PICKAXE_LEVELS[playerInfo.pickaxeLevel.level + 1];
                            }
                        } else {
                            toLevel = PICKAXE_LEVELS[0];
                        }
                        return toLevel.icon;
                    },
                    action: {
                        type: ActionType.UpgradePickaxe
                    }
                }, {
                    type: "action",
                    getDisplay(playerInfo, currentTokens) {
                        let toLevel: AxeLevel;
                        if (playerInfo.axeLevel) {
                            if (!hasNextAxeLevel(playerInfo.axeLevel)) {
                                return "§hYour axe is\nof the max level."
                            }
                            toLevel = AXE_LEVELS[playerInfo.axeLevel.level + 1];
                        } else {
                            toLevel = AXE_LEVELS[0];
                        }

                        const cost = toLevel.toCurrentLevelCost;
                        let color: string;
                        if (isTokenSatisfying(currentTokens, cost)) {
                            color = "§a§l";
                        } else {
                            color = "§4";
                        }
                        return `${color}${toLevel.name}\n${tokenToString(cost)}`;
                    },
                    getIcon(playerInfo) {
                        let toLevel: AxeLevel;
                        if (playerInfo.axeLevel) {
                            if (!hasNextAxeLevel(playerInfo.axeLevel)) {
                                toLevel = playerInfo.axeLevel;
                            } else {
                                toLevel = AXE_LEVELS[playerInfo.axeLevel.level + 1];
                            }
                        } else {
                            toLevel = AXE_LEVELS[0];
                        }
                        return toLevel.icon;
                    },
                    action: {
                        type: ActionType.UpgradeAxe
                    }
                }
            ]
        }, {
            type: "entry",
            display: "Potions",
            icon: "textures/items/potion_bottle_invisibility.png",
            title: "Potion Shop",
            getBody: generateSecondMenuGetBody("Buy potions"),
            subMenus: [
                generateBuyOneItemMenu("Invisible Potion (0:30)", () => ({
                    type: ActionType.BuyNormalItem,
                    itemName: "Invisible Potion (0:30)",
                    cost: { ironAmount: 0, goldAmount: 0, emeraldAmount: 2, diamondAmount: 0 },
                    item: INVISIBLILITY_POTION_ITEM
                }), () => "textures/items/potion_bottle_invisibility.png"),
                generateBuyOneItemMenu("Jump V Potion (0:45)", () => ({
                    type: ActionType.BuyNormalItem,
                    itemName: "Jump V Potion (0:45)",
                    cost: { ironAmount: 0, goldAmount: 0, emeraldAmount: 1, diamondAmount: 0 },
                    item: JUMP_BOOST_POTION_ITEM
                }), () => "textures/items/potion_bottle_jump.png"),
                generateBuyOneItemMenu("Speed II Potion (0:45)", () => ({
                    type: ActionType.BuyNormalItem,
                    itemName: "Speed II Potion (0:45)",
                    cost: { ironAmount: 0, goldAmount: 0, emeraldAmount: 1, diamondAmount: 0 },
                    item: SPEED_POTION_ITEM
                }), () => "textures/items/potion_bottle_moveSpeed.png")
            ]
        }, {
            type: "entry",
            display: "Bows",
            icon: "textures/items/bow_pulling_2.png",
            title: "Bow Shop",
            getBody: generateSecondMenuGetBody("Buy bows"),
            subMenus: [
                generateBuyOneItemMenu("Arrow", () => ({
                    type: ActionType.BuyNormalItem,
                    itemName: "Arrow",
                    cost: { ironAmount: 0, goldAmount: 2, emeraldAmount: 0, diamondAmount: 0 },
                    item: ARROW_ITEM
                }), () => "textures/items/arrow.png"),
                generateBuyOneItemMenu("Bow", () => ({
                    type: ActionType.BuyNormalItem,
                    itemName: "Bow",
                    cost: { ironAmount: 0, goldAmount: 12, emeraldAmount: 0, diamondAmount: 0 },
                    item: BOW_ITEM
                }), () => "textures/items/bow_standby.png"),
                generateBuyOneItemMenu("Bow Power I", () => ({
                    type: ActionType.BuyNormalItem,
                    itemName: "Bow Power I",
                    cost: { ironAmount: 0, goldAmount: 20, emeraldAmount: 0, diamondAmount: 0 },
                    item: BOW_POWERI_ITEM
                }), () => "textures/items/bow_pulling_0.png"),
                generateBuyOneItemMenu("Bow Power I,Punch I", () => ({
                    type: ActionType.BuyNormalItem,
                    itemName: "Bow Power I,Punch I",
                    cost: { ironAmount: 0, goldAmount: 0, emeraldAmount: 6, diamondAmount: 0 },
                    item: BOW_POWERI_PUNCHI_ITEM
                }), () => "textures/items/bow_pulling_1.png"),
            ]
        }, {
            type: "entry",
            display: "Utilities",
            icon: "textures/blocks/tnt_side.png",
            title: "Utility Shop",
            getBody: generateSecondMenuGetBody("Fancy utilities!"),
            subMenus: [
                generateBuyOneItemMenu("Tnt", () => ({
                    type: ActionType.BuyNormalItem,
                    itemName: "Tnt",
                    cost: { ironAmount: 0, goldAmount: 4, emeraldAmount: 0, diamondAmount: 0 },
                    item: TNT_ITEM
                }), () => "textures/blocks/tnt_side.png"),
                generateBuyOneItemMenu("Golden Apple", () => ({
                    type: ActionType.BuyNormalItem,
                    itemName: "Golden Apple",
                    cost: { ironAmount: 0, goldAmount: 3, emeraldAmount: 0, diamondAmount: 0 },
                    item: GOLDEN_APPLE_ITEM
                }), () => "textures/items/apple_golden.png"),
                generateBuyOneItemMenu("Fire Ball", () => ({
                    type: ActionType.BuyNormalItem,
                    itemName: "Fire Ball",
                    cost: { ironAmount: 40, goldAmount: 0, emeraldAmount: 0, diamondAmount: 0 },
                    item: FIRE_BALL_ITEM
                }), () => "textures/items/fireball.png"),
                generateBuyOneItemMenu("Ender Pearl", () => ({
                    type: ActionType.BuyNormalItem,
                    itemName: "Ender Pearl",
                    cost: { ironAmount: 0, goldAmount: 0, emeraldAmount: 4, diamondAmount: 0 },
                    item: ENDER_PEARL_ITEM
                }), () => "textures/items/ender_pearl.png"),
                generateBuyOneItemMenu("Bridge Egg", () => ({
                    type: ActionType.BuyNormalItem,
                    itemName: "Bridge Egg",
                    cost: { ironAmount: 0, goldAmount: 0, emeraldAmount: 1, diamondAmount: 0 },
                    item: BRIDGE_EGG_ITEM
                }), () => "textures/items/egg.png"),
                generateBuyOneItemMenu("Rescue Platform", () => ({
                    type: ActionType.BuyNormalItem,
                    itemName: "Rescue Platform",
                    cost: { ironAmount: 0, goldAmount: 0, emeraldAmount: 2, diamondAmount: 0 },
                    item: PLATFORM_ITEM
                }), () => "textures/items/blaze_rod.png")
            ]
        }
    ]
});

const IRON_FORGE_BODY = `§7Upgrade resources spawning on your island.

§7Tier 1: +50%% Resources, §b2 Diamonds
§7Tier 2: +100%% Resources, §b4 Diamonds
§7Tier 3: Spawn emeralds, §b6 Diamonds
§7Tier 4: +200%% Resources, §b8 Diamonds`;
const SHARPENED_SWORD_BODY = "§7Your team permanently gains sharpness I on all swords!";
const SHARPENED_SWORD_COST: TokenValue = { ironAmount: 0, goldAmount: 0, diamondAmount: 2, emeraldAmount: 0 };
const REINFORCED_ARMOR_BODY = `§7Your team permanently gains Protection on all armor pieces!

§7Tier 1: Protection I, §b2 Diamonds
§7Tier 2: Protection II, §b4 Diamonds
§7Tier 3: Protection III, §b8 Diamonds
§7Tier 4: Protection IV, §b16 Diamonds`;
const MANIAC_MINER_BODY = `§7All players on your team permanently gain Haste

§7Tier 1: Haste I, §b2 Diamonds
§7Tier 2: Haste II, §b4 Diamonds`;
const HEAL_POOL_BODY = "§7Create a regeneration field around your base!";

const TIER_STRING = ['O', 'I', 'II', 'III', 'IV', 'V'];

function calculateTrapCost(teamInfo: TeamGameInformation): TokenValue {
    return { ironAmount: 0, goldAmount: 0, diamondAmount: teamInfo.traps.length + 1, emeraldAmount: 0 };
}

function isTrapBought(trap: TrapType, teamInfo: TeamGameInformation) {
    for (const boughtTrap of teamInfo.traps) {
        if (boughtTrap == trap) return true;
    }
    return false;
}

function generateTeamFirstGetDisplay(text: string, available: (teamInfo: TeamGameInformation) => boolean) {
    return (_: any, __: any, teamInfo: TeamGameInformation) => {
        let color = "§h";
        if (available(teamInfo)) {
            color = "";
        }
        return `${color}${text}`;
    };
}
function generateTeamSecondGetDisplay(name: string, getCost: (teamInfo: TeamGameInformation) => TokenValue, available: (teamInfo: TeamGameInformation) => boolean) {
    return (_: any, currentTokens: TokenValue, teamInfo: TeamGameInformation) => {
        if (!available(teamInfo)) {
            return `§h${name}`;
        }
        let color: string;
        const cost = getCost(teamInfo);
        if (isTokenSatisfying(currentTokens, cost)) {
            color = "§a§l";
        } else {
            color = "§4";
        }
        return `${color}${name}\n${tokenToString(cost)}`;
    };
}

function generateTrapMenu(trapType: TrapType): Menu {
    return {
        type: "entry",
        getDisplay: generateTeamFirstGetDisplay(TRAP_CONSTANT[trapType].name,
            teamInfo => !isTrapBought(trapType, teamInfo)),
        icon: TRAP_CONSTANT[trapType].iconPath,
        title: TRAP_CONSTANT[trapType].name,
        body: TRAP_CONSTANT[trapType].description,
        subMenus: [
            {
                type: "action",
                getDisplay: generateTeamSecondGetDisplay(TRAP_CONSTANT[trapType].name,
                    calculateTrapCost, teamInfo => !isTrapBought(trapType, teamInfo) && teamInfo.traps.length != MAX_TRAP_COUNT),
                icon: TRAP_CONSTANT[trapType].iconPath,
                getAction: (_, __, teamInfo) => ({
                    type: ActionType.BuyTrap,
                    cost: calculateTrapCost(teamInfo),
                    trapType: trapType
                })
            }
        ]
    };
}

let teamShopData: Menu | null = null;
const generateTeamShopData: () => Menu = () => ({
    type: "entry",
    display: "",
    icon: "",
    title: "Team Upgrade",
    body: "Team Upgrade",
    subMenus: [
        {
            type: "entry",
            display: "Traps",
            icon: TRAP_CONSTANT[TrapType.NegativeEffect].iconPath,
            getBody: (_, __, teamInfo) => `Buy some traps for your team!${teamInfo.traps.length == MAX_TRAP_COUNT ?
                "\nYour team's traps have reached the maximum!" : ""}`,
            title: "Traps Shop",
            subMenus: [
                generateTrapMenu(TrapType.NegativeEffect),
                generateTrapMenu(TrapType.Defensive),
                generateTrapMenu(TrapType.Alarm),
                generateTrapMenu(TrapType.MinerFatigue),
                {
                    type: "entry",
                    display: "Your Traps",
                    icon: "",
                    getBody(_, __, teamInfo) {
                        let result = "§7Your team currently has:\n\n";
                        const words = ["first", "second", "third"];
                        for (let index = 0; index < MAX_TRAP_COUNT; ++index) {
                            const fixedIndex = index + 1;
                            const trapName = TRAP_CONSTANT[teamInfo.traps[index]]?.name ?? "§cNo Trap";
                            result += `§7Trap #${fixedIndex}: §a${trapName}§7, activates when the ${words[index]} enemy walks into your base\n`;
                        }
                        return result;
                    },
                    title: "Your Traps",
                    subMenus: []
                }
            ]
        }, {
            type: "entry",
            getDisplay: generateTeamFirstGetDisplay("Sharpened Sword", teamInfo => !teamInfo.hasSharpness),
            icon: "textures/items/diamond_sword.png",
            title: "Buy Sharpened Sword",
            body: SHARPENED_SWORD_BODY,
            subMenus: [
                {
                    type: "action",
                    getDisplay: generateTeamSecondGetDisplay("Sharpened Sword", () => SHARPENED_SWORD_COST,
                        teamInfo => !teamInfo.hasSharpness),
                    icon: "textures/items/diamond_sword.png",
                    action: {
                        type: ActionType.BuySharpness,
                        cost: SHARPENED_SWORD_COST
                    }
                }
            ]
        }, {
            type: "entry",
            getDisplay: generateTeamFirstGetDisplay("Reinforced Armor", teamInfo => teamInfo.protectionLevel != MAX_PROTECTION_LEVEL),
            icon: "textures/items/diamond_boots.png",
            title: "Reinforced Armor",
            body: REINFORCED_ARMOR_BODY,
            subMenus: [
                {
                    type: "action",
                    getDisplay: generateTeamSecondGetDisplay("Reinforced Armor",
                        teamInfo => PROTECTION_TO_NEXT_LEVEL_COSTS[teamInfo.protectionLevel],
                        teamInfo => teamInfo.protectionLevel != MAX_PROTECTION_LEVEL),
                    icon: "textures/items/diamond_boots.png",
                    action: {
                        type: ActionType.UpgradeProtection
                    }
                }
            ]
        }, {
            type: "entry",
            getDisplay: generateTeamFirstGetDisplay("Iron Forge", teamInfo => teamInfo.ironForgeLevel != MAX_IRON_FORGE_LEVEL),
            icon: "textures/blocks/furnace_front_off.png",
            title: "Upgrade Iron Forge",
            body: IRON_FORGE_BODY,
            subMenus: [
                {
                    type: "action",
                    getDisplay: generateTeamSecondGetDisplay("Iron Forge",
                        teamInfo => IRON_FORGE_TO_NEXT_LEVEL_COSTS[teamInfo.ironForgeLevel],
                        teamInfo => teamInfo.ironForgeLevel != MAX_IRON_FORGE_LEVEL),
                    icon: "textures/blocks/furnace_front_off.png",
                    action: {
                        type: ActionType.UpgradeIronForge
                    }
                }
            ]
        }, {
            type: "entry",
            getDisplay: generateTeamFirstGetDisplay("Maniac Miner", teamInfo => teamInfo.hasteLevel != MAX_HASTE_LEVEL),
            icon: "textures/items/gold_pickaxe.png",
            title: "Maniac Miner",
            body: MANIAC_MINER_BODY,
            subMenus: [
                {
                    type: "action",
                    getDisplay: generateTeamSecondGetDisplay("Maniac Miner",
                        teamInfo => HASTE_TO_NEXT_LEVEL_COSTS[teamInfo.hasteLevel],
                        teamInfo => teamInfo.hasteLevel != MAX_HASTE_LEVEL),
                    icon: "textures/items/gold_pickaxe.png",
                    action: {
                        type: ActionType.UpgradeHaste
                    }
                }
            ]
        }, {
            type: "entry",
            getDisplay: generateTeamFirstGetDisplay("Heal Pool", teamInfo => !teamInfo.healPoolEnabled),
            icon: "textures/blocks/beacon.png",
            title: "Heal Pool",
            body: HEAL_POOL_BODY,
            subMenus: [
                {
                    type: "action",
                    getDisplay: generateTeamSecondGetDisplay("Heal Pool", () => HEAL_POOL_COST,
                        teamInfo => !teamInfo.healPoolEnabled),
                    icon: "textures/blocks/beacon.png",
                    action: {
                        type: ActionType.BuyHealPool,
                        cost: HEAL_POOL_COST
                    }
                }
            ]
        }
    ]
});

function calculateTokens(container: mc.Container) {
    const tokens: TokenValue = {
        ironAmount: 0,
        goldAmount: 0,
        diamondAmount: 0,
        emeraldAmount: 0
    };
    for (const { item } of containerIterator(container)) {
        if (!item) continue;
        if (itemEqual(item, IRON_ITEM_STACK)) tokens.ironAmount += item.amount;
        if (itemEqual(item, GOLD_ITEM_STACK)) tokens.goldAmount += item.amount;
        if (itemEqual(item, DIAMOND_ITEM_STACK)) tokens.diamondAmount += item.amount;
        if (itemEqual(item, EMERALD_ITEM_STACK)) tokens.emeraldAmount += item.amount;
    }

    return tokens;
}

function isTokenSatisfying(a: TokenValue, b: TokenValue) {
    if (b.ironAmount > a.ironAmount ||
        b.goldAmount > a.goldAmount ||
        b.diamondAmount > a.diamondAmount ||
        b.emeraldAmount > a.emeraldAmount) return false;
    return true;
}

function tokenToString(t: TokenValue) {
    let result = "";
    if (t.ironAmount) {
        result += `${t.ironAmount} Irons `;
    }
    if (t.goldAmount) {
        result += `${t.goldAmount} Golds `;
    }
    if (t.diamondAmount) {
        result += `${t.diamondAmount} Diamonds `;
    }
    if (t.emeraldAmount) {
        result += `${t.emeraldAmount} Emeralds `;
    }
    if (result.length > 0)
        result = result.slice(0, result.length - 1);
    return result;
}

/**
 * @returns Rest of the tokens the container could not afford
 */
function consumeToken(container: mc.Container, _tokens: TokenValue) {
    const tokens = Object.assign({}, _tokens);
    // Consume tokens
    for (const { item, index } of containerIterator(container)) {
        if (!item) continue;
        if (itemEqual(item, IRON_ITEM_STACK)) {
            if (tokens.ironAmount >= item.amount) {
                tokens.ironAmount -= item.amount;
                container.setItem(index); // clear the slot
            } else {
                item.amount -= tokens.ironAmount;
                tokens.ironAmount = 0;
                container.setItem(index, item);
            }
        }
        if (itemEqual(item, GOLD_ITEM_STACK)) {
            if (tokens.goldAmount >= item.amount) {
                tokens.goldAmount -= item.amount;
                container.setItem(index); // clear the slot
            } else {
                item.amount -= tokens.goldAmount;
                tokens.goldAmount = 0;
                container.setItem(index, item);
            }
        }
        if (itemEqual(item, DIAMOND_ITEM_STACK)) {
            if (tokens.diamondAmount >= item.amount) {
                tokens.diamondAmount -= item.amount;
                container.setItem(index); // clear the slot
            } else {
                item.amount -= tokens.diamondAmount;
                tokens.diamondAmount = 0;
                container.setItem(index, item);
            }
        }
        if (itemEqual(item, EMERALD_ITEM_STACK)) {
            if (tokens.emeraldAmount >= item.amount) {
                tokens.emeraldAmount -= item.amount;
                container.setItem(index); // clear the slot
            } else {
                item.amount -= tokens.emeraldAmount;
                tokens.emeraldAmount = 0;
                container.setItem(index, item);
            }
        }
        if (tokens.ironAmount == 0 && tokens.goldAmount == 0 &&
            tokens.diamondAmount == 0 && tokens.emeraldAmount == 0) break;
    }
    return tokens;
}


/**
 * @param playerInfo the player to be showed
 * @param menu the menu to show
 * @param hasParentMenu whether to show a Back button
 * @returns Whether the player cancels the menu
 */
async function showMenuForPlayer(menu: Menu, playerInfo: PlayerGameInformation, teamInfo: TeamGameInformation, game: BedWarsGame, hasParentMenu: boolean): Promise<boolean> {
    if (menu.type != "entry") throw new Error();
    while (true) {
        let title: string;
        let body: string;
        let subMenus: Menu[];
        let subMenuDisplays: string[] = [];

        const currentTokens = calculateTokens(playerInfo.player.getComponent("minecraft:inventory")!.container!);

        // Extract information
        if ("title" in menu) {
            title = menu.title
        } else {
            title = menu.getTitle(playerInfo, currentTokens, teamInfo, game);
        }
        if ("body" in menu) {
            body = menu.body
        } else {
            body = menu.getBody(playerInfo, currentTokens, teamInfo, game);
        }
        if ("subMenus" in menu) {
            subMenus = menu.subMenus
        } else {
            subMenus = menu.getSubMenus(playerInfo, currentTokens, teamInfo, game);
        }

        // Prepare ActionFormData
        const form = new ActionFormData();
        form.title(title);
        form.body(body);
        for (const subMenu of subMenus) {
            let display: string;
            let icon: string;
            if ("display" in subMenu) {
                display = subMenu.display;
            } else {
                display = subMenu.getDisplay(playerInfo, currentTokens, teamInfo, game);
            }
            if ("icon" in subMenu) {
                icon = subMenu.icon;
            } else {
                icon = subMenu.getIcon(playerInfo, currentTokens, teamInfo, game);
            }
            subMenuDisplays.push(display);
            form.button(display, icon || undefined);
        }
        if (hasParentMenu) form.button("Back");


        const response = await form.show(playerInfo.player);
        if (playerInfo.state == PlayerState.Offline) return true;
        if (response.canceled) return true;

        const selectionIndex = response.selection!;
        if (selectionIndex == subMenus.length) { // Back button choosed
            playerInfo.lastActionSucceed = null;
            return false;
        }

        const selectedMenu = subMenus[selectionIndex];
        if (selectedMenu.type == "action") {
            let action: Action;
            if ("action" in selectedMenu) {
                action = selectedMenu.action;
            } else {
                action = selectedMenu.getAction(playerInfo, currentTokens, teamInfo, game);
            }
            const results = performAction(action, playerInfo, teamInfo, game);
            playerInfo.lastActionSucceed = results;
        } else { // entry
            const canceled = await showMenuForPlayer(selectedMenu, playerInfo, teamInfo, game, true);
            if (canceled) return true;
        }
    }
}

function performAction(action: Action, playerInfo: PlayerGameInformation, teamInfo: TeamGameInformation, game: BedWarsGame) {
    let result = false;
    const player = playerInfo.player;
    const container = player.getComponent("minecraft:inventory")!.container!

    const tokens = calculateTokens(container);
    execute: if (action.type == ActionType.BuyNormalItem) {
        if (!isTokenSatisfying(tokens, action.cost)) {
            // Failed to buy, insufficient tokens
            result = false;
            break execute;
        }
        consumeToken(container, action.cost);

        const leftover = stackFirstContainerAdd(container, action.item);
        if (leftover) { // if failed to add item
            // spawn the item as entity
            const entity = playerInfo.player.dimension.spawnItem(leftover, player.location);
            entity.applyImpulse(v3.scale(entity.getVelocity(), -1));
        }
        player.sendMessage(sprintf(PURCHASE_MESSAGE, action.itemName));
        result = true;
    } else if (action.type == ActionType.BuySword) {
        if (playerInfo.swordLevel.level >= action.toLevel.level) {
            result = false;
            break execute;
        }
        if (!isTokenSatisfying(tokens, action.cost)) {
            // Failed to buy, insufficient tokens
            result = false;
            break execute;
        }
        consumeToken(container, action.cost);
        let foundSword = false;
        for (const { slot } of containerSlotIterator(container)) {
            const item = slot.getItem();
            if (!item) continue;
            if (itemEqual(item, playerInfo.swordLevel.item)) {
                slot.setItem(action.toLevel.item);
                foundSword = true;
                break;
            }
        }
        if (!foundSword) {
            container.addItem(action.toLevel.item);
        }
        player.sendMessage(sprintf(PURCHASE_MESSAGE, action.toLevel.name))
        playerInfo.swordLevel = action.toLevel;
        result = true;
    } else if (action.type == ActionType.BuyShear) {
        if (playerInfo.hasShear) {
            result = false;
            break execute;
        }
        if (!isTokenSatisfying(tokens, action.cost)) {
            // Failed to buy, insufficient tokens
            result = false;
            break execute;
        }
        consumeToken(container, action.cost);
        container.addItem(new mc.ItemStack(MinecraftItemTypes.Shears));
        player.sendMessage(sprintf(PURCHASE_MESSAGE, "Shears"));
        playerInfo.hasShear = true;
        result = true;
    } else if (action.type == ActionType.BuyArmor) {
        const currentLevel = playerInfo.armorLevel;
        if (currentLevel.level >= action.toLevel.level) {
            result = false;
            break execute;
        }
        if (!isTokenSatisfying(tokens, action.cost)) {
            // Failed to buy, insufficient tokens
            result = false;
            break execute;
        }
        consumeToken(container, action.cost);
        playerInfo.armorLevel = action.toLevel;
        if (!playerInfo.armorDisabled) {
            game.resetArmor(playerInfo);
        }
        player.sendMessage(sprintf(PURCHASE_MESSAGE, playerInfo.armorLevel.name));
        result = true;
    } else if (action.type == ActionType.UpgradePickaxe) {
        let toLevel: PickaxeLevel;
        if (playerInfo.pickaxeLevel) {
            if (!hasNextPickaxeLevel(playerInfo.pickaxeLevel)) {
                result = false;
                break execute;
            }
            toLevel = PICKAXE_LEVELS[playerInfo.pickaxeLevel.level + 1];
        } else {
            toLevel = PICKAXE_LEVELS[0];
        }
        const cost = toLevel.toCurrentLevelCost;
        if (!isTokenSatisfying(tokens, cost)) {
            // Failed to buy, insufficient tokens
            result = false;
            break execute;
        }
        consumeToken(container, cost);
        if (playerInfo.pickaxeLevel) {
            let foundPickaxe = false;
            for (const { slot } of containerSlotIterator(container)) {
                const item = slot.getItem();
                if (!item) continue;
                if (itemEqual(item, playerInfo.pickaxeLevel.item)) {
                    slot.setItem(toLevel.item);
                    foundPickaxe = true;
                    break;
                }
            }
            if (!foundPickaxe) {
                container.addItem(toLevel.item);
            }
        } else {
            container.addItem(toLevel.item);
        }
        player.sendMessage(sprintf(PURCHASE_MESSAGE, toLevel.name))
        playerInfo.pickaxeLevel = toLevel;
        result = true;
    } else if (action.type == ActionType.UpgradeAxe) {
        let toLevel: AxeLevel;
        if (playerInfo.axeLevel) {
            if (!hasNextAxeLevel(playerInfo.axeLevel)) {
                result = false;
                break execute;
            }
            toLevel = AXE_LEVELS[playerInfo.axeLevel.level + 1];
        } else {
            toLevel = AXE_LEVELS[0];
        }
        const cost = toLevel.toCurrentLevelCost;
        if (!isTokenSatisfying(tokens, cost)) {
            // Failed to buy, insufficient tokens
            result = false;
            break execute;
        }
        consumeToken(container, cost);
        if (playerInfo.axeLevel) {
            let foundAxe = false;
            for (const { slot } of containerSlotIterator(container)) {
                const item = slot.getItem();
                if (!item) continue;
                if (itemEqual(item, playerInfo.axeLevel.item)) {
                    slot.setItem(toLevel.item);
                    foundAxe = true;
                    break;
                }
            }
            if (!foundAxe) {
                container.addItem(toLevel.item);
            }
        } else {
            container.addItem(toLevel.item);
        }
        player.sendMessage(sprintf(PURCHASE_MESSAGE, toLevel.name))
        playerInfo.axeLevel = toLevel;
        result = true;
    } else if (action.type == ActionType.UpgradeIronForge) {
        if (teamInfo.ironForgeLevel >= MAX_IRON_FORGE_LEVEL) {
            result = false;
            break execute;
        }
        const cost = IRON_FORGE_TO_NEXT_LEVEL_COSTS[teamInfo.ironForgeLevel];
        if (!isTokenSatisfying(tokens, cost)) {
            // Failed to buy, insufficient tokens
            result = false;
            break execute;
        }
        consumeToken(container, cost);
        ++teamInfo.ironForgeLevel;
        game.applyTeamIronForge(teamInfo.type);
        const t = TEAM_CONSTANTS[teamInfo.type];
        game.teamBroadcast(teamInfo.type, TEAM_PURCHASE_MESSAGE, t.colorPrefix, player.name, `Iron Forge level ${teamInfo.ironForgeLevel}`);
        result = true;
    } else if (action.type == ActionType.UpgradeProtection) {
        if (teamInfo.protectionLevel >= MAX_PROTECTION_LEVEL) {
            result = false;
            break execute;
        }
        const cost = PROTECTION_TO_NEXT_LEVEL_COSTS[teamInfo.protectionLevel];
        if (!isTokenSatisfying(tokens, cost)) {
            // Failed to buy, insufficient tokens
            result = false;
            break execute;
        }
        consumeToken(container, cost);
        ++teamInfo.protectionLevel;
        const t = TEAM_CONSTANTS[teamInfo.type];
        game.teamBroadcast(teamInfo.type, TEAM_PURCHASE_MESSAGE, t.colorPrefix, player.name, `Reinforced Armor level ${teamInfo.protectionLevel}`);
        result = true;
    } else if (action.type == ActionType.UpgradeHaste) {
        if (teamInfo.hasteLevel >= MAX_HASTE_LEVEL) {
            result = false;
            break execute;
        }
        const cost = HASTE_TO_NEXT_LEVEL_COSTS[teamInfo.hasteLevel];
        if (!isTokenSatisfying(tokens, cost)) {
            // Failed to buy, insufficient tokens
            result = false;
            break execute;
        }
        consumeToken(container, cost);
        ++teamInfo.hasteLevel;
        game.applyTeamHasteLevel(teamInfo.type);
        const t = TEAM_CONSTANTS[teamInfo.type];
        game.teamBroadcast(teamInfo.type, TEAM_PURCHASE_MESSAGE, t.colorPrefix, player.name, `Maniac Miner level ${teamInfo.protectionLevel}`);
        result = true;
    } else if (action.type == ActionType.BuySharpness) {
        if (teamInfo.hasSharpness) {
            result = false;
            break execute;
        }
        const cost = SHARPENED_SWORD_COST;
        if (!isTokenSatisfying(tokens, cost)) {
            // Failed to buy, insufficient tokens
            result = false;
            break execute;
        }
        consumeToken(container, cost);
        teamInfo.hasSharpness = true;
        const t = TEAM_CONSTANTS[teamInfo.type];
        game.teamBroadcast(teamInfo.type, TEAM_PURCHASE_MESSAGE, t.colorPrefix, player.name, "Sharpened Sword");
        result = true;
    } else if (action.type == ActionType.BuyHealPool) {
        if (teamInfo.healPoolEnabled) {
            result = false;
            break execute;
        }
        const cost = HEAL_POOL_COST;
        if (!isTokenSatisfying(tokens, cost)) {
            // Failed to buy, insufficient tokens
            result = false;
            break execute;
        }
        consumeToken(container, cost);
        teamInfo.healPoolEnabled = true;
        const t = TEAM_CONSTANTS[teamInfo.type];
        game.teamBroadcast(teamInfo.type, TEAM_PURCHASE_MESSAGE, t.colorPrefix, player.name, "Heal Pool");
        result = true;
    } else if (action.type == ActionType.BuyTrap) {
        if (isTrapBought(action.trapType, teamInfo)) {
            result = false;
            break execute;
        }
        if (teamInfo.traps.length == MAX_TRAP_COUNT) {
            result = false;
            break execute;
        }
        const cost = action.cost;
        if (!isTokenSatisfying(tokens, cost)) {
            // Failed to buy, insufficient tokens
            result = false;
            break execute;
        }
        consumeToken(container, cost);
        teamInfo.traps.push(action.trapType);
        const t = TEAM_CONSTANTS[teamInfo.type];
        game.teamBroadcast(teamInfo.type, TEAM_PURCHASE_MESSAGE, t.colorPrefix, player.name, TRAP_CONSTANT[action.trapType].name);
        result = true;
    }

    if (result) {
        player.playSound("mob.endermen.portal");
    } else {
        player.playSound("note.bass");
    }

    return result;
}

export function openShop(playerInfo: PlayerGameInformation, teamInfo: TeamGameInformation, game: BedWarsGame) {
    playerInfo.lastActionSucceed = null;
    if (!itemShopData) {
        itemShopData = generateItemShopData();
    }
    showMenuForPlayer(itemShopData, playerInfo, teamInfo, game, false);
}

export function openTeamShop(playerInfo: PlayerGameInformation, teamInfo: TeamGameInformation, game: BedWarsGame) {
    playerInfo.lastActionSucceed = null;
    if (!teamShopData) {
        teamShopData = generateTeamShopData();
    }
    showMenuForPlayer(teamShopData, playerInfo, teamInfo, game, false);
}