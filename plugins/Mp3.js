const { cmd } = require('../command');
const yts = require('yt-search');

const API_KEY = 'Sasa_Dev_Api_79346efacb553ec6ee94f2f6453dec8658ec5e7b';
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
    const unique = new Map();

    for (const item of videos) {
        if (!item?.videoId || !/^[\w-]{11}$/.test(item.videoId)) {
            continue;
        }

        if (!unique.has(item.videoId)) {
            unique.set(item.videoId, {
                id: item.videoId,
                title: cleanName(item.title),
                url: `https://www.youtube.com/watch?v=${item.videoId}`,
                author: item.author?.name || 'YouTube',
                duration: item.timestamp || 'Unknown',
                savedAt: Date.now()
            });
        }

        if (unique.size >= 1) break; // Direct ක්‍රමයට පළමු ප්‍රතිඵලය පමණක් ලබා ගනී
    }

    return [...unique.values()];
}

async function getAudioUrlFromApi(videoUrl) {
    // Sasa Dev API එක වෙත GET Request එකක් යවා direct ලින්ක් එක ලබා ගැනීම
    const fullUrl = `${API_URL}?apikey=${API_KEY}&url=${encodeURIComponent(videoUrl)}&quality=128&raw=false`;
    
    const response = await fetch(fullUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT)
    });

    if (!response.ok) {
        throw new Error(`Sasa API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // API response එක අනුව download link එක වෙන්කර ගැනීම (පොදු key හැඩතල කිහිපයක්ම පරික්ෂා කරයි)
    const downloadUrl = data.result || data.downloadUrl || data.url || (data.data && data.data.url);

    if (!downloadUrl || typeof downloadUrl !== 'string') {
        throw new Error('Sasa API output did not contain a valid download URL.');
    }

    return downloadUrl;
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

    return audio;
}

cmd({
    pattern: 'mp3',
    alias: ['song', 'ytaudio', 'ytmp3'],
    react: '🎵',
    desc: 'Search songs and download MP3 via Sasa Dev API',
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
                '╭━━〔 *ᴍᴘ3 ᴅᴏᴡණʟᴏᴀᴅ* 〕━━╮\n' +
                `┃ 🔍 Title: ${video.title}\n` +
                `┃ 👤 Channel: ${video.author}\n` +
                `┃ 🕒 Duration: ${video.duration}\n` +
                '┃ ⏳ Audio එක සකස් කරමින්...\n' +
                '╰━━━━━━━━━━━━━━━━━━╯\n' +
                FOOTER
        }, { quoted: mek });

        // 1. Sasa Dev API එකෙන් ඩවුන්ලෝඩ් ලින්ක් එක ලබා ගැනීම
        const audioUrl = await getAudioUrlFromApi(video.url);
        
        // 2. ලබාගත් ලින්ක් එකෙන් Audio file එක බාගත කිරීම
        const audio = await downloadAudio(audioUrl);

        // 3. WhatsApp හරහා ගීතය යැවීම
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
