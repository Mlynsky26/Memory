module.exports = class Player {
    constructor(name, id) {
        this.name = name
        this.id = id
        this.rotation = 0
        this.socket = null
        this.resetPosition()
    }

    resetPosition() {
        this.x = this.id * 100 - 50
        this.z = 50
        this.rotation = 0
    }

    sendPacket(packet) {
        this.socket.emit("message", packet)
    }

    sendPacketData(type, data) {
        this.sendPacket({ type, data })
    }

    toNetworkObject() {
        return {
            id: this.id,
            name: this.name,
            x: this.x,
            z: this.z,
            rotation: this.rotation
        }
    }
}