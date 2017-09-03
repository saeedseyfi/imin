const MongoClient = require('mongodb').MongoClient;

let _db;

module.exports = {
    connect: (callback) => {
        MongoClient.connect(process.env.MONGODB_URI, (err, database) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }

            // Save database object from the callback for reuse.
            _db = database;

            _db.COL = {EVENT: 'event', CALLBACK_DATA: 'callbackData'};

            console.log('Database connection ready');

            return callback();
        });
    },
    disconnectDB: () => _db.close(),
    getDb: () => _db
};