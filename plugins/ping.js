
const { cmd } = require('../command');
const os = require('os');

cmd({
    pattern: "ping",
    alias: ["speed"],
    desc: "Check NIKKA X MD speed",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const start = Date.now();

        const uptime = process.uptime();

        const formatTime = (seconds) => {
            const h = Math.floor(seconds / 3600);
            const min = Math.floor((seconds % 3600) / 60);
            const sec = Math.floor(seconds % 60);
            return `${h}h ${min}m ${sec}s`;
        };

        const memory = (
            process.memoryUsage().rss / 1024 / 1024
        ).toFixed(2);

        const newsletterName = "NIKKA X MD";
        const newsletterJid = "120363430604376029@newsletter";

        const text = `
╭━━〔 ⚡ NIKKA X MD 〕━━╮
┃
┃  🚀 *SPEED :* ${Date.now() - start} ms
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

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ NIKKA X MD
`;

        await conn.sendMessage(
            from,
            {
                text: text.trim(),
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: newsletterJid,
                        newsletterName: newsletterName,
                        serverMessageId: 143
                    }
                }
            },
            { quoted: mek }
        );

    } catch (e) {
        console.error("PING ERROR:", e);
        reply("❌ Ping Error: " + e.message);
    }
});
