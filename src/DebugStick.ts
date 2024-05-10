import * as mc from '@minecraft/server';
import * as ui from '@minecraft/server-ui';
import * as mcMath from '@minecraft/math';

import * as util from './utility.js';

const PLAYER_DEBUG_MODE_SYM = Symbol("enabled");
const DEBUG_MODE_COOLDOWN_SYM = Symbol("cooldown");
const DEBUG_COOLDOWN = 10;

declare module "@minecraft/server" {
    interface Player {
        [PLAYER_DEBUG_MODE_SYM]: boolean;
        [DEBUG_MODE_COOLDOWN_SYM]: number;
    }
}

function isItemDebugStick(item: mc.ItemStack) {
    return item.nameTag == "Debug Stick";
}

mc.system.runInterval(() => {
    for (const player of mc.world.getAllPlayers()) {
        if (!player.isOp()) continue;

        if (player[DEBUG_MODE_COOLDOWN_SYM] == undefined) {
            player[DEBUG_MODE_COOLDOWN_SYM] = 0;
        } else if (player[DEBUG_MODE_COOLDOWN_SYM] > 0) {
            --player[DEBUG_MODE_COOLDOWN_SYM];
        }
        if (player[PLAYER_DEBUG_MODE_SYM]) {
            player.onScreenDisplay.setActionBar("§6§lDEBUG MODE");
        }
    }
});

mc.world.beforeEvents.itemUse.subscribe(async event => {
    if (!event.source.isOp()) return;
    if (!isItemDebugStick(event.itemStack)) return;
    event.cancel = true;

    if (event.source[PLAYER_DEBUG_MODE_SYM] == undefined) {
        event.source[PLAYER_DEBUG_MODE_SYM] = false;
    }

    let data = new ui.ModalFormData();
    data.title("Debug Stick");
    data.toggle("Debug Mode", event.source[PLAYER_DEBUG_MODE_SYM]);
    data.textField("Enter expression", "expression...");

    await util.sleep(0);
    const response = await data.show(event.source);
    if (response.canceled) return;
    event.source[PLAYER_DEBUG_MODE_SYM] = response.formValues![0] as boolean;

    let code = "const ___players = []\nfor(const p of mc.world.getAllPlayers()){___players.push(p)\n}";
    let index = 0;
    for (const player of mc.world.getAllPlayers()) {
        let name = player.name;
        let changedName = "";
        { // does the name prefix with digit
            const head = player.name.codePointAt(0);
            if (head && head >= 48 && head <= 57) {
                changedName = "p";
            }
        }
        for (const char of name) {
            const point = char.codePointAt(0) as any;
            if ((point >= 97 && point <= 122) ||
                (point >= 65 && point <= 90) ||
                (point >= 48) && (point <= 57)) {
                changedName += char;
            } else {
                changedName += '_';
            }
        }
        code += `let ${ changedName } = ___players[${ index }]\n`;
        ++index;
    }
    code += `return ${ response.formValues![1] }`;
    try {
        let result = new Function('mc', 'ui', 'util', 'mcMath', 'me', code)(
            mc, ui, util, mcMath, event.source
        );
        util.showObjectToPlayer(event.source, result);
    } catch (e) {
        if (e instanceof Error) {
            event.source.sendMessage(`§c${ e.name }: ${ e.message }\n${ e?.stack }`);
        }
    }
});

mc.world.beforeEvents.playerInteractWithBlock.subscribe(async event => {
    const player = event.player;
    if (!player[PLAYER_DEBUG_MODE_SYM]) return;
    if (event.itemStack && isItemDebugStick(event.itemStack)) return;
    if (player[DEBUG_MODE_COOLDOWN_SYM] > 0) return;
    if (player.isSneaking) return;
    event.cancel = true;
    player[DEBUG_MODE_COOLDOWN_SYM] = DEBUG_COOLDOWN;

    const obj = event.block.permutation.getAllStates();
    obj.location = mcMath.Vector3Utils.toString(event.block.location, {
        decimals: 0
    });
    obj.tags = event.block.getTags().join(", ");

    await util.sleep(0);
    util.showObjectToPlayer(player, obj);
});

mc.world.beforeEvents.playerInteractWithEntity.subscribe(async event => {
    const player = event.player;
    if (!player[PLAYER_DEBUG_MODE_SYM]) return;
    if (event.itemStack && isItemDebugStick(event.itemStack)) return;
    if (player[DEBUG_MODE_COOLDOWN_SYM] > 0) return;
    event.cancel = true;
    player[DEBUG_MODE_COOLDOWN_SYM] = DEBUG_COOLDOWN;

    await util.sleep(0);
    util.showObjectToPlayer(player, event.target);
});
