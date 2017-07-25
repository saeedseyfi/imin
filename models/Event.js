const crypto = require('crypto');

class Event {
    constructor(options) {
        this.id = options.id || crypto.createHash('sha1').update((new Date()).valueOf().toString() + Math.random().toString()).digest('hex');
        this.messageId = options.messageId || null;
        this.name = options.name || null;
        this.attendees = options.attendees || [];
        this.chatId = options.chatId || null;
    }
}

module.exports = Event;