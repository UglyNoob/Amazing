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
    MAX_PROTECTION_LEVEL,
    MAX_HASTE_LEVEL,
    TRAP_CONSTANTS,
    TrapType,
    MAX_TRAP_COUNT,
    KNOCKBACK_STICK_ITEM,
    TRACKER_ITEM
} from "./Bedwars.js";
import { ActionFormData } from "@minecraft/server-ui";
import { containerIterator, containerSlotIterator, itemEqual, stackFirstContainerAdd } from './utility.js';
import { Vector3Utils as v3 } from "@minecraft/math";
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from "@minecraft/vanilla-data";
import { PLATFORM_ITEM } from "./RescuePlatform.js";
import { sprintf } from "sprintf-js";
import { BedWarsStrings, strings } from "./BedwarsLang.js";

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
    itemName: string | LocalString;
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
};

type LocalString = {
    local: keyof BedWarsStrings
}

type Menu = FieldOrFunction<"display", string | LocalString> & FieldOrFunction<"icon", string> &
    (
        ({ type: "entry"; }
            & FieldOrFunction<"body", string | LocalString>
            & FieldOrFunction<"title", string | LocalString>
            & FieldOrFunction<"subMenus", Menu[]>)
        |
        ({ type: "action"; }
            & FieldOrFunction<"action", Action>)
    );

function generateBuyOneItemMenu(
    name: string | LocalString,
    getAction: (playerInfo: PlayerGameInformation) => {
        cost: TokenValue,
        item: mc.ItemStack
    },
    getIcon: (playerInfo: PlayerGameInformation) => string
): Menu {
    return {
        type: "action",
        getIcon,
        getDisplay(playerInfo, tokens, _, game) {
            const action = getAction(playerInfo);
            const cost = action.cost;
            const item = action.item;
            let color: string;
            if (isTokenSatisfying(tokens, cost)) {
                color = "§a§l";
            } else {
                color = "§4";
            }
            const strs = strings[game.getPlayerLang(playerInfo.player)];
            const evaluatedName = evaluateString(name, strs)
            if (item.amount == 1) {
                return `${color}${evaluatedName}\n${tokenToString(cost, strs)}`;
            } else {
                return `${color}${evaluatedName} * ${item.amount}\n${tokenToString(cost, strs)}`;
            }
        },
        getAction(playerInfo) {
            const { item, cost } = getAction(playerInfo);
            return {
                type: ActionType.BuyNormalItem,
                cost,
                item,
                itemName: name
            }
        }
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
    };
}
function generateBuySwordMenu(toLevel: SwordLevel, cost: TokenValue): Menu {
    return {
        type: "action",
        getDisplay(playerInfo, currentTokens, _, game) {
            const strs = strings[game.getPlayerLang(playerInfo.player)];
            if (playerInfo.swordLevel.level >= toLevel.level) {
                return "§h" + strs[toLevel.name];
            }
            let color: string;
            if (isTokenSatisfying(currentTokens, cost)) {
                color = "§a§l";
            } else {
                color = "§4";
            }
            return `${color}${strs[toLevel.name]}\n${tokenToString(cost, strs)}`;
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
        getDisplay(playerInfo, currentTokens, _, game) {
            const strs = strings[game.getPlayerLang(playerInfo.player)];
            if (playerInfo.armorLevel.level >= toLevel.level) {
                return "§h" + strs[toLevel.name];
            }
            let color: string;
            if (isTokenSatisfying(currentTokens, cost)) {
                color = "§a§l";
            } else {
                color = "§4";
            }
            return `${color}${strs[toLevel.name]}\n${tokenToString(cost, strs)}`;
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
const LADDER_ITEM = new mc.ItemStack(MinecraftItemTypes.Ladder, 8);
const OBSIDIAN_ITEM = new mc.ItemStack(MinecraftItemTypes.Obsidian, 4);
const BOW_ITEM = new mc.ItemStack(MinecraftItemTypes.Bow, 1);
const ARROW_ITEM = new mc.ItemStack(MinecraftItemTypes.Arrow, 6);
const GOLDEN_APPLE_ITEM = new mc.ItemStack(MinecraftItemTypes.GoldenApple, 1);
const ENDER_PEARL_ITEM = new mc.ItemStack(MinecraftItemTypes.EnderPearl, 1);
const WIND_CHARGE_ITEM = new mc.ItemStack(MinecraftItemTypes.WindCharge, 1);
const WOLF_ARMOR_ITEM = new mc.ItemStack(MinecraftItemTypes.WolfArmor, 1);
const LOYAL_WOLF_ITEM = new mc.ItemStack(MinecraftItemTypes.WolfSpawnEgg, 1);
const HARDENED_CLAY_ITEM = new mc.ItemStack(MinecraftItemTypes.HardenedClay, 16);
const BOW_POWERI_ITEM = (() => {
    const i = new mc.ItemStack(MinecraftItemTypes.Bow);
    i.getComponent("enchantable")!.addEnchantment({
        level: 1,
        type: mc.EnchantmentTypes.get(MinecraftEnchantmentTypes.Power)!
    });
    return i;
})();
const BOW_POWERI_PUNCHI_ITEM = (() => {
    const i = new mc.ItemStack(MinecraftItemTypes.Bow);
    const e = i.getComponent("enchantable")!;
    e.addEnchantment({
        level: 1,
        type: mc.EnchantmentTypes.get(MinecraftEnchantmentTypes.Punch)!
    });
    e.addEnchantment({
        level: 1,
        type: mc.EnchantmentTypes.get(MinecraftEnchantmentTypes.Power)!
    });
    return i;
})();

let itemShopData: Menu | null = null;
// SHOP_DATA relies on global variable ARMOR_LEVELS and SWORD_LEVELS
// so it has to be initialized afterwards
const generateItemShopData: () => Menu = () => ({
    type: "entry",
    body: { local: "itemShopBody" },
    icon: "",
    display: "",
    title: { local: "itemShopTitle" },
    subMenus: [
        {
            type: "entry",
            display: { local: "blocksShopDisplay" },
            icon: "textures/blocks/wool_colored_white.png",
            title: { local: "blocksShopTitle" },
            getBody: generateSecondMenuGetBody("Buy blocks"),
            subMenus: [
                generateBuyOneItemMenu({ local: "woolName" }, playerInfo => ({
                    cost: { ironAmount: 4, goldAmount: 0, emeraldAmount: 0, diamondAmount: 0 },
                    item: new mc.ItemStack(TEAM_CONSTANTS[playerInfo.team].woolName, 16)
                }), playerInfo => TEAM_CONSTANTS[playerInfo.team].woolIconPath),
                generateBuyOneItemMenu({ local: "hardenedClayName" }, () => ({
                    cost: { ironAmount: 12, goldAmount: 0, emeraldAmount: 0, diamondAmount: 0 },
                    item: HARDENED_CLAY_ITEM
                }), () => "textures/blocks/hardened_clay.png"),
                generateBuyOneItemMenu({ local: "blastProofGlassName" }, playerInfo => ({
                    cost: { ironAmount: 12, goldAmount: 0, emeraldAmount: 0, diamondAmount: 0 },
                    item: new mc.ItemStack(TEAM_CONSTANTS[playerInfo.team].glassName, 4)
                }), playerInfo => TEAM_CONSTANTS[playerInfo.team].glassIconPath),
                generateBuyOneItemMenu({ local: "plankName" }, () => ({
                    cost: { ironAmount: 0, goldAmount: 4, emeraldAmount: 0, diamondAmount: 0 },
                    item: PLANKS_ITEM
                }), () => "textures/blocks/planks_oak.png"),
                generateBuyOneItemMenu({ local: "endStoneName" }, () => ({
                    cost: { ironAmount: 24, goldAmount: 0, emeraldAmount: 0, diamondAmount: 0 },
                    item: ENDSTONE_ITEM
                }), () => "textures/blocks/end_stone.png"),
                generateBuyOneItemMenu({ local: "ladderName" }, () => ({
                    cost: { ironAmount: 4, goldAmount: 0, emeraldAmount: 0, diamondAmount: 0 },
                    item: LADDER_ITEM
                }), () => "textures/blocks/ladder.png"),
                generateBuyOneItemMenu({ local: "obsidianName" }, () => ({
                    cost: { ironAmount: 0, goldAmount: 0, emeraldAmount: 4, diamondAmount: 0 },
                    item: OBSIDIAN_ITEM
                }), () => "textures/blocks/obsidian.png"),
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
                generateBuySwordMenu(SWORD_LEVELS[3], { ironAmount: 0, goldAmount: 0, diamondAmount: 0, emeraldAmount: 4 }),
                generateBuyOneItemMenu({ local: "fireBallName" }, () => ({
                    cost: { ironAmount: 40, goldAmount: 0, emeraldAmount: 0, diamondAmount: 0 },
                    item: FIRE_BALL_ITEM
                }), () => "textures/items/fireball.png"),
                generateBuyOneItemMenu({ local: "windChargeName" }, () => ({
                    cost: { ironAmount: 30, goldAmount: 0, emeraldAmount: 0, diamondAmount: 0 },
                    item: WIND_CHARGE_ITEM
                }), () => "textures/items/wind_charge.png"),
                generateBuyOneItemMenu({ local: "knockbackStickName" }, () => ({
                    cost: { ironAmount: 0, goldAmount: 5, emeraldAmount: 0, diamondAmount: 0 },
                    item: KNOCKBACK_STICK_ITEM
                }), () => "textures/items/stick.png")
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
                    getDisplay(playerInfo, tokens, _, game) {
                        const strs = strings[game.getPlayerLang(playerInfo.player)];
                        if (playerInfo.hasShear) {
                            return strs.itemAlreadyHaveString;
                        }
                        const cost = SHEARS_COST;
                        let color: string;
                        if (isTokenSatisfying(tokens, cost)) {
                            color = "§a§l";
                        } else {
                            color = "§4";
                        }
                        return `${color}${strs.shearsName}\n${tokenToString(cost, strs)}`;
                    },
                    icon: "textures/items/shears.png",
                    action: {
                        type: ActionType.BuyShear,
                        cost: SHEARS_COST
                    }
                }, {
                    type: "action",
                    getDisplay(playerInfo, currentTokens, _, game) {
                        const strs = strings[game.getPlayerLang(playerInfo.player)];
                        let toLevel: PickaxeLevel;
                        if (playerInfo.pickaxeLevel) {
                            if (!hasNextPickaxeLevel(playerInfo.pickaxeLevel)) {
                                return strs.pickaxeMaxLevelString;
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
                        return `${color}${strs[toLevel.name]}\n${tokenToString(cost, strs)}`;
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
                    getDisplay(playerInfo, currentTokens, _, game) {
                        const strs = strings[game.getPlayerLang(playerInfo.player)];
                        let toLevel: AxeLevel;
                        if (playerInfo.axeLevel) {
                            if (!hasNextAxeLevel(playerInfo.axeLevel)) {
                                return strs.axeMaxLevelString;
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
                        return `${color}${strs[toLevel.name]}\n${tokenToString(cost, strs)}`;
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
                generateBuyOneItemMenu({ local: "invisiblePotionName" }, () => ({
                    cost: { ironAmount: 0, goldAmount: 0, emeraldAmount: 2, diamondAmount: 0 },
                    item: INVISIBLILITY_POTION_ITEM
                }), () => "textures/items/potion_bottle_invisibility.png"),
                generateBuyOneItemMenu({ local: "jumpPotionName" }, () => ({
                    cost: { ironAmount: 0, goldAmount: 0, emeraldAmount: 1, diamondAmount: 0 },
                    item: JUMP_BOOST_POTION_ITEM
                }), () => "textures/items/potion_bottle_jump.png"),
                generateBuyOneItemMenu({ local: "speedPotionName" }, () => ({
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
                generateBuyOneItemMenu({ local: "arrowName" }, () => ({
                    cost: { ironAmount: 0, goldAmount: 2, emeraldAmount: 0, diamondAmount: 0 },
                    item: ARROW_ITEM
                }), () => "textures/items/arrow.png"),
                generateBuyOneItemMenu({ local: "bowName" }, () => ({
                    cost: { ironAmount: 0, goldAmount: 12, emeraldAmount: 0, diamondAmount: 0 },
                    item: BOW_ITEM
                }), () => "textures/items/bow_standby.png"),
                generateBuyOneItemMenu({ local: "bowPowerIName" }, () => ({
                    cost: { ironAmount: 0, goldAmount: 20, emeraldAmount: 0, diamondAmount: 0 },
                    item: BOW_POWERI_ITEM
                }), () => "textures/items/bow_pulling_0.png"),
                generateBuyOneItemMenu({ local: "bowPowerIPunchIName" }, () => ({
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
                generateBuyOneItemMenu("TNT", () => ({
                    cost: { ironAmount: 0, goldAmount: 4, emeraldAmount: 0, diamondAmount: 0 },
                    item: TNT_ITEM
                }), () => "textures/blocks/tnt_side.png"),
                generateBuyOneItemMenu({ local: "goldenAppleName" }, () => ({
                    cost: { ironAmount: 0, goldAmount: 3, emeraldAmount: 0, diamondAmount: 0 },
                    item: GOLDEN_APPLE_ITEM
                }), () => "textures/items/apple_golden.png"),
                generateBuyOneItemMenu({ local: "enderPearlName" }, () => ({
                    cost: { ironAmount: 0, goldAmount: 0, emeraldAmount: 4, diamondAmount: 0 },
                    item: ENDER_PEARL_ITEM
                }), () => "textures/items/ender_pearl.png"),
                generateBuyOneItemMenu({ local: "bridgeEggName" }, () => ({
                    cost: { ironAmount: 0, goldAmount: 0, emeraldAmount: 1, diamondAmount: 0 },
                    item: BRIDGE_EGG_ITEM
                }), () => "textures/items/egg.png"),
                generateBuyOneItemMenu({ local: "trackerName" }, () => ({
                    cost: { ironAmount: 0, goldAmount: 2, emeraldAmount: 0, diamondAmount: 0 },
                    item: TRACKER_ITEM
                }), () => "textures/blocks/deadbush.png"),
                generateBuyOneItemMenu({ local: "loyalWolfName" }, () => ({
                    cost: { ironAmount: 0, goldAmount: 0, emeraldAmount: 4, diamondAmount: 0 },
                    item: LOYAL_WOLF_ITEM
                }), () => "textures/items/spawn_egg.png"),
                generateBuyOneItemMenu({ local: "wolfArmorName" }, () => ({
                    cost: { ironAmount: 0, goldAmount: 0, emeraldAmount: 2, diamondAmount: 0 },
                    item: WOLF_ARMOR_ITEM
                }), () => "textures/items/wolf_armor.png"),
                generateBuyOneItemMenu({ local: "rescuePlatformName" }, () => ({
                    cost: { ironAmount: 0, goldAmount: 0, emeraldAmount: 2, diamondAmount: 0 },
                    item: PLATFORM_ITEM
                }), () => "textures/items/blaze_rod.png")
            ]
        }
    ]
});

const SHARPENED_SWORD_COST: TokenValue = { ironAmount: 0, goldAmount: 0, diamondAmount: 2, emeraldAmount: 0 };

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

function generateTeamFirstGetDisplay(text: keyof BedWarsStrings, available: (teamInfo: TeamGameInformation) => boolean) {
    return (playerInfo: PlayerGameInformation, __: any, teamInfo: TeamGameInformation, game: BedWarsGame) => {
        let color = "§h";
        if (available(teamInfo)) {
            color = "";
        }
        return `${color}${strings[game.getPlayerLang(playerInfo.player)][text]}`;
    };
}
function generateTeamSecondGetDisplay(
    getName: (teamInfo: TeamGameInformation, playerInfo: PlayerGameInformation, game: BedWarsGame) => string,
    getCost: (teamInfo: TeamGameInformation) => TokenValue,
    available: (teamInfo: TeamGameInformation) => boolean) {
    return (playerInfo: PlayerGameInformation, currentTokens: TokenValue, teamInfo: TeamGameInformation, game: BedWarsGame) => {
        const name = getName(teamInfo, playerInfo, game);
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
        return `${color}${name}\n${tokenToString(cost, strings[game.getPlayerLang(playerInfo.player)])}`;
    };
}

function generateTrapMenu(trapType: TrapType): Menu {
    return {
        type: "entry",
        getDisplay: generateTeamFirstGetDisplay(TRAP_CONSTANTS[trapType].name,
            teamInfo => !isTrapBought(trapType, teamInfo)),
        icon: TRAP_CONSTANTS[trapType].iconPath,
        title: TRAP_CONSTANTS[trapType].name,
        body: { local: TRAP_CONSTANTS[trapType].description },
        subMenus: [
            {
                type: "action",
                getDisplay: generateTeamSecondGetDisplay((_, { player }, game) => strings[game.getPlayerLang(player)][TRAP_CONSTANTS[trapType].name],
                    calculateTrapCost, teamInfo => !isTrapBought(trapType, teamInfo) && teamInfo.traps.length != MAX_TRAP_COUNT),
                icon: TRAP_CONSTANTS[trapType].iconPath,
                getAction: (_, __, teamInfo) => ({
                    type: ActionType.BuyTrap,
                    cost: calculateTrapCost(teamInfo),
                    trapType: trapType
                })
            }
        ]
    };
}
function addOneWithMaximum(num: number, maximum: number) {
    return num < maximum ? num + 1 : maximum;
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
            icon: TRAP_CONSTANTS[TrapType.NegativeEffect].iconPath,
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
                    getBody({ player }, __, teamInfo, game) {
                        let result = "§7Your team currently has:\n\n";
                        const words = ["first", "second", "third"];
                        const strs = strings[game.getPlayerLang(player)];
                        for (let index = 0; index < MAX_TRAP_COUNT; ++index) {
                            const trapName = TRAP_CONSTANTS[teamInfo.traps[index]]?.name ?? "§cNo Trap";
                            result += `§7Trap #${index + 1}: §a${strs[trapName]}§7, activates when the ${words[index]} enemy walks into your base\n`;
                        }
                        return result;
                    },
                    title: "Your Traps",
                    subMenus: []
                }
            ]
        }, {
            type: "entry",
            getDisplay: generateTeamFirstGetDisplay("sharpenedSwordName", teamInfo => !teamInfo.hasSharpness),
            icon: "textures/items/diamond_sword.png",
            title: { local: "sharpenedSwordName" },
            body: { local: "sharpenedSwordBody" },
            subMenus: [
                {
                    type: "action",
                    getDisplay: generateTeamSecondGetDisplay(
                        (_, { player }, game) => strings[game.getPlayerLang(player)].sharpenedSwordName,
                        () => SHARPENED_SWORD_COST,
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
            getDisplay: generateTeamFirstGetDisplay("reinforcedArmorName", teamInfo => teamInfo.protectionLevel != MAX_PROTECTION_LEVEL),
            icon: "textures/items/diamond_boots.png",
            title: { local: "reinforcedArmorName" },
            body: { local: "reinforcedArmorBody" },
            subMenus: [
                {
                    type: "action",
                    getDisplay: generateTeamSecondGetDisplay(
                        (teamInfo, { player }, game) => `${strings[game.getPlayerLang(player)].reinforcedArmorName} ${TIER_STRING[addOneWithMaximum(teamInfo.protectionLevel, MAX_PROTECTION_LEVEL)]}`,
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
            getDisplay: generateTeamFirstGetDisplay("ironForgeName", teamInfo => teamInfo.ironForgeLevel != MAX_IRON_FORGE_LEVEL),
            icon: "textures/blocks/furnace_front_off.png",
            title: { local: "ironForgeName" },
            body: { local: "ironForgeBody" },
            subMenus: [
                {
                    type: "action",
                    getDisplay: generateTeamSecondGetDisplay(
                        (teamInfo, { player }, game) => `${strings[game.getPlayerLang(player)].ironForgeName} ${TIER_STRING[addOneWithMaximum(teamInfo.ironForgeLevel, MAX_IRON_FORGE_LEVEL)]}`,
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
            getDisplay: generateTeamFirstGetDisplay("maniacMinerName", teamInfo => teamInfo.hasteLevel != MAX_HASTE_LEVEL),
            icon: "textures/items/gold_pickaxe.png",
            title: { local: "maniacMinerName" },
            body: { local: "maniacMinerBody" },
            subMenus: [
                {
                    type: "action",
                    getDisplay: generateTeamSecondGetDisplay(
                        (teamInfo, { player }, game) => `${strings[game.getPlayerLang(player)].maniacMinerName} ${TIER_STRING[addOneWithMaximum(teamInfo.hasteLevel, MAX_HASTE_LEVEL)]}`,
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
            getDisplay: generateTeamFirstGetDisplay("healPoolName", teamInfo => !teamInfo.healPoolEnabled),
            icon: "textures/blocks/beacon.png",
            title: { local: "healPoolName" },
            body: { local: "healPoolBody" },
            subMenus: [
                {
                    type: "action",
                    getDisplay: generateTeamSecondGetDisplay(
                        (_, { player }, game) => strings[game.getPlayerLang(player)].healPoolName,
                        () => HEAL_POOL_COST,
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

function tokenToString(t: TokenValue, strs: BedWarsStrings) {
    let result = "";
    const {
        ironName,
        goldName,
        diamondName,
        emeraldName
    } = strs;
    if (t.ironAmount) {
        result += `${t.ironAmount}${ironName} `;
    }
    if (t.goldAmount) {
        result += `${t.goldAmount}${goldName} `;
    }
    if (t.diamondAmount) {
        result += `${t.diamondAmount}${diamondName} `;
    }
    if (t.emeraldAmount) {
        result += `${t.emeraldAmount}${emeraldName} `;
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

function evaluateString(string: string | LocalString, strs: BedWarsStrings) {
    if (typeof string == "string") {
        return string;
    } else {
        return strs[string.local];
    }
}

/**
 * @param playerInfo the player to be showed
 * @param menu the menu to show
 * @param hasParentMenu whether to show a Back button
 * @returns Whether the player cancels the menu
 */
async function showMenuForPlayer(menu: Menu, playerInfo: PlayerGameInformation, teamInfo: TeamGameInformation, game: BedWarsGame, hasParentMenu: boolean): Promise<boolean> {
    if (menu.type != "entry") throw new Error();
    const strs = strings[game.getPlayerLang(playerInfo.player)];
    while (true) {
        let title: string;
        let body: string;
        let subMenus: Menu[];
        let subMenuDisplays: string[] = [];

        const currentTokens = calculateTokens(playerInfo.player.getComponent("minecraft:inventory")!.container!);

        // Extract information
        if ("title" in menu) {
            title = evaluateString(menu.title, strs);
        } else {
            title = evaluateString(menu.getTitle(playerInfo, currentTokens, teamInfo, game), strs);
        }
        if ("body" in menu) {
            body = evaluateString(menu.body, strs);
        } else {
            body = evaluateString(menu.getBody(playerInfo, currentTokens, teamInfo, game), strs);
        }
        if ("subMenus" in menu) {
            subMenus = menu.subMenus;
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
                display = evaluateString(subMenu.display, strs);
            } else {
                display = evaluateString(subMenu.getDisplay(playerInfo, currentTokens, teamInfo, game), strs);
            }
            if ("icon" in subMenu) {
                icon = subMenu.icon;
            } else {
                icon = subMenu.getIcon(playerInfo, currentTokens, teamInfo, game);
            }
            subMenuDisplays.push(display);
            form.button(display, icon || undefined);
        }
        if (hasParentMenu) form.button(strs.backButtonDisplay);


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
    const container = player.getComponent("minecraft:inventory")!.container!;

    const tokens = calculateTokens(container);
    const strs = strings[game.getPlayerLang(player)];
    const { purchaseMessage } = strs;
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
        player.sendMessage(sprintf(purchaseMessage, evaluateString(action.itemName, strs)));
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
        player.sendMessage(sprintf(purchaseMessage, strs[action.toLevel.name]));
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
        player.sendMessage(sprintf(purchaseMessage, strs.shearsName));
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
        player.sendMessage(sprintf(purchaseMessage, strs[playerInfo.armorLevel.name]));
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
        player.sendMessage(sprintf(purchaseMessage, strs[toLevel.name]));
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
        player.sendMessage(sprintf(purchaseMessage, strs[toLevel.name]));
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
        game.teamBroadcast(teamInfo.type, "teamPurchaseMessage", t.colorPrefix, player.name, `${strs.ironForgeName} ${TIER_STRING[teamInfo.ironForgeLevel]}`);
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
        game.teamBroadcast(teamInfo.type, "teamPurchaseMessage", t.colorPrefix, player.name, `${strs.reinforcedArmorName} ${TIER_STRING[teamInfo.protectionLevel]}`);
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
        game.teamBroadcast(teamInfo.type, "teamPurchaseMessage", t.colorPrefix, player.name, `${strs.maniacMinerName} ${TIER_STRING[teamInfo.hasteLevel]}`);
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
        game.teamBroadcast(teamInfo.type, "teamPurchaseMessage", t.colorPrefix, player.name, strs.sharpenedSwordName);
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
        game.teamBroadcast(teamInfo.type, "teamPurchaseMessage", t.colorPrefix, player.name, strs.healPoolName);
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
        game.teamBroadcast(teamInfo.type, "teamPurchaseMessage", t.colorPrefix, player.name, strs[TRAP_CONSTANTS[action.trapType].name]);
        result = true;
    }

    if (result) {
        player.playSound("note.pling");
    } else {
        // player.playSound("note.bass");
        player.playSound("mob.endermen.portal");
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
