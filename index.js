const http = require('http');
const TelegramBot = require('node-telegram-bot-api');
const dbUtil = require("./lib/dbUtil");
const _ = require('./lib/lang');
const config = require('./config');
const Event = require('./models/Event');
const CallbackData = require('./models/CallbackData');
require('dotenv').config(); // to fill env vars locally

const bot = new TelegramBot(process.env.BOT_TOKEN, {polling: true});

let db;
let eventCol;
let inlineKeyboardMarkup;

const init = () => {
    db = dbUtil.getDb();
    eventCol = db.collection(db.TABLE.EVENT);
    inlineKeyboardMarkup = [
        [
            {
                text: _('imin'),
                callback_data: new CallbackData().restore('imin').id
            },
            {
                text: _('imout'),
                callback_data: new CallbackData().restore('imout').id
            }
        ]//,
        // [
        //     {
        //         text: _('remove'),
        //         callback_data: new CallbackData().restore('remove').id
        //     },
        //     {
        //         text: _('تماس با پشتیبانی'),
        //         url: 'http://t.me/SSeyfi'
        //     }
        // ]
    ];
};

bot.onText(new RegExp(`^\/${config.commands.start}(@${config.bot.username}bot)?(\s+)?$`), (msg) => {
    bot.sendMessage(msg.chat.id, `${_('desc')}\n\n${_('howToUse')}`);
});

bot.onText(new RegExp(`^\/${config.commands.add}(@${config.bot.username}bot)?(\s+)?$`), (msg) => {
    const chatId = msg.chat.id;
    const event = new Event({
        owner: msg.from,
        chatId: chatId
    });

    bot.sendMessage(chatId, _('who_is_in'), {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: inlineKeyboardMarkup
        }
    }).done(function (message) {
        event.messageId = message.message_id;
        eventCol.insert(event);
    });
});

bot.on('callback_query', (q) => {
    const event = eventCol.select({messageId: q.message.message_id})[0];
    const oldEvent = JSON.stringify(event);

    let data = new CallbackData().restore(q.data).data;

    function getUserIndexInAttendees(where) {
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
            message += ` (${event.willAttend.length})\n`;
            message += getNames(event.willAttend).join('\n');
        } else {
            message += ' ' + _('no_one')
        }

        message += '\n\n';

        if (event.wontAttend.length) {
            message += _('who_is_out') + ` (${event.wontAttend.length})`;
            message += '\n';
            message += getNames(event.wontAttend).join('\n');
        }

        bot.editMessageText(message, {
            chat_id: q.message.chat.id,
            parse_mode: 'HTML',
            message_id: q.message.message_id,
            reply_markup: {
                inline_keyboard: inlineKeyboardMarkup
            }
        });

        eventCol.update({id: event.id}, event);
    }

    function doRemoveConfirm() {
        if (event.owner.id === q.from.id) {
            const removeYesCBD = new CallbackData({data: {do: 'removeYes', eventId: event.id}}).store();
            const removeNoCBD = new CallbackData({data: {do: 'removeNo', eventId: event.id}}).store();

            bot.sendMessage(q.message.chat.id, _('You are going to remove the poll. Are you sure?'), {
                reply_to_message_id: q.message.message_id,
                parse_mode: 'HTML',
                disable_notification: true,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: _('yes'),
                                callback_data: removeYesCBD.id
                            },
                            {
                                text: _('no'),
                                callback_data: removeNoCBD.id
                            }
                        ]
                    ]
                }
            }).done(function (message) {
                setTimeout(function () {
                    bot.deleteMessage(q.message.chat.id, message.message_id);
                    removeYesCBD.drop();
                    removeNoCBD.drop();
                }, 10000);
            });
        } else {
            bot.sendMessage(q.message.chat.id, _('You are not the owner of the event, I can\'t remove it'), {
                reply_to_message_id: q.message.message_id,
                disable_notification: true,
                parse_mode: 'HTML'
            }).done(function (message) {
                setTimeout(function () {
                    bot.deleteMessage(q.message.chat.id, message.message_id);
                }, 10000);
            });
        }
    }

    function doRemove(doRemove) {

        /* TODO: remove log stuff */
        console.log(event);

    }


    /* TODO: remove log stuff */
    console.log(data.do);


    switch (data.do) {
        case 'imin':
            doInOut(event.willAttend, getUserIndexInAttendees(event.willAttend), event.wontAttend, getUserIndexInAttendees(event.wontAttend));
            break;

        case 'imout':
            doInOut(event.wontAttend, getUserIndexInAttendees(event.wontAttend), event.willAttend, getUserIndexInAttendees(event.willAttend));
            break;

        case 'remove':
            doRemoveConfirm();
            break;

        case 'removeYes':
            doRemove(true);
            break;

        case 'removeNo':
            doRemove(false);
            break;
    }
});

dbUtil.connect(() => {
    init();

    eventCol.find({}).toArray(function(err, docs) {
        if (err) {
            throw err;
        } else {
            /* TODO: remove log stuff */
            console.log(docs);
        }
    });

    http.createServer((req, res) => {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end();
    }).listen(process.env.PORT || 5000);
});
