import * as gt from '@minecraft/server-gametest';
import * as mc from '@minecraft/server';
import { MinecraftBlockTypes } from '@minecraft/vanilla-data';

let gameTest: gt.Test;

gt.register("AmazingSimulatedPlayerFunctionalityImplementation", "Implementation", test => {
    gameTest = test;
    (globalThis as any).test = gameTest;
}).maxTicks(2147483647).structureName("void:void");

mc.world.getDimension(mc.MinecraftDimensionTypes.overworld).fillBlocks({x: 0, y: 317, z: 0}, {x: 0, y: 317, z: 0}, MinecraftBlockTypes.Glass);
mc.world.getDimension(mc.MinecraftDimensionTypes.overworld).fillBlocks({x: 0, y: 318, z: 0}, {x: 0, y: 319, z: 0}, MinecraftBlockTypes.Air);
mc.world.getDimension(mc.MinecraftDimensionTypes.overworld).runCommand("execute positioned 0 319 -3 run gametest run AmazingSimulatedPlayerFunctionalityImplementation:Implementation");

mc.world.beforeEvents.chatSend.subscribe(event => {
    if(event.message == "test") {
        mc.system.run(() => {
            let loc = mc.world.getAllPlayers()[0].location;
            event.cancel = true;
            gameTest.spawnSimulatedPlayer(gameTest.relativeBlockLocation(loc as any), "WOWME", mc.GameMode.survival);
        });
    }
})