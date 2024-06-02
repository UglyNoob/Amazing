import { GeneratorType, MapInformation, TeamType } from "./Bedwars.js";

const IRONGOLD_GENERATOR_INTERVAL = 60;
const DIAMOND_GENERATOR_INTERVAL = 900;
const EMERLAD_GENERATOR_INTERVAL = 1200;
/*
 * Convention:
 * playableArea should be the map's area extending 50 blocks
 * */

export const mapGarden: MapInformation = {
    playableArea: [{ x: 0, y: -64, z: 0 }, { x: 209, y: 101, z: 131 }],
    fallbackRespawnPoint: { x: 0 + 104, y: 149 - 54, z: 0 + 65 },
    voidY: -64,
    teamExtraEmeraldGenInterval: EMERLAD_GENERATOR_INTERVAL,
    teams: [
        {
            type: TeamType.Red,
            itemShopLocation: { x: 95.5 + 104, y: 79 - 54, z: 8.5 + 65 },
            teamShopLocation: { x: 95.5 + 104, y: 79 - 54, z: -7.5 + 65 },
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
            itemShopLocation: { x: -94.5 + 104, y: 79 - 54, z: -8 + 65.5 },
            teamShopLocation: { x: -94.5 + 104, y: 79 - 54, z: 8 + 65.5 },
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
    playableArea: [{ x: -161, y: -16, z: -161 }, { x: 162, y: 139, z: 162 }],
    fallbackRespawnPoint: { x: 0, y: 133, z: 0 },
    voidY: -16,
    teamExtraEmeraldGenInterval: EMERLAD_GENERATOR_INTERVAL,
    teams: [
        {
            type: TeamType.Green,
            itemShopLocation: { x: 105.5, y: 73, z: -56.5 },
            teamShopLocation: { x: 91.5, y: 73, z: -56.5 },
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
            itemShopLocation: { x: 91.5, y: 73, z: 57.5 },
            teamShopLocation: { x: 105.5, y: 73, z: 57.5 },
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
            itemShopLocation: { x: 57.5, y: 73, z: 105.5 },
            teamShopLocation: { x: 57.5, y: 73, z: 91.5 },
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
            itemShopLocation: { x: -56.5, y: 73, z: 91.5 },
            teamShopLocation: { x: -56.5, y: 73, z: 105.5 },
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
            itemShopLocation: { x: -104.5, y: 73, z: 57.5 },
            teamShopLocation: { x: -90.5, y: 73, z: 57.5 },
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
            itemShopLocation: { x: -90.5, y: 73, z: -56.5 },
            teamShopLocation: { x: -104.5, y: 73, z: -56.5 },
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
            itemShopLocation: { x: -56.5, y: 73, z: -104.5 },
            teamShopLocation: { x: -56.5, y: 73, z: -90.5 },
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
            itemShopLocation: { x: 57.5, y: 73, z: -90.5 },
            teamShopLocation: { x: 57.5, y: 73, z: -104.5 },
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
            indicatorLocation: { x: 85.5, y: 77, z: 0.5 }
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 0.5, y: 74, z: 85.5 },
            location: { x: 0, y: 73, z: 85 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocation: { x: 0.5, y: 77, z: 85.5 }
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: -84.5, y: 74, z: 0.5 },
            location: { x: -85, y: 73, z: 0 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocation: { x: -84.5, y: 77, z: 0.5 }
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 0.5, y: 74, z: -84.5 },
            location: { x: 0, y: 73, z: -85 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocation: { x: 0.5, y: 77, z: -84.5 }
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: 24.5, y: 74, z: 24.5 },
            location: { x: 24, y: 73, z: 24 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocation: { x: 24.5, y: 77, z: 24.5 }
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: -23.5, y: 74, z: 24.5 },
            location: { x: -24, y: 73, z: 24 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocation: { x: -23.5, y: 77, z: 24.5 }
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: 24.5, y: 74, z: -23.5 },
            location: { x: 24, y: 73, z: -24 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocation: { x: 24.5, y: 77, z: -23.5 }
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: -23.5, y: 74, z: -23.5 },
            location: { x: -24, y: 73, z: -24 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocation: { x: -23.5, y: 77, z: -23.5 }
        }
    ]
};
export const mapWaterfall: MapInformation = {
    playableArea: [{ x: -134, y: -16, z: -134 }, { x: 135, y: 101, z: 135 }],
    fallbackRespawnPoint: { x: 0, y: 118, z: 0 },
    voidY: -16,
    teamExtraEmeraldGenInterval: EMERLAD_GENERATOR_INTERVAL,
    teams: [
        {
            type: TeamType.Green,
            itemShopLocation: { x: 74.5, y: 66, z: -28.5 },
            teamShopLocation: { x: 74.5, y: 66, z: -38.5 },
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
            itemShopLocation: { x: 74.5, y: 66, z: 37.5 },
            teamShopLocation: { x: 74.5, y: 66, z: 27.5 },
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
            itemShopLocation: { x: 29.5, y: 66, z: 74.5 },
            teamShopLocation: { x: 39.5, y: 66, z: 74.5 },
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
            itemShopLocation: { x: -36.5, y: 66, z: 74.5 },
            teamShopLocation: { x: -26.5, y: 66, z: 74.5 },
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
            itemShopLocation: { x: -73.5, y: 66, z: 29.5 },
            teamShopLocation: { x: -73.5, y: 66, z: 39.5 },
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
            itemShopLocation: { x: -73.5, y: 66, z: -36.5 },
            teamShopLocation: { x: -73.5, y: 66, z: -26.5 },
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
            itemShopLocation: { x: -28.5, y: 66, z: -73.5 },
            teamShopLocation: { x: -38.5, y: 66, z: -73.5 },
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
            itemShopLocation: { x: 37.5, y: 66, z: -73.5 },
            teamShopLocation: { x: 27.5, y: 66, z: -73.5 },
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
            indicatorLocation: { x: 52.5, y: 67, z: 0.5 }
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 0.5, y: 64, z: 52.5 },
            location: { x: 0, y: 63, z: 52 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocation: { x: 0.5, y: 67, z: 52.5 }
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: -51.5, y: 64, z: 0.5 },
            location: { x: -52, y: 63, z: 0 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocation: { x: -51.5, y: 67, z: 0.5 }
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 0.5, y: 64, z: -51.5 },
            location: { x: 0, y: 63, z: -52 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocation: { x: 0.5, y: 67, z: -51.5 }
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: 12.5, y: 78, z: 12.5 },
            location: { x: 12, y: 77, z: 12 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocation: { x: 12.5, y: 81, z: 12.5 }
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: -11.5, y: 78, z: 12.5 },
            location: { x: -12, y: 77, z: 12 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocation: { x: -11.5, y: 81, z: 12.5 }
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: 12.5, y: 78, z: -11.5 },
            location: { x: 12, y: 77, z: -12 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocation: { x: 12.5, y: 81, z: -11.5 }
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: -11.5, y: 78, z: -11.5 },
            location: { x: -12, y: 77, z: -12 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocation: { x: -11.5, y: 81, z: -11.5 }
        }
    ]
};

export const mapEastwood: MapInformation = {
    playableArea: [{ x: -124, y: -19, z: -124 }, { x: 125, y: 100, z: 125 }],
    fallbackRespawnPoint: { x: 0, y: 118, z: 0 },
    voidY: -19,
    teamExtraEmeraldGenInterval: EMERLAD_GENERATOR_INTERVAL,
    teams: [
        {
            type: TeamType.Green,
            itemShopLocation: { x: -69.5, y: 66, z: -4.5 },
            teamShopLocation: { x: -69.5, y: 66, z: 3.5 },
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
            itemShopLocation: { x: 70.5, y: 66, z: 5.5 },
            teamShopLocation: { x: 70.5, y: 66, z: -2.5 },
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
            itemShopLocation: { x: 5.5, y: 66, z: -69.5 },
            teamShopLocation: { x: -2.5, y: 66, z: -69.5 },
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
            itemShopLocation: { x: -4.5, y: 66, z: 70.5 },
            teamShopLocation: { x: 3.5, y: 66, z: 70.5 },
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
            indicatorLocation: { x: 40.5, y: 68, z: 40.5 }
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: -39.5, y: 65, z: 40.5 },
            location: { x: -40, y: 64, z: 40 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocation: { x: -39.5, y: 68, z: 40.5 }
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 40.5, y: 65, z: -39.5 },
            location: { x: 40, y: 64, z: -40 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocation: { x: 40.5, y: 68, z: -39.5 }
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: -39.5, y: 65, z: -39.5 },
            location: { x: -40, y: 64, z: -40 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocation: { x: -39.5, y: 68, z: -39.5 }
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: 10.5, y: 65, z: 10.5 },
            location: { x: 10, y: 64, z: 10 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocation: { x: 10.5, y: 68, z: 10.5 }
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: -9.5, y: 65, z: -9.5 },
            location: { x: -10, y: 64, z: -10 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocation: { x: -9.5, y: 68, z: -9.5 }
        }
    ]
};

export const mapInvasion: MapInformation = {
    playableArea: [{ x: -118, y: 0, z: -118 }, { x: 119, y: 115, z: 119 }],
    fallbackRespawnPoint: { x: 0, y: 118, z: 0 },
    voidY: 0,
    teamExtraEmeraldGenInterval: EMERLAD_GENERATOR_INTERVAL,
    teams: [
        {
            type: TeamType.Green,
            itemShopLocation: { x: -51.5, y: 93, z: 44.5 },
            teamShopLocation: { x: -43.5, y: 93, z: 52.5 },
            teamChestLocation: { x: -46, y: 94, z: 42 },
            playerSpawn: { x: -47.5, y: 93, z: 48.5 },
            playerSpawnViewDirection: { x: 1, y: 0, z: -1 },
            islandArea: [{ x: -68, y: 84, z: 28 }, { x: -27, y: 111, z: 69 }],
            protectedArea: [{ x: -50, y: 93, z: 46 }, { x: -45, y: 97, z: 51 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                location: { x: -52, y: 93, z: 50 },
                spawnLocation: { x: -50.5, y: 93, z: 51.5 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: -39, y: 94, z: 39 }, { x: -39, y: 94, z: 40 }]
        }, {
            type: TeamType.Red,
            itemShopLocation: { x: 52.5, y: 93, z: -43.5 },
            teamShopLocation: { x: 44.5, y: 93, z: -51.5 },
            teamChestLocation: { x: 46, y: 94, z: -42 },
            playerSpawn: { x: 48.5, y: 93, z: -47.5 },
            playerSpawnViewDirection: { x: -1, y: 0, z: 1 },
            islandArea: [{ x: 28, y: 84, z: -68 }, { x: 69, y: 111, z: -27 }],
            protectedArea: [{ x: 46, y: 93, z: -50 }, { x: 51, y: 97, z: -45 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                location: { x: 50, y: 93, z: -52 },
                spawnLocation: { x: 51.5, y: 93, z: -50.5 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: 39, y: 94, z: -39 }, { x: 39, y: 94, z: -40 }]
        }, {
            type: TeamType.Yellow,
            itemShopLocation: { x: -43.5, y: 93, z: -51.5 },
            teamShopLocation: { x: -51.5, y: 93, z: -43.5 },
            teamChestLocation: { x: -42, y: 94, z: -46 },
            playerSpawn: { x: -47.5, y: 93, z: -47.5 },
            playerSpawnViewDirection: { x: 1, y: 0, z: 1 },
            islandArea: [{ x: -68, y: 84, z: -68 }, { x: -27, y: 111, z: -27 }],
            protectedArea: [{ x: -50, y: 93, z: -50 }, { x: -45, y: 97, z: -45 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                location: { x: -52, y: 93, z: -52 },
                spawnLocation: { x: -50.5, y: 93, z: -50.5 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: -39, y: 94, z: -39 }, { x: -40, y: 94, z: -39 }]
        }, {
            type: TeamType.Blue,
            itemShopLocation: { x: 44.5, y: 93, z: 52.5 },
            teamShopLocation: { x: 52.5, y: 93, z: 44.5 },
            teamChestLocation: { x: 42, y: 94, z: 46 },
            playerSpawn: { x: 48.5, y: 93, z: 48.5 },
            playerSpawnViewDirection: { x: -1, y: 0, z: -1 },
            islandArea: [{ x: 20, y: 84, z: 28 }, { x: 69, y: 111, z: 69 }],
            protectedArea: [{ x: 46, y: 93, z: 46 }, { x: 51, y: 97, z: 51 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                location: { x: 50, y: 93, z: 50 },
                spawnLocation: { x: 51.5, y: 93, z: 51.5 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: 39, y: 94, z: 39 }, { x: 40, y: 94, z: 39 }]
        }
    ],
    extraGenerators: [
        {
            type: GeneratorType.Diamond,
            spawnLocation: { x: -47.5, y: 87, z: 0.5 },
            location: { x: -48, y: 86, z: 0 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocation: { x: -47.5, y: 90, z: 0.5 }
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 48.5, y: 87, z: 0.5 },
            location: { x: 48, y: 86, z: 0 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocation: { x: 48.5, y: 90, z: 0.5 }
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 0, y: 87, z: -47.5 },
            location: { x: 0, y: 86, z: -48 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocation: { x: 0, y: 90, z: -47.5 }
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 0, y: 87, z: 48.5 },
            location: { x: 0, y: 86, z: 48 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocation: { x: 0, y: 90, z: 48.5 }
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: 0.5, y: 100, z: 13.5 },
            location: { x: 0, y: 99, z: 13 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocation: { x: 0.5, y: 103, z: 13.5 }
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: 0.5, y: 100, z: -12.5 },
            location: { x: 0, y: 99, z: -13 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocation: { x: 0.5, y: 103, z: -12.5 }
        }
    ]
};

export const mapVaryth: MapInformation = {
    playableArea: [{ x: -90, y: 71, z: -90 }, { x: 91, y: 128, z: 91 }],
    fallbackRespawnPoint: { x: 0, y: 120, z: 0 },
    voidY: -64, // void less
    teamExtraEmeraldGenInterval: EMERLAD_GENERATOR_INTERVAL,
    teams: [
        {
            type: TeamType.Green,
            itemShopLocation: { x: 20.5, y: 89, z: 82.5 },
            teamShopLocation: { x: 34.5, y: 89, z: 82.5 },
            teamChestLocation: { x: 23, y: 89, z: 78 },
            playerSpawn: { x: 27.5, y: 89, z: 81.5 },
            playerSpawnViewDirection: { x: 0, y: 0, z: -1 },
            islandArea: [{ x: 17, y: 88, z: 64 }, { x: 38, y: 119, z: 87 }],
            protectedArea: [{ x: 25, y: 89, z: 79 }, { x: 30, y: 94, z: 83 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 27.5, y: 88.5, z: 85.5 },
                location: { x: 26, y: 88, z: 84 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: 27, y: 88, z: 71 }, { x: 27, y: 88, z: 70 }],
        }, {
            type: TeamType.Blue,
            itemShopLocation: { x: -33.5, y: 89, z: 82.5 },
            teamShopLocation: { x: -19.5, y: 89, z: 82.5 },
            teamChestLocation: { x: -31, y: 89, z: 78 },
            playerSpawn: { x: -26.5, y: 89, z: 81.5 },
            playerSpawnViewDirection: { x: 0, y: 0, z: -1 },
            islandArea: [{ x: -37, y: 88, z: 64 }, { x: -16, y: 119, z: 87 }],
            protectedArea: [{ x: -29, y: 89, z: 79 }, { x: -24, y: 94, z: 83 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: -26.5, y: 88.5, z: 85.5 },
                location: { x: -28, y: 88, z: 84 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: -27, y: 88, z: 71 }, { x: -27, y: 88, z: 70 }],
        }, {
            type: TeamType.Yellow,
            itemShopLocation: { x: -81.5, y: 89, z: 20.5 },
            teamShopLocation: { x: -81.5, y: 89, z: 34.5 },
            teamChestLocation: { x: -78, y: 89, z: 23 },
            playerSpawn: { x: -80.5, y: 89, z: 27.5 },
            playerSpawnViewDirection: { x: 1, y: 0, z: 0 },
            islandArea: [{ x: -86, y: 88, z: 17 }, { x: -63, y: 119, z: 38 }],
            protectedArea: [{ x: -82, y: 89, z: 25 }, { x: -78, y: 94, z: 30 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: -84.5, y: 88.5, z: 27.5 },
                location: { x: -86, y: 88, z: 26 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: -71, y: 88, z: 27 }, { x: -70, y: 88, z: 27 }],
        }, {
            type: TeamType.Pink,
            itemShopLocation: { x: -81.5, y: 89, z: -33.5 },
            teamShopLocation: { x: -81.5, y: 89, z: -19.5 },
            teamChestLocation: { x: -78, y: 89, z: -31 },
            playerSpawn: { x: -80.5, y: 89, z: -26.5 },
            playerSpawnViewDirection: { x: 1, y: 0, z: 0 },
            islandArea: [{ x: -86, y: 88, z: -37 }, { x: -63, y: 119, z: -16 }],
            protectedArea: [{ x: -82, y: 89, z: -29 }, { x: -78, y: 94, z: -24 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: -84.5, y: 88.5, z: -26.5 },
                location: { x: -86, y: 88, z: -28 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: -71, y: 88, z: -27 }, { x: -70, y: 88, z: -27 }],
        }, {
            type: TeamType.Gray,
            itemShopLocation: { x: -19.5, y: 89, z: -81.5 },
            teamShopLocation: { x: -33.5, y: 89, z: -81.5 },
            teamChestLocation: { x: -23, y: 89, z: -78 },
            playerSpawn: { x: -26.5, y: 89, z: -80.5 },
            playerSpawnViewDirection: { x: 0, y: 0, z: 1 },
            islandArea: [{ x: -37, y: 88, z: -86 }, { x: -16, y: 119, z: -63 }],
            protectedArea: [{ x: -29, y: 89, z: -82 }, { x: -24, y: 94, z: -78 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: -26.5, y: 88.5, z: -84.5 },
                location: { x: -28, y: 88, z: -86 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: -27, y: 88, z: -71 }, { x: -27, y: 88, z: -70 }],
        }, {
            type: TeamType.Cyan,
            itemShopLocation: { x: 34.5, y: 89, z: -81.5 },
            teamShopLocation: { x: 20.5, y: 89, z: -81.5 },
            teamChestLocation: { x: 31, y: 89, z: -78 },
            playerSpawn: { x: 27.5, y: 89, z: -80.5 },
            playerSpawnViewDirection: { x: 0, y: 0, z: 1 },
            islandArea: [{ x: 17, y: 88, z: -86 }, { x: 38, y: 119, z: -63 }],
            protectedArea: [{ x: 25, y: 89, z: -82 }, { x: 30, y: 94, z: -78 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 27.5, y: 88.5, z: -84.5 },
                location: { x: 26, y: 88, z: -86 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: 27, y: 88, z: -71 }, { x: 27, y: 88, z: -70 }],
        }, {
            type: TeamType.White,
            itemShopLocation: { x: 82.5, y: 89, z: -19.5 },
            teamShopLocation: { x: 82.5, y: 89, z: -33.5 },
            teamChestLocation: { x: 78, y: 89, z: -23 },
            playerSpawn: { x: 81.5, y: 89, z: -26.5 },
            playerSpawnViewDirection: { x: -1, y: 0, z: 0 },
            islandArea: [{ x: 64, y: 88, z: -37 }, { x: 87, y: 119, z: -16 }],
            protectedArea: [{ x: 79, y: 89, z: -29 }, { x: 83, y: 94, z: -24 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 85.5, y: 88.5, z: -26.5 },
                location: { x: 84, y: 88, z: -28 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: 71, y: 88, z: -27 }, { x: 70, y: 88, z: -27 }],
        }, {
            type: TeamType.Red,
            itemShopLocation: { x: 82.5, y: 89, z: 34.5 },
            teamShopLocation: { x: 82.5, y: 89, z: 20.5 },
            teamChestLocation: { x: 78, y: 89, z: 31 },
            playerSpawn: { x: 81.5, y: 89, z: 27.5 },
            playerSpawnViewDirection: { x: -1, y: 0, z: 0 },
            islandArea: [{ x: 64, y: 88, z: 17 }, { x: 87, y: 119, z: 38 }],
            protectedArea: [{ x: 79, y: 89, z: 25 }, { x: 83, y: 94, z: 30 }],
            teamGenerator: {
                type: GeneratorType.IronGold,
                spawnLocation: { x: 85.5, y: 88.5, z: 27.5 },
                location: { x: 84, y: 88, z: 26 },
                initialInterval: IRONGOLD_GENERATOR_INTERVAL
            },
            bedLocation: [{ x: 71, y: 88, z: 27 }, { x: 70, y: 88, z: 27 }],
        }
    ],
    extraGenerators: [
        {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 35.5, y: 82, z: 35.5 },
            location: { x: 35, y: 81, z: 35 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocation: { x: 35.5, y: 85, z: 35.5 }
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: -34.5, y: 82, z: 35.5 },
            location: { x: -35, y: 81, z: 35 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocation: { x: -34.5, y: 85, z: 35.5 }
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: 35.5, y: 82, z: -34.5 },
            location: { x: 35, y: 81, z: -35 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocation: { x: 35.5, y: 85, z: -34.5 }
        }, {
            type: GeneratorType.Diamond,
            spawnLocation: { x: -34.5, y: 82, z: -34.5 },
            location: { x: -35, y: 81, z: -35 },
            initialInterval: DIAMOND_GENERATOR_INTERVAL,
            indicatorLocation: { x: -34.5, y: 85, z: -34.5 }
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: 16.5, y: 95, z: 16.5 },
            location: { x: 16, y: 94, z: 16 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocation: { x: 16.5, y: 98, z: 16.5 }
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: -15.5, y: 95, z: 16.5 },
            location: { x: -16, y: 94, z: 16 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocation: { x: -15.5, y: 98, z: 16.5 }
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: 16.5, y: 95, z: -15.5 },
            location: { x: 16, y: 94, z: -16 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocation: { x: 16.5, y: 98, z: -15.5 }
        }, {
            type: GeneratorType.Emerald,
            spawnLocation: { x: -15.5, y: 95, z: -15.5 },
            location: { x: -16, y: 94, z: -16 },
            initialInterval: EMERLAD_GENERATOR_INTERVAL,
            indicatorLocation: { x: -15.5, y: 98, z: -15.5 }
        }
    ]
};
