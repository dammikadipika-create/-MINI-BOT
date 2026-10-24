const { cmd } = require('../command');
const yts = require('yt-search');

const API_KEY = process.env.SASA_API_KEY;
const API_URL = 'https://sasa-dev-api.xyz/api/yt/mp3-dl';

const MAX_SIZE = 64 * 1024 * 1024;
const TIMEOUT = 300000;
const FOOTER = '> ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ';

const activeDownloads = new Set();

function cleanName(value) {
    return String(value || 'NIKKA-X-MD')
        .replace(/[\\/:*?"<>|\x00-\x1F]/g, '')
        .trim()
        .slice(0, 100) || 'NIKKA-X-MD';
}

async function searchSongs(query) {
    const result = await yts(query);
    const videos = result?.videos || [];

    const item = videos.find(video =>
        video?.videoId &&
        /^[\w-]{11}$/.test(video.videoId)
    );

    if (!item) return null;

    return {
        id: item.videoId,
        title: cleanName(item.title),
        url: `https://www.youtube.com/watch?v=${item.videoId}`,
        author: item.author?.name || 'YouTube',
        duration: item.timestamp || 'Unknown'
    };
}

async function downloadAudioDirectly(videoUrl, quality) {
    if (!API_KEY) {
        throw new Error(
            'SASA_API_KEY GitHub Secret එක සකස් කර නැත.'
        );
    }

    const params = new URLSearchParams({
        apikey: API_KEY,
        url: videoUrl,
        quality: quality,
        raw: 'true'
    });

    const requestUrl = `${API_URL}?${params.toString()}`;

    const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
            Accept: 'audio/mpeg, audio/*, application/octet-stream, application/json'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT)
    });

    const contentType = (
        response.headers.get('content-type') || ''
    ).toLowerCase();

    if (!response.ok) {
        const errorBody = await response.text().catch(() => '');

        console.error('[SASA MP3 API ERROR]', {
            status: response.status,
            body: errorBody.slice(0, 1500)
        });

        throw new Error(
            `Sasa API HTTP ${response.status}: ${
                errorBody.slice(0, 250) || 'No error details returned'
            }`
        );
    }

    if (
        contentType.includes('application/json') ||
        contentType.includes('text/html')
    ) {
        const body = await response.text().catch(() => '');

        console.error('[SASA MP3 INVALID RESPONSE]', {
            contentType,
            body: body.slice(0, 1500)
        });

        let message = body.slice(0, 250);

        try {
            const data = JSON.parse(body);
            message = data.message || data.error || message;
        } catch {}

        throw new Error(
            `API එක audio file එකක් වෙනුවට error response එකක් ලබා දුන්නා: ${message}`
        );
    }

    const declaredSize = Number(
        response.headers.get('content-length') || 0
    );

    if (declaredSize > MAX_SIZE) {
        throw new Error('FILE_TOO_LARGE');
    }

    if (!response.body) {
        throw new Error('API එකෙන් audio data ලැබුණේ නැහැ.');
    }

    const chunks = [];
    let totalSize = 0;

    for await (const chunk of response.body) {
        const buffer = Buffer.from(chunk);
        totalSize += buffer.length;

        if (totalSize > MAX_SIZE) {
            try {
                await response.body.cancel();
            } catch {}

            throw new Error('FILE_TOO_LARGE');
        }

        chunks.push(buffer);
    }

    const audio = Buffer.concat(chunks);

    if (!audio.length) {
        throw new Error('Downloaded audio file එක හිස්.');
    }

    // HTML/JSON වැනි වැරදි response එකක් MP3 ලෙස යැවීම වළක්වයි.
    const start = audio.subarray(0, 100).toString('utf8').trimStart();

    if (
        start.startsWith('<!DOCTYPE html') ||
        start.startsWith('<html') ||
        start.startsWith('{')
    ) {
        throw new Error(
            'API එකෙන් MP3 වෙනුවට error page එකක් ලැබුණා.'
        );
    }

    return audio;
}

cmd({
    pattern: 'mp3',
    alias: ['song', 'ytaudio', 'ytmp3'],
    react: '🎵',
    desc: 'Search and download YouTube MP3',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    const fullInput = (args || []).join(' ').trim();

    if (!fullInput) {
        return reply(
            '🎧 *YouTube MP3 Downloader*\n\n' +
            'ගීතයේ නම සහ quality එක ලබා දෙන්න.\n\n' +
            'Example: *.mp3 Shape of You | 128*\n' +
            'Example: *.mp3 Shape of You | 320*\n\n' +
            'Default quality: 128kbps\n\n' +
            FOOTER
        );
    }

    let query = fullInput;
    let quality = '128';

    if (fullInput.includes('|')) {
        const parts = fullInput.split('|');

        query = parts.slice(0, -1).join('|').trim();

        const requestedQuality = parts[parts.length - 1].trim();

        if (!['128', '320'].includes(requestedQuality)) {
            return reply(
                '❌ Quality එක 128 හෝ 320 ලෙස ලබා දෙන්න.\n\n' +
                'Example: *.mp3 Shape of You | 320*'
            );
        }

        quality = requestedQuality;
    }

    if (!query) {
        return reply('❌ ගීතයේ නම ලබා දෙන්න.');
    }

    if (activeDownloads.has(from)) {
        return reply(
            '⏳ මේ chat එකේ download එකක් දැනට ක්‍රියාත්මකයි. ටිකක් ඉන්න.'
        );
    }

    activeDownloads.add(from);

    try {
        if (!API_KEY) {
            throw new Error(
                'SASA_API_KEY GitHub Secret එක සකස් කර නැත.'
            );
        }

        const video = await searchSongs(query);

        if (!video) {
            return reply('❌ ඔබ සෙවූ ගීතය සොයාගත නොහැකි විය.');
        }

        await conn.sendMessage(from, {
            text:
                '╭━━〔 *ᴍᴘ3 ᴅᴏᴡɴʟᴏᴀᴅ* 〕━━╮\n' +
                `┃ 🎵 Title: ${video.title}\n` +
                `┃ 👤 Channel: ${video.author}\n` +
                `┃ 🕒 Duration: ${video.duration}\n` +
                `┃ 🎧 Quality: ${quality}kbps\n` +
                '┃ ⏳ Audio එක සකස් කරමින්...\n' +
                '╰━━━━━━━━━━━━━━━━━━╯\n' +
                FOOTER
        }, { quoted: mek });

        const audio = await downloadAudioDirectly(
            video.url,
            quality
        );

        await conn.sendMessage(from, {
            audio,
            mimetype: 'audio/mpeg',
            fileName: `${cleanName(video.title)}.mp3`,
            ptt: false
        }, { quoted: mek });

    } catch (error) {
        console.error('[MP3 DOWNLOAD ERROR]', error);

        let reason = String(
            error.message || 'Unknown error'
        ).slice(0, 350);

        if (error.message === 'FILE_TOO_LARGE') {
            reason = 'Audio file එක 64 MB සීමාව ඉක්මවයි.';
        } else if (
            error.name === 'TimeoutError' ||
            error.name === 'AbortError'
        ) {
            reason = 'Download එකට වැඩි වෙලාවක් ගියා. නැවත උත්සාහ කරන්න.';
        }

        await conn.sendMessage(from, {
            text:
                `❌ *MP3 Download Failed*\n\n` +
                `${reason}\n\n` +
                FOOTER
        }, { quoted: mek });

    } finally {
        activeDownloads.delete(from);
    }
});
