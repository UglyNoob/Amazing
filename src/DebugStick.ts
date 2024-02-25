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
                const formValues = response.formValues;
                let result = new Function('mc', 'ui', 'util', 'mcMath', 'me', `return ${formValues[0]}`)(
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
