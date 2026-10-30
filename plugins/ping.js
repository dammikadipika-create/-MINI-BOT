const { cmd } = require('../command');
const os = require('os');

cmd({
    pattern: "ping",
    alias: ["speed"],
    desc: "Check bot response speed",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const start = Date.now();

        const msg = await conn.sendMessage(from, {
            text: "⚡ Checking NIKKA X MD Speed..."
        }, { quoted: mek });

        const speed = Date.now() - start;
        const uptime = process.uptime();

        const formatTime = (seconds) => {
            const h = Math.floor(seconds / 3600);
            const min = Math.floor((seconds % 3600) / 60);
            const sec = Math.floor(seconds % 60);
            return `${h}h ${min}m ${sec}s`;
        };

        const memory = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);

        const newsletterName = "NIKKA X MD";
        const newsletterJid = "YOUR_NEWSLETTER_JID";

        const text = `
╭━━〔 ⚡ NIKKA X MD 〕━━╮
┃
┃  🚀 *SPEED :* ${speed} ms
┃  ⏱️ *UPTIME :* ${formatTime(uptime)}
┃  💾 *RAM :* ${memory} MB
┃  💻 *PLATFORM :* ${os.platform()}
┃
┣━━〔 📡 NEWSLETTER 〕━━
┃
┃  ✦ *NAME :* ${newsletterName}
┃  ✦ *JID :* ${newsletterJid}
┃
╰━━━━━━━━━━━━━━━━━━╯

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ
`;

        await danuwa.sendMessage(
    from,
    {
        caption: menuText.trim(),
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363430604376029@newsletter',
                newsletterName: 'අපේ නික්කා පැට්ටා',
                serverMessageId: 143
            }
        }
    },
    { quoted: mek }
);
