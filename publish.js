#! /usr/bin/env node
import * as fs from 'node:fs/promises';


async function main() {
    await fs.rm("out", {force: true, recursive: true});
    await fs.mkdir("out/AmazingBP/scripts", { recursive: true });

    await Promise.all([
        fs.copyFile("manifest.json", "out/AmazingBP/manifest.json"),
        fs.copyFile("scripts/main.js", "out/AmazingBP/scripts/main.js"),
        fs.copyFile("pack_icon.png", "out/AmazingBP/pack_icon.png")
    ]);
    const operations = [];
    for(const folderName of ["entities", "structures"]) {
        await fs.mkdir("out/AmazingBP/" + folderName);
        for(const fileName of await fs.readdir(folderName, {
            recursive: true
        })) {
            const path = folderName + "/" + fileName;
            console.log(path);
            const directory = (await fs.stat(path)).isDirectory();
            if(directory) {
                await fs.mkdir("out/AmazingBP/" + path, { recursive: true });
            } else {
                operations.push(fs.copyFile(path, "out/AmazingBP/" + path));
            }
        }
    }
    await Promise.all(operations);

    console.log("Publish complete");
}

main();
