const { cmd } = require('../command');
const config = require('../config');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { runtime } = require('../lib/functions');

// ========================================
// THENUVA X MD CONFIG
// ========================================

const BOT_NAME = 'THENUVA X MD';
const OWNER_NAME = 'Dilshan Ashinsa';
const VERSION = 'v2.0.0';

const ALIVE_IMAGE = 'https://i.ibb.co/Jw3Dyyqz/dec1fcbd941d.jpg';

// Audio file must be in the project root directory.
const AUDIO_FILE = path.join(
    process.cwd(),
    'AUD-20261027-WA0000.mp3'
);

// ========================================
// SEND CUSTOM AUDIO
// ========================================

async function sendCustomAudio(conn, from, mek) {
    try {
        if (!fs.existsSync(AUDIO_FILE)) {
            console.error(
                '[ALIVE MUSIC] Audio file not found:',
                AUDIO_FILE
            );

            await conn.sendMessage(
                from,
                {
                    text:
                        '❌ *Audio file not found!*\n\n' +
                        'Please check that AUD-20261027-WA0000.mp3 ' +
                        'is uploaded to the project root folder.'
                },
                { quoted: mek }
            );

            return;
        }

        const audioBuffer = fs.readFileSync(AUDIO_FILE);

        await conn.sendMessage(
            from,
            {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: 'AUD-20261027-WA0000.mp3',
                ptt: false
            },
            { quoted: mek }
        );

        console.log(
            '[ALIVE MUSIC] Custom audio sent successfully.'
        );

    } catch (error) {
        console.error(
            '[ALIVE MUSIC ERROR]',
            error.stack || error.message
        );
    }
}

// ========================================
// ALIVE COMMAND
// ========================================

cmd(
    {
        pattern: 'alive',
        alias: ['online', 'status'],
        react: '🟢',
        desc: 'Check bot status and send custom audio',
        category: 'main',
        filename: __filename
    },

    async (conn, mek, m, { from, pushname, reply }) => {
        try {
            const userName =
                pushname ||
                m?.pushName ||
                m?.pushname ||
                'User';

            const prefix = config.PREFIX || '.';

            const uptime = runtime(process.uptime());

            const usedMemory = (
                process.memoryUsage().rss / 1024 / 1024
            ).toFixed(2);

            const totalMemory = (
                os.totalmem() / 1024 / 1024 / 1024
            ).toFixed(2);

            const aliveText = [
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
                `✨ *${BOT_NAME} ɪs ʀᴜɴɴɪɴɢ sᴜᴄᴄᴇssғᴜʟʟʏ!*`,
                '',
                '🎵 _Sending your saved audio..._',
                '',
                `> ${BOT_NAME} • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${OWNER_NAME}`
            ].join('\n');

            // Send status image and caption.
            if (
                ALIVE_IMAGE &&
                /^https?:\/\//i.test(ALIVE_IMAGE)
            ) {
                try {
                    await conn.sendMessage(
                        from,
                        {
                            image: { url: ALIVE_IMAGE },
                            caption: aliveText
                        },
                        { quoted: mek }
                    );
                } catch (imageError) {
                    console.error(
                        '[ALIVE IMAGE ERROR]',
                        imageError.message
                    );

                    await reply(aliveText);
                }
            } else {
                await reply(aliveText);
            }

            // Send the locally uploaded MP3.
            await sendCustomAudio(conn, from, mek);

        } catch (error) {
            console.error(
                '[ALIVE ERROR]',
                error.stack || error.message
            );

            try {
                await conn.sendMessage(
                    from,
                    {
                        text:
                            '❌ *ALIVE ERROR*\n\n' +
                            `${error.message || 'Unknown error'}`
                    },
                    { quoted: mek }
                );
            } catch (sendError) {
                console.error(
                    '[ALIVE ERROR REPLY FAILED]',
                    sendError.message
                );
            }
        }
    }
);
