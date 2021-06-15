var Datastore = require('nedb')
var collection = new Datastore({
    filename: 'records.db',
    autoload: true
});

module.exports = class Database {
    constructor(game) {
        this.game = game
        this.collection = collection
    }

    async getRecords() {

        let records = await new Promise((resolve) => {
            this.collection.find({}, function (err, docs) {
                resolve(docs)
            });
        })

        records.sort(function (a, b) {
            return b.points - a.points;
        })

        return records
    }

    saveRecords(player1, player2, points, level) {
        var doc = {
            player1,
            player2,
            points,
            level
        };

        this.collection.insert(doc, function (err, newDoc) { });
        this.reduceDatabase()
    }

    async reduceDatabase() {

        let records = await this.getRecords()
        records.sort(function (a, b) {
            return b.points - a.points;
        })

        if (records.length > 10) {
            records.length = 10
        }

        this.collection.remove({}, { multi: true }, function (err, numRemoved) { });

        for (let record of records) {

            var doc = {
                player1: record.player1,
                player2: record.player2,
                points: record.points,
                level: record.level,
            };

            this.collection.insert(doc, function (err, newDoc) { });
        }
    }
}