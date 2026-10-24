const { cmd } = require('../command');
const yts = require('yt-search');

const fs = require('fs');
const os = require('os');
const path = require('path');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

const SASA_API_KEY = process.env.SASA_API_KEY;
const API_URL = 'https://sasa-dev-api.xyz/api/yt/mp4-dl';

const TIMEOUT = 300000;
const MAX_MEDIA_SIZE = 512 * 1024 * 1024;
const QUALITIES = ['360', '480', '720', '1080'];

const FOOTER =
    '> ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa';

const pendingVideos = new Map();
const pendingVideoNames = new Map();
const registeredListeners = new WeakSet();

function isYouTubeUrl(value) {
    try {
        const url = new URL(value);

        return [
            'youtube.com',
            'www.youtube.com',
            'm.youtube.com',
            'youtu.be',
            'www.youtu.be'
        ].includes(url.hostname.toLowerCase()) &&
        ['http:', 'https:'].includes(url.protocol);
    } catch {
        return false;
    }
}

function safeFileName(value) {
    return String(value || 'THENUVA-X-MD')
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 100) || 'THENUVA-X-MD';
}

function getMessageText(message) {
    const msg = message?.message || {};

    return (
        msg.conversation ||
        msg.extendedTextMessage?.text ||
        msg.imageMessage?.caption ||
        msg.videoMessage?.caption ||
        msg.documentMessage?.caption ||
        msg.ephemeralMessage?.message?.conversation ||
        msg.ephemeralMessage?.message?.extendedTextMessage?.text ||
        msg.viewOnceMessage?.message?.conversation ||
        msg.viewOnceMessageV2?.message?.conversation ||
        ''
    ).trim();
}

async function sendQualityMenu(conn, from, mek, video) {
    pendingVideos.set(from, {
        url: video.url,
        title: video.title || 'YouTube Video'
    });

    return conn.sendMessage(
        from,
        {
            text:
                '╭━━〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕━━╮\n' +
                '┃ 🎬 *VIDEO DOWNLOAD*\n' +
                '┣━━━━━━━━━━━━━━━━━━╯\n' +
                `┃ 📌 ${video.title || 'YouTube Video'}\n` +
                '┃\n' +
                '┃ 📺 *Quality එක තෝරන්න:*\n' +
                '┃\n' +
                '┃ 1️⃣ 360p\n' +
                '┃ 2️⃣ 480p\n' +
                '┃ 3️⃣ 720p HD\n' +
                '┃ 4️⃣ 1080p Full HD\n' +
                '┃\n' +
                '┃ ✍️ පිළිතුරු ලෙස `360`, `480`, `720` හෝ `1080` එවන්න.\n' +
                '┣━━━━━━━━━━━━━━━━━━╯\n' +
                FOOTER
        },
        { quoted: mek }
    );
}

async function downloadVideo(conn, mek, from, reply, quality) {
    let tempDir;

    try {
        const selected = pendingVideos.get(from);

        if (!selected?.url) {
            return reply(
                '❌ වීඩියෝවක් තෝරාගෙන නැහැ.\n\n' +
                'මුලින් `.video` command එක භාවිත කරන්න.\n\n' +
                FOOTER
            );
        }

        if (!SASA_API_KEY) {
            return reply(
                '❌ `SASA_API_KEY` GitHub Secret එක සකස් කර නැහැ.\n\n' +
                FOOTER
            );
        }

        quality = String(quality).trim();

        if (!QUALITIES.includes(quality)) {
            return reply(
                '❌ වැරදි Quality එකක්.\n\n' +
                '360, 480, 720 හෝ 1080 ලෙස පිළිතුරු දෙන්න.'
            );
        }

        await conn.sendMessage(from, {
            react: { text: '⏳', key: mek.key }
        }).catch(() => {});

        await reply(
            '⏳ *VIDEO DOWNLOADING...*\n\n' +
            `📺 Quality: ${quality}p\n` +
            '📁 Format: MP4\n' +
            'කරුණාකර රැඳී සිටින්න.\n\n' +
            FOOTER
        );

        const requestUrl = new URL(API_URL);
        requestUrl.searchParams.set('apikey', SASA_API_KEY);
        requestUrl.searchParams.set('url', selected.url);
        requestUrl.searchParams.set('quality', quality);
        requestUrl.searchParams.set('raw', '1');

        const response = await fetch(requestUrl, {
            method: 'GET',
            redirect: 'follow',
            signal: AbortSignal.timeout(TIMEOUT),
            headers: {
                Accept: 'video/mp4, application/octet-stream, application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');

            console.error(
                '[SASA VIDEO API]',
                response.status,
                errorText.slice(0, 500)
            );

            throw new Error(`API_HTTP_${response.status}`);
        }

        const contentType = (
            response.headers.get('content-type') || ''
        ).toLowerCase();

        if (
            contentType.includes('text/html') ||
            contentType.includes('application/json') ||
            contentType.includes('text/plain')
        ) {
            const body = await response.text().catch(() => '');

            console.error(
                '[SASA API RESPONSE]',
                body.slice(0, 1000)
            );

            throw new Error(
                'API එක MP4 ගොනුවක් වෙනුවට Text/JSON ප්‍රතිචාරයක් ලබා දුන්නා.'
            );
        }

        if (
            !contentType.includes('video/') &&
            !contentType.includes('application/octet-stream') &&
            !contentType.includes('binary/octet-stream')
        ) {
            throw new Error(
                `Unsupported content type: ${contentType || 'unknown'}`
            );
        }

        const declaredSize = Number(
            response.headers.get('content-length') || 0
        );

        if (declaredSize > MAX_MEDIA_SIZE) {
            throw new Error('FILE_TOO_LARGE');
        }

        if (!response.body) {
            throw new Error('EMPTY_RESPONSE');
        }

        tempDir = await fs.promises.mkdtemp(
            path.join(os.tmpdir(), 'thenuva-video-')
        );

        const tempFile = path.join(tempDir, 'video.mp4');
        let downloadedSize = 0;

        const source = Readable.fromWeb(response.body);

        source.on('data', chunk => {
            downloadedSize += chunk.length;

            if (downloadedSize > MAX_MEDIA_SIZE) {
                source.destroy(new Error('FILE_TOO_LARGE'));
            }
        });

        try {
            await pipeline(
                source,
                fs.createWriteStream(tempFile)
            );
        } catch (error) {
            if (
                error.message === 'FILE_TOO_LARGE' ||
                downloadedSize > MAX_MEDIA_SIZE
            ) {
                throw new Error('FILE_TOO_LARGE');
            }

            throw error;
        }

        const fileInfo = await fs.promises.stat(tempFile);

        if (!fileInfo.size) {
            throw new Error('EMPTY_FILE');
        }

        if (fileInfo.size > MAX_MEDIA_SIZE) {
            throw new Error('FILE_TOO_LARGE');
        }

        // Check that the downloaded file has an MP4 signature.
        const fileHandle = await fs.promises.open(tempFile, 'r');

        try {
            const header = Buffer.alloc(12);
            const { bytesRead } = await fileHandle.read(
                header, 0, 12, 0
            );

            if (
                bytesRead < 8 ||
                header.toString('ascii', 4, 8) !== 'ftyp'
            ) {
                throw new Error('INVALID_MP4');
            }
        } finally {
            await fileHandle.close();
        }

        const title = safeFileName(selected.title);

        const caption =
            '╭━━〔 *ᴅᴏᴡɴʟᴏᴀᴅ sᴜᴄᴄᴇss* 〕━━╮\n' +
            `┃ 🎬 *${title}*\n` +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            `┃ 📺 Quality: ${quality}p\n` +
            '┃ 📁 Format: MP4\n' +
            `┃ 📦 Size: ${(fileInfo.size / (1024 * 1024)).toFixed(1)} MB\n` +
            '┃ ✅ Download complete\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER;

        await conn.sendMessage(
            from,
            {
                video: { url: tempFile },
                mimetype: 'video/mp4',
                fileName: `${title}.mp4`,
                caption
            },
            { quoted: mek }
        );

        pendingVideos.delete(from);

        await conn.sendMessage(from, {
            react: { text: '✅', key: mek.key }
        }).catch(() => {});

    } catch (error) {
        console.error(
            '[VIDEO DOWNLOAD ERROR]',
            error.stack || error.message
        );

        await conn.sendMessage(from, {
            react: { text: '❌', key: mek.key }
        }).catch(() => {});

        let message = error.message || 'Unknown error';

        if (message === 'FILE_TOO_LARGE') {
            message = 'වීඩියෝව 512 MB සීමාව ඉක්මවා ඇත.';
        } else if (message === 'EMPTY_RESPONSE' || message === 'EMPTY_FILE') {
            message = 'API එකෙන් වීඩියෝ ගොනුවක් ලැබුණේ නැහැ.';
        } else if (message === 'INVALID_MP4') {
            message = 'API ප්‍රතිචාරය වලංගු MP4 වීඩියෝවක් නොවේ.';
        } else if (/API_HTTP_401|API_HTTP_403/.test(message)) {
            message = 'API key එක හෝ API access එක පරීක්ෂා කරන්න.';
        } else if (/API_HTTP_429/.test(message)) {
            message = 'API requests සීමාව ඉක්මවා ඇත. පසුව උත්සාහ කරන්න.';
        } else if (/API_HTTP_5\d\d/.test(message)) {
            message = 'Sasa API server එකේ දෝෂයක්. පසුව උත්සාහ කරන්න.';
        } else if (/AbortError|TimeoutError/i.test(message)) {
            message = 'Download එකට වැඩි වේලාවක් ගත වුණා. නැවත උත්සාහ කරන්න.';
        }

        return reply(
            '╭━━〔 *ᴅᴏᴡɴʟᴏᴀᴅ ғᴀɪʟᴇᴅ* 〕━━╮\n' +
            `┃ ❌ ${message}\n` +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER
        );

    } finally {
        if (tempDir) {
            await fs.promises.rm(tempDir, {
                recursive: true,
                force: true
            }).catch(error => {
                console.error('[TEMP CLEANUP ERROR]', error.message);
            });
        }
    }
}

function registerVideoListener(conn) {
    if (!conn?.ev || registeredListeners.has(conn)) {
        return;
    }

    registeredListeners.add(conn);

    conn.ev.on('messages.upsert', async ({ messages }) => {
        for (const incoming of messages || []) {
            try {
                if (!incoming?.message || incoming.key?.fromMe) {
                    continue;
                }

                const from = incoming.key?.remoteJid;

                if (!from) continue;

                const text = getMessageText(incoming);
                if (!text) continue;

                // Handle a quality reply for the previously selected video.
                const quality = text.match(/^(360|480|720|1080)p?$/i);

                if (quality && pendingVideos.has(from)) {
                    const selectedQuality = quality[1];

                    await downloadVideo(
                        conn,
                        incoming,
                        from,
                        message => conn.sendMessage(
                            from,
                            { text: message },
                            { quoted: incoming }
                        ),
                        selectedQuality
                    );

                    continue;
                }

                // Handle a video search name after the user sends `.video`.
                if (!pendingVideoNames.has(from)) {
                    continue;
                }

                if (text.startsWith('.')) {
                    continue;
                }

                pendingVideoNames.delete(from);

                await conn.sendMessage(from, {
                    react: { text: '🔎', key: incoming.key }
                }).catch(() => {});

                const search = await yts(text);
                const video = search?.videos?.[0];

                if (!video?.url) {
                    await conn.sendMessage(
                        from,
                        {
                            text:
                                '❌ YouTube වීඩියෝවක් හමු වුණේ නැහැ.\n' +
                                'නැවත `.video` යවලා උත්සාහ කරන්න.\n\n' +
                                FOOTER
                        },
                        { quoted: incoming }
                    );

                    continue;
                }

                await sendQualityMenu(
                    conn,
                    from,
                    incoming,
                    {
                        url: video.url,
                        title: video.title
                    }
                );

            } catch (error) {
                console.error(
                    '[VIDEO MESSAGE LISTENER ERROR]',
                    error.stack || error.message
                );
            }
        }
    });
}

cmd({
    pattern: 'video',
    alias: ['ytmp4', 'ytvideo'],
    react: '🎬',
    desc: 'Search and download YouTube videos',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    registerVideoListener(conn);

    const input = args.join(' ').trim();

    if (!input) {
        pendingVideoNames.set(from, true);

        return reply(
            '╭━━〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕━━╮\n' +
            '┃ 🎬 *VIDEO DOWNLOADER*\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            '┃\n' +
            '┃ YouTube වීඩියෝ නම එවන්න.\n' +
            '┃ උදා: `.video Sanda Mithuri`\n' +
            '┃\n' +
            '┃ නැත්නම් URL එකත් එක්ක යවන්න:\n' +
            '┃ `.video https://youtu.be/...`\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER
        );
    }

    try {
        await conn.sendMessage(from, {
            react: { text: '🔎', key: mek.key }
        }).catch(() => {});

        const video = isYouTubeUrl(input)
            ? { url: input, title: 'YouTube Video' }
            : (await yts(input))?.videos?.[0];

        if (!video?.url) {
            return reply(
                '❌ ඒ නමට ගැළපෙන YouTube වීඩියෝවක් හමු වුණේ නැහැ.\n\n' +
                FOOTER
            );
        }

        return sendQualityMenu(
            conn,
            from,
            mek,
            {
                url: video.url,
                title: video.title || 'YouTube Video'
            }
        );

    } catch (error) {
        console.error(
            '[VIDEO SEARCH ERROR]',
            error.stack || error.message
        );

        return reply(
            '❌ Video search එක අසාර්ථකයි.\n' +
            `${error.message || 'Unknown error'}\n\n` +
            FOOTER
        );
    }
});
