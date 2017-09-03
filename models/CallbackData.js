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
}

module.exports = CallbackData;