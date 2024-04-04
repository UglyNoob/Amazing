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
    BuyShear
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
}
interface BuySwordAction {
    type: ActionType.BuySword;
    toLevel: SwordLevel;
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

type Action = BuyNormalItemAction |
    BuySwordAction |
    UpgradePickaxeAction |
    UpgradeAxeAction |
    BuyShearAction |
    BuyArmorAction;

type isUnion<T, K = T> = T extends any ? (Exclude<K, T> extends T ? false : true) : false;

type FieldOrFunction<PropName extends string, ValueType> = isUnion<PropName> extends true ? never : {
    [prop in PropName]: ValueType;
} | {
        [prop in PropName as `get${Capitalize<prop>}`]:
        (playerInfo: PlayerGameInformation, currentTokens: TokenValue, game: BedWarsGame) => ValueType;
    }

type Menu = FieldOrFunction<"display", string> & FieldOrFunction<"icon", string> &
    (
        ({ type: "entry"; }
            & FieldOrFunction<"body", string>
            & FieldOrFunction<"title", string>
            & FieldOrFunction<"subMenus", Menu[]>)
        |
        ({ type: "action"; }
            & FieldOrFunction<"actions", Action[]>)
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
            return `${color}${name} * ${item.amount}\n${tokenToString(cost)}`;
        },
        getActions(playerInfo) { return [getAction(playerInfo)]; }
    };
}

function generateSecondMenuGetBody(defaultText: string) {
    return (playerInfo: PlayerGameInformation) => {
        if (playerInfo.lastActionResults.length != 0) {
            for (const result of playerInfo.lastActionResults) {
                if (!result) {
                    return "Failed to perform action.";
                }
            }
            return "Success!";
        }
        return defaultText;
    }
}
function generateBuySwordMenu(toLevel: SwordLevel): Menu {
    return {
        type: "action",
        getDisplay(playerInfo, currentTokens) {
            if (playerInfo.swordLevel.level >= toLevel.level) {
                return "§h" + toLevel.name;
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
        icon: toLevel.icon,
        actions: [{
            type: ActionType.BuySword,
            toLevel
        }]
    };
}
function generateBuyArmorMenu(toLevel: ArmorLevel): Menu {
    return {
        type: "action",
        getDisplay(playerInfo, currentTokens) {
            if (playerInfo.armorLevel.level >= toLevel.level) {
                return "§h" + toLevel.name;
            }
            const cost = toLevel.cost;
            let color: string;
            if (isTokenSatisfying(currentTokens, cost)) {
                color = "§a§l";
            } else {
                color = "§4";
            }
            return `${color}${toLevel.name}\n${tokenToString(cost)}`;
        },
        icon: toLevel.icon,
        actions: [{
            type: ActionType.BuyArmor,
            toLevel
        }]
    };
}

const SHEARS_COST: TokenValue = {
    ironAmount: 20,
    goldAmount: 0,
    diamondAmount: 0,
    emeraldAmount: 0
};

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

let SHOP_DATA: Menu | null = null;
// SHOP_DATA relies on global variable ARMOR_LEVELS
// so it has to be initialized afterwards
const getShopData: () => Menu = () => ({
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
                generateBuyOneItemMenu("Wool", playerInfo => {
                    return {
                        type: ActionType.BuyNormalItem,
                        itemName: "Wool",
                        cost: { ironAmount: 4, goldAmount: 0, emeraldAmount: 0, diamondAmount: 0 },
                        item: new mc.ItemStack(TEAM_CONSTANTS[playerInfo.team].woolName, 16)
                    }
                }, playerInfo => TEAM_CONSTANTS[playerInfo.team].woolIconPath),
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
                generateBuySwordMenu(SWORD_LEVELS[1]),
                generateBuySwordMenu(SWORD_LEVELS[2]),
                generateBuySwordMenu(SWORD_LEVELS[3])
            ]
        }, {
            type: "entry",
            display: "Armors",
            icon: "textures/items/iron_boots.png",
            title: "Armor Shop",
            getBody: generateSecondMenuGetBody("Buy armors"),
            subMenus: [
                generateBuyArmorMenu(ARMOR_LEVELS[1]),
                generateBuyArmorMenu(ARMOR_LEVELS[2]),
                generateBuyArmorMenu(ARMOR_LEVELS[3])
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
                    actions: [{
                        type: ActionType.BuyShear,
                        cost: SHEARS_COST
                    }]
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
                    actions: [{
                        type: ActionType.UpgradePickaxe
                    }]
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
                    actions: [{
                        type: ActionType.UpgradeAxe
                    }]
                }
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
async function showMenuForPlayer(playerInfo: PlayerGameInformation, menu: Menu, game: BedWarsGame, hasParentMenu: boolean): Promise<boolean> {
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
            title = menu.getTitle(playerInfo, currentTokens, game);
        }
        if ("body" in menu) {
            body = menu.body
        } else {
            body = menu.getBody(playerInfo, currentTokens, game);
        }
        if ("subMenus" in menu) {
            subMenus = menu.subMenus
        } else {
            subMenus = menu.getSubMenus(playerInfo, currentTokens, game);
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
                display = subMenu.getDisplay(playerInfo, currentTokens, game);
            }
            if ("icon" in subMenu) {
                icon = subMenu.icon;
            } else {
                icon = subMenu.getIcon(playerInfo, currentTokens, game);
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
            playerInfo.lastActionResults = [];
            return false;
        }

        const selectedMenu = subMenus[selectionIndex];
        if (selectedMenu.type == "action") {
            let actions: Action[];
            if ("actions" in selectedMenu) {
                actions = selectedMenu.actions;
            } else {
                actions = selectedMenu.getActions(playerInfo, currentTokens, game);
            }
            const results = performAction(playerInfo, actions);
            playerInfo.lastActionResults = results;
        } else { // entry
            const canceled = await showMenuForPlayer(playerInfo, selectedMenu, game, true);
            if (canceled) return true;
        }
    }
}

function performAction(playerInfo: PlayerGameInformation, actions: Action[]) {
    const results: boolean[] = [];
    const player = playerInfo.player;
    const container = player.getComponent("minecraft:inventory")!.container!

    for (const action of actions) {
        const tokens = calculateTokens(container);
        let result: boolean = false;
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
            player.sendMessage(sprintf(PURCHASE_MESSAGE, action.itemName))
            result = true;
        } else if (action.type == ActionType.BuySword) {
            if (playerInfo.swordLevel.level >= action.toLevel.level) {
                result = false;
                break execute;
            }
            const cost = action.toLevel.toCurrentLevelCost;
            if (!isTokenSatisfying(tokens, cost)) {
                // Failed to buy, insufficient tokens
                result = false;
                break execute;
            }
            consumeToken(container, cost);
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
            if (!isTokenSatisfying(tokens, action.toLevel.cost)) {
                // Failed to buy, insufficient tokens
                result = false;
                break execute;
            }
            consumeToken(container, action.toLevel.cost);
            playerInfo.armorLevel = action.toLevel;
            const equipment = player.getComponent("equippable")!
            equipment.setEquipment(mc.EquipmentSlot.Legs, playerInfo.armorLevel.leggings);
            equipment.setEquipment(mc.EquipmentSlot.Feet, playerInfo.armorLevel.boots);
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
        }

        if (result) {
            player.playSound("mob.endermen.portal");
        } else {
            player.playSound("note.bass");
        }
        results.push(result);
    }
    return results;
}

export function openShop(playerInfo: PlayerGameInformation, game: BedWarsGame) {
    playerInfo.lastActionResults = [];
    if (!SHOP_DATA) {
        SHOP_DATA = getShopData();
    }
    showMenuForPlayer(playerInfo, SHOP_DATA, game, false);
}
