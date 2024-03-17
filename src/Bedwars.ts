import { Vector3Utils as v3 } from '@minecraft/math';
import * as mc from '@minecraft/server';
import * as ui from '@minecraft/server-ui';
import { sleep } from './utility.js';
import { setupGameTest } from './GameTest.js';
import { MinecraftItemTypes } from '@minecraft/vanilla-data';

import { sprintf, vsprintf } from 'sprintf-js';
import { ActionResult, openShop } from './BedwarsShop.js';

const RESPAWN_TIME = 100; // in ticks
const AIR_PERM = mc.BlockPermutation.resolve("minecraft:air");
const IRONGOLD_GENERATOR_INTERVAL = 200;
const DIAMOND_GENERATOR_INTERVAL = 300;
const EMERLAD_GENERATOR_INTERVAL = 400;
export const IRON_ITEM_STACK = new mc.ItemStack(MinecraftItemTypes.IronIngot);
IRON_ITEM_STACK.nameTag = "Iron Token";
export const GOLD_ITEM_STACK = new mc.ItemStack(MinecraftItemTypes.GoldIngot);
GOLD_ITEM_STACK.nameTag = "Gold Token";
export const DIAMOND_ITEM_STACK = new mc.ItemStack(MinecraftItemTypes.Diamond);
DIAMOND_ITEM_STACK.nameTag = "Diamond Token";
export const EMERALD_ITEM_STACK = new mc.ItemStack(MinecraftItemTypes.Emerald);
EMERALD_ITEM_STACK.nameTag = "Emerald Token";

const DEATH_TITLE = "§cYOU DIED!";
const DEATH_SUBTITLE = "§eYou will respawn in §c%d §eseconds!";
const RESPAWN_TITLE = "§aRESPAWNED!";
const BED_DESTROYED_TITLE = "§cBED DESTROYED!";
const TEAM_BED_DESTROYED_MESSAGE = "§l%s%s§c's bed has been destroyed!";

enum GeneratorType {
    IronGold,
    Diamond,
    Emerald
}
enum TeamType {
    Red,
    Blue,
    Yellow,
    Green
}
interface GeneratorInformation {
    type: GeneratorType;
    spawnLocation: mc.Vector3;
    defaultInterval: number;
}
interface TeamInformation {
    type: TeamType;
    shopLocation: mc.Vector3;
    teamGenerator: GeneratorInformation;
    bedLocation: [mc.Vector3, mc.Vector3];
    playerSpawn: mc.Vector3;
    playerSpawnViewDirection: mc.Vector3;
}
interface MapInformation {
    teams: TeamInformation[];
    extraGenerators: GeneratorInformation[];
    size: mc.Vector3;
    /**
     * Used to detect respawning player
     */
    fallbackRespawnPoint: mc.Vector3;
}

function getNameOfTeam(t: TeamType) {
    switch (t) {
        case TeamType.Blue:
            return "blue";
        case TeamType.Green:
            return "green";
        case TeamType.Red:
            return "red";
        case TeamType.Yellow:
            return "yellow";
    }
}
function getColorPrefixOfTeam(t: TeamType) {
    switch (t) {
        case TeamType.Blue:
            return "§b";
        case TeamType.Green:
            return "§2";
        case TeamType.Red:
            return "§m";
        case TeamType.Yellow:
            return "§g";
    }
}

const testMap: MapInformation = {
    size: { x: 21, y: 3, z: 5 },
    fallbackRespawnPoint: { x: 0, y: 200, z: 0 },
    teams: [
        {
            type: TeamType.Red,
            shopLocation: { x: 6, y: 2, z: 4 },
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 1.5, y: 1.5, z: 2.5 },
                defaultInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: 4, y: 1, z: 2 }, { x: 5, y: 1, z: 2 }],
            playerSpawn: { x: 3.5, y: 1, z: 2.5 },
            playerSpawnViewDirection: { x: 1, y: 0, z: 0 }
        },
        {
            type: TeamType.Blue,
            shopLocation: { x: 14, y: 2, z: 0 },
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 19.5, y: 1.5, z: 2.5 },
                defaultInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: 16, y: 1, z: 2 }, { x: 15, y: 1, z: 2 }],
            playerSpawn: { x: 17.5, y: 1, z: 2.5 },
            playerSpawnViewDirection: { x: -1, y: 0, z: 0 }
        }
    ],
    extraGenerators: [
        {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 10.5, y: 1, z: 0.5 },
            defaultInterval: DIAMOND_GENERATOR_INTERVAL
        },
        {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 10.5, y: 1, z: 4.5 },
            defaultInterval: DIAMOND_GENERATOR_INTERVAL
        },
        {
            type: GeneratorType.Emerald,
            spawnLocation: { x: 10.5, y: 1, z: 2.5 },
            defaultInterval: EMERLAD_GENERATOR_INTERVAL
        }
    ]
};

export enum PlayerState {
    Alive,
    Offline,
    dead, // When the player haven't clicked the "respawn" button
    Respawning,
    Spectating
}
enum TeamState {
    BedAlive,
    BedDestoryed,
    Dead
}

enum GameState {
    waiting,
    started
}

type GeneratorGameInformation = {
    spawnLocation: mc.Vector3;
    type: GeneratorType;
    interval: number;
    remainingCooldown: number;
} & ({
    belongToTeam: true;
    team: TeamType;
} | {
    belongToTeam: false;
});

export interface PlayerGameInformation {
    name: string;
    team: TeamType;
    state: PlayerState;
    player: mc.Player;
    deathTime: number; // global tick
    deathLocation: mc.Vector3;
    deathRotaion: mc.Vector2;
    /**
     * Cleared when the player opens menu or press the back button,
     * set when the player perform an action
     */
    lastActionResults: ActionResult[];
}
export class Game {
    private map: MapInformation;
    private players: {
        [name: string]: PlayerGameInformation
    };
    private teamStates: Map<TeamType, TeamState>;
    private originLocation: mc.Vector3;
    private state: GameState;
    private dimension: mc.Dimension;
    private generators: GeneratorGameInformation[];


    constructor({ map: _map, originLocation: _origin, dimension: _dimension }: { map: MapInformation, originLocation: mc.Vector3, dimension: mc.Dimension }) {
        this.map = _map;
        this.originLocation = _origin;
        this.state = GameState.waiting;
        this.players = Object.create(null);
        this.dimension = _dimension;
        this.teamStates = new Map();
        for (const team of this.map.teams) {
            this.teamStates.set(team.type, TeamState.BedAlive);
        }
        this.generators = [];
        for (const teamInfo of this.map.teams) {
            const genInfo = teamInfo.teamGenerator;
            this.generators.push({
                spawnLocation: genInfo.spawnLocation,
                type: genInfo.type,
                interval: genInfo.defaultInterval,
                remainingCooldown: 0,
                belongToTeam: true,
                team: teamInfo.type
            });
        }
        for (const genInfo of this.map.extraGenerators) {
            this.generators.push({
                spawnLocation: genInfo.spawnLocation,
                type: genInfo.type,
                interval: genInfo.defaultInterval,
                remainingCooldown: 0,
                belongToTeam: false
            });
        }
    }

    setPlayer(player: mc.Player, team: TeamType) {
        if (this.players[player.name]) {
            this.players[player.name].team = team;
            return;
        }
        this.players[player.name] = {
            name: player.name,
            state: PlayerState.Alive,
            player,
            team,
            deathLocation: { x: 0, y: 0, z: 0 },
            deathTime: 0,
            deathRotaion: { x: 0, y: 0 },
            lastActionResults: []
        };
    }

    start() {
        this.state = GameState.started;
        for (const playerInfo of Object.values(this.players)) {
            if (!playerInfo.player.isValid()) {
                playerInfo.state = PlayerState.Offline;
                continue;
            }
            this.respawnPlayer(playerInfo);
        }
        for (const gen of this.generators) {
            gen.remainingCooldown = gen.interval;
        }
    }

    private respawnPlayer(playerInfo: PlayerGameInformation) {
        const teamInfo = this.map.teams.find(ele => ele.type === playerInfo.team)!;
        const spawnPoint = v3.add(teamInfo.playerSpawn, this.originLocation);
        playerInfo.player.teleport(spawnPoint, { facingLocation: v3.add(spawnPoint, teamInfo.playerSpawnViewDirection) });
        playerInfo.player.runCommand("gamemode survival");
        playerInfo.player.getComponent("minecraft:health")!.resetToMaxValue();
        playerInfo.player.extinguishFire();
        playerInfo.state = PlayerState.Alive;
    }

    getMainShopMenu(playerInfo: PlayerGameInformation) {
        ;
    }
    private async openShopMenuForPlayer(playerInfo: PlayerGameInformation) {
        while (true) {
            const form = new ui.ActionFormData();
            form.title("Shop");
            form.body("Buy something");

            const response = await form.show(playerInfo.player);
            if (playerInfo.state != PlayerState.Alive) return;
            if (response.canceled) return;
        }
    }

    private broadcast(content: any, ...params: any[]) {
        for (const playerInfo of Object.values(this.players)) {
            if (playerInfo.state == PlayerState.Offline) return;
            playerInfo.player.sendMessage(vsprintf(String(content), params));
        }
    }

    tickEvent() {
        if (this.state != GameState.started) return;
        for (const playerInfo of Object.values(this.players)) {
            if (playerInfo.state == PlayerState.Offline) continue;
            const player = playerInfo.player;
            if (!player.isValid()) {
                playerInfo.state = PlayerState.Offline;
                continue;
            }

            if (v3.distance(v3.add(this.originLocation, this.map.fallbackRespawnPoint), player.location) <= 1) {
                player.runCommand("gamemode spectator");
                player.teleport(playerInfo.deathLocation, { rotation: playerInfo.deathRotaion });
                player.onScreenDisplay.setTitle(DEATH_TITLE, {
                    subtitle: sprintf(DEATH_SUBTITLE, RESPAWN_TIME / 20),
                    fadeInDuration: 0,
                    stayDuration: 30,
                    fadeOutDuration: 20,
                });
                if (playerInfo.state == PlayerState.dead) {
                    playerInfo.state = PlayerState.Respawning;
                }
            }

            if (playerInfo.state == PlayerState.Respawning) {
                const remainingTicks = RESPAWN_TIME + playerInfo.deathTime - mc.system.currentTick;
                if (remainingTicks <= 0) {
                    this.respawnPlayer(playerInfo);
                    player.onScreenDisplay.setTitle(RESPAWN_TITLE, {
                        fadeInDuration: 0,
                        stayDuration: 10,
                        fadeOutDuration: 20,
                    });
                } else if (remainingTicks % 20 == 0) {
                    player.onScreenDisplay.setTitle(DEATH_TITLE, {
                        subtitle: sprintf(DEATH_SUBTITLE, remainingTicks / 20),
                        fadeInDuration: 0,
                        stayDuration: 30,
                        fadeOutDuration: 20,
                    });
                }
            }
        }
        for (const gen of this.generators) {
            --gen.remainingCooldown;
            if (gen.remainingCooldown != 0) continue;

            gen.remainingCooldown = gen.interval;
            const location = v3.add(gen.spawnLocation, this.originLocation);

            let itemEntity: mc.Entity;
            switch (gen.type) {
                case GeneratorType.IronGold:
                    itemEntity = this.dimension.spawnItem(IRON_ITEM_STACK, location);
                    break;
                case GeneratorType.Diamond:
                    itemEntity = this.dimension.spawnItem(DIAMOND_ITEM_STACK, location);
                    break;
                case GeneratorType.Emerald:
                    itemEntity = this.dimension.spawnItem(EMERALD_ITEM_STACK, location);
                    break;
            }
            if (gen.type == GeneratorType.IronGold) continue;
            const v = itemEntity.getVelocity();
            v.x = -v.x;
            v.y = 0;
            v.z = -v.z;
            itemEntity.applyImpulse(v);
        }
    }

    afterEntityDie(event: mc.EntityDieAfterEvent) {
        if (this.state != GameState.started) return;
        if (!(event.deadEntity instanceof mc.Player)) return;
        let player = event.deadEntity;
        if (!this.players[player.name]) return;

        const playerInfo = this.players[player.name];
        playerInfo.deathTime = mc.system.currentTick;
        playerInfo.deathLocation = player.location;
        playerInfo.deathRotaion = player.getRotation();
        if (this.teamStates.get(playerInfo.team) == TeamState.BedDestoryed) {
            playerInfo.state = PlayerState.Spectating;
        } else {
            playerInfo.state = PlayerState.dead;
        }

        player.setSpawnPoint(Object.assign({ dimension: player.dimension }, v3.add(this.originLocation, this.map.fallbackRespawnPoint)));
    }
    async beforePlayerInteractWithBlock(event: mc.PlayerInteractWithBlockBeforeEvent) {
        if (this.state != GameState.started) return;

        if (event.block.dimension != this.dimension) return;
        const playerInfo = this.players[event.player.name];
        if (!playerInfo) return;

        for (const { shopLocation } of this.map.teams) {
            if (v3.equals(v3.add(this.originLocation, shopLocation), event.block.location)) {
                await sleep(0);
                openShop(playerInfo);
                return;
            }
        }
    }
    beforePlayerInteractWithEntity(event: mc.PlayerInteractWithEntityBeforeEvent) {
        if (this.state != GameState.started) return;
    }
    async beforePlayerBreakBlock(event: mc.PlayerBreakBlockBeforeEvent) {
        if (this.state != GameState.started) return;
        if (event.dimension != this.dimension) return;
        if (event.block.typeId != "minecraft:bed") return;

        const destroyedTeam = this.map.teams.find(team =>
            team.bedLocation.findIndex(pos =>
                v3.equals(v3.add(pos, this.originLocation), event.block.location)) != -1);
        const destroyerInfo = this.players[event.player.name];
        if (!destroyedTeam) return;
        event.cancel = true;
        if (!destroyerInfo) return;
        if (destroyedTeam.type != destroyerInfo.team) {
            await sleep(0);
            /* Clear the bed */
            event.dimension.fillBlocks(v3.add(destroyedTeam.bedLocation[0], this.originLocation),
                v3.add(destroyedTeam.bedLocation[1], this.originLocation), AIR_PERM);
            for (const playerInfo of Object.values(this.players)) {
                if (playerInfo.state == PlayerState.Offline) continue;

                if (playerInfo.team == destroyedTeam.type) {
                    playerInfo.player.playSound("mob.wither.death");
                    playerInfo.player.onScreenDisplay.setTitle(BED_DESTROYED_TITLE, {
                        fadeInDuration: 5,
                        stayDuration: 40,
                        fadeOutDuration: 10
                    });
                } else {
                    playerInfo.player.playSound("mob.enderdragon.growl", { volume: 0.1 });
                }
                playerInfo.player.sendMessage(sprintf(TEAM_BED_DESTROYED_MESSAGE,
                    getColorPrefixOfTeam(destroyedTeam.type), getNameOfTeam(destroyedTeam.type)));
            }
        }
        this.teamStates.set(destroyedTeam.type, TeamState.BedDestoryed);
    }
};

let game: Game;

mc.world.beforeEvents.chatSend.subscribe(async event => {
    if (event.message == "start") {
        event.cancel = true;
        await sleep(0); // get out of read-only mode
        setupGameTest(event.sender.location.x, event.sender.location.z, event.sender.dimension);
        mc.system.run(function loop() {
            if (!globalThis.test) {
                mc.system.run(loop);
                return;
            }
            globalThis.test.spawnSimulatedPlayer(event.sender.location as any, "a");
            const players = mc.world.getAllPlayers();
            game = new Game({ map: testMap, originLocation: { x: -17, y: 5, z: 32 }, dimension: players[0].dimension });
            game.setPlayer(players[0], TeamType.Red);
            game.setPlayer(players[1], TeamType.Blue);
            game.start();
            globalThis.game = game;
        });
    }
})

mc.world.afterEvents.entityDie.subscribe(event => {
    if (game) {
        game.afterEntityDie(event);
    }
});
mc.world.beforeEvents.playerBreakBlock.subscribe(event => {
    if (game) {
        game.beforePlayerBreakBlock(event);
    }
});
mc.world.beforeEvents.itemUse.subscribe(event => {
    if (game) {
    }
});
mc.world.beforeEvents.playerInteractWithBlock.subscribe(event => {
    if (game) {
        game.beforePlayerInteractWithBlock(event);
    }
})
mc.world.beforeEvents.playerInteractWithEntity.subscribe(event => {
    if (game) {
        game.beforePlayerInteractWithEntity(event);
    }
});
mc.system.runInterval(() => {
    if (game) game.tickEvent();
});

(globalThis as any).me = mc.world.getAllPlayers().filter(p => p.name == "SkeletonSquid12")[0];
