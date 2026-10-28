const { cmd } = require('../command');
const {
    toggleAntiDelete,
    getAntiDeleteStatus
} = require('../lib/antidel');

// AntiDelete image URL
const ANTIDELETE_IMAGE_URL = 'https://i.ibb.co/7J9Q8Vf/antidelete.jpg';

cmd({
    pattern: 'antidelete',
    alias: ['antidel'],
    react: '🛡️',
    desc: 'Enable or disable AntiDelete',
    category: 'tools',
    filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
    try {
        const type = (args?.[0] || '').toLowerCase();
        const action = (args?.[1] || '').toLowerCase();

        if (!['gc', 'dm'].includes(type) ||
            !['on', 'off'].includes(action)) {
            const status = getAntiDeleteStatus();

            const text =
                '╭─〔 *🛡️ ANTI DELETE* 〕\n' +
                '│\n' +
                '│ *Commands:*\n' +
                '│ .antidelete gc on\n' +
                '│ .antidelete gc off\n' +
                '│ .antidelete dm on\n' +
                '│ .antidelete dm off\n' +
                '│\n' +
                '│ *Current Status:*\n' +
                `│ 👥 Group: ${status.gc ? '✅ ON' : '❌ OFF'}\n` +
                `│ 👤 Personal: ${status.dm ? '✅ ON' : '❌ OFF'}\n` +
                '│\n' +
                '╰──────────────────\n\n' +
                '> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ';

            // Send image with the existing help text
            try {
                await conn.sendMessage(from, {
                    image: { url: ANTIDELETE_IMAGE_URL },
                    caption: text
                }, { quoted: mek });
            } catch (imageError) {
                console.error('[ANTIDELETE IMAGE ERROR]', imageError);
                return reply(text);
            }

            return;
        }

        const enabled = action === 'on';

        await toggleAntiDelete(conn, from, type, enabled);

    } catch (error) {
        console.error('[ANTIDELETE COMMAND ERROR]', error);
        return reply(
            '❌ AntiDelete command එකේ දෝෂයක් ඇති වුණා.\n' +
            `${error.message || 'Unknown error'}`
        );
    }
});
