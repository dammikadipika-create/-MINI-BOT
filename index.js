const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    jidNormalizedUser,
    getContentType,
    fetchLatestBaileysVersion,
    Browsers
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const P = require('pino');
const express = require('express');
const path = require('path');
const qrcode = require('qrcode-terminal');

const config = require('./config');
const { sms } = require('./lib/msg');
const { getGroupAdmins } = require('./lib/functions');
const { File } = require('megajs');
const { commands, replyHandlers } = require('./command');

const app = express();
const port = process.env.PORT || 8000;

const prefix = '.';
const ownerNumber = ['94703270772'];

const authDir = path.join(__dirname, 'auth_info_baileys');
const credsPath = path.join(authDir, 'creds.json');
const pluginsDir = path.join(__dirname, 'plugins');

let danuwa = null;
let isConnecting = false;
let reconnectTimer = null;
let reconnectAttempts = 0;
let pluginsLoaded = false;
let connectionStopped = false;

// ========================================
// EXPRESS SERVER
// ========================================

app.get('/', (req, res) => {
    res.send('Hey, THENUVA X MD started ✅');
});

app.get('/api/status', (req, res) => {
    res.json({
        bot: 'THENUVA X MD',
        status: danuwa?.user ? 'connected' : 'disconnected',
        owner: 'Dilshan Ashinsa',
        pluginsLoaded,
        registeredCommands: commands.length
    });
});

app.listen(port, () => {
    console.log(`🌐 THENUVA X MD server listening on port ${port}`);
});

// ========================================
// SESSION RESTORE FROM MEGA
// ========================================

async function ensureSessionFile() {
    const tempPath = `${credsPath}.download`;

    try {
        fs.mkdirSync(authDir, { recursive: true });

        if (!fs.existsSync(credsPath)) {
            const sessionUrl = String(config.SESSION_ID || '')
                .trim()
                .replace(/^THENUVA-XMD=/i, '')
                .trim();

            if (!/^https:\/\/mega\.nz\/file\/[^#]+#[^#]+$/i.test(sessionUrl)) {
                throw new Error(
                    'Invalid SESSION_ID. Set the complete MEGA URL including its # key.'
                );
            }

            console.log('🔄 Downloading session from MEGA...');

            const { pipeline } = require('stream/promises');
            const megaFile = File.fromURL(sessionUrl);

            await pipeline(
                megaFile.download(),
                fs.createWriteStream(tempPath)
            );

            let sessionData;

            try {
                sessionData = JSON.parse(
                    fs.readFileSync(tempPath, 'utf8')
                );
            } catch {
                throw new Error(
                    'Downloaded session file is not valid JSON.'
                );
            }

            if (
                !sessionData ||
                typeof sessionData !== 'object' ||
                Array.isArray(sessionData)
            ) {
                throw new Error('Invalid session file format.');
            }

            fs.renameSync(tempPath, credsPath);
            console.log('✅ Session credentials downloaded successfully.');
        } else {
            console.log('✅ Existing creds.json found.');
        }

        await connectToWA();
    } catch (error) {
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }

        console.error('❌ SESSION RESTORE ERROR:', error.message);
        console.error(error.stack || 'No stack trace available');
    }
}

// ========================================
// LOAD PLUGINS
// ========================================

function loadPlugins() {
    if (pluginsLoaded) return;

    console.log(`📂 Looking for plugins at: ${pluginsDir}`);

    if (!fs.existsSync(pluginsDir)) {
        console.error(`❌ Plugins folder not found: ${pluginsDir}`);
        console.error('👉 Create plugins/alive.js in your GitHub repository.');
        return;
    }

    let pluginFiles;

    try {
        pluginFiles = fs.readdirSync(pluginsDir)
            .filter(file => file.endsWith('.js'));
    } catch (error) {
        console.error('❌ Cannot read plugins directory:', error.message);
        return;
    }

    if (pluginFiles.length === 0) {
        console.warn('⚠️ No JavaScript plugins found in plugins/.');
        return;
    }

    let loadedCount = 0;

    for (const plugin of pluginFiles) {
        const pluginPath = path.join(pluginsDir, plugin);

        try {
            require(pluginPath);
            loadedCount++;
            console.log(`✅ Plugin loaded: ${plugin}`);
        } catch (error) {
            console.error(
                `❌ Plugin load failed: ${plugin}`,
                error.stack || error.message
            );
        }
    }

    pluginsLoaded = loadedCount > 0;

    console.log(`📦 Plugins loaded: ${loadedCount}/${pluginFiles.length}`);
    console.log(`📋 Registered commands: ${commands.length}`);
    console.log(
        '📋 Commands:',
        commands.map(command => command.pattern).join(', ') || '(none)'
    );
}

// ========================================
// SAFE RECONNECT
// ========================================

function scheduleReconnect() {
    if (connectionStopped || reconnectTimer) return;

    reconnectAttempts++;

    const delay = Math.min(
        5000 * (2 ** (reconnectAttempts - 1)),
        60000
    );

    console.log(
        `🔄 Reconnecting in ${Math.ceil(delay / 1000)} seconds...`
    );

    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;

        connectToWA().catch(error => {
            isConnecting = false;
            console.error('❌ RECONNECT ERROR:', error.message);
        });
    }, delay);
}

// ========================================
// CONNECT TO WHATSAPP
// ========================================

async function connectToWA() {
    if (isConnecting || connectionStopped) return;

    isConnecting = true;

    try {
        fs.mkdirSync(authDir, { recursive: true });

        const { state, saveCreds } =
            await useMultiFileAuthState(authDir);

        const { version } = await fetchLatestBaileysVersion();

        console.log(
            `🔄 Connecting THENUVA X MD using WhatsApp Web version ${version.join('.')}`
        );

        const socket = makeWASocket({
            logger: P({ level: 'silent' }),
            printQRInTerminal: false,
            browser: Browsers.macOS('THENUVA X MD'),
            auth: state,
            version,
            syncFullHistory: false,
            markOnlineOnConnect: false,
            generateHighQualityLinkPreview: true
        });

        danuwa = socket;

        socket.ev.on('creds.update', saveCreds);

        // ========================================
        // CONNECTION STATUS
        // ========================================

        socket.ev.on('connection.update', async update => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('📱 Scan this QR with WhatsApp:');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'connecting') {
                console.log('⏳ THENUVA X MD is connecting...');
            }

            if (connection === 'open') {
                isConnecting = false;
                reconnectAttempts = 0;

                if (reconnectTimer) {
                    clearTimeout(reconnectTimer);
                    reconnectTimer = null;
                }

                console.log('✅ THENUVA X MD connected to WhatsApp!');

                // Do not send an automatic WhatsApp message on startup.
                loadPlugins();
            }

            if (connection === 'close') {
                isConnecting = false;

                const error = lastDisconnect?.error;
                const statusCode = error?.output?.statusCode;

                console.error('⚠️ WhatsApp connection closed:', {
                    statusCode: statusCode || 'unknown',
                    message: error?.message || 'No error message',
                    payload: error?.output?.payload
                });

                if (statusCode === DisconnectReason.loggedOut) {
                    connectionStopped = true;

                    if (reconnectTimer) {
                        clearTimeout(reconnectTimer);
                        reconnectTimer = null;
                    }

                    console.error(
                        '❌ WhatsApp logged out. A fresh session is required.'
                    );
                    return;
                }

                if (statusCode === DisconnectReason.connectionReplaced) {
                    connectionStopped = true;

                    if (reconnectTimer) {
                        clearTimeout(reconnectTimer);
                        reconnectTimer = null;
                    }

                    console.error('❌ CONNECTION REPLACED (440).');
                    console.error(
                        '👉 Stop any other bot instance using this WhatsApp session.'
                    );
                    return;
                }

                scheduleReconnect();
            }
        });

        // ========================================
        // INCOMING MESSAGES / COMMANDS
        // ========================================

        socket.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;

            for (const mek of messages) {
                if (!mek?.message) continue;
                if (mek.key?.fromMe) continue;

                try {
                    const from = mek.key?.remoteJid;

                    if (
                        !from ||
                        from === 'status@broadcast' ||
                        from.endsWith('@newsletter')
                    ) {
                        continue;
                    }

                    let message = mek.message;

                    if (message.ephemeralMessage?.message) {
                        message = message.ephemeralMessage.message;
                        mek.message = message;
                    }

                    if (message.viewOnceMessage?.message) {
                        message = message.viewOnceMessage.message;
                        mek.message = message;
                    }

                    const m = sms(socket, mek);
                    const typeOfMessage = getContentType(message);

                    const body = (
                        typeOfMessage === 'conversation'
                            ? message.conversation
                            : message[typeOfMessage]?.text ||
                              message[typeOfMessage]?.caption ||
                              message[typeOfMessage]?.selectedButtonId ||
                              message[typeOfMessage]?.singleSelectReply?.selectedRowId ||
                              ''
                    ).trim();

                    if (!body) continue;

                    const isCmd = body.startsWith(prefix);
                    const parts = body.split(/\s+/);
                    const commandName = isCmd
                        ? parts[0].slice(prefix.length).toLowerCase()
                        : '';

                    const args = isCmd ? parts.slice(1) : [];
                    const q = args.join(' ');

                    const sender = mek.key.participant || from;
                    const senderNumber = sender
                        .split('@')[0]
                        .split(':')[0];

                    const isGroup = from.endsWith('@g.us');
                    const botNumber = socket.user?.id
                        ?.split(':')[0]
                        .split('@')[0] || '';

                    const pushname = mek.pushName || 'User';
                    const isMe = botNumber === senderNumber;
                    const isOwner = ownerNumber.includes(senderNumber) || isMe;

                    const botNumber2 = await jidNormalizedUser(socket.user.id);

                    const groupMetadata = isGroup
                        ? await socket.groupMetadata(from).catch(() => null)
                        : null;

                    const groupName = groupMetadata?.subject || '';
                    const participants = groupMetadata?.participants || [];
                    const groupAdmins = isGroup
                        ? getGroupAdmins(participants)
                        : [];

                    const isBotAdmins = isGroup
                        ? groupAdmins.includes(botNumber2)
                        : false;

                    const isAdmins = isGroup
                        ? groupAdmins.includes(sender)
                        : false;

                    const reply = text =>
                        socket.sendMessage(
                            from,
                            { text: String(text) },
                            { quoted: mek }
                        );

                    console.log(
                        `📩 Message from ${senderNumber}: ${body.slice(0, 100)}`
                    );

                    // ========================================
                    // COMMAND HANDLER
                    // ========================================

                    if (isCmd) {
                        const cmd = commands.find(command => {
                            const pattern = String(command.pattern || '')
                                .toLowerCase();

                            const aliases = Array.isArray(command.alias)
                                ? command.alias.map(alias =>
                                    String(alias).toLowerCase()
                                )
                                : command.alias
                                    ? [String(command.alias).toLowerCase()]
                                    : [];

                            return pattern === commandName ||
                                aliases.includes(commandName);
                        });

                        if (cmd) {
                            console.log(`⚡ Running command: ${commandName}`);

                            if (cmd.react) {
                                socket.sendMessage(from, {
                                    react: {
                                        text: cmd.react,
                                        key: mek.key
                                    }
                                }).catch(() => {});
                            }

                            try {
                                await cmd.function(socket, mek, m, {
                                    from,
                                    quoted: mek,
                                    body,
                                    isCmd,
                                    command: commandName,
                                    args,
                                    q,
                                    isGroup,
                                    sender,
                                    senderNumber,
                                    botNumber2,
                                    botNumber,
                                    pushname,
                                    isMe,
                                    isOwner,
                                    groupMetadata,
                                    groupName,
                                    participants,
                                    groupAdmins,
                                    isBotAdmins,
                                    isAdmins,
                                    reply
                                });
                            } catch (error) {
                                console.error(
                                    `[COMMAND ERROR: ${commandName}]`,
                                    error.stack || error.message
                                );

                                await reply(
                                    '❌ Command error. Check GitHub Actions logs.'
                                ).catch(() => {});
                            }
                        } else {
                            console.log(`⚠️ Command not found: ${commandName}`);
                        }
                    }

                    // ========================================
                    // REPLY HANDLERS
                    // ========================================

                    for (const handler of replyHandlers) {
                        try {
                            if (
                                typeof handler.filter === 'function' &&
                                handler.filter(body, {
                                    sender,
                                    message: mek
                                })
                            ) {
                                await handler.function(socket, mek, m, {
                                    from,
                                    quoted: mek,
                                    body,
                                    sender,
                                    reply
                                });
                                break;
                            }
                        } catch (error) {
                            console.error(
                                '❌ Reply handler error:',
                                error.stack || error.message
                            );
                        }
                    }
                } catch (error) {
                    console.error(
                        '❌ MESSAGE HANDLER ERROR:',
                        error.stack || error.message
                    );
                }
            }
        });
    } catch (error) {
        isConnecting = false;

        console.error(
            '❌ WHATSAPP STARTUP ERROR:',
            error.stack || error.message
        );

        scheduleReconnect();
    }
}

// ========================================
// START BOT
// ========================================

ensureSessionFile().catch(error => {
    console.error('❌ BOT START ERROR:', error.stack || error.message);
});
