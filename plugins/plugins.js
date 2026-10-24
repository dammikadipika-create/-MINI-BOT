const fs = require('fs');
const path = require('path');
const { cmd, commands } = require('../command');

const PLUGIN_DIR = __dirname;

const MENU_IMAGE =
'https://i.ibb.co/67DRMzkf/b5fbf712e8fd.jpg';

const BOT_NAME = 'ɴɪᴋᴋᴀ x ᴍᴅ';

const FOOTER =
'ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ';

function getPluginFiles(dir) {
let files = [];


try {
    const entries = fs.readdirSync(dir, {
        withFileTypes: true
    });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files = files.concat(getPluginFiles(fullPath));
        } else if (
            entry.isFile() &&
            entry.name.endsWith('.js')
        ) {
            files.push(fullPath);
        }
    }
} catch (error) {
    console.error(
        '[NIKKA MENU] Directory error:',
        error.message
    );
}

return files;


}

cmd({
pattern: 'menu',
alias: ['menulist', 'menulistall'],
react: '📋',
desc: 'Show plugins and their registered commands',
category: 'owner',
filename: __filename
}, async (conn, mek, m, { from, reply, isOwner }) => {
try {
if (!isOwner) {
return reply(
'❌ *ᴏᴡɴᴇʀ ᴏɴʟʏ ᴄᴏᴍᴍᴀɴᴅ*\n\n' +
FOOTER
);
}


    const files = getPluginFiles(PLUGIN_DIR);

    const loadedFiles = files.filter(file => {
        try {
            return Boolean(
                require.cache[require.resolve(file)]
            );
        } catch {
            return false;
        }
    });

    const commandMap = new Map();

    for (const command of commands) {
        if (
            !command ||
            typeof command.function !== 'function'
        ) {
            continue;
        }

        const pluginName = command.filename
            ? path.basename(command.filename)
            : 'Unknown';

        if (!commandMap.has(pluginName)) {
            commandMap.set(pluginName, []);
        }

        const name = command.pattern || command.name;

        if (name) {
            commandMap.get(pluginName).push(
                '.' + String(name)
            );
        }
    }

    let output =
        `╭─〔 *${BOT_NAME}* 〕─●●►\n` +
        '┃\n' +
        '┃ 🧩 *ᴘʟᴜɢɪɴ ᴍᴀɴᴀɢᴇʀ*\n' +
        '┃ ──────────\n' +
        `┃ 📁 ᴛᴏᴛᴀʟ ᴘʟᴜɢɪɴ ꜰɪʟᴇꜱ : ${files.length}\n` +
        `┃ ✅ ʟᴏᴀᴅᴇᴅ ᴘʟᴜɢɪɴꜱ : ${loadedFiles.length}\n` +
        `┃ ⚙️ ʀᴇɢɪꜱᴛᴇʀᴇᴅ ᴄᴏᴍᴍᴀɴᴅꜱ : ${commands.length}\n` +
        '┃\n' +
        '╰━━━━━━━━━━━━●●►\n\n';

    if (loadedFiles.length === 0) {
        output +=
            '⚠️ *ɴᴏ ʟᴏᴀᴅᴇᴅ ᴘʟᴜɢɪɴꜱ ꜰᴏᴜɴᴅ.*\n\n';
    } else {
        output +=
            '╭─〔 *ʟᴏᴀᴅᴇᴅ ᴘʟᴜɢɪɴꜱ* 〕─●●►\n\n';

        loadedFiles.forEach((file, index) => {
            const name = path.basename(file);
            const pluginCommands =
                commandMap.get(name) || [];

            output +=
                `┃ ${index + 1}. *${name}*\n` +
                `┃ ➜ ᴄᴏᴍᴍᴀɴᴅꜱ : ${
                    pluginCommands.length
                        ? pluginCommands.join(', ')
                        : 'ɴᴏ ʀᴇɢɪꜱᴛᴇʀᴇᴅ ᴄᴏᴍᴍᴀɴᴅꜱ'
                }\n\n`;
        });

        output +=
            '╰━━━━━━━━━━━━●●►\n\n';
    }

    output += FOOTER;

    return await conn.sendMessage(
        from,
        {
            image: { url: MENU_IMAGE },
            caption: output
        },
        { quoted: mek }
    );

} catch (error) {
    console.error('[NIKKA MENU ERROR]', error);

    return reply(
        '❌ *ᴍᴇɴᴜ ᴇʀʀᴏʀ*\n\n' +
        '┃ ➜ GitHub Actions logs පරීක්ෂා කරන්න.\n' +
        '╰━━━━━━━━━━━━●●►\n\n' +
        FOOTER
    );
}


});
