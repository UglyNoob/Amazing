import * as mc from '@minecraft/server';
import * as ui from '@minecraft/server-ui';

import * as util from './utility.js';

mc.world.beforeEvents.itemUse.subscribe(event => {
    if(event.itemStack.nameTag === "Debug Stick") {
        if(!event.source.isOp()) return;
        event.cancel = true;

        let data = new ui.ModalFormData();
        data.title("Debug Stick");
        data.textField("Enter expersion", "expersion...");
        mc.system.run(() => data.show(event.source).then(response => {
            if(response.canceled) return;
            try {
                let result = eval(response.formValues[0]);
                util.showObjectToPlayer(event.source, result);
            } catch(e) {
                event.source.sendMessage(`§c${e.name}: ${e.message}\n${e?.stack}`);
            }
        }));
    }
});
