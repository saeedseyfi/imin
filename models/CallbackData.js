const crypto = require('crypto');
const db = require('../lib/db');
const callbackDataTable = db.table('callbackData');

class CallbackData {
    constructor(options) {
        options = options || {};
        this.id = options.id || crypto.createHash('sha1').update((new Date()).valueOf().toString() + Math.random().toString()).digest('hex');
        this.data = options.data || {};

        return this;
    }

    restore(id) {
        const cdb = callbackDataTable.select({id: id}, 1)[0];

        for (let key in cdb) {
            if (cdb.hasOwnProperty(key)) {
                this[key] = cdb[key];
            }
        }

        return this;
    }

    store() {
        if (callbackDataTable.select({id: this.id}, 1).length) {
            callbackDataTable.update({id: this.id}, this);
        } else {
            callbackDataTable.insert(this);
        }

        return this;
    }

    drop() {
        if (callbackDataTable.select({id: this.id}).length) {
            callbackDataTable.drop({id: this.id}, 1);
        }

        return this;
    }
}

module.exports = CallbackData;