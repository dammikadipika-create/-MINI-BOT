const { cmd } = require('../command');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { runtime } = require('../lib/functions');

// =====================================
//          NIKKA X MD ALIVE
// =====================================

const BOT_NAME = 'NIKKA X MD';
const OWNER_NAME = 'Nikila Vimoksha';
const VERSION = 'v2.0.0';
const prefix = '.';

const ALIVE_IMAGE = 'https://i.ibb.co/Jw3Dyyqz/dec1fcbd941d.jpg';

const AUDIO_FILE = path.resolve(
    __dirname,
    '..',
    'AUD-20261027-WA0000.mp3'
);

async function sendAliveAudio(conn, from, mek) {
    try {
        if (!fs.existsSync(AUDIO_FILE)) {
            console.log('[NIKKA X MD] Audio file not found:', AUDIO_FILE);
            return;
        }

        await conn.sendMessage(
            from,
            {
                audio: fs.readFileSync(AUDIO_FILE),
                mimetype: 'audio/mpeg',
                fileName: 'AUD-20261027-WA0000.mp3',
                ptt: false
            },
            { quoted: mek }
        );

        console.log('[NIKKA X MD] Audio sent successfully.');
    } catch (error) {
        console.error('[NIKKA X MD] Audio error:', error);
    }
}

cmd({
    pattern: 'alive',
    alias: ['status', 'runtime', 'uptime'],
    react: '🟢',
    desc: 'Check bot online status',
    category: 'main',
    filename: __filename
},
async (conn, mek, m, { from, pushname, reply }) => {
    try {
        const userName = pushname || 'User';
        const uptime = runtime(process.uptime());

        const usedMemory = (
            process.memoryUsage().rss / 1024 / 1024
        ).toFixed(2);

        const totalMemory = (
            os.totalmem() / 1024 / 1024 / 1024
        ).toFixed(2);

        const statusLines = [
            `╭━━〔 ⚡ ${BOT_NAME} 〕━━╮`,
            '',
            `👋 Hello, *${userName}!* ❤️`,
            '',
            '╭─〔 *sᴛᴀᴛᴜs ᴘᴀɴᴇʟ* 〕──●●►',
            '│',
            `│ ⏳ *ᴜᴘᴛɪᴍᴇ*   : ${uptime}`,
            `│ 💾 *ʀᴀᴍ*      : ${usedMemory} MB`,
            `│ 🖥️ *ᴛᴏᴛᴀʟ ʀᴀᴍ* : ${totalMemory} GB`,
            `│ ⚙️ *ʜᴏsᴛ*      : ${os.hostname()}`,
            `│ ⌨️ *ᴘʀᴇғɪx*    : ${prefix}`,
            `│ 🧬 *ᴠᴇʀsɪᴏɴ*   : ${VERSION}`,
            `│ 👑 *ᴏᴡɴᴇʀ*     : ${OWNER_NAME}`,
            '│',
            '╰─────────────────●●►',
            '',
            `> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${OWNER_NAME}`,
            `> © ${BOT_NAME}`
        ];

        const caption = statusLines.join('\n');

        if (ALIVE_IMAGE) {
            await conn.sendMessage(
                from,
                {
                    image: { url: ALIVE_IMAGE },
                    caption
                },
                { quoted: mek }
            );
        } else {
            await conn.sendMessage(
                from,
                { text: caption },
                { quoted: mek }
            );
        }

        await sendAliveAudio(conn, from, mek);

    } catch (error) {
        console.error('[NIKKA X MD] Alive error:', error);
        await reply('❌ Alive command failed. Please check the logs.');
    }
});
