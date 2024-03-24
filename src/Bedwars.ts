import { Vector3Utils as v3 } from '@minecraft/math';
import * as mc from '@minecraft/server';
import { itemEqual, showObjectToPlayer, sleep, vectorAdd, vectorWithinArea } from './utility.js';
import { setupGameTest } from './GameTest.js';
import { MinecraftItemTypes } from '@minecraft/vanilla-data';

import { sprintf, vsprintf } from 'sprintf-js';
import { ActionResult, openShop } from './BedwarsShop.js';
import { isLocationPartOfAnyPlatforms } from './RescuePlatform.js';

const RESPAWN_TIME = 100; // in ticks
const IRONGOLD_GENERATOR_INTERVAL = 50;
const DIAMOND_GENERATOR_INTERVAL = 600;
const EMERLAD_GENERATOR_INTERVAL = 1200;
export const IRON_ITEM_STACK = new mc.ItemStack(MinecraftItemTypes.IronIngot);
IRON_ITEM_STACK.nameTag = "Iron Token";
export const GOLD_ITEM_STACK = new mc.ItemStack(MinecraftItemTypes.GoldIngot);
GOLD_ITEM_STACK.nameTag = "Gold Token";
export const DIAMOND_ITEM_STACK = new mc.ItemStack(MinecraftItemTypes.Diamond);
DIAMOND_ITEM_STACK.nameTag = "Diamond Token";
export const EMERALD_ITEM_STACK = new mc.ItemStack(MinecraftItemTypes.Emerald);
EMERALD_ITEM_STACK.nameTag = "Emerald Token";

type Area = [mc.Vector3, mc.Vector3]
const PROTECTED_AREA_IRONGOLD: Area = [{ x: 0, y: 0, z: 0 }, { x: 3, y: 3, z: 3 }];
const PROTECTED_AREA_DIAMOND: Area = [{ x: 0, y: 0, z: 0 }, { x: 0, y: 3, z: 0 }];
const PROTECTED_AREA_EMERALD: Area = [{ x: 0, y: 0, z: 0 }, { x: 0, y: 3, z: 0 }];
const PRODUCING_AREA_IRONGOLD: Area = [{ x: 0, y: 0, z: 0 }, { x: 3, y: 1, z: 3 }];
const PRODUCING_AREA_DIAMOND: Area = [{ x: 0, y: 1, z: 0 }, { x: 0, y: 2, z: 0 }];
const PRODUCING_AREA_EMERALD: Area = [{ x: 0, y: 1, z: 0 }, { x: 0, y: 2, z: 0 }];

const DEATH_TITLE = "§cYOU DIED!";
const DEATH_SUBTITLE = "§eYou will respawn in §c%d §eseconds!";
const SPECTATE_TITLE = "SPECTATING!"
const SPECTATE_SUBTITLE = "Your bed has been destroyed";
const RESPAWN_TITLE = "§aRESPAWNED!";
const BED_DESTROYED_TITLE = "§cBED DESTROYED!";
const BED_DESTROYED_SUBTITLE = "You will no longer respawn!";
const TEAM_BED_DESTROYED_MESSAGE = "BED DESTRUCTION > %s%s bed was destroyed by %s%s!";
const TEAM_ELIMINATION_MESSAGE = "TEAN ELIMINATED > %s%s §chas been eliminated!"
const FINAL_KILL_MESSAGE = "%(victimColor)s%(victim)s was killed by %(killerColor)s%(killer)s. FINAL KILL!";
const BREAKING_BLOCK_INVALID_MESSAGE = "§cYou cannot break blocks that are not placed by players.";
const KILL_NOTIFICATION = "KILL: %s%s";
const FINAL_KILL_NOTIFICATION = "FINAL KILL: %s%s";
const DISCONNECTED_MESSAGE = "%s%s has disconnected.";
const RECONNECTION_MESSAGE = "%s%s has connected.";
const PLACING_BLOCK_ILLAGEL_MESSAGE = "§cYou can't place blocks here!"

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
    location: mc.Vector3; // the bottom-north-west location
    defaultInterval: number;
    defaultCapacity: number; // 0 means no limit
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
export function getWoolItemNameOfTeam(t: TeamType) {
    switch (t) {
        case TeamType.Blue:
            return MinecraftItemTypes.BlueWool;
        case TeamType.Green:
            return MinecraftItemTypes.GreenWool;
        case TeamType.Red:
            return MinecraftItemTypes.RedWool;
        case TeamType.Yellow:
            return MinecraftItemTypes.YellowWool;
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
                location: { x: 0, y: 1, z: 1 },
                defaultInterval: IRONGOLD_GENERATOR_INTERVAL,
                defaultCapacity: 3
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
                location: { x: 18, y: 1, z: 1 },
                defaultInterval: IRONGOLD_GENERATOR_INTERVAL,
                defaultCapacity: 3
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
            location: { x: 10, y: 0, z: 0 },
            defaultInterval: DIAMOND_GENERATOR_INTERVAL,
            defaultCapacity: 3
        },
        {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 10.5, y: 1, z: 4.5 },
            location: { x: 10, y: 0, z: 4 },
            defaultInterval: DIAMOND_GENERATOR_INTERVAL,
            defaultCapacity: 3
        },
        {
            type: GeneratorType.Emerald,
            spawnLocation: { x: 10.5, y: 1, z: 2.5 },
            location: { x: 10, y: 0, z: 2 },
            defaultInterval: EMERLAD_GENERATOR_INTERVAL,
            defaultCapacity: 3
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
    location: mc.Vector3;
    type: GeneratorType;
    capacity: number;
    interval: number;
    remainingCooldown: number;
    tokensGeneratedCount: number;
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
    killCount: number;
    deathCount: number;
    finalKillCount: number;
    deathTime: number; // global tick
    deathLocation: mc.Vector3;
    deathRotaion: mc.Vector2;
    /**
     * Cleared when the player opens menu or press the back button,
     * set when the player perform an action
     */
    lastActionResults: ActionResult[];
    /**
     * Indicates the attacker.
     * this field is cleared on death
     */
    lastHurtBy?: PlayerGameInformation;
    placement: BlockPlacementTracker;
}
export class Game {
    private map: MapInformation;
    private players: Map<string, PlayerGameInformation>;
    private teamStates: Map<TeamType, TeamState>;
    private originPos: mc.Vector3;
    private state: GameState;
    private dimension: mc.Dimension;
    private generators: GeneratorGameInformation[];
    private scoreObj: mc.ScoreboardObjective;
    private startTime: number;

    constructor({ map, originLocation, dimension, scoreboardObjective }: {
        map: MapInformation,
        originLocation: mc.Vector3,
        dimension: mc.Dimension,
        scoreboardObjective: mc.ScoreboardObjective
    }) {
        this.map = map;
        this.originPos = originLocation;
        this.state = GameState.waiting;
        this.players = new Map();
        this.dimension = dimension;
        this.startTime = 0;
        this.scoreObj = scoreboardObjective;
        this.teamStates = new Map();
        for (const team of this.map.teams) {
            this.teamStates.set(team.type, TeamState.BedAlive);
        }
        this.generators = [];
        for (const teamInfo of this.map.teams) {
            const genInfo = teamInfo.teamGenerator;
            this.generators.push({
                spawnLocation: genInfo.spawnLocation,
                location: genInfo.location,
                type: genInfo.type,
                interval: genInfo.defaultInterval,
                capacity: genInfo.defaultCapacity,
                remainingCooldown: 0,
                tokensGeneratedCount: 0,
                belongToTeam: true,
                team: teamInfo.type
            });
        }
        for (const genInfo of this.map.extraGenerators) {
            this.generators.push({
                spawnLocation: genInfo.spawnLocation,
                location: genInfo.location,
                type: genInfo.type,
                interval: genInfo.defaultInterval,
                capacity: genInfo.defaultCapacity,
                remainingCooldown: 0,
                tokensGeneratedCount: 0,
                belongToTeam: false
            });
        }
    }

    setPlayer(player: mc.Player, teamType: TeamType) {
        if (!this.map.teams.find(t => t.type == teamType)) throw new Error("No such team");

        const playerInfo = this.players.get(player.name);
        if (playerInfo) {
            playerInfo.team = teamType;
            return;
        }
        this.players.set(player.name, {
            name: player.name,
            state: PlayerState.Alive,
            player,
            team: teamType,
            killCount: 0,
            deathCount: 0,
            finalKillCount: 0,
            deathLocation: { x: 0, y: 0, z: 0 },
            deathTime: 0,
            deathRotaion: { x: 0, y: 0 },
            lastActionResults: [],
            placement: new BlockPlacementTracker()
        });
    }

    start() {
        this.state = GameState.started;
        this.startTime = mc.system.currentTick;
        for (const playerInfo of this.players.values()) {
            if (!playerInfo.player.isValid()) {
                playerInfo.state = PlayerState.Offline;
                continue;
            }
            this.respawnPlayer(playerInfo);
            this.setupSpawnPoint(playerInfo.player);
        }
        for (const gen of this.generators) {
            gen.remainingCooldown = gen.interval;
        }

    }

    private respawnPlayer(playerInfo: PlayerGameInformation) {
        const teamInfo = this.map.teams.find(ele => ele.type === playerInfo.team)!;
        const spawnPoint = v3.add(teamInfo.playerSpawn, this.originPos);
        playerInfo.player.teleport(spawnPoint, { facingLocation: v3.add(spawnPoint, teamInfo.playerSpawnViewDirection) });
        playerInfo.player.runCommand("gamemode survival");
        playerInfo.player.getComponent("minecraft:health")!.resetToMaxValue();
        playerInfo.player.extinguishFire();
        playerInfo.state = PlayerState.Alive;
    }

    private setupSpawnPoint(player: mc.Player) {
        player.setSpawnPoint(Object.assign({ dimension: player.dimension }, v3.add(this.originPos, this.map.fallbackRespawnPoint)));
    }

    private checkTeamPlayers() {
        const remainingPlayerCounts = new Map<TeamType, number>();
        for (const { type: teamType } of this.map.teams) {
            if (this.teamStates.get(teamType) == TeamState.Dead) continue;
            remainingPlayerCounts.set(teamType, 0);
        }

        for (const playerInfo of this.players.values()) {
            const teamState = this.teamStates.get(playerInfo.team);
            let counting = false;
            if (teamState == TeamState.BedAlive) {
                if (playerInfo.state == PlayerState.Alive ||
                    playerInfo.state == PlayerState.dead ||
                    playerInfo.state == PlayerState.Respawning ||
                    playerInfo.state == PlayerState.Offline) {
                    counting = true;
                }
            } else if (teamState == TeamState.BedDestoryed) {
                if (playerInfo.state == PlayerState.Alive ||
                    playerInfo.state == PlayerState.Respawning) {
                    counting = true;
                }
            }
            if (counting) {
                remainingPlayerCounts.set(playerInfo.team, 1 + remainingPlayerCounts.get(playerInfo.team)!);
            }
        }

        for (const [teamType, aliveCount] of remainingPlayerCounts) {
            if (aliveCount == 0) {
                this.teamStates.set(teamType, TeamState.Dead);
                this.broadcast(TEAM_ELIMINATION_MESSAGE,
                    getColorPrefixOfTeam(teamType), getNameOfTeam(teamType).toUpperCase());
            }
        }
    }

    private broadcast(content: any, ...params: any[]) {
        for (const playerInfo of this.players.values()) {
            if (playerInfo.state == PlayerState.Offline) continue;
            playerInfo.player.sendMessage(vsprintf(String(content), params));
        }
    }

    tickEvent() {
        if (this.state != GameState.started) return;

        for (const playerInfo of this.players.values()) {
            if (playerInfo.state == PlayerState.Offline) {
                const player = mc.world.getPlayers({ name: playerInfo.name })[0];
                if (!player) continue;
                // the player comes online
                playerInfo.player = player;
                player.runCommand("gamemode spectator");
                player.teleport(playerInfo.deathLocation, { rotation: playerInfo.deathRotaion });
                playerInfo.deathTime = mc.system.currentTick;

                const teamState = this.teamStates.get(playerInfo.team);
                switch (teamState) {
                    case TeamState.BedAlive:
                        playerInfo.state = PlayerState.Respawning;
                        player.onScreenDisplay.setTitle(DEATH_TITLE, {
                            subtitle: sprintf(DEATH_SUBTITLE, RESPAWN_TIME / 20),
                            fadeInDuration: 0,
                            stayDuration: 30,
                            fadeOutDuration: 20,
                        });
                        break;
                    case TeamState.BedDestoryed:
                    case TeamState.Dead:
                        playerInfo.state = PlayerState.Spectating;
                        player.onScreenDisplay.setTitle(SPECTATE_TITLE, {
                            subtitle: SPECTATE_SUBTITLE,
                            fadeInDuration: 0,
                            stayDuration: 50,
                            fadeOutDuration: 10
                        });
                        break;
                }
                this.broadcast(RECONNECTION_MESSAGE,
                    getColorPrefixOfTeam(playerInfo.team),
                    playerInfo.name);
            }
            const player = playerInfo.player;
            if (!player.isValid()) {
                playerInfo.state = PlayerState.Offline; // the player comes offline
                this.broadcast(DISCONNECTED_MESSAGE,
                    getColorPrefixOfTeam(playerInfo.team),
                    playerInfo.name);
                this.playerDieOrOffline(playerInfo, playerInfo.lastHurtBy);
                continue;
            }

            if (v3.distance(v3.add(this.originPos, this.map.fallbackRespawnPoint), player.location) <= 1) {
                player.runCommand("gamemode spectator");
                player.teleport(playerInfo.deathLocation, { rotation: playerInfo.deathRotaion });
                player.onScreenDisplay.setTitle(DEATH_TITLE, {
                    subtitle: sprintf(DEATH_SUBTITLE, RESPAWN_TIME / 20),
                    fadeInDuration: 0,
                    stayDuration: 30,
                    fadeOutDuration: 20
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
            const spawnLocation = v3.add(gen.spawnLocation, this.originPos);

            // Detect if it reaches capacity
            let producing_area: Area;
            let original_producing_area: Area;
            switch (gen.type) {
                case GeneratorType.IronGold:
                    original_producing_area = PRODUCING_AREA_IRONGOLD;
                    break;
                case GeneratorType.Diamond:
                    original_producing_area = PRODUCING_AREA_DIAMOND;
                    break;
                case GeneratorType.Emerald:
                    original_producing_area = PRODUCING_AREA_EMERALD;
                    break;
            }
            producing_area = original_producing_area.map(
                vec => vectorAdd(vec, gen.location, this.originPos)) as Area;
            let existingTokens = 0;
            for (const entity of this.dimension.getEntities({ type: "minecraft:item" })) {
                if (!vectorWithinArea(entity.location, producing_area)) continue;
                const itemStack = entity.getComponent("minecraft:item")!.itemStack;
                switch (gen.type) {
                    case GeneratorType.IronGold:
                        if (itemEqual(itemStack, IRON_ITEM_STACK) || itemEqual(itemStack, GOLD_ITEM_STACK)) {
                            existingTokens += itemStack.amount;
                        }
                        continue;
                    case GeneratorType.Diamond:
                        if (itemEqual(itemStack, DIAMOND_ITEM_STACK)) {
                            existingTokens += itemStack.amount;
                        }
                        continue;
                    case GeneratorType.Emerald:
                        if (itemEqual(itemStack, EMERALD_ITEM_STACK)) {
                            existingTokens += itemStack.amount;
                        }
                        continue;
                }
            }
            if (existingTokens >= gen.capacity) continue;


            ++gen.tokensGeneratedCount;

            let itemEntity: mc.Entity;
            switch (gen.type) {
                case GeneratorType.IronGold:
                    if (gen.tokensGeneratedCount % 4 == 0) {
                        itemEntity = this.dimension.spawnItem(GOLD_ITEM_STACK, spawnLocation);
                    }
                    itemEntity = this.dimension.spawnItem(IRON_ITEM_STACK, spawnLocation);
                    break;
                case GeneratorType.Diamond:
                    itemEntity = this.dimension.spawnItem(DIAMOND_ITEM_STACK, spawnLocation);
                    break;
                case GeneratorType.Emerald:
                    itemEntity = this.dimension.spawnItem(EMERALD_ITEM_STACK, spawnLocation);
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

    private playerDieOrOffline(victimInfo: PlayerGameInformation, killerInfo?: PlayerGameInformation) {
        victimInfo.deathTime = mc.system.currentTick;
        ++victimInfo.deathCount;
        victimInfo.lastHurtBy = undefined;
        let victimOffline = false;
        if (victimInfo.state == PlayerState.Offline) {
            victimOffline = true;
            const teamInfo = this.map.teams.find(ele => ele.type === victimInfo.team)!;
            victimInfo.deathLocation = v3.add(this.originPos, teamInfo.playerSpawn);
            victimInfo.deathRotaion = teamInfo.playerSpawnViewDirection;
        } else {
            victimInfo.deathLocation = victimInfo.player.location;
            victimInfo.deathRotaion = victimInfo.player.getRotation();
        }

        if (this.teamStates.get(victimInfo.team) == TeamState.BedDestoryed) { // FINAL KILL
            if (!victimOffline) victimInfo.state = PlayerState.Spectating;
            if (killerInfo) {
                ++killerInfo.finalKillCount;
                this.broadcast(sprintf(FINAL_KILL_MESSAGE, {
                    killerColor: getColorPrefixOfTeam(killerInfo.team),
                    killer: killerInfo.name,
                    victimColor: getColorPrefixOfTeam(victimInfo.team),
                    victim: victimInfo.name
                }));
                killerInfo.player.onScreenDisplay.setActionBar(sprintf(
                    FINAL_KILL_NOTIFICATION,
                    getColorPrefixOfTeam(victimInfo.team),
                    victimInfo.name));
            }
            if (!victimOffline) victimInfo.player.onScreenDisplay.setTitle(SPECTATE_TITLE, {
                subtitle: SPECTATE_SUBTITLE,
                fadeInDuration: 0,
                stayDuration: 50,
                fadeOutDuration: 10
            });
        } else {
            if (!victimOffline) victimInfo.state = PlayerState.dead;
            if (killerInfo) {
                ++killerInfo.killCount;
                killerInfo.player.onScreenDisplay.setActionBar(sprintf(
                    KILL_NOTIFICATION,
                    getColorPrefixOfTeam(victimInfo.team),
                    victimInfo.name));
            }
        }

        if (!victimOffline) this.setupSpawnPoint(victimInfo.player);

        this.checkTeamPlayers();
    }

    afterEntityDie(event: mc.EntityDieAfterEvent) {
        if (this.state != GameState.started) return;
        if (!(event.deadEntity instanceof mc.Player)) return;
        const victim = event.deadEntity;
        const victimInfo = this.players.get(victim.name);
        if (!victimInfo) return;

        let killerInfo: PlayerGameInformation | undefined;
        if (event.damageSource.cause == mc.EntityDamageCause.entityAttack &&
            event.damageSource.damagingEntity instanceof mc.Player) {
            killerInfo = this.players.get(event.damageSource.damagingEntity.name);
        } else if (victimInfo.lastHurtBy) {
            killerInfo = victimInfo.lastHurtBy;
        }
        this.playerDieOrOffline(victimInfo, killerInfo);
    }
    afterEntityHitEntity(event: mc.EntityHitEntityAfterEvent) {
        if (this.state != GameState.started) return;

        if (!(event.hitEntity instanceof mc.Player)) return;
        const victimInfo = this.players.get(event.hitEntity.name);
        if (!victimInfo) return;

        if (event.damagingEntity instanceof mc.Player) {
            const killerInfo = this.players.get(event.damagingEntity.name);
            if (killerInfo) {
                victimInfo.lastHurtBy = killerInfo;
                return;
            }
        }

        victimInfo.lastHurtBy = undefined;
    }
    async beforePlayerInteractWithBlock(event: mc.PlayerInteractWithBlockBeforeEvent) {
        if (this.state != GameState.started) return;

        if (event.block.dimension != this.dimension) return;
        const playerInfo = this.players.get(event.player.name);
        if (!playerInfo) return;

        for (const { shopLocation } of this.map.teams) {
            if (v3.equals(v3.add(this.originPos, shopLocation), event.block.location)) {
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
        const destroyerInfo = this.players.get(event.player.name);
        TeamBedDestroyed: if (event.block.typeId == "minecraft:bed") {
            const destroyedTeam = this.map.teams.find(team =>
                team.bedLocation.findIndex(pos =>
                    v3.equals(v3.add(pos, this.originPos), event.block.location)) != -1);
            if (!destroyedTeam) {
                break TeamBedDestroyed;
            }
            event.cancel = true;

            if (!destroyerInfo) return;
            if (destroyedTeam.type == destroyerInfo.team) return;
            await sleep(0);

            /* Clear the bed */
            event.dimension.fillBlocks(v3.add(destroyedTeam.bedLocation[0], this.originPos),
                v3.add(destroyedTeam.bedLocation[1], this.originPos), "minecraft:air");

            if (this.teamStates.get(destroyedTeam.type) == TeamState.Dead) return;

            /* Inform all the players */
            for (const playerInfo of this.players.values()) {
                if (playerInfo.state == PlayerState.Offline) continue;

                if (playerInfo.team == destroyedTeam.type) {
                    playerInfo.player.playSound("mob.wither.death");
                    playerInfo.player.onScreenDisplay.setTitle(BED_DESTROYED_TITLE, {
                        subtitle: BED_DESTROYED_SUBTITLE,
                        fadeInDuration: 5,
                        stayDuration: 40,
                        fadeOutDuration: 10
                    });
                } else {
                    playerInfo.player.playSound("mob.enderdragon.growl", { volume: 0.1 });
                }
                playerInfo.player.sendMessage(sprintf(TEAM_BED_DESTROYED_MESSAGE,
                    getColorPrefixOfTeam(destroyedTeam.type), getNameOfTeam(destroyedTeam.type).toUpperCase(),
                    getColorPrefixOfTeam(destroyerInfo.team), destroyerInfo.name));
            }
            this.teamStates.set(destroyedTeam.type, TeamState.BedDestoryed);
            return;
        }

        if (!destroyerInfo) return;
        if (isLocationPartOfAnyPlatforms(event.block.location, this.dimension)) return;
        for (const { placement } of this.players.values()) {
            if (!placement.remove(event.block.location)) continue;
            // the location appears in the tracker.
            const location = Object.assign({}, event.block.location);

            let bit = event.block.permutation.getState("upper_block_bit");
            if (bit != null) {
                if (bit) { --location.y; } else { ++location.y; }
                placement.remove(location);
            }

            bit = event.block.permutation.getState("head_piece_bit");
            checkBed: if (bit != null) {
                const modifier = bit ? -1 : 1;
                const direction = event.block.permutation.getState("direction");
                if (direction == null) break checkBed;
                switch (direction) {
                    case 0: location.z += modifier; break; // SOUTH
                    case 1: location.x -= modifier; break; // WEST
                    case 2: location.z -= modifier; break; // NORTH
                    case 3: location.x += modifier; break; // EAST
                }
                placement.remove(location);
            }

            return;

        }
        // The location doesn't appear in the tracker.
        event.cancel = true;
        destroyerInfo.player.sendMessage(BREAKING_BLOCK_INVALID_MESSAGE);
    }

    async beforePlayerPlaceBlock(event: mc.PlayerPlaceBlockBeforeEvent) {
        if (this.state != GameState.started) return;

        const playerInfo = this.players.get(event.player.name);
        if (!playerInfo) return;

        for (const gen of this.generators) {
            let protected_area: Area;
            let original_protected_area: Area;
            switch (gen.type) {
                case GeneratorType.IronGold:
                    original_protected_area = PROTECTED_AREA_IRONGOLD;
                    break;
                case GeneratorType.Diamond:
                    original_protected_area = PROTECTED_AREA_DIAMOND;
                    break;
                case GeneratorType.Emerald:
                    original_protected_area = PROTECTED_AREA_EMERALD;
                    break;
            }
            protected_area = original_protected_area.map(
                vec => vectorAdd(vec, gen.location, this.originPos)) as Area;
            if (vectorWithinArea(event.block.location, protected_area)) {
                event.cancel = true;
                playerInfo.player.sendMessage(PLACING_BLOCK_ILLAGEL_MESSAGE);
                return;
            }
        }

        // Allow the player to place block
        playerInfo.placement.push(event.block.location);

        if (event.permutationBeingPlaced.getState("upper_block_bit") != null) { // DOOR
            const location = Object.assign({}, event.block.location);
            ++location.y;
            playerInfo.placement.push(location);
        }

        checkBed: if (event.permutationBeingPlaced.getState("head_piece_bit") != null) { // BED
            const location = Object.assign({}, event.block.location);
            await sleep(0);
            /* Instead of directly using event.permutaionBeingPlaced, I have to do it this way to get the right direction */
            const direction = this.dimension.getBlock(location)?.permutation.getState("direction");
            if (direction == null) break checkBed;
            switch (direction) {
                case 0: location.z += 1; break; // SOUTH
                case 1: location.x -= 1; break; // WEST
                case 2: location.z -= 1; break; // NORTH
                case 3: location.x += 1; break; // EAST
            }
            playerInfo.placement.push(location);
        }
    }
};

class BlockPlacementTracker {
    static DEFAULT_BUCKET_SIZE = 25;
    private data: mc.Vector3[][];
    private readonly bucketSize: number;

    constructor(bucketSize = BlockPlacementTracker.DEFAULT_BUCKET_SIZE) {
        this.data = [];
        this.bucketSize = bucketSize;
        for (let i = 0; i < bucketSize; ++i) this.data.push([]);
    }
    private hash(loc: mc.Vector3) {
        return Math.abs(loc.x + loc.y + loc.z);
    }
    /**
     * Push a location into the tracker.
     * Would remove overlaping record if it exists
     */
    push(loc: mc.Vector3) {
        const bucketIndex = this.hash(loc) % this.bucketSize;
        let index = 0;
        for (const existedLoc of this.data[bucketIndex]) {
            if (v3.equals(loc, existedLoc)) {
                this.data[bucketIndex].splice(index, 1);
                break;
            }
            ++index;
        }

        this.data[bucketIndex].push(loc);
    }
    has(loc: mc.Vector3) {
        const bucketIndex = this.hash(loc) % this.bucketSize;
        for (const existedLoc of this.data[bucketIndex]) {
            if (v3.equals(loc, existedLoc)) {
                return true;
            }
        }
        return false;
    }
    /**
     * @returns {Boolean} Whether the operation succeeds
     */
    remove(loc: mc.Vector3): boolean {
        const bucketIndex = this.hash(loc) % this.bucketSize;
        let index = 0;
        for (const existedLoc of this.data[bucketIndex]) {
            if (v3.equals(loc, existedLoc)) {
                this.data[bucketIndex].splice(index, 1);
                return true;
            }
            ++index;
        }
        return false;
    }
}

let game: Game;

mc.world.beforeEvents.chatSend.subscribe(async event => {
    if (event.message == "start") {
        event.cancel = true;
        await sleep(0); // get out of read-only mode

        const setup = () => {
            const players = mc.world.getAllPlayers();
            game = new Game({
                map: testMap, originLocation: { x: -17, y: 5, z: 32 }, dimension: players[0].dimension, scoreboardObjective:
                    mc.world.scoreboard.getObjective("GAME") ?? mc.world.scoreboard.addObjective("GAME")
            });
            if (Math.random() >= 0.5) {
                game.setPlayer(players[0], TeamType.Red);
                game.setPlayer(players[1], TeamType.Blue);
            } else {
                game.setPlayer(players[0], TeamType.Blue);
                game.setPlayer(players[1], TeamType.Red);
            }
            game.start();
            globalThis.game = game;
        }
        if (mc.world.getAllPlayers().length >= 2) {
            setup();
            return;
        }
        if (!globalThis.test) setupGameTest(event.sender.location.x, event.sender.location.z, event.sender.dimension);
        while (!globalThis.test) {
            await sleep(0);
        }
        globalThis.test.spawnSimulatedPlayer(event.sender.location as any, "a");

        setup();
    }
})

mc.world.afterEvents.entityDie.subscribe(event => {
    if (game) {
        game.afterEntityDie(event);
    }
});
mc.world.afterEvents.entityHitEntity.subscribe(event => {
    if (game) {
        game.afterEntityHitEntity(event);
    }
});
mc.world.beforeEvents.playerBreakBlock.subscribe(event => {
    if (game) {
        game.beforePlayerBreakBlock(event);
    }
});
mc.world.beforeEvents.playerPlaceBlock.subscribe(event => {
    if (game) {
        game.beforePlayerPlaceBlock(event);
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
