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
        let jid;

        if (quoted) {
            jid =
                quoted.sender ||
                quoted.participant ||
                quoted.key?.participant;
        }

        if (!jid && mentionedJid?.length) {
            jid = mentionedJid[0];
        }

        if (!jid) {
            jid = from || mek.key?.remoteJid;
        }

        if (!jid) {
            return reply('❌ JID එක හොයාගන්න බැරි වුණා.');
        }

        const isChannel = jid.endsWith('@newsletter');

        const caption =
            `╭━━〔 🆔 ɴɪᴋᴋᴀ x ᴍᴅ 〕━━╮\n` +
            `┃ 👋 Hello: ${pushname || 'User'} ❤️\n` +
            `┃ 🤖 Bot: NIKKA X MD\n` +
            `┃ 📍 Type: ${isChannel ? 'Channel' : 'Chat'}\n` +
            `┃ 🆔 JID:\n` +
            `┃ ${jid}\n` +
            `╰━━━━━━━━━━━━━━━━╯\n\n` +
            `> ɴɪᴋᴋᴀ x ᴍᴅ 🚀`;

        await conn.sendMessage(
            from || mek.key.remoteJid,
            {
                image: {
                    url: 'https://i.ibb.co/67DRMzkf/b5fbf712e8fd.jpg'
                },
                caption
            },
            { quoted: mek }
        );

    } catch (error) {
        console.error('NIKKA X MD JID Error:', error);
        return reply(
            '❌ JID යැවීමට නොහැකි වුණා. Channel support එක හෝ bot library version එක පරීක්ෂා කරන්න.'
        );
    }
});
