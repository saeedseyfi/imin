const crypto = require('crypto');

class Event {
    constructor(options) {
        this.id = options.id || crypto.createHash('sha1').update((new Date()).valueOf().toString() + Math.random().toString()).digest('hex');
        this.owner = options.owner || null;
        this.messageId = options.messageId || null;
        this.title = options.title || null;
        this.willAttend = options.willAttend || [];
        this.wontAttend = options.wontAttend || [];
        this.chatId = options.chatId || null;
    }
}

module.exports = Event;