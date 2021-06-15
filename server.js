const express = require("express")
const app = express()
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const Game = require(__dirname + "/static/files/Game.js")
const path = require("path")
const PORT = process.env.PORT || 3000;

app.use(express.json())
app.use(express.static("static"))
app.use(express.static("static/client"))

let game = new Game()

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname + "/static/client/index.html"))
})

app.get("/ping", function (req, res) {
    res.end("pong")
})

app.post("/startGame", function (req, res) {
    let name = req.body.name
    let result = game.addToGame(name)

    if (!result.join) {
        return res.json({ error: 'Lobby is full' })
    }

    const { player } = result

    res.json({
        success: true,
        port: PORT,
        player: {
            id: player.id,
            x: player.x,
            z: player.z,
            name: player.name
        }
    })
})

app.post("/getBoard", function (req, res) {
    let value = game.getBoard()
    res.json(value)
})

app.post("/getRecords", async function (req, res) {
    let records = await game.database.getRecords()
    res.json(records)
})

const httpServer = server.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT)
})

io.on('connection', (socket) => {
    socket.on("assignPlayer", (data) => {
        const playerId = data.playerId

        if (!playerId) {
            console.log('No playerId')
            return socket.disconnect(true)
        }

        const player = game.getPlayerById(playerId)
        if (!player) {
            console.log('No player')
            return socket.disconnect(true)
        }

        player.socket = socket

        player.sendPacketData('world-state', {
            players: game.players.map(player => player.toNetworkObject())
        })

        if (game.players.length == 2) {
            game.countdownToStart()
        }

        const packet = game.makePacket('player-join', { player: player.toNetworkObject() })
        game.broadcastPacket(packet, player)
        console.log("websocket is okey")

        socket.on('message', data => {
            const packet = JSON.parse(data)
            game.handlePacket(player, packet)
        })
    })
})