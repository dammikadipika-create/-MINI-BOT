const { cmd } = require('../command');
const config = require('../config');
const { isJidGroup } = require('@whiskeysockets/baileys');

const BOT_NAME = 'NIKKA X MD';
const FOOTER = '> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ';

let antiLinkEnabled = true;
const initializedConnections = new WeakSet();

const LINK_REGEX =
    /(?:https?:\/\/|www\.|chat\.whatsapp\.com\/|wa\.me\/|t\.me\/|telegram\.me\/|facebook\.com\/|fb\.me\/|instagram\.com\/|tiktok\.com\/|youtu\.be\/|youtube\.com\/|discord\.gg\/|discord\.com\/invite\/)[^\s]+/i;

function normalizeNumber(value) {
    return String(value || '').replace(/\D/g, '');
}

function getOwnerNumbers() {
    return [
        config.OWNER_NUMBER,
        config.DEV,
        config.OWNER,
        config.ownerNumber
    ]
        .filter(Boolean)
        .map(normalizeNumber)
        .filter(Boolean);
}

function getJidNumber(jid) {
    return normalizeNumber(
        String(jid || '')
            .split('@')[0]
            .split(':')[0]
    );
}

function isOwnerJid(jid) {
    const number = getJidNumber(jid);

    return Boolean(
        number && getOwnerNumbers().includes(number)
    );
}

function getMessageText(message) {
    const msg = message?.message;
    if (!msg) return '';

    return (
        msg.conversation ||
        msg.extendedTextMessage?.text ||
        msg.imageMessage?.caption ||
        msg.videoMessage?.caption ||
        msg.documentMessage?.caption ||
        msg.buttonsResponseMessage?.selectedDisplayText ||
        msg.listResponseMessage?.title ||
        msg.templateButtonReplyMessage?.selectedDisplayText ||
        ''
    );
}

function makePanel(title, lines = []) {
    return [
        '╭──────────────●●►',
        `┋ 🔗 *${title}*`,
        '┋',
        ...lines.map(line => `┋ ${line}`),
        '╰──────────────●●►',
        '',
        FOOTER
    ].join('\n');
}

async function sendWarning(conn, jid, text) {
    try {
        await conn.sendMessage(jid, { text });
    } catch (error) {
        console.error('[ANTILINK WARNING ERROR]', error);
    }
}

async function isGroupAdmin(conn, groupJid, participantJid) {
    try {
        const metadata = await conn.groupMetadata(groupJid);

        const participant = metadata.participants?.find(
            item =>
                item.id === participantJid ||
                getJidNumber(item.id) === getJidNumber(participantJid)
        );

        return Boolean(
            participant &&
            (
                participant.admin === 'admin' ||
                participant.admin === 'superadmin'
            )
        );
    } catch (error) {
        console.error('[ANTILINK ADMIN CHECK ERROR]', error.message);
        return false;
    }
}

async function handleIncomingMessages(conn, messages) {
    if (!antiLinkEnabled) return;

    for (const message of messages || []) {
        try {
            const key = message?.key;
            const chatJid = key?.remoteJid;
            const senderJid = key?.participant || chatJid;

            if (!key || !chatJid || !senderJid) continue;
            if (key.fromMe) continue;
            if (!isJidGroup(chatJid)) continue;
            if (message.message?.protocolMessage) continue;

            const text = getMessageText(message);

            if (!text || !LINK_REGEX.test(text)) continue;

            // Owner: warning only; never delete their link message.
            if (isOwnerJid(senderJid)) {
                await sendWarning(
                    conn,
                    chatJid,
                    makePanel('OWNER ANTILINK WARNING', [
                        `👑 *${BOT_NAME} Owner,* link එකක් හඳුනාගත්තා!`,
                        '⚠️ මේක warning එකක් පමණයි.',
                        '✅ ඔබගේ message එක delete කරන්නේ නැහැ.'
                    ])
                );

                continue;
            }

            // Group admins are allowed to post links.
            const senderIsAdmin = await isGroupAdmin(
                conn,
                chatJid,
                senderJid
            );

            if (senderIsAdmin) continue;

            // Delete the link message.
            try {
                await conn.sendMessage(
                    chatJid,
                    { delete: key }
                );
            } catch (deleteError) {
                console.error(
                    '[ANTILINK DELETE ERROR]',
                    deleteError.message
                );

                await sendWarning(
                    conn,
                    chatJid,
                    makePanel('ANTILINK WARNING', [
                        '⚠️ Link එකක් හඳුනාගත්තා.',
                        '❌ Message එක delete කරන්න බැරි වුණා.',
                        '🤖 Bot එකට group admin permission තිබේද බලන්න.'
                    ])
                );

                continue;
            }

            // Warn other members.
            await sendWarning(
                conn,
                chatJid,
                makePanel('ANTILINK WARNING', [
                    '🚫 Link දැමීම අවසර නැත!',
                    `👤 *Member:* @${getJidNumber(senderJid)}`,
                    '🗑️ Link message එක delete කළා.',
                    '⚠️ නැවත link දැමීමෙන් වළකින්න.'
                ])
            );

        } catch (error) {
            console.error('[ANTILINK MESSAGE ERROR]', error);
        }
    }
}

function initializeAntiLink(conn) {
    if (!conn || typeof conn !== 'object') return;

    if (initializedConnections.has(conn)) return;

    if (!conn.ev || typeof conn.ev.on !== 'function') {
        console.error(
            '[ANTILINK] Connection event emitter is unavailable.'
        );
        return;
    }

    initializedConnections.add(conn);

    conn.ev.on('messages.upsert', async ({ messages }) => {
        await handleIncomingMessages(conn, messages);
    });

    console.log(`🔗 ${BOT_NAME} AntiLink listener initialized.`);
}

cmd({
    pattern: 'antilink',
    alias: ['antilinks'],
    react: '🔗',
    desc: 'Enable or disable AntiLink',
    category: 'group',
    filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
    try {
        initializeAntiLink(conn);

        const action = String(args?.[0] || '').toLowerCase();

        if (action === 'on') {
            antiLinkEnabled = true;

            return reply(
                makePanel('ANTILINK ENABLED', [
                    '✅ AntiLink ක්‍රියාත්මකයි.',
                    '🗑️ සාමාන්‍ය සාමාජිකයන්ගේ link messages delete කරනවා.',
                    '👑 Ownerට warning පමණයි.',
                    '🛡️ Group admins bypass.'
                ])
            );
        }

        if (action === 'off') {
            antiLinkEnabled = false;

            return reply(
                makePanel('ANTILINK DISABLED', [
                    '❌ AntiLink අක්‍රිය කළා.'
                ])
            );
        }

        return reply(
            makePanel('ANTILINK SETTINGS', [
                `📌 *Status:* ${antiLinkEnabled ? '✅ ON' : '❌ OFF'}`,
                '➤ `.antilink on`',
                '➤ `.antilink off`',
                '👑 Ownerට warning පමණයි.',
                '🛡️ Group admins bypass.'
            ])
        );

    } catch (error) {
        console.error('[ANTILINK COMMAND ERROR]', error);

        return reply(
            makePanel('ANTILINK ERROR', [
                `❌ ${error.message || 'Unknown error'}`
            ])
        );
    }
});
