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
    PURCHASE_MESSAGE
} from "./Bedwars.js";
import { ActionFormData } from "@minecraft/server-ui";
import { containerIterator, itemEqual, statckableFirstContainerAdd } from './utility.js'
import { Vector3Utils as v3 } from "@minecraft/math";
import { MinecraftItemTypes, PinkGlazedTerracottaStates } from "@minecraft/vanilla-data";
import {PLATFORM_ITEM} from "./RescuePlatform.js";
import {sprintf} from "sprintf-js";


enum ActionType {
    BuyNormalItem,
    UpgradeSword,
    BuyArmor,
    UpgradePickaxe,
    UpgradeAxe,
    BuyShear
}

export interface TokenValue {
    ironAmount: number;
    goldAmount: number;
    diamondAmount: number;
    emeraldAmount: number;
}

interface BuyNormalItemAction {
    type: ActionType.BuyNormalItem;
    cost: TokenValue;
    name: string;
    items: mc.ItemStack[];
}
type BuyNormalItemResult = {
    type: ActionType.BuyNormalItem;
} & ({
    success: true;
} | {
    success: false;
    lack: TokenValue;
});

interface UpgradeSwordAction {
    type: ActionType.UpgradeSword;
}


type Action = BuyNormalItemAction |
    UpgradeSwordAction;
export type ActionResult = BuyNormalItemResult;

type isUnion<T, K = T> = T extends any ? (Exclude<K, T> extends T ? false : true) : false;

type FieldOrFunction<PropName extends string, ValueType> = isUnion<PropName> extends true ? never : {
    [prop in PropName]: ValueType;
} | {
        [prop in PropName as `get${Capitalize<prop>}`]:
        (playerInfo: PlayerGameInformation, tokens: TokenValue, game: BedWarsGame) => ValueType;
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
            const item = action.items[0];
            let color: string;
            if (isTokenSatisfying(tokens, cost)) {
                color = "§a§l";
            } else {
                color = "§4";
            }
            let display = `${color}${name} * ${item.amount}\n`;
            if (cost.ironAmount) {
                display += `${cost.ironAmount} irons `;
            }
            if (cost.goldAmount) {
                display += `${cost.goldAmount} golds `;
            }
            if (cost.diamondAmount) {
                display += `${cost.diamondAmount} diamonds `;
            }
            if (cost.emeraldAmount) {
                display += `${cost.emeraldAmount} emeralds `;
            }
            return display;
        },
        getActions(playerInfo) { return [getAction(playerInfo)]; }
    };
}

function generateSecondMenuGetBody(defaultText: string) {
    return (playerInfo: PlayerGameInformation) => {
        if (playerInfo.lastActionResults.length != 0) {
            for (const result of playerInfo.lastActionResults) {
                if (!result.success) {
                    return "Insufficient tokens.";
                }
            }
            return "Success!";
        }
        return defaultText;
    }
}

const SHOP_DATA: Menu = {
    type: "entry",
    body: "",
    icon: "",
    display: "Bedwars shop",
    title: "Bedwars Shop",
    subMenus: [
        {
            type: "entry",
            display: "Blocks",
            icon: "",
            title: "Blocks Shop",
            getBody: generateSecondMenuGetBody("Buy blocks"),
            subMenus: [
                generateBuyOneItemMenu("Wool", playerInfo => {
                    return {
                        type: ActionType.BuyNormalItem,
                        name: "Wool",
                        cost: { ironAmount: 4, goldAmount: 0, emeraldAmount: 0, diamondAmount: 0 },
                        items: [new mc.ItemStack(TEAM_CONSTANTS[playerInfo.team].woolName, 16)]
                    }
                }, playerInfo => TEAM_CONSTANTS[playerInfo.team].woolIconPath),
                generateBuyOneItemMenu("Tnt", () => ({
                    type: ActionType.BuyNormalItem,
                    name: "Tnt",
                    cost: { ironAmount: 0, goldAmount: 4, emeraldAmount: 0, diamondAmount: 0 },
                    items: [new mc.ItemStack(MinecraftItemTypes.Tnt)]
                }), () => "textures/blocks/tnt_side.png"),
                generateBuyOneItemMenu("Plank", () => ({
                    type: ActionType.BuyNormalItem,
                    name: "Plank",
                    cost: { ironAmount: 16, goldAmount: 0, emeraldAmount: 0, diamondAmount: 0 },
                    items: [new mc.ItemStack(MinecraftItemTypes.Planks, 8)]
                }), () => "textures/blocks/planks_oak.png"),
                generateBuyOneItemMenu("End Stone", () => ({
                    type: ActionType.BuyNormalItem,
                    name: "End Stone",
                    cost: { ironAmount: 16, goldAmount: 0, emeraldAmount: 0, diamondAmount: 0 },
                    items: [new mc.ItemStack(MinecraftItemTypes.EndStone, 4)]
                }), () => "textures/blocks/end_stone.png"),
                generateBuyOneItemMenu("Bow", () => ({
                    type: ActionType.BuyNormalItem,
                    name: "Bow",
                    cost: { ironAmount: 0, goldAmount: 10, emeraldAmount: 0, diamondAmount: 0 },
                    items: [new mc.ItemStack(MinecraftItemTypes.Bow, 1)]
                }), () => "textures/items/bow_pulling_0.png"),
                generateBuyOneItemMenu("Arrow", () => ({
                    type: ActionType.BuyNormalItem,
                    name: "Arrow",
                    cost: { ironAmount: 0, goldAmount: 8, emeraldAmount: 0, diamondAmount: 0 },
                    items: [new mc.ItemStack(MinecraftItemTypes.Arrow, 16)]
                }), () => "textures/items/arrow.png"),
                generateBuyOneItemMenu("Rescue Platform", () => ({
                    type: ActionType.BuyNormalItem,
                    name: "Rescue Platform",
                    cost: { ironAmount: 0, goldAmount: 0, emeraldAmount: 2, diamondAmount: 0 },
                    items: [PLATFORM_ITEM]
                }), () => "textures/items/blaze_rod.png")
            ]
        }, {
            type: "entry",
            display: "Weapons",
            icon: "",
            title: "Weapon Shop",
            getBody: generateSecondMenuGetBody("Buy weapons"),
            subMenus: [
                {
                    type: "action",
                    display: "U",
                    icon: "",
                    actions: [{
                        type: ActionType.UpgradeSword
                    }]
                }
            ]
        }
    ]
};

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
    const results: ActionResult[] = [];
    const player = playerInfo.player;
    const inv = player.getComponent("minecraft:inventory")!.container!

    for (const action of actions) {
        const tokens = calculateTokens(inv);
        if (action.type == ActionType.BuyNormalItem) {
            if (!isTokenSatisfying(tokens, action.cost)) {
                // Failed to buy, insufficient tokens
                player.playSound("note.bass");
                results.push({
                    type: ActionType.BuyNormalItem,
                    success: false,
                    lack: {
                        ironAmount: action.cost.ironAmount - tokens.ironAmount,
                        goldAmount: action.cost.goldAmount - tokens.goldAmount,
                        diamondAmount: action.cost.diamondAmount - tokens.diamondAmount,
                        emeraldAmount: action.cost.emeraldAmount - tokens.emeraldAmount,
                    }
                });
                continue;
            }
            consumeToken(inv, action.cost);

            for (const item of action.items) {
                if (/*inv.addItem(item)*/statckableFirstContainerAdd(inv, item)) { // if failed to add item
                    // spawn the item as entity
                    const entity = playerInfo.player.dimension.spawnItem(item, player.location);
                    entity.applyImpulse(v3.scale(entity.getVelocity(), -1));
                }
            };
            player.playSound("mob.endermen.portal");
            player.sendMessage(sprintf(PURCHASE_MESSAGE, action.name))
            results.push({
                type: ActionType.BuyNormalItem,
                success: true
            });
        } else if (action.type == ActionType.UpgradeSword) {
            ;
        }
    }
    return results;
}

export function openShop(playerInfo: PlayerGameInformation, game: BedWarsGame) {
    playerInfo.lastActionResults = [];
    showMenuForPlayer(playerInfo, SHOP_DATA, game, false);
}
