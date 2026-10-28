
'use strict';

const { isJidGroup } = require('@whiskeysockets/baileys');
const { loadMessage, getAnti, setAnti } = require('../data');

let globalAntiStatus = {
    gc: false,
    dm: false
};

let initialized = false;
const deletedMessages = new Map();

async function initializeAntiStatus() {
    try {
        globalAntiStatus.gc = Boolean(await getAnti('gc'));
        globalAntiStatus.dm = Boolean(await getAnti('dm'));
        initialized = true;

        console.log(
            `🛡️ NIKKA X MD AntiDelete | GC: ${globalAntiStatus.gc} | DM: ${globalAntiStatus.dm}`
        );
    } catch (error) {
        console.error('AntiDelete initialization error:', error);
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

    const keys = Object.keys(message).filter(
        key => !['messageContextInfo', 'senderKeyDistributionMessage'].includes(key)
    );

    return keys[0] || 'unknown';
}

function getSenderJid(key, fallback) {
    return key?.participant || key?.remoteJid || fallback || '';
}

async function sendDeletedMessage(conn, original, chatJid, deleteInfo) {
    const message = original.message;
    const type = getMessageType(message);
    const text = getMessageText(message);

    const header =
        `🛡️ *NIKKA X MD — ANTI DELETE*\n\n` +
        `${deleteInfo}\n\n` +
        `━━━━━━━━━━━━━━━━━━\n`;

    try {
        // TEXT MESSAGE
        if (
            type === 'conversation' ||
            type === 'extendedTextMessage'
        ) {
            await conn.sendMessage(chatJid, {
                text: `${header}📝 *Deleted message:*\n\n${text || '(Empty text message)'}`
            });
            return true;
        }

        // PHOTO
        if (type === 'imageMessage') {
            const caption = message.imageMessage.caption || '';

            await conn.sendMessage(chatJid, {
                text: `${header}🖼️ *Deleted photo*${caption ? `\n\nCaption: ${caption}` : ''}`
            });

            await conn.relayMessage(chatJid, message, {});
            return true;
        }

        // VIDEO
        if (type === 'videoMessage') {
            const caption = message.videoMessage.caption || '';

            await conn.sendMessage(chatJid, {
                text: `${header}🎬 *Deleted video*${caption ? `\n\nCaption: ${caption}` : ''}`
            });

            await conn.relayMessage(chatJid, message, {});
            return true;
        }

        // AUDIO / VOICE NOTE
        if (
            type === 'audioMessage' ||
            type === 'pttMessage'
        ) {
            await conn.sendMessage(chatJid, {
                text: `${header}🎵 *Deleted audio / voice message*`
            });

            await conn.relayMessage(chatJid, message, {});
            return true;
        }

        // DOCUMENT
        if (type === 'documentMessage') {
            const caption = message.documentMessage.caption || '';

            await conn.sendMessage(chatJid, {
                text: `${header}📄 *Deleted document*${caption ? `\n\nCaption: ${caption}` : ''}`
            });

            await conn.relayMessage(chatJid, message, {});
            return true;
        }

        // STICKER
        if (type === 'stickerMessage') {
            await conn.sendMessage(chatJid, {
                text: `${header}🎭 *Deleted sticker*`
            });

            await conn.relayMessage(chatJid, message, {});
            return true;
        }

        // OTHER MESSAGE TYPES
        await conn.sendMessage(chatJid, {
            text:
                `${header}` +
                `⚠️ Message type: ${type}\n` +
                `This message type may not be recoverable.`
        });

        return true;
    } catch (error) {
        console.error('NIKKA X MD AntiDelete send error:', error);

        try {
            await conn.sendMessage(chatJid, {
                text:
                    `${header}` +
                    `⚠️ Deleted message detected, but the original content could not be resent.\n` +
                    `Reason: ${error.message || 'Unknown error'}`
            });
        } catch (fallbackError) {
            console.error('AntiDelete fallback error:', fallbackError);
        }

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

            // Prevent duplicate reports for the same deleted message
            if (deletedMessages.has(messageId)) continue;

            const store = await loadMessage(messageId);

            if (!store?.message) {
                console.log(
                    `AntiDelete: original message not found in cache (${messageId})`
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

            const senderNumber = senderJid.split('@')[0];
            const deleterNumber = deleterJid.split('@')[0];

            const deleteInfo =
                `💬 *Chat:* ${isGroup ? 'Group' : 'Personal'}\n` +
                `👤 *Original sender:* ${senderNumber}\n` +
                `🗑️ *Deleted by:* ${deleterNumber}\n` +
                `🕒 *Detected:* ${new Date().toLocaleString()}`;

            deletedMessages.set(messageId, Date.now());

            // Keep memory usage limited
            if (deletedMessages.size > 1000) {
                const oldestId = deletedMessages.keys().next().value;
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
        console.error('NIKKA X MD AntiDelete error:', error);
    }
}

async function toggleAntiDelete(conn, jid, type, enable = true) {
    try {
        if (!['gc', 'dm'].includes(type)) {
            await conn.sendMessage(jid, {
                text: '❌ Invalid AntiDelete type. Use gc or dm.'
            });
            return false;
        }

        const result = await setAnti(type, enable);

        if (result === false) {
            await conn.sendMessage(jid, {
                text: '❌ Failed to save AntiDelete setting.'
            });
            return false;
        }

        globalAntiStatus[type] = enable;
        initialized = true;

        await conn.sendMessage(jid, {
            text:
                `🛡️ *NIKKA X MD — ANTI DELETE*\n\n` +
                `Type: ${type === 'gc' ? 'Group chats' : 'Personal chats'}\n` +
                `Status: ${enable ? '✅ ENABLED' : '❌ DISABLED'}`
        });

        return true;
    } catch (error) {
        console.error('toggleAntiDelete error:', error);

        await conn.sendMessage(jid, {
            text: '❌ Error updating AntiDelete setting.'
        });

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
    DeletedText: async (conn, mek, jid, deleteInfo, isGroup, update) =>
        sendDeletedMessage(conn, mek, jid, deleteInfo),
    DeletedMedia: async (conn, mek, jid, deleteInfo) =>
        sendDeletedMessage(conn, mek, jid, deleteInfo),
    AntiDelete,
    toggleAntiDelete,
    getAntiDeleteStatus,
    getDeletedLog,
    clearDeletedLog
};
