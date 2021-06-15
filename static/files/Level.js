const levels = [
    { x: 4, z: 4 },
    { x: 4, z: 4 },
    { x: 5, z: 4 },
    { x: 5, z: 4 },
    { x: 6, z: 4 },
    { x: 6, z: 4 },
    { x: 6, z: 5 },
    { x: 6, z: 5 },
    { x: 6, z: 6 },
    { x: 6, z: 6 }
]

const allFruits = [
    "banana",
    "apple",
    "peach",
    "orange",
    "kiwi",
    "watermelon",
    "grapes",
    "pineapple",
    "cherry",
    "coconut",
    "pear",
    "mango",
    "lemon",
    "plum",
    "strawberry",
    "raspberry",
    "papaya",
    "lime",
]

module.exports = class Level {
    constructor(game, levelNumber) {
        this.game = game
        this.requests = this.game.requests
        this.levelNumber = levelNumber
        this.board = this.createBoard()
        this.picked = []
        this.lives = 3
    }

    getRandomFruits(number) {
        let copy = this.copyObj(allFruits)
        let fruits = []

        for (let i = 0; i < number; i++) {
            let random = Math.floor(Math.random() * copy.length)
            let element = copy.splice(random, 1)[0]
            fruits.push({ name: element, count: 2 })
        }

        return fruits
    }

    createBoard() {
        let coordinates
        if (this.levelNumber < levels.length) {
            coordinates = levels[this.levelNumber]
        } else {
            coordinates = levels[levels.length - 1]
        }

        this.neededFruits = coordinates.x * coordinates.z / 2

        let avaibleFruits = this.getRandomFruits(this.neededFruits)

        let array = []
        for (let i = 0; i < coordinates.x; i++) {
            let row = []
            for (let j = 0; j < coordinates.z; j++) {
                let number = Math.floor(Math.random() * avaibleFruits.length)

                let fruit = avaibleFruits[number].name
                avaibleFruits[number].count--
                if (avaibleFruits[number].count < 1) {
                    avaibleFruits.splice(number, 1)
                }

                row.push(fruit)
            }
            array.push(row)
        }


        // let testIndex = 0
        // for (let i = 0; i < coordinates.x; i++) {
        //     let row = []
        //     for (let j = 0; j < coordinates.z; j++) {
        //         let number = Math.floor(testIndex / 2)

        //         let fruit = avaibleFruits[number].name

        //         testIndex++
        //         row.push(fruit)
        //     }
        //     array.push(row)
        // }

        return array
    }

    async startLevel() {

        this.requests.moveBlocker(true)
        await new Promise((resolve) => setTimeout(resolve, 2000))
        for (let i = 10; i > 0; i--) {
            this.requests.updateTimer(i)
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }
        this.requests.updateTimer("Checking...")

        this.requests.moveBlocker(false)

        this.requests.playAnimation("praying")
        await new Promise((resolve) => setTimeout(resolve, 4000))

        this.requests.updateTimer("")
        this.checkChoice()
    }

    async checkChoice() {
        let availablePick = true
        if (this.isOutOfBoard())
            availablePick = false

        if (availablePick && this.sameTile())
            availablePick = false

        if (availablePick) {
            let tile1 = this.getTile(0)
            let tile2 = this.getTile(1)
            let alreadyPicked = false
            this.picked.forEach(tile => {
                if (tile1.x == tile.x && tile1.z == tile.z)
                    alreadyPicked = true
                if (tile2.x == tile.x && tile2.z == tile.z)
                    alreadyPicked = true
            })

            if (!alreadyPicked) {
                let fruit1 = this.board[tile1.x][tile1.z]
                let fruit2 = this.board[tile2.x][tile2.z]

                if (fruit1 == fruit2) {
                    this.goodGuess(tile1, tile2)
                } else {
                    this.wrongGuess(tile1, tile2)
                }
            } else {
                await this.loseHeart()
                this.nextMove()
            }
        } else {
            await this.loseHeart()
            this.nextMove()
        }
    }

    async loseHeart() {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        this.lives--
        this.requests.loseHeart(this.lives)
        if (this.lives != 0){
            this.requests.playAnimation("sad")
            await new Promise((resolve) => setTimeout(resolve, 5000))
            this.requests.playAnimation("stand")
        }
        else{
            this.requests.playAnimation("death")
            await new Promise((resolve) => setTimeout(resolve, 3000))
        }
    }

    nextMove() {
        this.requests.updateTimer("")

        if (this.lives == 0) {
            this.game.noLives()
        } else if (this.picked.length >= this.neededFruits * 2) {
            this.game.addPointsForHearts()
            this.game.nextLevel()
        } else {
            this.startLevel()
        }
    }

    async goodGuess(tile1, tile2) {
        
        this.picked.push(tile1)
        this.picked.push(tile2)
        
        this.requests.rotateTile(Math.PI, tile1, tile2)
        
        await new Promise((resolve) => setTimeout(resolve, 2000))
        this.game.addPoints()
        this.requests.playAnimation("happy")
        
        await new Promise((resolve) => setTimeout(resolve, 5000))
        this.requests.playAnimation("stand")
        this.nextMove()
    }

    async wrongGuess(tile1, tile2) {

        this.requests.rotateTile(Math.PI, tile1, tile2)

        await this.loseHeart()

        this.requests.rotateTile(0, tile1, tile2)
        this.nextMove()
    }

    isOutOfBoard() {
        let out = false
        this.game.players.forEach(player => {
            if (player.x < 100 ||
                player.z < 100 ||
                player.x > this.board.length * 100 + 100 ||
                player.z > this.board[0].length * 100 + 100) {
                out = true
            }
        });

        return out
    }

    getTile(playerId) {
        return {
            x: Math.floor(this.game.players[playerId].x / 100) - 1,
            z: Math.floor(this.game.players[playerId].z / 100) - 1
        }
    }

    sameTile() {
        let tile1 = this.getTile(0)
        let tile2 = this.getTile(1)

        return tile1.x == tile2.x && tile1.z == tile2.z
    }

    copyObj(obj) {
        return JSON.parse(JSON.stringify(obj))
    }
}