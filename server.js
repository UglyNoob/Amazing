#! /usr/bin/env node
// const net = require('node:net');
// const fs = require('node:fs');
import * as net from 'node:net';
import * as fs from 'node:fs';

const CLIENT_GREETING = "Client for the application";
const SERVER_GREETING = "Server for the application";
const PORT = 8537;

// const PATH_PREFIX = "C:/Users/Administrator/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_behavior_packs/Amazing/";
let PATH_PREFIX = process.argv.slice(2).join(" ");
main: {
    if (PATH_PREFIX == "") {
        console.error("Please specify path.");
        break main;
    }
    {
        let last;
        for (last of PATH_PREFIX);
        if (last != '/') PATH_PREFIX += '/';
    }
    console.log(`Working on ${PATH_PREFIX} with port ${PORT}`);
    let server = net.createServer(client => {
        client.write(SERVER_GREETING);
        client.once("data", chunk => {
            if (chunk.toString() != CLIENT_GREETING) {
                console.log(`${Date()}: Connection failed`);
                client.on("error", () => { });
                return;
            }
            console.log(`${Date()}: Connected.\nPress enter to publish.`);

            let readBuffer = Buffer.allocUnsafe(20480);
            /**
             * @param {string} filepath
             */
            function publish(filepath) {
                let fullPath = PATH_PREFIX + filepath;
                let stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    for (let filename of fs.readdirSync(fullPath)) {
                        publish(filepath + '/' + filename);
                    }
                    return;
                }
                let file = fs.openSync(fullPath);
                client.write(`{"filepath":"${filepath}","length":${fs.fstatSync(file).size}}`);
                while (true) {
                    let bytesRead = fs.readSync(file, readBuffer);
                    if (bytesRead == 0) break;
                    client.write(readBuffer.subarray(0, bytesRead));
                }
                fs.close(file);
            }
            function onInput() {
                publish("manifest.json");
                publish("scripts");

                console.log(`${Date()}: Publish complete.`);
            }
            process.stdin.on("data", onInput);
            client.on("error", () => {
                process.stdin.off("data", onInput);
                console.log(`${Date()}: Client disconnected.`);
            });
        });
    });
    server.listen(PORT);
}