import { Test } from "@minecraft/server-gametest";
import { Game } from "./src/Bedwars.ts";

declare global {
    var game: Game;
    var test: Test;
}