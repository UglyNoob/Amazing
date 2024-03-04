import './SumoStick.js';
import './FireSword.js';
import './DebugStick.js';
import './RescuePlatform.js';
import './Bedwars.js';
import './GameTest.js';

import * as mc from '@minecraft/server';
// DEBUG DEBUG DEBUG
mc.system.beforeEvents.watchdogTerminate.subscribe(event => {
    mc.world.sendMessage(`§4Yall gotta be careful! ${event.terminateReason}`);
});