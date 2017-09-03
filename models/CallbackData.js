const crypto = require('crypto');
const dbUtil = require("../lib/dbUtil");

let db;
let callbackDataCol;

class CallbackData {
    constructor(options) {
        db = dbUtil.getDb();
        callbackDataCol = db.collection(db.COL.CALLBACK_DATA);

        options = options || {};
        this.id = options.id || crypto.createHash('sha1').update((new Date()).valueOf().toString() + Math.random().toString()).digest('hex');
        this.data = options.data || {};

        return this;
    }

    restore(id) {
        db.collection(CONTACTS_COLLECTION).find({}).toArray(function(err, docs) {
            if (err) {
                handleError(res, err.message, "Failed to get contacts.");
            } else {
                res.status(200).json(docs);
            }
        });
        //
        // const cdb = callbackDataCol.select({id: id}, 1)[0];
        //
        // for (let key in cdb) {
        //     if (cdb.hasOwnProperty(key)) {
        //         this[key] = cdb[key];
        //     }
        // }

        return this;
    }

    store() {
        db.collection(db.COL.CALLBACK_DATA).find({}).toArray(function(err, docs) {
            if (err) {
                throw err;
            } else {

            }
        });









        if (callbackDataCol.select({id: this.id}, 1).length) {
            callbackDataCol.update({id: this.id}, this);
        } else {
            callbackDataCol.insert(this);
        }

        return this;
    }

    drop() {
        if (callbackDataCol.select({id: this.id}).length) {
            callbackDataCol.drop({id: this.id}, 1);
        }

        return this;
    }
}

module.exports = CallbackData;