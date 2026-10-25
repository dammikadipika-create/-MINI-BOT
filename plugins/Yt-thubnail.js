const { cmd } = require('../command');

const API_KEY = process.env.SASA_API_KEY;
const API_URL = 'https://sasa-dev-api.xyz/api/yt/thumbnail-dl';

cmd({
    pattern: 'thumbnail',
    alias: ['ytthumb', 'thumb'],
    desc: 'Download YouTube thumbnail',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const input = q?.trim();

        if (!input) {
            return reply(
                '╭─〔 *ʏᴛ ᴛʜᴜᴍʙɴᴀɪʟ* 〕\n' +
                '│\n' +
                '│ ❌ YouTube URL එකක් දෙන්න.\n' +
                '│\n' +
                '│ උදා: .thumbnail https://youtu.be/VIDEO_ID\n' +
                '╰──────────────\n\n' +
                '> ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ'
            );
        }

        if (!API_KEY) {
            return reply('❌ SASA_API_KEY එක සකසා නැහැ.');
        }

        let videoUrl;

        try {
            videoUrl = new URL(input);

            const allowedHosts = [
                'youtube.com',
                'www.youtube.com',
                'm.youtube.com',
                'youtu.be',
                'www.youtu.be',
                'youtube-nocookie.com',
                'www.youtube-nocookie.com'
            ];

            if (
                !['https:', 'http:'].includes(videoUrl.protocol) ||
                !allowedHosts.includes(videoUrl.hostname)
            ) {
                return reply('❌ නිවැරදි YouTube URL එකක් ලබා දෙන්න.');
            }
        } catch {
            return reply('❌ URL එක නිවැරදි නැහැ.');
        }

        const apiUrl = new URL(API_URL);
        apiUrl.searchParams.set('apikey', API_KEY);
        apiUrl.searchParams.set('url', videoUrl.toString());
        apiUrl.searchParams.set('quality', 'maxresdefault');
        apiUrl.searchParams.set('raw', 'false');

        const response = await fetch(apiUrl.toString(), {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(30000)
        });

        const contentType = response.headers.get('content-type') || '';

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Thumbnail API Error:', response.status, errorText);

            return reply(
                `❌ API Error: HTTP ${response.status}\n\n` +
                '> ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ'
            );
        }

        // API එක image එකක් කෙළින්ම ලබා දෙනවා නම්
        if (contentType.startsWith('image/')) {
            const imageBuffer = Buffer.from(
                await response.arrayBuffer()
            );

            return await conn.sendMessage(
                from,
                {
                    image: imageBuffer,
                    caption:
                        '╭─〔 *ʏᴏᴜᴛᴜʙᴇ ᴛʜᴜᴍʙɴᴀɪʟ* 〕\n' +
                        '│ ✅ Thumbnail ලබාගත්තා!\n' +
                        '╰──────────────\n\n' +
                        '> ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ'
                },
                { quoted: mek }
            );
        }

        const data = await response.json();

        if (
            data.status === false ||
            data.success === false ||
            data.error
        ) {
            return reply(
                `❌ ${data.message || data.error || 'Thumbnail ලබාගැනීමට නොහැකියි.'}`
            );
        }

        const imageUrl =
            data.thumbnail ||
            data.thumbnailUrl ||
            data.image ||
            data.imageUrl ||
            data.downloadUrl ||
            data.result?.url ||
            data.data?.thumbnail ||
            data.data?.thumbnailUrl ||
            data.data?.image ||
            data.data?.imageUrl ||
            data.data?.url ||
            '';

        if (!imageUrl) {
            console.log('Thumbnail API response:', JSON.stringify(data));

            return reply(
                '❌ Thumbnail URL එක response එකෙන් හමු වුණේ නැහැ.\n' +
                'API response format එක පරීක්ෂා කරන්න.'
            );
        }

        const parsedImageUrl = new URL(imageUrl);

        if (!['https:', 'http:'].includes(parsedImageUrl.protocol)) {
            return reply('❌ API එකෙන් ලැබුණු image URL එක වලංගු නැහැ.');
        }

        return await conn.sendMessage(
            from,
            {
                image: { url: parsedImageUrl.toString() },
                caption:
                    '╭━━〔 *ʏᴛ ᴛʜᴜᴍʙɴᴀɪʟ* 〕━━╮\n' +
                    '┃ ✅ Thumbnail Ready!\n' +
                    '┃ 🎬 YouTube Thumbnail\n' +
                    '╰━━━━━━━━━━━━━━━━╯\n\n' +
                    '> ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ'
            },
            { quoted: mek }
        );

    } catch (error) {
        console.error('Thumbnail Plugin Error:', error);

        return reply(
            '❌ Thumbnail ලබාගැනීමේදී දෝෂයක් ඇති වුණා.\n' +
            'URL එක පරීක්ෂා කර නැවත උත්සාහ කරන්න.\n\n' +
            '> ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ'
        );
    }
});
