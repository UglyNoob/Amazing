import * as mc from '@minecraft/server';
import * as ui from '@minecraft/server-ui';

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
}
interface MapInformation {
    teams: TeamInformation[];
    extraGenerators: GeneratorInformation[];
    size: mc.Vector3
}

function* mapGeneratorsIterator(map: MapInformation) {
    for(let team of map.teams) {
        yield team.teamGenerator;
    }
    yield* map.extraGenerators;
}

const testMap: MapInformation = {
    size: {x: 21, y: 3, z: 5},
    teams: [
        {
            type: TeamType.Red,
            shopLocation: {x: 6, y: 2, z: 4},
            teamGenerator: {
                type: GeneratorType.IronGold,
                location: {x: 1, y: 1, z: 2}
            },
            bedLocation: [{x: 4, y: 1, z: 2}, {x: 5, y: 1, z: 2}]
        },
        {
            type: TeamType.Blue,
            shopLocation: {x: 14, y: 0, z: 0},
            teamGenerator: {
                type: GeneratorType.IronGold,
                location: {x: 19, y: 1, z: 2}
            },
            bedLocation: [{x: 16, y: 0, z: 2}, {x: 15, y: 1, z: 2}]
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

interface PlayerInformation {
    nametag: string,
    team: TeamType,
    state: PlayerState
}
class Game {
    readonly map: MapInformation;
    readonly players: PlayerInformation[];
    readonly teamStates: Map<TeamType, TeamState>;
    readonly originLocation: mc.Vector3;
    readonly state: GameState;

    constructor({map: _map, originLocation : _origin}: {map: MapInformation, originLocation: mc.Vector3}) {
        this.map = _map;
        this.originLocation = _origin;
        this.state = GameState.waiting;
        this.players = [];
        this.teamStates = new Map();
        for(const team of this.map.teams) {
            this.teamStates.set(team.type, TeamState.BedAlive);
        }
    }

    setPlayer(playerNameTag: string, team: TeamType) {
        console.assert(this.state == GameState.waiting);
        const index = this.players.findIndex(value => value.nametag == playerNameTag);
        if(index >= 0) {
            this.players[index].team = team;
            return;
        }
        this.players.push({
            nametag: playerNameTag,
            state: PlayerState.Alive,
            team
        });
    }

    
}

function startGame(map: MapInformation, coord: mc.Vector3) {
    ;
}