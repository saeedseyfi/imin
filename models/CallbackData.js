const crypto = require('crypto');

class CallbackData {
    constructor(options) {
        options = options || {};
        this.id = options.id || crypto.createHash('sha1').update((new Date()).valueOf().toString() + Math.random().toString()).digest('hex');
        this.data = options.data || {};
    }
}

module.exports = CallbackData;