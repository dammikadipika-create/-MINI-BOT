const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(process.cwd(), 'config.env');

function cleanNumber(value) {
    return String(value || '').replace(/\D/g, '');
}

function isBotOwner(sender, conn) {
    const senderNumber = cleanNumber(String(sender || '').split('@')[0]);
    const owners = [
        config.OWNER_NUMBER,
        config.DEV
    ].map(cleanNumber).filter(Boolean);

    // Allow the connected bot account itself too.
    const botNumber = cleanNumber(conn && conn.user && conn.user.id
        ? conn.user.id.split(':')[0].split('@')[0]
        : '');

    return owners.includes(senderNumber) || (!!botNumber && senderNumber === botNumber);
}

function getEnvValue(key) {
    if (!fs.existsSync(ENV_PATH)) return null;
    const content = fs.readFileSync(ENV_PATH, 'utf8');
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = content.match(new RegExp('^\\s*(?:export\\s+)?' + escaped + '\\s*=\\s*(.*)\\s*$', 'm'));
    if (!match) return null;
    let value = match[1].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
    }
    return value;
}

function saveSetting(key, value) {
    // Preserve other config.env values and replace only the requested key.
    let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
    const lines = content ? content.split(/\r?\n/) : [];
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('^\\s*(?:export\\s+)?' + escaped + '\\s*=');
    const line = `${key}=${String(value).replace(/\r?\n/g, '\\n')}`;
    let found = false;

    for (let i = 0; i < lines.length; i++) {
        if (re.test(lines[i])) {
            lines[i] = line;
            found = true;
            break;
        }
    }
    if (!found) {
        if (lines.length && lines[lines.length - 1] !== '') lines.push('');
        lines.push(line);
    }
    fs.writeFileSync(ENV_PATH, lines.join('\n').replace(/\n*$/, '\n'), 'utf8');
    config[key] = String(value);
}

function status(value) {
    return String(value).toLowerCase() === 'true' ? '✅ ON' : '❌ OFF';
}

const booleanSettings = {
    antilink: ['ANTI_LINK', 'Anti-Link'],
    antibad: ['ANTI_BAD', 'Anti-Bad Words'],
    antivv: ['ANTI_VV', 'Anti-View Once'],
    deletelinks: ['DELETE_LINKS', 'Delete Links'],
    autostatus: ['AUTO_STATUS_SEEN', 'Auto Status Seen'],
    statusseen: ['AUTO_STATUS_SEEN', 'Auto Status Seen'],
    statusreact: ['AUTO_STATUS_REACT', 'Auto Status React'],
    statusreply: ['AUTO_STATUS_REPLY', 'Auto Status Reply'],
    autoreact: ['AUTO_REACT', 'Auto React'],
    autovoice: ['AUTO_VOICE', 'Auto Voice'],
    autosticker: ['AUTO_STICKER', 'Auto Sticker'],
    autoreply: ['AUTO_REPLY', 'Auto Reply'],
    online: ['ALWAYS_ONLINE', 'Always Online'],
    typing: ['AUTO_TYPING', 'Auto Typing'],
    recording: ['AUTO_RECORDING', 'Auto Recording'],
    read: ['READ_MESSAGE', 'Read Messages'],
    readmessage: ['READ_MESSAGE', 'Read Messages'],
    readcmd: ['READ_CMD', 'Read Commands'],
    customreact: ['CUSTOM_REACT', 'Custom React'],
    publicmode: ['PUBLIC_MODE', 'Public Mode']
};

cmd({
    pattern: 'setting',
    alias: ['settings', 'settingmenu', 'panel'],
    desc: 'Show bot settings',
    category: 'owner',
    filename: __filename
}, async (conn, m, store, { reply, sender }) => {
    if (!isBotOwner(sender, conn)) return reply('❌ මෙම command එක Owner සඳහා පමණි.');

    const lines = [
        `╭──〔 ⚙️ *${config.BOT_NAME || 'WhatsApp Bot'} SETTINGS* 〕`,
        `│ 👤 Owner: ${config.OWNER_NAME || 'Not set'}`,
        `│ 📱 Mode: ${config.MODE || 'public'}`,
        `│ ⌨️ Prefix: ${config.PREFIX || '.'}`,
        '╰────────────────',
        '',
        '🛡️ *SECURITY*',
        `• Anti-Link: ${status(config.ANTI_LINK)}`,
        `• Anti-Bad: ${status(config.ANTI_BAD)}`,
        `• Anti-View Once: ${status(config.ANTI_VV)}`,
        `• Delete Links: ${status(config.DELETE_LINKS)}`,
        '',
        '🤖 *AUTOMATION*',
        `• Status Seen: ${status(config.AUTO_STATUS_SEEN)}`,
        `• Status React: ${status(config.AUTO_STATUS_REACT)}`,
        `• Status Reply: ${status(config.AUTO_STATUS_REPLY)}`,
        `• Auto React: ${status(config.AUTO_REACT)}`,
        `• Auto Voice: ${status(config.AUTO_VOICE)}`,
        `• Auto Sticker: ${status(config.AUTO_STICKER)}`,
        `• Auto Reply: ${status(config.AUTO_REPLY)}`,
        `• Always Online: ${status(config.ALWAYS_ONLINE)}`,
        `• Auto Typing: ${status(config.AUTO_TYPING)}`,
        `• Auto Recording: ${status(config.AUTO_RECORDING)}`,
        '',
        '📖 *MESSAGES & REACTIONS*',
        `• Read Messages: ${status(config.READ_MESSAGE)}`,
        `• Read Commands: ${status(config.READ_CMD)}`,
        `• Custom React: ${status(config.CUSTOM_REACT)}`,
        `• Emojis: ${config.CUSTOM_REACT_EMOJIS || 'Not set'}`,
        '',
        '📝 *COMMANDS*',
        `${config.PREFIX}set prefix !`,
        `${config.PREFIX}set mode public`,
        `${config.PREFIX}set antilink true`,
        `${config.PREFIX}set autoreact false`,
        `${config.PREFIX}set alive_msg Hello there`,
        `${config.PREFIX}set owner_name My Name`,
        '',
        '⚠️ Config value එක වෙනස් වීමෙන් feature එක වැඩ කරනවා කියලා අදහස් නොවේ; අදාළ code/plugin එකත් තිබිය යුතුයි.'
    ];
    return reply(lines.join('\n'));
});

cmd({
    pattern: 'set',
    alias: ['setconfig'],
    desc: 'Change bot settings',
    category: 'owner',
    filename: __filename
}, async (conn, m, store, { q, reply, sender }) => {
    if (!isBotOwner(sender, conn)) return reply('❌ මෙම command එක Owner සඳහා පමණි.');
    if (!q || !q.trim()) {
        return reply(`භාවිතය:\n${config.PREFIX}set antilink true\n${config.PREFIX}set mode private\n${config.PREFIX}set prefix !\n${config.PREFIX}set alive_msg Hello`);
    }

    const input = q.trim();
    const firstSpace = input.search(/\s/);
    if (firstSpace < 0) return reply(`Value එකත් දෙන්න.\nඋදා: ${config.PREFIX}set antilink true`);

    const key = input.slice(0, firstSpace).toLowerCase().replace(/-/g, '_');
    const rawValue = input.slice(firstSpace).trim();
    if (!rawValue) return reply('Value එක හිස්ව තියන්න බැහැ.');

    try {
        if (key === 'mode') {
            const value = rawValue.toLowerCase();
            if (!['public', 'private', 'inbox', 'groups'].includes(value)) {
                return reply('❌ Mode එක public / private / inbox / groups වලින් එකක් විය යුතුයි.');
            }
            saveSetting('MODE', value);
            return reply(`✅ MODE වෙනස් කළා: *${value}*\n💾 config.env එකට save කළා.`);
        }

        if (key === 'prefix') {
            if (rawValue.length > 3 || /\s/.test(rawValue)) return reply('❌ Prefix එක characters 1–3ක් විය යුතුයි; spaces එපා.');
            saveSetting('PREFIX', rawValue);
            return reply(`✅ Prefix වෙනස් කළා: *${rawValue}*\n💾 config.env එකට save කළා.\nසමහර command handlers අලුත් prefix එක භාවිතා කිරීමට restart අවශ්‍ය විය හැක.`);
        }

        if (booleanSettings[key]) {
            const [configKey, label] = booleanSettings[key];
            const value = rawValue.toLowerCase();
            if (!['true', 'false', 'on', 'off'].includes(value)) return reply('❌ Value එක true/false හෝ on/off විය යුතුයි.');
            const normalized = ['true', 'on'].includes(value) ? 'true' : 'false';
            saveSetting(configKey, normalized);
            return reply(`✅ *${label}* ➜ ${status(normalized)}\n💾 config.env එකට save කළා.`);
        }

        const textSettings = {
            bot_name: ['BOT_NAME', 'Bot Name'],
            owner_name: ['OWNER_NAME', 'Owner Name'],
            description: ['DESCRIPTION', 'Description'],
            alive_msg: ['LIVE_MSG', 'Alive Message'],
            auto_status_msg: ['AUTO_STATUS_MSG', 'Auto Status Message'],
            sticker_name: ['STICKER_NAME', 'Sticker Name'],
            alive_img: ['ALIVE_IMG', 'Alive Image URL'],
            owner_number: ['OWNER_NUMBER', 'Owner Number'],
            custom_react_emojis: ['CUSTOM_REACT_EMOJIS', 'Custom Reaction Emojis']
        };

        if (!textSettings[key]) {
            return reply(`❌ නොදන්නා setting එකක්: *${key}*\n${config.PREFIX}setting කියලා settings list එක බලන්න.`);
        }

        const [configKey, label] = textSettings[key];
        if (['ALIVE_IMG'].includes(configKey) && !/^https?:\/\//i.test(rawValue)) {
            return reply('❌ Image URL එක http:// හෝ https:// වලින් පටන් ගන්න ඕන.');
        }
        if (configKey === 'OWNER_NUMBER' && !/^\+?\d{7,15}$/.test(rawValue.replace(/\s/g, ''))) {
            return reply('❌ Owner number එක country code සමඟ digits පමණක් ඇතුළත් කරන්න.');
        }
        saveSetting(configKey, rawValue);
        return reply(`✅ *${label}* වෙනස් කළා.\n💾 config.env එකට save කළා.\n\nසටහන: අදාළ feature එක code එකෙන් භාවිතා කළා නම් පමණක් එහි හැසිරීම වෙනස් වේ.`);
    } catch (error) {
        console.error('[SETTINGS PLUGIN]', error);
        return reply(`❌ Save කරන්න බැරි වුණා: ${error.message}`);
    }
});
