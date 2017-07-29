const http = require('http');
const TelegramBot = require('node-telegram-bot-api');
const db = require('./lib/db');
const _ = require('./lib/lang');
const config = require('./config');
const token = require('./token');
const Event = require('./models/Event');

const bot = new TelegramBot(token, {polling: true});
const eventTable = db.table('event');

const inlineKeyboardMarkup = [
    [
        {
            text: _('imin'),
            callback_data: '{"do":"imin"}'
        },
        {
            text: _('imout'),
            callback_data: '{"do":"imout"}'
        }
    ]
];

bot.onText(new RegExp(`^\/${config.commands.start}(@${config.bot.username})?(\s+)?$`), (msg) => {
    bot.sendMessage(msg.chat.id, `${_('desc')}\n\n${_('howToUse')}`);
});

bot.onText(new RegExp(`^\/${config.commands.add}(@${config.bot.username})?(\s+)?$`), (msg) => {
    const chatId = msg.chat.id;
    const event = new Event({
        owner: msg.from,
        chatId: chatId
    });

    bot.sendMessage(chatId, _('who_is_in'), {
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
    const oldEvent = JSON.stringify(event);
    const data = JSON.parse(q.data);

    function findUser(where) {
        for (let i = 0; i < where.length; i++) {
            if (where[i].id === q.from.id) {
                return i;
            }
        }

        return -1;
    }

    function doInOut(firstArr, firstIndex, secondArr, secondIndex) {
        if (firstIndex === -1) {
            firstArr.push(q.from);
        }

        if (secondIndex > -1) {
            secondArr.splice(secondIndex, 1);
        }
    }

    switch (data.do) {
        case 'imin':
            doInOut(event.willAttend, findUser(event.willAttend), event.wontAttend, findUser(event.wontAttend));
            break;

        case 'imout':
            doInOut(event.wontAttend, findUser(event.wontAttend), event.willAttend, findUser(event.willAttend));
            break;
    }


    /* TODO: remove log stuff */
    console.log(JSON.stringify(event), findUser(event.willAttend), findUser(event.wontAttend));


    if (oldEvent === JSON.stringify(event)) {
        return; // No change
    }

    function getNames(arr) {
        let names = [];

        for (let i = 0; i < arr.length; i++) {
            names.push(_('userTemplate', {
                first: arr[i].first_name || '',
                last: arr[i].last_name || '',
                username: arr[i].username || ''
            }));
        }

        return names
    }

    let message = _('who_is_in');

    if (event.willAttend.length) {
        message += '\n';
        message += getNames(event.willAttend).join('\n');
    } else {
        message += _('no_one')
    }

    message += '\n\n';

    if (event.wontAttend.length) {
        message += _('who_is_out');
        message += '\n';
        message += getNames(event.wontAttend).join('\n');
    }

    bot.editMessageText(message, {
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