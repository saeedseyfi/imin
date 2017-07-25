const http = require('http');
const TelegramBot = require('node-telegram-bot-api');
const db = require('./db');
const token = require('./token');
const Event = require('./models/Event');

const bot = new TelegramBot(token, {polling: true});
const eventTable = db.table('event');

const inlineKeyboardMarkup = [
    [
        {
            text: 'پایه ام',
            callback_data: 'imin'
        },
        {
            text: 'پایه نیستم',
            callback_data: 'imout'
        }
    ]
];

bot.onText(/^\/who(@iminbot)?(\s+)?$/, (msg) => {
    bot.sendMessage(msg.chat.id, 'اینگونه از دستور استفاده کنید:\n/who نام رویداد', {disable_notification: true}).done(function (message) {
        setTimeout(function () {
            bot.deleteMessage(msg.chat.id, message.message_id);
        }, 20000);
    });
});

// Matches "/new [whatever]"
bot.onText(/^\/who(@iminbot)? (.*)/, (msg, match) => {
    const chatId = msg.chat.id;
    const event = new Event({name: match[2], catId: chatId});

    bot.sendMessage(chatId, event.name, {
        reply_markup: {
            inline_keyboard: inlineKeyboardMarkup
        }
    }).done(function (message) {
        event.messageId = message.message_id;
        eventTable.insert(event);
    });
});

bot.on('callback_query', function (q) {
    const event = eventTable.select({messageId: q.message.message_id})[0];
    const name = `${q.from.first_name} ${q.from.last_name}`;

    switch (q.data) {
        case 'imin':
            if (event.attendees.indexOf(name) === -1) {
                event.attendees.push(name);
                break;
            }
            return;

        case 'imout':
            if (event.attendees.indexOf(name) >= 0) {
                event.attendees.splice(event.attendees.indexOf(name), 1);
                break;
            }
            return;
    }

    bot.editMessageText(`${event.name}:\n${event.attendees.join('\n')}`, {
        chat_id: q.message.chat.id,
        message_id: q.message.message_id,
        reply_markup: {
            inline_keyboard: inlineKeyboardMarkup
        }
    });

    eventTable.update({id: event.id}, event);
});

http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end();
}).listen(9615); 