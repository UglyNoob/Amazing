import * as mc from '@minecraft/server';
import { showObjectToPlayer } from './utility.js';

function defineEnum() {}

/*
 * Bed occupies two blocks
 * Generators types: iron_gold, diamond, emerald
 * iron_gold generator is a 3 by 3 area
 * diamond and emerald generators is a single block area
 *
 * The shop is a lever. Players switch it to open the shop.
 *
 * One player could have different status during the game.
 * Player state: alive, respawning, disconnected, dead
 * Game state: pending, started, ended
 */

const GENERATOR_TYPES = defineEnum(["iron_gold", "diamond", "emerald"]);
const TEAM_TYPES = defineEnum(["red", "green", "yellow", "blue"])
const PLAYER_STATE_TYPES = defineEnum(["alive", "respawning", "disconnected", "dead"]);
const GAME_STATE_TYPES = defineEnum(["pending", "started", "ended"]);

const log = s => mc.world.sendMessage(String(s));

function MapInfo() {
    this.teams = {};
    this.generators = [];
}
MapInfo.prototype.addTeam = function(team) {
    console.assert(!this.teams[team]);

    this.teams[team] = {
        bed: [],
        shopLocation: []
    };
}
MapInfo.prototype.setBed = function(team, location1, location2) {
    console.assert(this.teams[team]);

    this.teams[team].bed = [location1, location2];
};
MapInfo.prototype.addGenerator = function(team, genType, location) {
    console.assert(this.teams[team]);

    this.generators.push({type: genType, location: location, team: team});
}
MapInfo.prototype.setShop = function(team, location) {
    console.assert(this.teams[team]);
    this.teams[team].shopLocation = location;
}
MapInfo.prototype.getTeams = function() {
    return Object.keys(this.teams);
}
MapInfo.prototype.getAllGenerators = function() {
    return this.generators;
}

function GameSettings() {}
GameSettings.prototype.setMapInfo = function(mapInfo) {
    this.mapInfo = mapInfo;
}
GameSettings.prototype.getMapInfo = function(mapInfo) {
    return this.mapInfo;
}

function Game() {
    this.teams = {};
    this.players = {};
    this.state = GAME_STATE_TYPES.pending;
}
Game.prototype.setSettings = function(settings) {
    this.settings = settings;
}
Game.prototype.getSettings = function() {
    return this.settings;
}
Game.prototype._addTeam = function(team) {
    this.teams[team] = {
        players: []
    };
}
Game.prototype._addPlayer = function(player) {
}
Game.prototype.setPlayer =  function(playerName, team) {
    if(!this.teams[team]) this._addTeam(team);

    for(let iteam of Object.keys(this.teams)) {
        let index = this.teams[iteam].players.indexOf(player);
        if(index >= 0) {
            this.teams[iteam].players.splice(index, 1);
            break;
        }
    }
    this.teams[team].players.push(player);
}
Game.prototype.resetAllStatus = function() {
    // TODO
}
Game.prototype.removePlayer = function(player) {
    // TODO
}
Game.prototype.getState = function() {
    // TODO
}
Game.prototype.start = function() {
    // TODO
}
Game.prototype.mainLoop = function() { // Should be called every tick
    // TODO
}

mc.world.beforeEvents.chatSend.subscribe(event => {
    let player = event.sender;
    let message = event.message;
    if(message == "!start") {
        let game = new Game();
        game.setPlayer(player, TEAM_TYPES.red);
        log(JSON.stringify(game.teams, null, 2));
        game.setPlayer(player, TEAM_TYPES.blue);
        log(JSON.stringify(game.teams, null, 2));
    }
});
