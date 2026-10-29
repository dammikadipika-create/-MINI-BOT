const { cmd } = require('../command');

// ==========================================
//             NIKKA X MD JID
// ==========================================

const BOT_NAME = 'NIKKA X MD';
const NEWSLETTER_NAME = 'අපේ නික්කා පැට්ටා';
const NEWSLETTER_JID = '120363430604376029@newsletter';
const NEWSLETTER_MESSAGE_ID = 143;

const IMAGE_URL = 'https://i.ibb.co/Jw3Dyyqz/dec1fcbd941d.jpg';

cmd({
    pattern: 'jid',
    alias: ['getjid', 'id'],
    desc: 'Get WhatsApp JID',
    category: 'main',
    react: '🆔',
    filename: __filename
},
async (conn, mek, m, {
    from,
    quoted,
    mentionedJid,
    reply
}) => {
    try {
        let jid;

        // If message is replied to
        if (quoted) {
            jid = quoted.sender ||
                  quoted.participant ||
                  quoted.key?.participant;
        }

        // If user is mentioned
        if (!jid && mentionedJid && mentionedJid.length > 0) {
            jid = mentionedJid[0];
        }

        // If no reply/mention, use current chat JID
        if (!jid) {
            jid = from;
        }

        if (!jid) {
            return reply('❌ JID එක හොයාගන්න බැරි වුණා.');
        }

        const caption = [
            `╭━━━〔 🆔 ${BOT_NAME} 〕━━━╮`,
            '',
            '┃ 👤 *WHATSAPP JID*',
            `┃ ${jid}`,
            '',
            '┃ 📢 *NEWSLETTER*',
            `┃ ${NEWSLETTER_NAME}`,
            `┃ ${NEWSLETTER_JID}`,
            '',
            '╰━━━━━━━━━━━━━━━━━━╯',
            '',
            `> © POWERED BY ${BOT_NAME}`
        ].join('\n');

        await conn.sendMessage(
            from,
            {
                image: { url: IMAGE_URL },
                caption,
                contextInfo: {
                    mentionedJid: [],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: NEWSLETTER_JID,
                        newsletterName: NEWSLETTER_NAME,
                        serverMessageId: NEWSLETTER_MESSAGE_ID
                    }
                }
            },
            { quoted: mek }
        );

    } catch (error) {
        console.error('[NIKKA X MD JID ERROR]', error);

        try {
            await reply('❌ JID ලබාගැනීමේදී error එකක් ආවා.');
        } catch (replyError) {
            console.error('[NIKKA X MD JID REPLY ERROR]', replyError);
        }
    }
});
