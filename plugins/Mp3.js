const { cmd } = require('../command');
const yts = require('yt-search');

const API_KEY = 'Sasa_Dev_Api_79346efacb553ec6ee94f2f6453dec8658ec5e7b';
const API_URL = 'https://sasa-dev-api.xyz';
const MAX_SIZE = 64 * 1024 * 1024;
const TIMEOUT = 300000;
const FOOTER = '> ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇഡ് ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ';

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

async function getAudioUrlFromApi(videoUrl, quality) {
    const fullUrl = `${API_URL}?apikey=${API_KEY}&url=${encodeURIComponent(videoUrl)}&quality=${quality}&raw=false`;
    
    const response = await fetch(fullUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT)
    });

    if (!response.ok) {
        throw new Error(`Sasa API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const downloadUrl = data.result?.download || data.result?.url || data.downloadUrl || data.url;

    if (!downloadUrl || typeof downloadUrl !== 'string') {
        throw new Error(data.message || data.error || 'API did not return a valid download URL.');
    }

    return downloadUrl;
}

async function downloadAudio(url) {
    const response = await fetch(url, {
        headers: { Accept: 'audio/*, application/octet-stream, */*' },
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT)
    });

    if (!response.ok) {
        throw new Error(`Audio hosting server returned HTTP ${response.status}`);
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (
        contentType.includes('text/html') ||
        contentType.startsWith('text/') ||
        contentType.includes('application/json')
    ) {
        throw new Error('Download server returned an invalid content type instead of audio.');
    }

    const declaredSize = Number(response.headers.get('content-length') || 0);
    if (declaredSize > MAX_SIZE) {
        throw new Error('FILE_TOO_LARGE');
    }

    if (!response.body) {
        throw new Error('Empty audio response body.');
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
    return audio;
}

cmd({
    pattern: 'mp3',
    alias: ['song', 'ytaudio', 'ytmp3'],
    react: '🎵',
    desc: 'Search songs and download MP3 with dynamic verification template',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    let fullInput = (args || []).join(' ').trim();

    if (!fullInput) {
        return reply(
            '🎧 *YouTube MP3 Downloader*\n\n' +
            'Song එකේ නම සමඟ quality එක ඇතුළත් කරන්න.\n' +
            'Example: *.mp3 Shape of You | 320*'
        );
    }

    let query = fullInput;
    let quality = '128'; 

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

        const video = results[0]; 

        // 🟢 ඔබ ඉල්ලූ පරිදි WhatsApp Security Card එක සහ කොළ පාට බටන් එක සෘජුවම නිර්මාණය කර යැවීම:
        await conn.sendMessage(from, {
            text: `*WhatsApp can't verify the security of this media. Only download if you trust the sender.*`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                externalAdReply: {
                    title: `📥 NIKKA-X-MD DOWNLOAD ENGINE`,
                    body: `🎵 Downloading: ${video.title}\n🕒 Duration: ${video.duration}`,
                    mediaType: 2,
                    sourceUrl: video.url,
                    mediaUrl: video.url,
                    // බෝට්ටුවේ ලෝගෝ එක හෝ යූටියුබ් තම්බ්නෙල් එක මෙතැනට දිය හැක
                    thumbnailUrl: 'https://ibb.co' 
                }
            }
        }, { quoted: mek });

        // API ක්‍රියාවලිය සිදුවේ
        const audioUrl = await getAudioUrlFromApi(video.url, quality);
        const audio = await downloadAudio(audioUrl);

        // සින්දුව WhatsApp එකට ලබා දීම
        await conn.sendMessage(from, {
            audio,
            mimetype: 'audio/mpeg',
            fileName: `${cleanName(video.title)}.mp3`,
            ptt: false
        }, { quoted: mek });

    } catch (error) {
        console.error('[MP3 DOWNLOAD ERROR]', error);
        await conn.sendMessage(from, {
            text: `❌ *MP3 Download Failed*\n${error.message}\n\n${FOOTER}`
        }, { quoted: mek });
    } finally {
        activeDownloads.delete(from);
    }
});
