const { cmd } = require('../command');

cmd({
    pattern: 'jid',
    alias: ['getjid', 'id'],
    desc: 'Get chat, group, or newsletter JID',
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
        // Prefer the original WhatsApp message's remote JID.
        const remoteJid =
            mek?.key?.remoteJid ||
            m?.key?.remoteJid ||
            from ||
            null;

        let jid = null;
        let jidType = 'Unknown';

        // If the command is used as a reply, get the quoted sender.
        if (quoted) {
            jid =
                quoted.sender ||
                quoted.participant ||
                quoted.key?.participant ||
                null;
        }

        // If a user is mentioned, get their JID.
        if (!jid && Array.isArray(mentionedJid) && mentionedJid.length) {
            jid = mentionedJid[0];
        }

        // Otherwise, get the chat/channel JID itself.
        if (!jid) {
            jid = remoteJid;
        }

        if (!jid) {
            return reply('❌ JID එක ලබාගන්න බැරි වුණා.');
        }

        if (jid.endsWith('@newsletter')) {
            jidType = 'WhatsApp Channel / Newsletter';
        } else if (jid.endsWith('@g.us')) {
            jidType = 'WhatsApp Group';
        } else if (jid.endsWith('@s.whatsapp.net')) {
            jidType = 'WhatsApp User';
        } else {
            jidType = 'WhatsApp Chat';
        }

        const caption = `
╭━━〔 🆔 ɴɪᴋᴋᴀ x ᴍᴅ 〕━━╮
┃
┃ 👋 ʜᴇʟʟᴏ ${pushname || 'User'} ❤️
┃
┃ 🤖 ʙᴏᴛ : ɴɪᴋᴋᴀ x ᴍᴅ
┃
┃ 📌 ᴊɪᴅ ɪɴғᴏ
┃
┃ ➤ *Type:* ${jidType}
┃ ➤ *JID:*
┃ ${jid}
┃
╰━━━━━━━━━━━━━━━━╯

> ɴɪᴋᴋᴀ x ᴍᴅ 🚀
`;

        await conn.sendMessage(
            from || remoteJid,
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
        console.error('NIKKA X MD JID Plugin Error:', error);

        try {
            await reply(
                '❌ JID ලබාගැනීමේදී දෝෂයක් ඇති වුණා.\n\n' +
                'Error: ' + (error.message || 'Unknown error')
            );
        } catch {}
    }
});
