const { cmd } = require('../command');
const yts = require('yt-search');

const fs = require('fs');
const os = require('os');
const path = require('path');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

const SASA_API_KEY = process.env.SASA_API_KEY;
const API_URL = 'https://sasa-dev-api.xyz/api/yt/mp4-dl';

const QUALITY = '720';
const TIMEOUT = 300000;
const MAX_MEDIA_SIZE = 512 * 1024 * 1024;

const FOOTER =
    '> ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa';

const pendingDownloads = new Map();
const activeDownloads = new Set();

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

async function downloadAndSend(conn, mek, from, video) {
    let tempDir;

    if (activeDownloads.has(from)) {
        return conn.sendMessage(
            from,
            { text: '⏳ දැනටමත් වීඩියෝවක් Download වෙනවා. කරුණාකර රැඳී සිටින්න.' },
            { quoted: mek }
        );
    }

    activeDownloads.add(from);

    try {
        if (!SASA_API_KEY) {
            throw new Error('SASA_API_KEY GitHub Secret එක සකස් කර නැහැ.');
        }

        await conn.sendMessage(from, {
            react: { text: '⬇️', key: mek.key }
        }).catch(() => {});

        await conn.sendMessage(
            from,
            {
                text:
                    '╭━━〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕━━╮\n' +
                    '┃ 🎬 *VIDEO DOWNLOADER*\n' +
                    '┣━━━━━━━━━━━━━━━━━━╯\n' +
                    `┃ 📌 ${video.title || 'YouTube Video'}\n` +
                    '┃\n' +
                    '┃ ⏳ වීඩියෝව Download කරමින් පවතී...\n' +
                    `┃ 📺 Quality: ${QUALITY}p\n` +
                    '┃ 📁 Format: MP4\n' +
                    '┣━━━━━━━━━━━━━━━━━━╯\n' +
                    FOOTER
            },
            { quoted: mek }
        );

        const requestUrl = new URL(API_URL);
        requestUrl.searchParams.set('apikey', SASA_API_KEY);
        requestUrl.searchParams.set('url', video.url);
        requestUrl.searchParams.set('quality', QUALITY);
        requestUrl.searchParams.set('raw', '1');

        const response = await fetch(requestUrl, {
            method: 'GET',
            redirect: 'follow',
            signal: AbortSignal.timeout(TIMEOUT),
            headers: {
                Accept: 'video/mp4, application/octet-stream'
            }
        });

        if (!response.ok) {
            const details = await response.text().catch(() => '');
            console.error(
                '[SASA VIDEO API]',
                response.status,
                details.slice(0, 500)
            );
            throw new Error(`API_HTTP_${response.status}`);
        }

        const contentType = (
            response.headers.get('content-type') || ''
        ).toLowerCase();

        if (
            contentType.includes('application/json') ||
            contentType.includes('text/html') ||
            contentType.includes('text/plain')
        ) {
            const details = await response.text().catch(() => '');
            console.error('[SASA API RESPONSE]', details.slice(0, 1000));
            throw new Error('API එකෙන් සෘජු MP4 ගොනුවක් ලැබුණේ නැහැ.');
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
            await pipeline(source, fs.createWriteStream(tempFile));
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

        const fileHandle = await fs.promises.open(tempFile, 'r');

        try {
            const header = Buffer.alloc(12);
            const { bytesRead } = await fileHandle.read(header, 0, 12, 0);

            if (
                bytesRead < 8 ||
                header.toString('ascii', 4, 8) !== 'ftyp'
            ) {
                throw new Error('INVALID_MP4');
            }
        } finally {
            await fileHandle.close();
        }

        const title = safeFileName(video.title);

        await conn.sendMessage(
            from,
            {
                video: { url: tempFile },
                mimetype: 'video/mp4',
                fileName: `${title}.mp4`,
                caption:
                    '╭━━〔 *ᴅᴏᴡɴʟᴏᴀᴅ sᴜᴄᴄᴇss* 〕━━╮\n' +
                    `┃ 🎬 *${title}*\n` +
                    '┣━━━━━━━━━━━━━━━━━━╯\n' +
                    `┃ 📺 Quality: ${QUALITY}p\n` +
                    `┃ 📦 Size: ${(fileInfo.size / (1024 * 1024)).toFixed(1)} MB\n` +
                    '┃ ✅ Download complete\n' +
                    '┣━━━━━━━━━━━━━━━━━━╯\n' +
                    FOOTER
            },
            { quoted: mek }
        );

        await conn.sendMessage(from, {
            react: { text: '✅', key: mek.key }
        }).catch(() => {});

    } catch (error) {
        console.error(
            '[THENUVA VIDEO ERROR]',
            error.stack || error.message
        );

        let message = error.message || 'Unknown error';

        if (message === 'FILE_TOO_LARGE') {
            message = 'වීඩියෝව 512 MB සීමාව ඉක්මවා ඇත.';
        } else if (
            message === 'EMPTY_RESPONSE' ||
            message === 'EMPTY_FILE'
        ) {
            message = 'API එකෙන් වීඩියෝ ගොනුවක් ලැබුණේ නැහැ.';
        } else if (message === 'INVALID_MP4') {
            message = 'API ප්‍රතිචාරය වලංගු MP4 ගොනුවක් නොවේ.';
        } else if (/API_HTTP_401|API_HTTP_403/.test(message)) {
            message = 'SASA API key එක හෝ API access එක පරීක්ෂා කරන්න.';
        } else if (/API_HTTP_429/.test(message)) {
            message = 'API request සීමාව ඉක්මවා ඇත. පසුව උත්සාහ කරන්න.';
        } else if (/API_HTTP_5\d\d/.test(message)) {
            message = 'SASA API server එකේ දෝෂයක්. පසුව උත්සාහ කරන්න.';
        } else if (/AbortError|TimeoutError/i.test(message)) {
            message = 'Download එකට වැඩි වේලාවක් ගත වුණා. නැවත උත්සාහ කරන්න.';
        }

        await conn.sendMessage(
            from,
            {
                text:
                    '╭━━〔 *ᴅᴏᴡɴʟᴏᴀᴅ ғᴀɪʟᴇᴅ* 〕━━╮\n' +
                    `┃ ❌ ${message}\n` +
                    '┣━━━━━━━━━━━━━━━━━━╯\n' +
                    FOOTER
            },
            { quoted: mek }
        ).catch(() => {});

        await conn.sendMessage(from, {
            react: { text: '❌', key: mek.key }
        }).catch(() => {});

    } finally {
        activeDownloads.delete(from);

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

cmd({
    pattern: 'video',
    alias: ['ytmp4', 'ytvideo'],
    react: '🎬',
    desc: 'Download a YouTube video directly',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, args }) => {
    try {
        const input = args.join(' ').trim();

        if (!input) {
            return conn.sendMessage(
                from,
                {
                    text:
                        '╭━━〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕━━╮\n' +
                        '┃ 🎬 *VIDEO DOWNLOADER*\n' +
                        '┣━━━━━━━━━━━━━━━━━━╯\n' +
                        '┃ භාවිතය:\n' +
                        '┃ `.video වීඩියෝ නම`\n' +
                        '┃ `.video YouTube URL`\n' +
                        '┃\n' +
                        '┃ උදා: `.video Sanda Mithuri`\n' +
                        '┣━━━━━━━━━━━━━━━━━━╯\n' +
                        FOOTER
                },
                { quoted: mek }
            );
        }

        if (activeDownloads.has(from)) {
            return conn.sendMessage(
                from,
                { text: '⏳ Download එකක් දැනටමත් සිදුවෙමින් පවතී.' },
                { quoted: mek }
            );
        }

        await conn.sendMessage(from, {
            react: { text: '🔎', key: mek.key }
        }).catch(() => {});

        let video;

        if (isYouTubeUrl(input)) {
            video = {
                url: input,
                title: 'YouTube Video'
            };
        } else {
            const search = await yts(input);
            video = search?.videos?.[0];
        }

        if (!video?.url) {
            return conn.sendMessage(
                from,
                {
                    text:
                        '❌ ඒ නමට ගැළපෙන YouTube වීඩියෝවක් හමු වුණේ නැහැ.\n\n' +
                        FOOTER
                },
                { quoted: mek }
            );
        }

        return downloadAndSend(conn, mek, from, video);

    } catch (error) {
        console.error(
            '[VIDEO COMMAND ERROR]',
            error.stack || error.message
        );

        return conn.sendMessage(
            from,
            {
                text:
                    '❌ Video search/download එක අසාර්ථකයි.\n' +
                    `${error.message || 'Unknown error'}\n\n` +
                    FOOTER
            },
            { quoted: mek }
        ).catch(() => {});
    }
});
