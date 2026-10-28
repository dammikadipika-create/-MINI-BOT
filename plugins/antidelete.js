'use strict';

const { cmd } = require('../command');
const {
    toggleAntiDelete,
    getAntiDeleteStatus
} = require('../lib/antidel');

cmd({
    pattern: 'antidelete',
    alias: ['antidel', 'antidelete'],
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

            return reply(
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
                '╰──────────────────'
            );
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
