const { cmd } = require('../command');

cmd({
    pattern: 'jid',
    alias: ['getjid', 'id'],
    desc: 'Get WhatsApp JID',
    category: 'main',
    react: '🆔',
    filename: __filename
}, async (conn, mek, m, {
    from,
    quoted,
    mentionedJid,
    reply,
    pushname
}) => {
    try {
        // Use the message's actual remote JID when available.
        const remoteJid = mek?.key?.remoteJid || from;

        let jid = null;

        // Quoted message JID
        if (quoted) {
            jid =
                quoted.sender ||
                quoted.participant ||
                quoted.key?.participant ||
                null;
        }

        // Mentioned user's JID
        if (!jid && Array.isArray(mentionedJid) && mentionedJid.length) {
            jid = mentionedJid[0];
        }

        // Default: current chat/channel JID
        if (!jid) {
            jid = remoteJid;
        }

        if (!jid) {
            return reply('❌ JID එක ලබාගන්න බැරි වුණා.');
        }

        const caption = `
╭━━〔 🆔 ɴɪᴋᴋᴀ x ᴍᴅ 〕━━╮
┃
┃ 👋 ʜᴇʟʟᴏ ${pushname || 'User'} ❤️
┃
┃ 🆔 ᴊɪᴅ ɪɴғᴏ
┃
┃ ➤ *JID:* ${jid}
┃
╰━━━━━━━━━━━━━━━━╯

> ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ 🚀`;

        await conn.sendMessage(
            remoteJid,
            {
                image: {
                    url: 'https://i.ibb.co/qPDNmSY/5cdec1f68264.jpg'
                },
                caption,
                contextInfo: {
                    mentionedJid: mek?.sender ? [mek.sender] : [],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363403804248705@newsletter',
                        newsletterName: 'NIKKA X MD',
                        serverMessageId: 143
                    }
                }
            },
            { quoted: mek }
        );
    } catch (error) {
        console.error('JID Plugin Error:', error);
        return reply('❌ JID ලබාගැනීමේදී දෝෂයක් ඇති වුණා.');
    }
});
