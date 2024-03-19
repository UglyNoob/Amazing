import * as mc from "@minecraft/server";
import {
    IRON_ITEM_STACK,
    GOLD_ITEM_STACK,
    DIAMOND_ITEM_STACK,
    EMERALD_ITEM_STACK,
    Game,
    PlayerGameInformation,
    PlayerState,
    getWoolItemNameOfTeam
} from "./Bedwars.js";
import { ActionFormData } from "@minecraft/server-ui";
import { containerIterator, itemEqual } from './utility.js'
import { Vector3Utils as v3 } from "@minecraft/math";


enum ActionType {
    BuyNormalItem,
    UpgradeSword,
    BuyArmor
}

interface TokenValue {
    ironAmount: number;
    goldAmount: number;
    diamondAmount: number;
    emeraldAmount: number;
}

interface BuyNormalItemAction {
    type: ActionType.BuyNormalItem;
    cost: TokenValue;
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
    costWooden: TokenValue;
}

type Action = BuyNormalItemAction |
    UpgradeSwordAction;
export type ActionResult = BuyNormalItemResult;

type isUnion<T, K = T> = T extends any ? (Exclude<K, T> extends T ? false : true) : false;

type FieldOrFunction<PropName extends string, ValueType> = isUnion<PropName> extends true ? never : {
    [prop in PropName]: ValueType;
} | {
        [prop in PropName as `get${Capitalize<prop>}`]: (playerInfo: PlayerGameInformation, tokens: TokenValue, game: Game) => ValueType;
    }

type Menu = FieldOrFunction<"display", string> & (
    ({ type: "entry"; }
        & FieldOrFunction<"body", string>
        & FieldOrFunction<"title", string>
        & FieldOrFunction<"subMenus", Menu[]>)
    |
    ({ type: "action"; }
        & FieldOrFunction<"actions", Action[]>)
);

const SHOP_DATA: Menu = {
    type: "entry",
    body: "This is the shop",
    display: "",
    title: "Shop",
    subMenus: [
        {
            type: "entry",
            display: "Blocks",
            title: "Blocks Shop",
            getBody(playerInfo) {
                if (playerInfo.lastActionResults.length != 0) {
                    for (const result of playerInfo.lastActionResults) {
                        if (!result.success) {
                            return "Insufficient tokens.";
                        }
                    }
                    return "Success!";
                }
                return "Buy some blocks";
            },
            subMenus: [
                {
                    type: "action",
                    display: "Wools\n1 iron",
                    getActions(playerInfo) {
                        return [{
                            type: ActionType.BuyNormalItem,
                            cost: {ironAmount: 1, goldAmount: 0, emeraldAmount: 0, diamondAmount: 0},
                            items: [new mc.ItemStack(getWoolItemNameOfTeam(playerInfo.team), 16)]
                        }];
                    }
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
    for (const item of containerIterator(container)) {
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
    let slot = -1;
    // Consume tokens
    for (const item of containerIterator(container)) {
        ++slot;
        if (!item) continue;
        if (itemEqual(item, IRON_ITEM_STACK)) {
            if (tokens.ironAmount >= item.amount) {
                tokens.ironAmount -= item.amount;
                container.setItem(slot); // clear the slot
            } else {
                item.amount -= tokens.ironAmount;
                tokens.ironAmount = 0;
                container.setItem(slot, item);
            }
        }
        if (itemEqual(item, GOLD_ITEM_STACK)) {
            if (tokens.goldAmount >= item.amount) {
                tokens.goldAmount -= item.amount;
                container.setItem(slot); // clear the slot
            } else {
                item.amount -= tokens.goldAmount;
                tokens.goldAmount = 0;
                container.setItem(slot, item);
            }
        }
        if (itemEqual(item, DIAMOND_ITEM_STACK)) {
            if (tokens.diamondAmount >= item.amount) {
                tokens.diamondAmount -= item.amount;
                container.setItem(slot); // clear the slot
            } else {
                item.amount -= tokens.diamondAmount;
                tokens.diamondAmount = 0;
                container.setItem(slot, item);
            }
        }
        if (itemEqual(item, EMERALD_ITEM_STACK)) {
            if (tokens.emeraldAmount >= item.amount) {
                tokens.emeraldAmount -= item.amount;
                container.setItem(slot); // clear the slot
            } else {
                item.amount -= tokens.emeraldAmount;
                tokens.emeraldAmount = 0;
                container.setItem(slot, item);
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
async function showMenuForPlayer(playerInfo: PlayerGameInformation, menu: Menu, hasParentMenu: boolean): Promise<boolean> {
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
            if ("display" in subMenu) {
                display = subMenu.display;
            } else {
                display = subMenu.getDisplay(playerInfo, currentTokens, game);
            }
            subMenuDisplays.push(display);
            form.button(display);
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
            const canceled = await showMenuForPlayer(playerInfo, selectedMenu, true);
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
                if (inv.addItem(item)) { // if failed to add item
                    // spawn the item as entity
                    const entity = playerInfo.player.dimension.spawnItem(item, player.location);
                    entity.applyImpulse(v3.scale(entity.getVelocity(), -1));
                }
            };
            player.playSound("note.banjo");
            results.push({
                type: ActionType.BuyNormalItem,
                success: true
            });
        } else if(action.type == ActionType.UpgradeSword) {
            ;
        }
    }
    return results;
}

export function openShop(playerInfo: PlayerGameInformation) {
    playerInfo.lastActionResults = [];
    showMenuForPlayer(playerInfo, SHOP_DATA, false);
}
