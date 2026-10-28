
'use strict';

const { isJidGroup } = require('@whiskeysockets/baileys');
const { loadMessage, getAnti, setAnti } = require('../data');

// ╭────────────〔 CONFIGURATION 〕────────────╮
const BOT_NAME = 'NIKKA X MD';
const FOOTER = '> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ';

// මෙතනට ඔයාගේ direct image URL එක දාන්න
const ANTIDELETE_IMAGE_URL = 'https://i.ibb.co/67DRMzkf/b5fbf712e8fd.jpg';

// උදාහරණය:
// const ANTIDELETE_IMAGE_URL = 'https://your-domain.com/antidelete.jpg';
// ╰─────────────────────────────────────────╯

let globalAntiStatus = {
    gc: false,
    dm: false
};

let initialized = false;
const deletedMessages = new Map();

function makePanel(title, lines = []) {
    return [
        `╭──────────────●●►`,
        `┋ 🛡️ *${title}*`,
        `┋`,
        ...lines.map(line => `┋ ${line}`),
        `┋`,
        `╰──────────────●●►`,
        '',
        FOOTER
    ].join('\n');
}

async function sendPanel(conn, jid, text, quoted) {
    try {
        const validImageUrl =
            /^https?:\/\/\S+$/i.test(ANTIDELETE_IMAGE_URL);

        if (validImageUrl) {
            try {
                await conn.sendMessage(
                    jid,
                    {
                        image: { url: ANTIDELETE_IMAGE_URL },
                        caption: text
                    },
                    quoted ? { quoted } : {}
                );
                return true;
            } catch (imageError) {
                console.error(
                    '[ANTIDELETE IMAGE ERROR]',
                    imageError.message
                );
            }
        }

        await conn.sendMessage(
            jid,
            { text },
            quoted ? { quoted } : {}
        );

        return true;
    } catch (error) {
        console.error('[ANTIDELETE PANEL ERROR]', error);
        return false;
    }
}

async function initializeAntiStatus() {
    try {
        globalAntiStatus.gc = Boolean(await getAnti('gc'));
        globalAntiStatus.dm = Boolean(await getAnti('dm'));
        initialized = true;

        console.log(
            `🛡️ ${BOT_NAME} AntiDelete | GC: ${globalAntiStatus.gc} | DM: ${globalAntiStatus.dm}`
        );
    } catch (error) {
        console.error('[ANTIDELETE INIT ERROR]', error);
    }
}

function getMessageText(message) {
    if (!message) return '';

    if (message.conversation) {
        return message.conversation;
    }

    if (message.extendedTextMessage?.text) {
        return message.extendedTextMessage.text;
    }

    if (message.imageMessage?.caption) {
        return message.imageMessage.caption;
    }

    if (message.videoMessage?.caption) {
        return message.videoMessage.caption;
    }

    if (message.documentMessage?.caption) {
        return message.documentMessage.caption;
    }

    return '';
}

function getMessageType(message) {
    if (!message) return 'unknown';

    const ignored = [
        'messageContextInfo',
        'senderKeyDistributionMessage'
    ];

    const keys = Object.keys(message).filter(
        key => !ignored.includes(key)
    );

    return keys[0] || 'unknown';
}

function getSenderJid(key, fallback) {
    return key?.participant ||
        key?.remoteJid ||
        fallback ||
        '';
}

async function sendDeletedMessage(
    conn,
    original,
    chatJid,
    deleteInfo
) {
    const message = original.message;
    const type = getMessageType(message);
    const text = getMessageText(message);

    const header = makePanel(
        `${BOT_NAME} — ANTI DELETE`,
        deleteInfo
    );

    try {
        if (
            type === 'conversation' ||
            type === 'extendedTextMessage'
        ) {
            await sendPanel(
                conn,
                chatJid,
                `${header}\n\n` +
                `╭──────────────●●►\n` +
                `┋ 📝 *DELETED MESSAGE*\n` +
                `┋\n` +
                `┋ ${text || '(Empty text message)'}\n` +
                `╰──────────────●●►\n\n` +
                FOOTER
            );

            return true;
        }

        const mediaTypes = {
            imageMessage: {
                icon: '🖼️',
                label: 'DELETED PHOTO',
                caption: message.imageMessage?.caption
            },
            videoMessage: {
                icon: '🎬',
                label: 'DELETED VIDEO',
                caption: message.videoMessage?.caption
            },
            audioMessage: {
                icon: '🎵',
                label: 'DELETED AUDIO'
            },
            pttMessage: {
                icon: '🎙️',
                label: 'DELETED VOICE MESSAGE'
            },
            documentMessage: {
                icon: '📄',
                label: 'DELETED DOCUMENT',
                caption: message.documentMessage?.caption
            },
            stickerMessage: {
                icon: '🎭',
                label: 'DELETED STICKER'
            }
        };

        const media = mediaTypes[type];

        if (media) {
            const mediaInfo = [
                `╭──────────────●●►`,
                `┋ ${media.icon} *${media.label}*`,
                ...(media.caption
                    ? [`┋ 📝 *Caption:* ${media.caption}`]
                    : []),
                `╰──────────────●●►`,
                '',
                FOOTER
            ].join('\n');

            await sendPanel(
                conn,
                chatJid,
                `${header}\n\n${mediaInfo}`
            );

            // Original media is resent separately.
            // WhatsApp may reject expired or unavailable media.
            await conn.relayMessage(chatJid, message, {});

            return true;
        }

        await sendPanel(
            conn,
            chatJid,
            `${header}\n\n` +
            `╭──────────────●●►\n` +
            `┋ ⚠️ *MESSAGE TYPE:* ${type}\n` +
            `┋ Original content may not be recoverable.\n` +
            `╰──────────────●●►\n\n` +
            FOOTER
        );

        return true;
    } catch (error) {
        console.error('[ANTIDELETE SEND ERROR]', error);

        await sendPanel(
            conn,
            chatJid,
            makePanel('ANTIDELETE ERROR', [
                '⚠️ Message delete detected.',
                `❌ ${error.message || 'Unable to resend content'}`
            ])
        );

        return false;
    }
}

async function AntiDelete(conn, updates) {
    try {
        if (!initialized) {
            await initializeAntiStatus();
        }

        for (const update of updates || []) {
            if (update?.update?.message !== null) continue;
            if (!update?.key?.id) continue;

            const messageId = update.key.id;

            if (deletedMessages.has(messageId)) continue;

            const store = await loadMessage(messageId);

            if (!store?.message) {
                console.log(
                    `[ANTIDELETE] Original message not found: ${messageId}`
                );
                continue;
            }

            const original = store.message;

            const chatJid =
                store.jid ||
                original.key?.remoteJid ||
                update.key.remoteJid;

            if (!chatJid) continue;

            const isGroup = isJidGroup(chatJid);
            const antiType = isGroup ? 'gc' : 'dm';

            if (!globalAntiStatus[antiType]) continue;

            const senderJid = getSenderJid(
                original.key,
                chatJid
            );

            const deleterJid = getSenderJid(
                update.key,
                chatJid
            );

            const senderNumber =
                senderJid.split('@')[0].split(':')[0];

            const deleterNumber =
                deleterJid.split('@')[0].split(':')[0];

            const deleteInfo = [
                `┋ 💬 *Chat:* ${isGroup ? 'GROUP' : 'PERSONAL'}`,
                `┋ ➤ 👤 *Original Sender:* ${senderNumber}`,
                `┋ ➤ 🗑️ *Deleted By:* ${deleterNumber}`,
                `┋ ➤ 🕒 *Time:* ${new Date().toLocaleString()}`
            ];

            deletedMessages.set(messageId, Date.now());

            if (deletedMessages.size > 1000) {
                const oldestId =
                    deletedMessages.keys().next().value;

                deletedMessages.delete(oldestId);
            }

            await sendDeletedMessage(
                conn,
                original,
                chatJid,
                deleteInfo
            );
        }
    } catch (error) {
        console.error('[ANTIDELETE ERROR]', error);
    }
}

async function toggleAntiDelete(
    conn,
    jid,
    type,
    enable = true
) {
    try {
        if (!['gc', 'dm'].includes(type)) {
            await sendPanel(
                conn,
                jid,
                makePanel('ANTIDELETE', [
                    '❌ Invalid type.',
                    'Use gc or dm.'
                ])
            );

            return false;
        }

        const result = await setAnti(type, enable);

        if (result === false) {
            await sendPanel(
                conn,
                jid,
                makePanel('ANTIDELETE', [
                    '❌ Failed to save settings.'
                ])
            );

            return false;
        }

        globalAntiStatus[type] = enable;
        initialized = true;

        await sendPanel(
            conn,
            jid,
            makePanel('ANTI DELETE SETTINGS', [
                `⚙️ *Type:* ${type === 'gc' ? 'GROUP CHATS' : 'PERSONAL CHATS'}`,
                `📌 *Status:* ${enable ? '✅ ENABLED' : '❌ DISABLED'}`
            ])
        );

        return true;
    } catch (error) {
        console.error('[ANTIDELETE TOGGLE ERROR]', error);

        await sendPanel(
            conn,
            jid,
            makePanel('ANTIDELETE ERROR', [
                `❌ ${error.message || 'Unable to update settings'}`
            ])
        );

        return false;
    }
}

function getAntiDeleteStatus() {
    return {
        gc: globalAntiStatus.gc,
        dm: globalAntiStatus.dm
    };
}

function getDeletedLog() {
    return Array.from(deletedMessages.entries()).map(
        ([id, timestamp]) => ({ id, timestamp })
    );
}

function clearDeletedLog() {
    deletedMessages.clear();
}

initializeAntiStatus();

module.exports = {
    DeletedText: async (
        conn, mek, jid, deleteInfo, isGroup, update
    ) => sendDeletedMessage(
        conn, mek, jid, deleteInfo
    ),

    DeletedMedia: async (
        conn, mek, jid, deleteInfo
    ) => sendDeletedMessage(
        conn, mek, jid, deleteInfo
    ),

    AntiDelete,
    toggleAntiDelete,
    getAntiDeleteStatus,
    getDeletedLog,
    clearDeletedLog
};
