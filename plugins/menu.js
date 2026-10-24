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
│ 📸 *.insta <url>*
│ 🎬 *.video <url>*
│ 📁 *.gdrive <url>*
│ 🐦 *.twitter <url>*
│ 🎵 *.tt <url>*
│ 📂 *.mediafire <url>*
│ 🎧 *.song <query>*
│ ▶️ *.play <query>*
│ 🎞️ *.video2 <url>*
│ 🖼️ *.img <query>*
│ 📦 *.apk <name>*
│ 🎭 *.darama <title>*
│ 🎶 *.play2 <title>*
│ 📺 *.baiscope <url>*
│ 🎬 *.ginisisila <title>*
│
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 🔎 sᴇᴀʀᴄʜ 〕━━╮
│
│ 🔍 *.yts <text>*
│ 🎵 *.yta <url>*
│ 🔎 *.loli <text>*
│ 🎬 *.movieinfo <text>*
│ 🖼️ *.img <text>*
│ 🌦️ *.weather <city>*
│
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 🧠 ᴀɪ ᴄᴏᴍᴍᴀɴᴅs 〕━━╮
│
│ 🤖 *.gpt <text>*
│ ✨ *.ai <text>*
│ 💬 *.bot <text>*
│
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 👨‍💻 ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅs 〕━━╮
│
│ 🔄 *.updatecmd*
│ ⚙️ *.settings*
│ 👑 *.owner*
│ 📦 *.repo*
│ 💻 *.system*
│ 📊 *.status*
│ 🚫 *.block*
│ ✅ *.unblock*
│ 🔴 *.shutdown*
│ 🧹 *.clearchats*
│ 🖼️ *.setpp*
│ 📢 *.broadcast*
│ 🆔 *.jid*
│ 👥 *.gjid*
│ 🔁 *.restart*
│
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 👥 ɢʀᴏᴜᴘ ᴄᴏᴍᴍᴀɴᴅs 〕━━╮
│
│ 🗑️ *.remove*
│ ❌ *.delete*
│ ➕ *.add*
│ 👢 *.kick*
│ 👋 *.setgoodbye <text>*
│ 🎉 *.setwelcome <text>*
│ ⬆️ *.promote*
│ ⬇️ *.demote*
│ 📢 *.tagall*
│ 🖼️ *.getpic*
│ 🔗 *.invite*
│ 🔄 *.revoke*
│ 📩 *.joinrequests*
│ 📋 *.allreq*
│ 🔇 *.mute*
│ 🔊 *.unmute*
│ 🔒 *.lockgc*
│ 🔓 *.unlockgc*
│ 🚪 *.leave*
│ ✏️ *.updatename*
│ 📝 *.updatedesc*
│ 🔗 *.join*
│ 🫥 *.hidetag*
│ ℹ️ *.ginfo*
│ ⏳ *.disappear on*
│ ⏳ *.disappear off*
│ ⏳ *.disappear 7d / 24h / 90d*
│ 📩 *.senddm*
│
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 📃 ɪɴғᴏ ᴄᴏᴍᴍᴀɴᴅs 〕━━╮
│
│ 📋 *.menu*
│ 📋 *.menu2*
│ 📋 *.menu3*
│ ℹ️ *.about*
│ 📜 *.script*
│ 📦 *.repo*
│ 💚 *.alive*
│ 🤖 *.botinfo*
│ 📊 *.status*
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
