const net = require('node:net');
const fs = require('node:fs');

const CLIENT_GREETING = "Client for the application";
const SERVER_GREETING = "Server for the application";

let host = process.argv[2];
let PATH_PREFIX = process.argv.slice(3).join(" ");

main: {
if(host == "") {
    console.error("Please specify the host.");
    break main;
}
if(PATH_PREFIX == "") {
    console.error("Please specify path.");
    break main;
}
if(PATH_PREFIX[PATH_PREFIX.length - 1] != '/') PATH_PREFIX += '/';
console.log(`Working on ${PATH_PREFIX}\nConnecting to ${host}:8000`);

let server = net.createConnection(8000, host, () => {
    server.write(CLIENT_GREETING);
    server.once("data", chunk => {
        if(chunk.toString() != SERVER_GREETING) {
            console.log(`${Date()}: Connection failed.`);
            return;
        }
        console.log(`${Date()}: Server connected.`);
        server.on('data', onReceiveData);
    });
});
server.on("error", () => console.log(`${Date()}: Connection lost.`));

/**
 * @param {string[]} array
 */
function defineEnum(array) {
    return array.reduce((result, value, index) => {
        result[result[value] = index] = value;
        return result;
    }, {});
}

const MODES = defineEnum(["toJSON", "toFile"]);
let mode = MODES.toJSON;
let destFile = 0;
let metaJSON = "";
let bytesToWrite = 0;

/**
 * @param {Buffer} buffer
 */
function onReceiveData(buffer) {
    if(buffer.length == 0) return;

    if(mode == MODES.toJSON) {
        let index = buffer.indexOf('}');
        if(index < 0) { // not found
            metaJSON += buffer.toString();
            return;
        }
        // found a right bracket
        metaJSON += buffer.subarray(0, index + 1).toString();
        let obj = JSON.parse(metaJSON);
        destFile = fs.openSync(PATH_PREFIX + obj.filepath, "w");
        bytesToWrite = obj.length;
        mode = MODES.toFile;
        metaJSON = "";

        onReceiveData(buffer.subarray(index + 1));
    } else if(mode == MODES.toFile) {
        if(buffer.length < bytesToWrite) {
            fs.writeFileSync(destFile, buffer);
            bytesToWrite -= buffer.length;
        } else {
            fs.writeFileSync(destFile, buffer.subarray(0, bytesToWrite));
            fs.closeSync(destFile);
            mode = MODES.toJSON;
            onReceiveData(buffer.subarray(bytesToWrite));
        }
    }
}
}
