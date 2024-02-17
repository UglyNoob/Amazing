const net = require('node:net');
const fs = require('node:fs');
const CLIENT_GREETING = "Client for the application";
const SERVER_GREETING = "Server for the application";

const PATH_PREFIX = "C:/Users/Administrator/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_behavior_packs/Amazing/";

let server = net.createServer(client => {
    client.write(SERVER_GREETING);
    client.once("data", chunk => {
        if(chunk.toString() != CLIENT_GREETING) {
            console.log(`${Date()}: Connection failed`);
            client.on("error", () => {});
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
            if(stat.isDirectory()) {
                for(let filename of fs.readdirSync(fullPath)) {
                    publish(filepath + '/' + filename);
                }
                return;
            }
            let file = fs.openSync(fullPath);
            client.write(`{"filepath":"${filepath}","length":${fs.fstatSync(file).size}}`);
            while(true) {
                let bytesRead = fs.readSync(file, readBuffer);
                if(bytesRead == 0) break;
                client.write(readBuffer.subarray(0, bytesRead));
            }
            fs.close(file);
        }
        function onInput() {
            publish("manifest.json");
            publish("scripts")

            console.log(`${Date()}: Publish complete.`);
        }
        process.stdin.on("data", onInput);
        client.on("error", () => {
            process.stdin.off("data", onInput);
            console.log(`${Date()}: Client disconnected.`);
        });
    });
});
server.listen(8000);
