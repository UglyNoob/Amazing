import { GeneratorType, MapInformation, TeamType } from "./Bedwars.js";

const IRONGOLD_GENERATOR_INTERVAL = 60;
const DIAMOND_GENERATOR_INTERVAL = 900;
const EMERLAD_GENERATOR_INTERVAL = 1200;

export const testMap: MapInformation = {
    size: [{ x: 0, y: 0, z: 0 }, { x: 21, y: 3, z: 5 }],
    fallbackRespawnPoint: { x: 0, y: 50, z: 0 },
    voidY: -48,
    teamExtraEmeraldGenInterval: EMERLAD_GENERATOR_INTERVAL,
    teams: [
        {
            type: TeamType.Red,
            itemShopLocation: { x: 6, y: 2, z: 4 },
            teamShopLocation: { x: 6, y: 2, z: 4 }, // TODO
            teamChestLocation: { x: 5, y: 1, z: 4 },
            islandArea: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }], // TODO
            protectedArea: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }], // TODO
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 1.5, y: 1.5, z: 2.5 },
                location: { x: 0, y: 1, z: 1 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: 4, y: 1, z: 2 }, { x: 5, y: 1, z: 2 }],
            playerSpawn: { x: 3.5, y: 1, z: 2.5 },
            playerSpawnViewDirection: { x: 1, y: 0, z: 0 }
        }, {
            type: TeamType.Blue,
            itemShopLocation: { x: 14, y: 2, z: 0 },
            teamShopLocation: { x: 6, y: 2, z: 4 }, // TODO
            teamChestLocation: { x: 15, y: 1, z: 0 },
            islandArea: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }], // TODO
            protectedArea: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }], // TODO
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 19.5, y: 1.5, z: 2.5 },
                location: { x: 18, y: 1, z: 1 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
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
            initialInterval: DIAMOND_GENERATOR_INTERVAL
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 10.5, y: 1, z: 4.5 },
            location: { x: 10, y: 0, z: 4 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: 10.5, y: 1, z: 2.5 },
            location: { x: 10, y: 0, z: 2 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL
        }
    ]
};
export const mapGarden: MapInformation = {
    size: [{ x: 0, y: 0, z: 0 }, { x: 208, y: 101, z: 130 }],
    fallbackRespawnPoint: { x: 0 + 104, y: 149 - 54, z: 0 + 65 },
    voidY: -64,
    teamExtraEmeraldGenInterval: EMERLAD_GENERATOR_INTERVAL,
    teams: [
        {
            type: TeamType.Red,
            itemShopLocation: { x: 95 + 104, y: 80 - 54, z: 8 + 65 },
            teamShopLocation: { x: 95 + 104, y: 80 - 54, z: -8 + 65 },
            islandArea: [{ x: 70 + 104, y: 69 - 54, z: -17 + 65 }, { x: 106 + 104, y: 92 - 54, z: 16 + 65 }],
            protectedArea: [{ x: 92 + 104, y: 79 - 54, z: -3 + 65 }, { x: 97 + 104, y: 84 - 54, z: 4 + 65 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 98.5 + 104, y: 78.5 - 54, z: 0.5 + 65 },
                location: { x: 97 + 104, y: 78 - 54, z: -1 + 65 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: 79 + 104, y: 77 - 54, z: 0 + 65 }, { x: 80 + 104, y: 77 - 54, z: 0 + 65 }],
            playerSpawn: { x: 94.5 + 104, y: 79 - 54, z: 0.5 + 65 },
            playerSpawnViewDirection: { x: -1, y: 0, z: 0 },
            teamChestLocation: { x: 91 + 104, y: 79 - 54, z: 4 + 65 },
        }, {
            type: TeamType.Blue,
            itemShopLocation: { x: -95 + 104, y: 80 - 54, z: -8 + 65 },
            teamShopLocation: { x: -95 + 104, y: 80 - 54, z: 8 + 65 },
            islandArea: [{ x: -106 + 104, y: 69 - 54, z: -17 + 65 }, { x: -70 + 104, y: 92 - 54, z: 16 + 65 }],
            protectedArea: [{ x: -96 + 104, y: 79 - 54, z: -3 + 65 }, { x: -91 + 104, y: 84 - 54, z: 4 + 65 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: -97.5 + 104, y: 78.5 - 54, z: 0.5 + 65 },
                location: { x: -99 + 104, y: 78 - 54, z: -1 + 65 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: -79 + 104, y: 77 - 54, z: 0 + 65 }, { x: -80 + 104, y: 77 - 54, z: 0 + 65 }],
            playerSpawn: { x: -93.5 + 104, y: 79 - 54, z: 0.5 + 65 },
            playerSpawnViewDirection: { x: 1, y: 0, z: 0 },
            teamChestLocation: { x: -91 + 104, y: 79 - 54, z: 4 + 65 },
        }
    ],
    extraGenerators: [
        {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 0.5 + 104, y: 78 - 54, z: -51.5 + 65 },
            location: { x: 0 + 104, y: 77 - 54, z: -52 + 65 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 0.5 + 104, y: 78 - 54, z: 52.5 + 65 },
            location: { x: 0 + 104, y: 77 - 54, z: 52 + 65 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: -20.5 + 104, y: 77 - 54, z: -20.5 + 65 },
            location: { x: -21 + 104, y: 76 - 54, z: -21 + 65 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: 21.5 + 104, y: 77 - 54, z: 21.5 + 65 },
            location: { x: 21 + 104, y: 76 - 54, z: 21 + 65 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL
        }
    ]
};

export const mapSteamPunk: MapInformation = {
    size: [{ x: -111, y: 48, z: -111 }, { x: 111, y: 139, z: 111 }],
    fallbackRespawnPoint: { x: 0, y: 133, z: 0 },
    voidY: -16,
    teamExtraEmeraldGenInterval: EMERLAD_GENERATOR_INTERVAL,
    teams: [
        {
            type: TeamType.Green,
            itemShopLocation: { x: 105, y: 74, z: -57 },
            teamShopLocation: { x: 91, y: 74, z: -57 },
            islandArea: [{ x: 82, y: 59, z: -67 }, { x: 111, y: 102, z: -39 }],
            protectedArea: [{ x: 95, y: 73, z: -59 }, { x: 102, y: 77, z: -52 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 98.5, y: 72.5, z: -61.5 },
                location: { x: 97, y: 72, z: -63 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: 98, y: 73, z: -47 }, { x: 98, y: 73, z: -46 }],
            playerSpawn: { x: 98.5, y: 73, z: -55.5 },
            playerSpawnViewDirection: { x: 0, y: 0, z: 1 },
            teamChestLocation: { x: 102, y: 73, z: -52 },
        }, {
            type: TeamType.Yellow,
            itemShopLocation: { x: 91, y: 74, z: 57 },
            teamShopLocation: { x: 105, y: 74, z: 57 },
            islandArea: [{ x: 86, y: 59, z: 40 }, { x: 115, y: 102, z: 68 }],
            protectedArea: [{ x: 95, y: 73, z: 53 }, { x: 102, y: 77, z: 60 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 98.5, y: 72.5, z: 62.5 },
                location: { x: 97, y: 72, z: 61 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: 98, y: 73, z: 47 }, { x: 98, y: 73, z: 46 }],
            playerSpawn: { x: 98.5, y: 73, z: 56.5 },
            playerSpawnViewDirection: { x: 0, y: 0, z: -1 },
            teamChestLocation: { x: 94, y: 73, z: 52 },
        }, {
            type: TeamType.Cyan,
            itemShopLocation: { x: 57, y: 74, z: 105 },
            teamShopLocation: { x: 57, y: 74, z: 91 },
            islandArea: [{ x: 40, y: 59, z: 82 }, { x: 68, y: 102, z: 111 }],
            protectedArea: [{ x: 53, y: 73, z: 95 }, { x: 60, y: 77, z: 102 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 62.5, y: 72.5, z: 98.5 },
                location: { x: 61, y: 72, z: 97 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: 47, y: 73, z: 98 }, { x: 46, y: 73, z: 98 }],
            playerSpawn: { x: 56, y: 73, z: 98 },
            playerSpawnViewDirection: { x: -1, y: 0, z: 0 },
            teamChestLocation: { x: 52, y: 73, z: 102 },
        }, {
            type: TeamType.White,
            itemShopLocation: { x: -57, y: 74, z: 91 },
            teamShopLocation: { x: -57, y: 74, z: 105 },
            islandArea: [{ x: -67, y: 59, z: 86 }, { x: -39, y: 102, z: 115 }],
            protectedArea: [{ x: -59, y: 73, z: 95 }, { x: -53, y: 77, z: 101 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: -61.5, y: 72.5, z: 98.5 },
                location: { x: -63, y: 72, z: 97 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: -47, y: 73, z: 98 }, { x: -46, y: 73, z: 98 }],
            playerSpawn: { x: -55.5, y: 73, z: 98.5 },
            playerSpawnViewDirection: { x: 1, y: 0, z: 0 },
            teamChestLocation: { x: -52, y: 73, z: 94 },
        }, {
            type: TeamType.Pink,
            itemShopLocation: { x: -105, y: 74, z: 57 },
            teamShopLocation: { x: -91, y: 74, z: 57 },
            islandArea: [{ x: -110, y: 59, z: 40 }, { x: -81, y: 102, z: 68 }],
            protectedArea: [{ x: -101, y: 73, z: 53 }, { x: -94, y: 77, z: 60 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: -97.5, y: 72.5, z: 62.5 },
                location: { x: -99, y: 72, z: 61 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: -98, y: 73, z: 47 }, { x: -98, y: 73, z: 46 }],
            playerSpawn: { x: -98, y: 73, z: 56 },
            playerSpawnViewDirection: { x: 0, y: 0, z: -1 },
            teamChestLocation: { x: -102, y: 73, z: 52 },
        }, {
            type: TeamType.Gray,
            itemShopLocation: { x: -91, y: 74, z: -57 },
            teamShopLocation: { x: -105, y: 74, z: -57 },
            islandArea: [{ x: -114, y: 59, z: -67 }, { x: -85, y: 102, z: -39 }],
            protectedArea: [{ x: -101, y: 73, z: -59 }, { x: -94, y: 77, z: -52 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: -97.5, y: 72.5, z: -61.5 },
                location: { x: -99, y: 72, z: -63 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: -98, y: 73, z: -47 }, { x: -98, y: 73, z: -46 }],
            playerSpawn: { x: -97.5, y: 73, z: -55.5 },
            playerSpawnViewDirection: { x: 0, y: 0, z: 1 },
            teamChestLocation: { x: -94, y: 73, z: -52 },
        }, {
            type: TeamType.Red,
            itemShopLocation: { x: -57, y: 74, z: -105 },
            teamShopLocation: { x: -57, y: 74, z: -91 },
            islandArea: [{ x: -67, y: 59, z: -110 }, { x: -39, y: 102, z: -81 }],
            protectedArea: [{ x: -59, y: 73, z: -101 }, { x: -52, y: 77, z: -94 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: -61.5, y: 72.5, z: -97.5 },
                location: { x: -63, y: 72, z: -99 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: -47, y: 73, z: -98 }, { x: -46, y: 73, z: -98 }],
            playerSpawn: { x: -55.5, y: 73, z: -97.5 },
            playerSpawnViewDirection: { x: 1, y: 0, z: 0 },
            teamChestLocation: { x: -52, y: 73, z: -102 },
        }, {
            type: TeamType.Blue,
            itemShopLocation: { x: 57, y: 74, z: -91 },
            teamShopLocation: { x: 57, y: 74, z: -105 },
            islandArea: [{ x: 40, y: 59, z: -114 }, { x: 68, y: 102, z: -85 }],
            protectedArea: [{ x: 53, y: 73, z: -101 }, { x: 60, y: 77, z: -94 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 62.5, y: 72.5, z: -97.5 },
                location: { x: 61, y: 72, z: -99 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: 47, y: 73, z: -98 }, { x: 46, y: 73, z: -98 }],
            playerSpawn: { x: 56.5, y: 73, z: -97.5 },
            playerSpawnViewDirection: { x: -1, y: 0, z: 0 },
            teamChestLocation: { x: 52, y: 73, z: -94 },
        }
    ],
    extraGenerators: [
        {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 85.5, y: 74, z: 0.5 },
            location: { x: 85, y: 73, z: 0 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: 85, y: 77, z: 0 }]
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 0.5, y: 74, z: 85.5 },
            location: { x: 0, y: 73, z: 85 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: 0, y: 77, z: 85 }]
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: -84.5, y: 74, z: 0.5 },
            location: { x: -85, y: 73, z: 0 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: -85, y: 77, z: 0 }]
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 0.5, y: 74, z: -84.5 },
            location: { x: 0, y: 73, z: -85 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: 0, y: 77, z: -85 }]
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: 24.5, y: 74, z: 24.5 },
            location: { x: 24, y: 73, z: 24 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: 24, y: 77, z: 24 }]
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: -23.5, y: 74, z: 24.5 },
            location: { x: -24, y: 73, z: 24 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: -24, y: 77, z: 24 }]
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: 24.5, y: 74, z: -23.5 },
            location: { x: 24, y: 73, z: -24 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: 24, y: 77, z: -24 }]
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: -23.5, y: 74, z: -23.5 },
            location: { x: -24, y: 73, z: -24 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: -24, y: 77, z: -24 }]
        }
    ]
};
export const mapWaterfall: MapInformation = {
    size: [{ x: -84, y: 45, z: -84 }, { x: 84, y: 101, z: 84 }],
    fallbackRespawnPoint: { x: 0, y: 118, z: 0 },
    voidY: -16,
    teamExtraEmeraldGenInterval: EMERLAD_GENERATOR_INTERVAL,
    teams: [
        {
            type: TeamType.Green,
            itemShopLocation: { x: 74, y: 67, z: -29 },
            teamShopLocation: { x: 74, y: 67, z: -39 },
            teamChestLocation: { x: 71, y: 66, z: -31 },
            playerSpawn: { x: 73.5, y: 66, z: -33.5 },
            playerSpawnViewDirection: { x: -1, y: 0, z: 0 },
            islandArea: [{ x: 57, y: 57, z: -45 }, { x: 85, y: 93, z: -20 }],
            protectedArea: [{ x: 72, y: 66, z: -36 }, { x: 76, y: 69, z: -31 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 77.5, y: 65.5, z: -33.5 },
                location: { x: 76, y: 65, z: -35 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: 65, y: 66, z: -33 }, { x: 64, y: 66, z: -33 }],
        }, {
            type: TeamType.Yellow,
            itemShopLocation: { x: 74, y: 67, z: 37 },
            teamShopLocation: { x: 74, y: 67, z: 27 },
            teamChestLocation: { x: 71, y: 66, z: 35 },
            playerSpawn: { x: 73.5, y: 66, z: 32.5 },
            playerSpawnViewDirection: { x: -1, y: 0, z: 0 },
            islandArea: [{ x: 57, y: 57, z: 21 }, { x: 85, y: 93, z: 46 }],
            protectedArea: [{ x: 72, y: 66, z: 30 }, { x: 76, y: 69, z: 35 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 77.5, y: 65.5, z: 32.5 },
                location: { x: 76, y: 65, z: 31 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: 65, y: 66, z: 33 }, { x: 64, y: 66, z: 33 }],
        }, {
            type: TeamType.Cyan,
            itemShopLocation: { x: 29, y: 67, z: 74 },
            teamShopLocation: { x: 39, y: 67, z: 74 },
            teamChestLocation: { x: 31, y: 66, z: 71 },
            playerSpawn: { x: 34.5, y: 66, z: 73.5 },
            playerSpawnViewDirection: { x: 0, y: 0, z: -1 },
            islandArea: [{ x: 21, y: 57, z: 57 }, { x: 46, y: 93, z: 85 }],
            protectedArea: [{ x: 32, y: 66, z: 72 }, { x: 37, y: 69, z: 76 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 34.5, y: 65.5, z: 77.5 },
                location: { x: 33, y: 65, z: 76 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: 33, y: 66, z: 65 }, { x: 33, y: 66, z: 64 }],
        }, {
            type: TeamType.White,
            itemShopLocation: { x: -37, y: 67, z: 74 },
            teamShopLocation: { x: -27, y: 67, z: 74 },
            teamChestLocation: { x: -35, y: 66, z: 71 },
            playerSpawn: { x: -31.5, y: 66, z: 73.5 },
            playerSpawnViewDirection: { x: 0, y: 0, z: -1 },
            islandArea: [{ x: -45, y: 57, z: 57 }, { x: -20, y: 93, z: 85 }],
            protectedArea: [{ x: -34, y: 66, z: 72 }, { x: -29, y: 69, z: 76 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: -31.5, y: 65.5, z: 77.5 },
                location: { x: -33, y: 65, z: 76 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: -33, y: 66, z: 65 }, { x: -33, y: 66, z: 64 }],
        }, {
            type: TeamType.Pink,
            itemShopLocation: { x: -74, y: 67, z: 29 },
            teamShopLocation: { x: -74, y: 67, z: 39 },
            teamChestLocation: { x: -71, y: 66, z: 31 },
            playerSpawn: { x: -72.5, y: 66, z: 34.5 },
            playerSpawnViewDirection: { x: 1, y: 0, z: 0 },
            islandArea: [{ x: -84, y: 57, z: 21 }, { x: -56, y: 93, z: 46 }],
            protectedArea: [{ x: -75, y: 66, z: 32 }, { x: -71, y: 69, z: 37 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: -76.5, y: 65.5, z: 34.5 },
                location: { x: -78, y: 65, z: 33 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: -65, y: 66, z: 33 }, { x: -64, y: 66, z: 33 }],
        }, {
            type: TeamType.Gray,
            itemShopLocation: { x: -74, y: 67, z: -37 },
            teamShopLocation: { x: -74, y: 67, z: -27 },
            teamChestLocation: { x: -71, y: 66, z: -35 },
            playerSpawn: { x: -72.5, y: 66, z: -31.5 },
            playerSpawnViewDirection: { x: 1, y: 0, z: 0 },
            islandArea: [{ x: -84, y: 57, z: -45 }, { x: -56, y: 93, z: -20 }],
            protectedArea: [{ x: -75, y: 66, z: -34 }, { x: -71, y: 69, z: -29 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: -76.5, y: 65.5, z: -31.5 },
                location: { x: -78, y: 65, z: -33 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: -65, y: 66, z: -33 }, { x: -64, y: 66, z: -33 }],
        }, {
            type: TeamType.Red,
            itemShopLocation: { x: -29, y: 67, z: -74 },
            teamShopLocation: { x: -39, y: 67, z: -74 },
            teamChestLocation: { x: -31, y: 66, z: -71 },
            playerSpawn: { x: -33.5, y: 66, z: -72.5 },
            playerSpawnViewDirection: { x: 0, y: 0, z: 1 },
            islandArea: [{ x: -45, y: 57, z: -84 }, { x: -20, y: 93, z: -56 }],
            protectedArea: [{ x: -36, y: 66, z: -75 }, { x: -31, y: 69, z: -71 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: -33.5, y: 65.5, z: -76.5 },
                location: { x: -35, y: 65, z: -78 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: -33, y: 66, z: -65 }, { x: -33, y: 66, z: -64 }],
        }, {
            type: TeamType.Blue,
            itemShopLocation: { x: 37, y: 67, z: -74 },
            teamShopLocation: { x: 27, y: 67, z: -74 },
            teamChestLocation: { x: 35, y: 66, z: -71 },
            playerSpawn: { x: 32.5, y: 66, z: -72.5 },
            playerSpawnViewDirection: { x: 0, y: 0, z: 1 },
            islandArea: [{ x: 21, y: 57, z: -84 }, { x: 46, y: 93, z: -56 }],
            protectedArea: [{ x: 30, y: 66, z: -75 }, { x: 35, y: 69, z: -71 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 32.5, y: 65.5, z: -76.5 },
                location: { x: 31, y: 65, z: -78 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: 33, y: 66, z: -65 }, { x: 33, y: 66, z: -64 }],
        }
    ],
    extraGenerators: [
        {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 52.5, y: 64, z: 0.5 },
            location: { x: 52, y: 63, z: 0 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: 52, y: 67, z: 0 }]
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 0.5, y: 64, z: 52.5 },
            location: { x: 0, y: 63, z: 52 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: 0, y: 67, z: 52 }]
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: -51.5, y: 64, z: 0.5 },
            location: { x: -52, y: 63, z: 0 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: -52, y: 67, z: 0 }]
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 0.5, y: 64, z: -51.5 },
            location: { x: 0, y: 63, z: -52 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: 0, y: 67, z: -52 }]
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: 12.5, y: 78, z: 12.5 },
            location: { x: 12, y: 77, z: 12 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: 12, y: 81, z: 12 }]
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: -11.5, y: 78, z: 12.5 },
            location: { x: -12, y: 77, z: 12 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: -12, y: 81, z: 12 }]
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: 12.5, y: 78, z: -11.5 },
            location: { x: 12, y: 77, z: -12 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: 12, y: 81, z: -12 }]
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: -11.5, y: 78, z: -11.5 },
            location: { x: -12, y: 77, z: -12 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: -12, y: 81, z: -12 }]
        }
    ]
};

export const mapEastwood: MapInformation = {
    size: [{ x: -74, y: 45, z: -74 }, { x: 74, y: 100, z: 74 }],
    fallbackRespawnPoint: { x: 0, y: 118, z: 0 },
    voidY: -19,
    teamExtraEmeraldGenInterval: EMERLAD_GENERATOR_INTERVAL,
    teams: [
        {
            type: TeamType.Green,
            itemShopLocation: { x: -70, y: 67, z: -5 },
            teamShopLocation: { x: -70, y: 67, z: 3 },
            teamChestLocation: { x: -70, y: 66, z: -3 },
            playerSpawn: { x: -65.5, y: 66.07, z: 0.5 },
            playerSpawnViewDirection: { x: 1, y: 0, z: 0 },
            islandArea: [{ x: -75, y: 52, z: -12 }, { x: -45, y: 79, z: 13 }],
            protectedArea: [{ x: -67, y: 66, z: -2 }, { x: -64, y: 69, z: 3 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: -69.5, y: 65.5, z: 0.5 },
                location: { x: -71, y: 65, z: -1 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: -56, y: 66, z: 0 }, { x: -55, y: 66, z: 0 }],
        }, {
            type: TeamType.Red,
            itemShopLocation: { x: 70, y: 67, z: 5 },
            teamShopLocation: { x: 70, y: 67, z: -3 },
            teamChestLocation: { x: 70, y: 66, z: 3 },
            playerSpawn: { x: 66.5, y: 66.07, z: 0.5 },
            playerSpawnViewDirection: { x: -1, y: 0, z: 0 },
            islandArea: [{ x: 46, y: 52, z: -12 }, { x: 76, y: 79, z: 13 }],
            protectedArea: [{ x: -2, y: 66, z: -67 }, { x: 3, y: 69, z: -64 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 70.5, y: 65.5, z: 0.5 },
                location: { x: 69, y: 65, z: -1 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: 56, y: 66, z: 0 }, { x: 55, y: 66, z: 0 }],
        }, {
            type: TeamType.Yellow,
            itemShopLocation: { x: 5, y: 67, z: -70 },
            teamShopLocation: { x: -3, y: 67, z: -70 },
            teamChestLocation: { x: 3, y: 66, z: -70 },
            playerSpawn: { x: 0.5, y: 66.07, z: -65.5 },
            playerSpawnViewDirection: { x: 0, y: 0, z: 1 },
            islandArea: [{ x: -12, y: 52, z: -75 }, { x: 13, y: 79, z: -45 }],
            protectedArea: [{ x: 65, y: 66, z: -2 }, { x: 68, y: 69, z: 3 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 0.5, y: 65.5, z: -69.5 },
                location: { x: -1, y: 65, z: -71 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: 0, y: 66, z: -56 }, { x: 0, y: 66, z: -55 }],
        }, {
            type: TeamType.Blue,
            itemShopLocation: { x: -5, y: 67, z: 70 },
            teamShopLocation: { x: 3, y: 67, z: 70 },
            teamChestLocation: { x: -3, y: 66, z: 70 },
            playerSpawn: { x: 0.5, y: 66.07, z: 66.5 },
            playerSpawnViewDirection: { x: 0, y: 0, z: -1 },
            islandArea: [{ x: -12, y: 52, z: 46 }, { x: 13, y: 79, z: 76 }],
            protectedArea: [{ x: -2, y: 66, z: 65 }, { x: 3, y: 69, z: 68 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 0.5, y: 65.5, z: 70.5 },
                location: { x: -1, y: 65, z: 69 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: 0, y: 66, z: 56 }, { x: 0, y: 66, z: 55 }],
        }
    ],
    extraGenerators: [
        {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 40.5, y: 65, z: 40.5 },
            location: { x: 40, y: 64, z: 40 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: 40, y: 68, z: 40 }]
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: -39.5, y: 65, z: 40.5 },
            location: { x: -40, y: 64, z: 40 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: -40, y: 68, z: 40 }]
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 40.5, y: 65, z: -39.5 },
            location: { x: 40, y: 64, z: -40 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: 40, y: 68, z: -40 }]
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: -39.5, y: 65, z: -39.5 },
            location: { x: -40, y: 64, z: -40 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: -40, y: 68, z: -40 }]
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: 10.5, y: 65, z: 10.5 },
            location: { x: 10, y: 64, z: 10 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: 10, y: 68, z: 10 }]
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: -9.5, y: 65, z: -9.5 },
            location: { x: -10, y: 64, z: -10 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocations: [{ x: -10, y: 68, z: -10 }]
        }
    ]
};
