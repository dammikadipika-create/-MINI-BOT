const { cmd } = require('../command');
const yts = require('yt-search');

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = 'ZSKNl5eniyeAPcPkf';
const API_URL = `https://apify.com{ACTOR_ID}/run-sync-get-dataset-items`;

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
    const unique = new Map();

    for (const item of videos) {
        if (!item?.videoId || !/^[\w-]{11}$/.test(item.videoId)) {
            continue;
        }

        if (!unique.has(item.videoId)) {
            unique.set(item.videoId, {
                id: item.videoId,
                title: cleanName(item.title),
                url: `https://youtube.com{item.videoId}`,
                author: item.author?.name || 'YouTube',
                duration: item.timestamp || 'Unknown',
                savedAt: Date.now()
            });
        }

        if (unique.size >= 1) break; 
    }

    return [...unique.values()];
}

async function getAudioUrl(video) {
    if (!APIFY_TOKEN) {
        throw new Error('APIFY_TOKEN is missing in Railway Variables.');
    }

    const response = await fetch(
        `${API_URL}?token=${encodeURIComponent(APIFY_TOKEN)}&timeout=240`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                urls: [{ url: video.url }],
                quality: '1080',
                format: 'mp3',
                residentialProxyMode: 'disabled',
                proxyCountry: ''
            }),
            signal: AbortSignal.timeout(TIMEOUT)
        }
    );

    const body = await response.text();

    if (!response.ok) {
        console.error('[MP3 API]', response.status, body.slice(0, 500));
        throw new Error(`Apify returned HTTP ${response.status}`);
    }

    let parsed;
    try {
        parsed = JSON.parse(body);
    } catch {
        throw new Error('Apify did not return valid JSON.');
    }

    const root = Array.isArray(parsed) ? parsed : [parsed];
    const queue = [...root];
    const visited = new Set();

    while (queue.length) {
        const item = queue.shift();

        if (!item || typeof item !== 'object' || visited.has(item)) {
            continue;
        }
        visited.add(item);

        for (const key of [
            'audioUrl',
            'audio_url',
            'mp3Url',
            'mp3_url',
            'audioDownloadUrl',
            'downloadUrl',
            'download_url'
        ]) {
            const value = item[key];
            if (
                typeof value === 'string' &&
                /^https?:\/\//i.test(value) &&
                !/\.html?(?:[?#]|$)/i.test(value)
            ) {
                return value;
            }
        }

        for (const [key, value] of Object.entries(item)) {
            if (value && typeof value === 'object') {
                queue.push(value);
            } else if (
                typeof value === 'string' &&
                /^https?:\/\//i.test(value) &&
                /^(audio|mp3|download)/i.test(key)
            ) {
                return value;
            }
        }
    }

    console.error('[MP3 API OUTPUT]', JSON.stringify(parsed).slice(0, 2000));
    throw new Error('Apify output did not contain an audio download URL.');
}

async function downloadAudio(url) {
    const response = await fetch(url, {
        headers: { Accept: 'audio/*, application/octet-stream, */*' },
        signal: AbortSignal.timeout(TIMEOUT)
    });

    if (!response.ok) {
        throw new Error(`Audio server returned HTTP ${response.status}`);
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (
        contentType.includes('text/html') ||
        contentType.startsWith('text/') ||
        contentType.includes('application/json')
    ) {
        throw new Error('Download server returned a webpage instead of audio.');
    }

    const declaredSize = Number(response.headers.get('content-length') || 0);
    if (declaredSize > MAX_SIZE) {
        throw new Error('FILE_TOO_LARGE');
    }

    if (!response.body) {
        throw new Error('Empty audio response.');
    }

    const chunks = [];
    let totalSize = 0;

    for await (const chunk of response.body) {
        const buffer = Buffer.from(chunk);
        totalSize += buffer.length;

        if (totalSize > MAX_SIZE) {
            try { await response.body.cancel(); } catch {}
            throw new Error('FILE_TOO_LARGE');
        }
        chunks.push(buffer);
    }

    const audio = Buffer.concat(chunks);
    if (!audio.length) {
        throw new Error('Downloaded audio is empty.');
    }

    const looksLikeAudio =
        audio.subarray(0, 3).toString() === 'ID3' ||
        (audio.length > 1 && audio === 0xff && (audio & 0xe0) === 0xe0) ||
        audio.subarray(4, 8).toString() === 'ftyp' ||
        audio.subarray(0, 4).toString() === 'OggS';

    if (!contentType.startsWith('audio/') && !looksLikeAudio) {
        throw new Error('The downloaded file does not look like audio.');
    }

    return audio;
}

cmd({
    pattern: 'mp3',
    alias: ['song', 'ytaudio', 'ytmp3'],
    react: '🎵',
    desc: 'Search songs and download MP3 directly',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    const query = (args || []).join(' ').trim();

    if (!query) {
        return reply(
            '🎧 *YouTube MP3 Downloader*\n\n' +
            'Song එකේ නම සමඟ command එක යොදන්න.\n' +
            'Example: *.mp3 Shape of You*'
        );
    }

    if (activeDownloads.has(from)) {
        return reply('⏳ Download එකක් දැනට ක්‍රියාත්මකයි. ටිකක් ඉන්න.');
    }

    activeDownloads.add(from);

    try {
        const results = await searchSongs(query);

        if (!results || results.length === 0) {
            activeDownloads.delete(from);
            return reply('❌ ඔබ සෙවූ ගීතය සොයාගත නොහැකි විය.');
        }

        const video = results[0]; 

        await conn.sendMessage(from, {
            text:
                '╭━━〔 *ᴍᴘ3 ᴅᴏᴡɴʟᴏᴀᴅ* 〕━━╮\n' +
                `┃ 🔍 Title: ${video.title}\n` +
                `┃ 👤 Channel: ${video.author}\n` +
                `┃ 🕒 Duration: ${video.duration}\n` +
                '┃ ⏳ Audio එක සකස් කරමින්...\n' +
                '╰━━━━━━━━━━━━━━━━━━╯\n' +
                FOOTER
        }, { quoted: mek });

        const audioUrl = await getAudioUrl(video);
        const audio = await downloadAudio(audioUrl);

        await conn.sendMessage(from, {
            audio,
            mimetype: 'audio/mpeg',
            fileName: `${cleanName(video.title)}.mp3`,
            ptt: false
        }, { quoted: mek });

    } catch (error) {
        console.error('[MP3 DOWNLOAD ERROR]', error);

        const reason = error.message === 'FILE_TOO_LARGE'
            ? 'Audio file එක 64 MB සීමාව ඉක්මවයි.'
            : String(error.message || 'Unknown error').slice(0, 250);

        await conn.sendMessage(from, {
            text: `❌ *MP3 Download Failed*\n${reason}\n\n${FOOTER}`
        }, { quoted: mek });

    } finally {
        activeDownloads.delete(from);
    }
});
