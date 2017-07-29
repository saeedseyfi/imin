const config = require('../config');

const lang = {
    // add_no_param: 'اینگونه از دستور استفاده کنید:\n/%command% نام رویداد'
    who_is_in: 'Who is attending?',
    who_is_out: 'And who is NOT attending?',
    no_one: 'No one',
    imin: '✋ I do',
    imout: 'I don\'t',
    desc: 'This bot helps you create simple polls to count who is attending an event.',
    howToUse: `How to use:\n1. Add the bot to your group/channel\n2. Comment /${config.commands.add} or /${config.commands.add}@${config.bot.username}`,
    userTemplate: '%first% %last% (@%username%)'
};

function _(key, val) {
    if (key) {
        if (typeof key === 'object') {
            for (const k in key) {
                if (key.hasOwnProperty(k)) {
                    lang[k] = key[k];
                }
            }
        } else if (typeof key === 'string') {
            let translation = lang[key] || key;

            // Replace positional parameters
            if (typeof val === 'object') {
                for (const idx in val) {
                    if (val.hasOwnProperty(idx)) {
                        translation = translation.replace(`%${idx}%`, val[idx]);
                    }
                }
            } else {
                for (let i = 1; i < arguments.length; i++) {
                    translation = translation.replace(`%${i - 1}%`, arguments[i]);
                }
            }

            return translation;
        } else if (window.console) {
            console.error('First parameter must be string or object');
        }
    } else {
        return lang;
    }
}

module.exports = _;