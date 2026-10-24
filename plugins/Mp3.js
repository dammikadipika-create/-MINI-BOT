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

// තෝරාගත් quality අගය සමඟ 302 Redirect එක අනුගමනය කරමින් direct audio එක බාගත කරන ශ්‍රිතය
async function downloadAudioDirectly(videoUrl, quality) {
    let fullUrl = `${API_URL}?apikey=${API_KEY}&url=${encodeURIComponent(videoUrl)}&quality=${quality}&raw=true`;
    
    let response = await fetch(fullUrl, {
        method: 'GET',
        headers: { Accept: 'audio/*, application/octet-stream, */*' },
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT)
    });

    if (response.status === 302 || response.status === 301) {
        const redirectUrl = response.headers.get('location');
        if (redirectUrl) {
            response = await fetch(redirectUrl, {
                method: 'GET',
                headers: { Accept: 'audio/*, application/octet-stream, */*' },
                signal: AbortSignal.timeout(TIMEOUT)
            });
        }
    }

    if (!response.ok) {
        throw new Error(`Sasa API returned HTTP ${response.status}`);
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    
    if (contentType.includes('application/json')) {
        const errData = await response.json();
        throw new Error(errData.message || errData.error || 'API Internal Error');
    }

    const declaredSize = Number(response.headers.get('content-length') || 0);
    if (declaredSize > MAX_SIZE) {
        throw new Error('FILE_TOO_LARGE');
    }

    if (!response.body) {
        throw new Error('Empty audio response from Sasa API.');
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
    desc: 'Search songs and download MP3 with custom quality (128/320)',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    let fullInput = (args || []).join(' ').trim();

    if (!fullInput) {
        return reply(
            '🎧 *YouTube MP3 Downloader*\n\n' +
            'Song එකේ නම සමඟ quality එක ඇතුළත් කරන්න.\n' +
            'Example: *.mp3 Shape of You | 320*\n' +
            'Example: *.mp3 Shape of You | 128*'
        );
    }

    // පරිශීලකයා ලබා දුන් input එකෙන් quality එක වෙන් කර හඳුනා ගැනීම (| ලකුණ මඟින්)
    let query = fullInput;
    let quality = '128'; // Default quality එක 128kbps වේ

    if (fullInput.includes('|')) {
        const parts = fullInput.split('|');
        query = parts[0].trim();
        const extractedQuality = parts[1].trim();
        
        if (extractedQuality === '320' || extractedQuality === '128') {
            quality = extractedQuality;
        }
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

        const video = results; 

        await conn.sendMessage(from, {
            text:
                '╭━━〔 *ᴍᴘ3 ᴅᴏᴡɴʟᴏᴀᴅ* 〕━━╮\n' +
                `┃ 🔍 Title: ${video.title}\n` +
                `┃ 👤 Channel: ${video.author}\n` +
                `┃ 🕒 Duration: ${video.duration}\n` +
                `┃ 🎧 Quality: ${quality}kbps\n` +
                '┃ ⏳ Audio එක සකස් කරමින්...\n' +
                '╰━━━━━━━━━━━━━━━━━━╯\n' +
                FOOTER
        }, { quoted: mek });

        // පරිශීලකයා තෝරාගත් quality එක අනුව බාගත කිරීම
        const audio = await downloadAudioDirectly(video.url, quality);

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
