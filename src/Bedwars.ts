import { Vector3Utils } from '@minecraft/math';
import * as mc from '@minecraft/server';
import * as ui from '@minecraft/server-ui';
import { MinecraftEntityTypes } from '@minecraft/vanilla-data';

enum GeneratorType {
    IronGold,
    Diamond,
    Emerald
}
enum TeamType {
    Red = "red",
    Blue = "blue",
    Yellow = "yellow",
    Green = "green"
}
interface GeneratorInformation {
    location: mc.Vector3;
    type: GeneratorType;
}
interface TeamInformation {
    type: TeamType;
    shopLocation: mc.Vector3;
    teamGenerator: GeneratorInformation;
    bedLocation: [mc.Vector3, mc.Vector3];
    playerSpawn: mc.Vector3;
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

function* mapGeneratorsIterator(map: MapInformation) {
    for(let team of map.teams) {
        yield team.teamGenerator;
    }
    yield* map.extraGenerators;
}

const testMap: MapInformation = {
    size: {x: 21, y: 3, z: 5},
    fallbackRespawnPoint: {x: 0, y: 200, z: 0},
    teams: [
        {
            type: TeamType.Red,
            shopLocation: {x: 6, y: 2, z: 4},
            teamGenerator: {
                type: GeneratorType.IronGold,
                location: {x: 1, y: 1, z: 2}
            },
            bedLocation: [{x: 4, y: 1, z: 2}, {x: 5, y: 1, z: 2}],
            playerSpawn: {x: 3, y: 1, z: 2}
        },
        {
            type: TeamType.Blue,
            shopLocation: {x: 14, y: 0, z: 0},
            teamGenerator: {
                type: GeneratorType.IronGold,
                location: {x: 19, y: 1, z: 2}
            },
            bedLocation: [{x: 16, y: 0, z: 2}, {x: 15, y: 1, z: 2}],
            playerSpawn: {x: 17, y: 1, z: 2}
        }
    ],
    extraGenerators: [
        {
            type: GeneratorType.Diamond,
            location: {x: 10, y: 0, z: 0}
        },
        {
            type: GeneratorType.Diamond,
            location: {x: 10, y: 0, z: 4}
        },
        {
            type: GeneratorType.Emerald,
            location: {x: 10, y: 0, z: 2}
        }
    ]
}

enum PlayerState {
    Alive,
    Offline,
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

interface PlayerGameInformation {
    name: string;
    team: TeamType;
    state: PlayerState;
    player: mc.Player;
}
class Game {
    private map: MapInformation;
    private players: {
        [name: string]: PlayerGameInformation
    };
    private teamStates: Map<TeamType, TeamState>;
    private originLocation: mc.Vector3;
    private state: GameState;


    constructor({map: _map, originLocation : _origin}: {map: MapInformation, originLocation: mc.Vector3}) {
        this.map = _map;
        this.originLocation = _origin;
        this.state = GameState.waiting;
        this.players = Object.create(null);
        this.teamStates = new Map();
        for(const team of this.map.teams) {
            this.teamStates.set(team.type, TeamState.BedAlive);
        }
    }

    setPlayer(player: mc.Player, team: TeamType) {
        console.assert(this.state == GameState.waiting);
        if(this.players[player.name]) {
            this.players[player.name].team = team;
            return;
        }
        this.players[player.name] = {
            name: player.name,
            state: PlayerState.Alive,
            player,
            team
        };
    }
    
    start() {
        console.assert(this.state == GameState.waiting);
        this.state = GameState.started;
        for(const playerInfo of Object.values(this.players)) {
            if(!playerInfo.player.isValid()) {
                playerInfo.state = PlayerState.Offline;
                continue;
            }
        }
    }

    tickEvent() {
        for(let playerInfo of Object.values(this.players)) {

        }
    }

    afterEntityDie(event: mc.EntityDieAfterEvent) {
        if (event.deadEntity.typeId != MinecraftEntityTypes.Player) return;
        let player = event.deadEntity as mc.Player;
        if(!this.players[player.name]) return;

        player.setSpawnPoint(Object.assign({dimension: player.dimension}, Vector3Utils.add(this.originLocation, player.location)));
    }
    beforePlayerInteractWithBlock(event: mc.PlayerInteractWithBlockBeforeEvent) {}
    beforePlayerBreakBlock(event: mc.PlayerBreakBlockBeforeEvent) {}
};

let game: Game;

mc.world.beforeEvents.chatSend.subscribe(event => {
    if(event.message == "start") {
        event.cancel = true;
        game = new Game({map: testMap, originLocation: {x: -17, y: 5, z: 32}});
    }
})

mc.world.afterEvents.entityDie.subscribe(event => {
    if(game) {
        game.afterEntityDie(event);
    }
});
mc.world.beforeEvents.playerBreakBlock.subscribe(event => {
    if(game) {
        game.beforePlayerBreakBlock(event);
    }
});
mc.world.beforeEvents.itemUse.subscribe(event => {
    if(game) {
    }
});