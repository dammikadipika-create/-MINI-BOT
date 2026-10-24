const { cmd } = require('../command');

cmd({
    pattern: "jid",
    alias: ["getjid", "id"],
    desc: "Get WhatsApp JID",
    category: "main",
    react: "🆔",
    filename: __filename
},
async (conn, mek, m, {
    from,
    quoted,
    mentionedJid,
    reply,
    pushname
}) => {
    try {
        let jid;

        // Get JID from replied message
        if (quoted) {
            jid =
                quoted.sender ||
                quoted.participant ||
                quoted.key?.participant;
        }

        // Get JID from mentioned user
        if (!jid && mentionedJid && mentionedJid.length > 0) {
            jid = mentionedJid[0];
        }

        // If no reply or mention, use current chat JID
        if (!jid) {
            jid = from;
        }

        if (!jid) {
            return reply("❌ JID එක හොයාගන්න බැරි වුණා.");
        }

        const caption = `
╭━━〔 🆔 ɴɪᴋᴋᴀ x ᴍᴅ 〕━━╮
┃
┃ 👋 ʜᴇʟʟᴏ ${pushname || "User"} ❤️
┃
┃ 🤖 ʙᴏᴛ : ɴɪᴋᴋᴀ x ᴍᴅ
┃
┃ 🆔 ᴊɪᴅ ɪɴғᴏ
┃
┃ ➤ *JID:* ${jid}
┃
╰━━━━━━━━━━━━━━━━╯

> ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ🚀
`;

        await conn.sendMessage(
            from,
            {
                image: {
                    url: "https://i.ibb.co/qPDNmSY/5cdec1f68264.jpg"
                },
                caption,
                contextInfo: {
                    mentionedJid: mek.sender ? [mek.sender] : [],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363403804248705@newsletter",
                        newsletterName: "NIKKA X MD",
                        serverMessageId: 143
                    }
                }
            },
            { quoted: mek }
        );

    } catch (error) {
        console.error("NIKKA X MD JID Plugin Error:", error);
        return reply("❌ JID ලබාගැනීමේදී දෝෂයක් ඇති වුණා. නැවත උත්සාහ කරන්න.");
    }
});
