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
                // API එක බලාපොරොත්තු වන සරලම YouTube URL හැඩතලයට සකස් කිරීම
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

// URL සහ Quality අගයන් Sasa API එකට ගැළපෙන සේ නිවැරදිව යවන ශ්‍රිතය
async function getAudioUrlFromApi(videoUrl, qualityValue) {
    const parsedQuality = parseInt(qualityValue, 10) || 128;
    
    // URL එකේ කිසිදු සංකේත දෝෂයක් නොවීමට encodeURIComponent නිවැරදිව භාවිතය
    const fullUrl = `${API_URL}?apikey=${API_KEY}&url=${encodeURIComponent(videoUrl)}&quality=${parsedQuality}&raw=false`;
    
    const response = await fetch(fullUrl, {
        method: 'GET',
        headers: { 
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[Sasa API Debug Header]', response.status, errorText);
        throw new Error(`Sasa API returned HTTP ${response.status}. Please check parameters.`);
    }

    const data = await response.json();
    
    // API එකෙන් එන download link එක වෙන්කර ගැනීම
    const downloadUrl = data.result?.download || data.result?.url || data.downloadUrl || data.url || (data.data && data.data.url);

    if (!downloadUrl || typeof downloadUrl !== 'string') {
        throw new Error(data.error || data.message || 'API did not return a valid download URL.');
    }

    return downloadUrl;
}

async function downloadAudio(url) {
    const response = await fetch(url, {
        headers: { 
            'Accept': 'audio/*, application/octet-stream, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT)
    });

    if (!response.ok) {
        throw new Error(`Audio hosting server returned HTTP ${response.status}`);
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

    return Buffer.concat(chunks);
}

cmd({
    pattern: 'mp3',
    alias: ['song', 'ytaudio', 'ytmp3'],
    react: '🎵',
    desc: 'Search songs and download MP3 cleanly',
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

        // 🟢 ඔබ ඉල්ලූ පරිදි "Download" බටන් එක සහිත නිල ආරක්ෂිත පණිවිඩය (Security Warning Card)
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
                    thumbnailUrl: 'https://ibb.co' 
                }
            }
        }, { quoted: mek });

        // URL දෝෂය සම්පූර්ණයෙන්ම මඟහැර API එකෙන් සබැඳිය ලබා ගැනීම
        const audioUrl = await getAudioUrlFromApi(video.url, quality);
        const audio = await downloadAudio(audioUrl);

        // WhatsApp වෙත සින්දුව සාර්ථකව යැවීම
        await conn.sendMessage(from, {
            audio,
            mimetype: 'audio/mpeg',
            fileName: `${cleanName(video.title)}.mp3`,
            ptt: false
        }, { quoted: mek });

    } catch (error) {
        console.error('[MP3 DOWNLOAD ERROR]', error);
        
        let reason = error.message;
        if (error.message.includes('400')) {
            reason = 'යූටියුබ් ලින්ක් එකේ ගැටලුවක් පවතී. කරුණාකර නැවත උත්සාහ කරන්න.';
        } else if (error.message === 'FILE_TOO_LARGE') {
            reason = 'Audio file එක 64 MB සීමාව ඉක්මවයි.';
        }

        await conn.sendMessage(from, {
            text: `❌ *MP3 Download Failed*\n${reason}\n\n${FOOTER}`
        }, { quoted: mek });
    } finally {
        activeDownloads.delete(from);
    }
});
