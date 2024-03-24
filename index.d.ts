import { Test } from "@minecraft/server-gametest";
import { BedWarsGame } from "./src/Bedwars.ts";

declare global {
    var game: BedWarsGame;
    var test: Test;
}