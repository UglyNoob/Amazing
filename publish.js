#! /usr/bin/env node
import * as fs from 'node:fs/promises';

function addTrailingSlash(pathStr) {
    if (pathStr.endsWith("/") || pathStr.endsWith("\\")) return pathStr;
    return pathStr + "/";
}

async function copyFolder(source, destination) {
    try {
        await fs.mkdir(destination);
    } catch { }
    source = addTrailingSlash(source);
    destination = addTrailingSlash(destination);

    const operations = [];
    for (const entry of await fs.readdir(source)) {
        if (entry.startsWith(".")) continue;
        const sourcePath = source + entry;
        const destPath = destination + entry;
        operations.push(fs.stat(sourcePath).then(stat => {
            if (stat.isDirectory()) {
                return copyFolder(sourcePath, destPath);
            } else {
                return fs.copyFile(sourcePath, destPath);
            }
        }));
    }
    return Promise.all(operations);
}

async function main() {
    await fs.rm("out", { force: true, recursive: true });
    await fs.mkdir("out/AmazingBP/scripts", { recursive: true });

    await Promise.all([
        fs.copyFile("manifest.json", "out/AmazingBP/manifest.json"),
        fs.copyFile("scripts/main.js", "out/AmazingBP/scripts/main.js"),
        fs.copyFile("pack_icon.png", "out/AmazingBP/pack_icon.png")
    ]);
    await Promise.all([
        copyFolder("entities", "out/AmazingBP/entities"),
        copyFolder("items", "out/AmazingBP/items"),
        copyFolder("structures", "out/AmazingBP/structures"),
        copyFolder("resource_pack", "out/AmazingRP"),
    ]);

    console.log("Publish complete");
}

main();
