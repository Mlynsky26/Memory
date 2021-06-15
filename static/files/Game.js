const Player = require("./Player.js")
const Level = require("./Level.js")
const Requests = require("./Requests.js")
const Database = require("./Database.js")
module.exports = class Game {
    constructor() {
        this.database = new Database(this)
        this.reset()
    }

    reset() {
        this.players = []
        this.levelNumber = 0
        this.points = 0
        this.requests = new Requests(this)
        this.level = new Level(this, this.levelNumber)
    }

    addPoints() {
        this.points += this.level.neededFruits * 2
        this.requests.pointsNumber(this.points)
    }

    addPointsForHearts() {
        this.points += this.level.lives * 10
        this.requests.pointsNumber(this.points)
    }

    addToGame(name) {
        if (this.players.length > 1) return { join: false }
        let player = new Player(name, this.players.length + 1)
        this.players.push(player)
        return { join: true, player }
    }

    async countdownToStart() {

        this.requests.moveBlocker(true)

        this.requests.rotateAll(Math.PI)

        await new Promise((resolve) => setTimeout(resolve, 10000))

        for (let i = 5; i > 0; i--) {

            this.requests.updateTimer(i)

            if (i == 2) {
                this.requests.rotateAll(0)
            }
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }
        this.startGame()
    }

    startGame() {
        this.requests.updateTimer("Start!!!")
        this.requests.pointsNumber(this.points)
        this.level.startLevel()
    }

    noLives() {
        this.requests.moveBlocker(false)
        this.requests.endGame(this.points)
        this.database.saveRecords(this.players[0].name, this.players[1].name, this.points, this.levelNumber + 1)
        this.reset()
    }

    getBoard() {
        return this.level.board
    }

    async nextLevel() {
        this.levelNumber++
        this.level = new Level(this, this.levelNumber)
        let pp = []
        this.players.forEach(pl => {
            pl.resetPosition()
            pp.push(pl.toNetworkObject())
        })
        this.lives = 3

        this.requests.nextLevel(this.level.board)

        await new Promise((resolve) => setTimeout(resolve, 2000))
        this.countdownToStart()
    }

    getPlayerById(id) {
        return this.players.find(player => player.id == id)
    }

    handlePacket(sender, packet) {
        switch (packet.type) {
            case 'player-move': {
                const { x, z, rotation } = packet.data
                const outPacket = this.makePacket('player-move', {
                    playerId: sender.id,
                    x,
                    z,
                    rotation
                })

                sender.x = x
                sender.z = z
                sender.rotation = rotation
                this.broadcastPacket(outPacket, sender)
                break
            }
            case 'player-animation': {
                const { animation, timeScale } = packet.data
                const outPacket = this.makePacket("player-animation", {
                    playerId: sender.id,
                    animation,
                    timeScale
                })
                this.broadcastPacket(outPacket, sender)
                break
            }
        }
    }

    broadcastPacket(packet, sender = undefined) {
        for (const player of this.players) {
            if (player !== sender) {
                player.sendPacket(packet)
            }
        }
    }

    makePacket(type, data) {
        return { type, data }
    }
}
