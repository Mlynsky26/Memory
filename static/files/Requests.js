module.exports = class Requests {
    constructor(game) {
        this.game = game
        this.players=this.game.players
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

    moveBlocker(can) {
        let packet = this.makePacket("move-blocker", {
            canMove: can
        })
        this.broadcastPacket(packet)
    }
    updateTimer(i) {
        let packet = this.makePacket("countdown", {
            number: i
        })
        this.broadcastPacket(packet)
    }

    playAnimation(animation) {
        let packet = this.makePacket('players-animation', {
            animation,
            timeScale: 1
        })
        this.broadcastPacket(packet)
    }
    loseHeart(lives) {
        let packet = this.makePacket("lose-heart", {
            live: lives
        })
        this.broadcastPacket(packet)
    }
    rotateTile(degree, tile1, tile2) {
        let packet = this.makePacket("rotate-tile", {
            tile1,
            tile2,
            rotation: degree
        })
        this.broadcastPacket(packet)
    }
    rotateAll(degree) {
        let rotationPacket = this.makePacket("rotate-all", {
            rotation: degree
        })
        this.broadcastPacket(rotationPacket)
    }
    nextLevel(board) {
        let packet = this.makePacket("next-level", {
            level: board
        })
        this.broadcastPacket(packet)
    }
    pointsNumber(points) {
        let packet = this.makePacket("points-number", {
            points: points
        })
        this.broadcastPacket(packet)
    }

    endGame(points){
        let packet = this.makePacket("end-game", {
            reason: "no lives",
            points: points
        })
        this.broadcastPacket(packet)
    }

}