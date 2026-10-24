const config = require('../config');
const { cmd } = require('../command');
const os = require('os');
const { runtime } = require('../lib/functions');

const MENU_IMAGE = 'https://i.ibb.co/67DRMzkf/b5fbf712e8fd.jpg';

cmd({
    pattern: 'menu',
    react: '🛸',
    alias: ['panel', 'commands'],
    desc: "Get bot's command list.",
    category: 'main',
    use: '.menu',
    filename: __filename
},
async (conn, mek, m, {
    from,
    pushname,
    reply
}) => {
    try {
        const prefix = config.PREFIX || '.';
        const botName = 'NIKKA X MD';
        const ownerName = 'Nikila vimoksha';

        const usedMemory = (
            process.memoryUsage().heapUsed / 1024 / 1024
        ).toFixed(2);

        const totalMemory = (
            os.totalmem() / 1024 / 1024 / 1024
        ).toFixed(2);

        const madeMenu = `
╭━━〔 🛸 ɴɪᴋᴋᴀ x ᴍᴅ 〕━━╮

       👋 ʜᴇʟʟᴏ, *${pushname || 'Friend'}* ❤️

╰━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 📊 sᴛᴀᴛᴜs ᴘᴀɴᴇʟ 〕━━╮
│
│ ⏳ *ᴜᴘᴛɪᴍᴇ*  : ${runtime(process.uptime())}
│ 💾 *ʀᴀᴍ ᴜsᴇ* : ${usedMemory} MB
│ 🖥️ *ᴛᴏᴛᴀʟ ʀᴀᴍ* : ${totalMemory} GB
│ ⚙️ *ᴍᴏᴅᴇ*    : ${config.MODE || 'public'}
│ ⌨️ *ᴘʀᴇғɪx*  : ${prefix}
│ 🧬 *ᴠᴇʀsɪᴏɴ* : v2.0.0
│ 👑 *ᴏᴡɴᴇʀ*   : Nikila vimoksha
│
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 📥 ᴅᴏᴡɴʟᴏᴀᴅᴇʀ 〕━━╮
│
│ 📹 *.fb <url>*
│
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 🔎 sᴇᴀʀᴄʜ 〕━━╮
│
│ 🖼️ *.img <text>*
│ 🌦️ *.weather <city>*
│    *.cartoon <url>*
│    *.animedl <url>*
│    *.animsearch <url>*
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 🧠 ᴀɪ ᴄᴏᴍᴍᴀɴᴅs 〕━━╮
│
│ 
│ 
│
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 👨‍💻 ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅs 〕━━╮
│
│ 
│
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 👥 ɢʀᴏᴜᴘ ᴄᴏᴍᴍᴀɴᴅs 〕━━╮
│
│ 🗑️ *.remove*
│
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 📃 ɪɴғᴏ ᴄᴏᴍᴍᴀɴᴅs 〕━━╮
│
│ 📋 *.menu*
│ ℹ️ *.about*
│ 📜 *.script*
│ 📦 *.repo*
│ 💚 *.alive*
│ 🤖 *.botinfo*
│ 🆘 *.support*
│ ⚡ *.ping*
│ ⚡ *.ping2*
│ 💻 *.system*
│
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 🎡 ᴄᴏɴᴠᴇʀᴛᴇʀ 〕━━╮
│
│ 🎭 *.sticker*
│ 🌐 *.trt <text>*
│ 🗣️ *.tts <text>*
│
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 🥂 ʀᴀɴᴅᴏᴍ 〕━━╮
│
│ 👑 *.king*
│ 🐶 *.dog*
│ 🎌 *.anime*
│ 👧 *.animegirl*
│ 👧 *.animegirl1*
│ 👧 *.animegirl2*
│ 👧 *.animegirl3*
│ 👧 *.animegirl4*
│ 👧 *.animegirl5*
│
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 🏜️ ᴡᴀʟʟᴘᴀᴘᴇʀ 〕━━╮
│
│ 🖼️ *.img*
│
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 🌐 ᴏᴛʜᴇʀ 〕━━╮
│
│ 🌐 *.trt*
│ 😂 *.joke*
│ 💡 *.fact*
│ 🔎 *.githubstalk*
│ 🔐 *.gpass*
│ 💻 *.hack*
│ 💬 *.quote*
│ 📦 *.srepo*
│ 📖 *.define*
│
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━━━━━━━━━━━━━━━━━━╮
│ 🌐 *ᴏғғɪᴄɪᴀʟ ᴄʜᴀɴɴᴇʟ* │
╰━━━━━━━━━━━━━━━━━━━━╯

> ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ`;

        await conn.sendMessage(
            from,
            {
                image: { url: MENU_IMAGE },
                caption: madeMenu
            },
            { quoted: mek }
        );

    } catch (e) {
        console.error('[NIKKA X MD MENU ERROR]', e);
        reply(`❌ Menu error: ${e.message || e}`);
    }
});
