import * as mc from '@minecraft/server';
import * as ui from '@minecraft/server-ui';
import * as mcMath from '@minecraft/math';

import * as util from './utility.js';

mc.world.beforeEvents.itemUse.subscribe(event => {
    if (!event.source.isOp()) return;
    if (event.itemStack.nameTag === "Debug Stick") {
        event.cancel = true;

        let data = new ui.ModalFormData();
        data.title("Debug Stick");
        data.textField("Enter expression", "expression...");
        mc.system.run(() => data.show(event.source).then(response => {
            if (response.canceled) return;
            try {
                const me = event.source;
                let code = "const ___players = []\nfor(const p of mc.world.getAllPlayers()){___players.push(p)\n}";
                let index = 0;
                for (const player of mc.world.getAllPlayers()) {
                    let name = player.name;
                    { // does the name prefix with digit
                        const head = player.name.codePointAt(0);
                        if (head && head >= 48 && head <= 57) {
                            name = "p" + name;
                        }
                    }
                    name = name.replaceAll(' ', '_');
                    name = name.replaceAll(',', '_');
                    name = name.replaceAll(';', '_');
                    name = name.replaceAll('?', '_');
                    name = name.replaceAll('!', '_');
                    name = name.replaceAll('+', '_');
                    name = name.replaceAll('-', '_');
                    name = name.replaceAll('*', '_');
                    name = name.replaceAll('/', '_');
                    name = name.replaceAll('{', '_');
                    name = name.replaceAll('}', '_');
                    name = name.replaceAll('[', '_');
                    name = name.replaceAll(']', '_');
                    name = name.replaceAll('.', '_');
                    name = name.replaceAll('\\', '_');
                    name = name.replaceAll('<', '_');
                    name = name.replaceAll('>', '_');
                    code += `let ${name} = ___players[${index}]\n`;
                    ++index;
                }
                code += `return ${response.formValues![0]}`;
                let result = new Function('mc', 'ui', 'util', 'mcMath', 'me', code)(
                    mc, ui, util, mcMath, me
                );
                util.showObjectToPlayer(event.source, result);
            } catch (e) {
                if (e instanceof Error) {
                    event.source.sendMessage(`§c${e.name}: ${e.message}\n${e?.stack}`);
                }
            }
        }));
    }
});
