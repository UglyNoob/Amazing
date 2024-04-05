#! /usr/bin/env node
import * as fs from 'node:fs/promises';


async function main() {
    await Promise.allSettled([
        fs.mkdir("out/AmazingBP/scripts", { recursive: true }),
        fs.mkdir("out/AmazingBP/structures/void", { recursive: true }),
        fs.mkdir("out/AmazingBP/entities", { recursive: true })
    ]);

    await Promise.all([
        fs.copyFile("manifest.json", "out/AmazingBP/manifest.json"),
        fs.copyFile("scripts/main.js", "out/AmazingBP/scripts/main.js"),
        fs.copyFile("structures/void/void.mcstructure", "out/AmazingBP/structures/void/void.mcstructure"),
        fs.copyFile("entities/fireball.json", "out/AmazingBP/entities/fireball.json"),
        fs.copyFile("pack_icon.png", "out/AmazingBP/pack_icon.png")
    ]);

    console.log("Publish complete");
}

main();
