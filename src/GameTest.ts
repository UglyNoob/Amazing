import * as gt from '@minecraft/server-gametest';
import * as mc from '@minecraft/server';
import * as ui from '@minecraft/server-ui';
import { MinecraftBlockTypes } from '@minecraft/vanilla-data';
import { sleep } from './utility.js';

let gameTest: gt.Test;

gt.register("AmazingSimulatedPlayerFunctionalityImplementation", "Implementation", test => {
    gameTest = test;
    globalThis.test = gameTest;
}).maxTicks(2147483647).structureName("void:void");

/**
 * @returns {Promise<Boolean>} whether the player decides to continue
 */
async function showErrorMenu(player: mc.Player, message: string): Promise<boolean> {
    let form = new ui.MessageFormData();
    form.title("Error");
    form.body(message);
    form.button1("Close");
    form.button2("Back");
    let response = await form.show(player);
    if (!response.canceled && response.selection == 1) return true;
    return false;
}

export function setupGameTest(x: number, z: number, dimension: mc.Dimension) {
    x = Math.floor(x);
    z = Math.floor(z);
    x -= x % 32;
    z -= z % 32;
    dimension.fillBlocks(new mc.BlockVolume({ x: x, y: 317, z: z + 3 }, { x: x, y: 317, z: z + 3 }), MinecraftBlockTypes.Glass);
    dimension.fillBlocks(new mc.BlockVolume({ x: x, y: 318, z: z + 3 }, { x: x, y: 319, z: z + 3 }), MinecraftBlockTypes.Air);
    dimension.runCommandAsync(`execute positioned ${x} 319 ${z} run gametest run AmazingSimulatedPlayerFunctionalityImplementation:Implementation`);
}

mc.world.beforeEvents.chatSend.subscribe(event => {
    if (event.message != "spawn") return;
    if (!event.sender.isOp()) return;
    event.cancel = true;

    mc.system.run(async () => {
        const player = event.sender;

        if (!gameTest) {
            setupGameTest(player.location.x, player.location.z, player.dimension);
        }

        const dropdownFields = [mc.GameMode.survival, mc.GameMode.creative, mc.GameMode.adventure, mc.GameMode.spectator];
        let defaultName: string | undefined;
        let defaultGameModeChoice: number | undefined;
        let reShowed = false; // Indicates whether the form is showed again
        while (true) { // Repeats until the user fill everything legally
            const form = new ui.ModalFormData();
            form.title("Simulated Player Wizard");
            form.textField("Name:", "name of the simulated player...", defaultName);
            form.dropdown("Game Mode:", dropdownFields, defaultGameModeChoice);

            if (!reShowed) {
                player.sendMessage("Please close the chat menu to see the wizard");
            }
            let response: ui.ModalFormResponse;
            while (true) { // Repeats showing when the user is busy
                response = await form.show(event.sender);
                if (!response.canceled || response.cancelationReason != ui.FormCancelationReason.UserBusy) break;
                await sleep(5);
            }
            if (response.canceled) return;
            const name = response.formValues![0] as string;
            const gameMode = dropdownFields[response.formValues![1] as number];
            if (name == "") { // Name is blank
                let doContinue = await showErrorMenu(player, "Please specify the name");
                if (doContinue) {
                    defaultGameModeChoice = response.formValues![1] as number;
                    reShowed = true;
                    continue;
                }
                break;
            }
            if (mc.world.getAllPlayers().find(player => player.name === name)) { // Name already exists
                let doContinue = await showErrorMenu(player, "The name you specify already exists on this server.");
                if (doContinue) {
                    defaultName = name;
                    defaultGameModeChoice = response.formValues![1] as number;
                    reShowed = true;
                    continue;
                }
                break;
            }
            // All valid, start spawning
            try {
                gameTest.spawnSimulatedPlayer(gameTest.relativeBlockLocation(player.location as any), name, gameMode);
            } catch {
                player.sendMessage("Failed to spawn the player.");
            }

            break;
        }
    });
});

mc.world.afterEvents.entityDie.subscribe(event => {
    if (event.deadEntity instanceof gt.SimulatedPlayer) {
        let sPlayer = event.deadEntity;
        // mc.world.sendMessage(`${sPlayer.name} will respawn in 5 seconds`);
        mc.system.runTimeout(() => sPlayer.respawn(), 20);
    }
});
