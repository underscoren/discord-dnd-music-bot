const { readdir } = require("fs/promises");
const { resolve, relative } = require("path");
const http = require("http");
const { Readable } = require("stream");
const outputStream = new Readable({read() {}});

const express = require("express");
const app = express();
const httpServer = http.createServer(app);

const WebSocketServer = require("ws").Server;
const wss = new WebSocketServer({ server: httpServer });

const PORT = 80; //TODO: allow user to configure this

app.use(express.static("dist"));

// taken from https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search 
async function getFiles(dir) {
    const dirents = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
        const res = resolve(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : relative("./dist/",res).replace(/\\/g,"/");
    }));

    return files.flat();
}

app.get("/audio/music", (req, res) => {
    getFiles("dist/audio/music").then(files => {
        files.shift(); // remove .gitignore file which should be on top
        res.json(files);
    }).catch(err => {
        console.error("Error getting file list");
        console.error(err);
        res.status(500).json({ error:"Error getting file list" });
    });
});

app.get("/audio/sfx", (req, res) => {
    getFiles("dist/audio/sfx").then(files => {
        files.shift(); // remove .gitignore file which should be on top
        res.json(files);
    }).catch(err => {
        console.error("Error getting file list");
        console.error(err);
        res.status(500).json({ error:"Error getting file list" });
    });
});

wss.on("connection", socket => {
    console.log("Socket opened");

    // push all data received to output stream
    socket.on("message", data => {
        outputStream.push(data, "binary");
    });

    socket.on("close", () => {
        console.log("Socket closed");
    });
});


function start() {
    httpServer.listen(PORT, () => {
        console.log("Webserver started on port "+PORT);
    });
}

module.exports = { start, outputStream };