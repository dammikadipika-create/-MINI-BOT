const { cmd } = require('../command');

const API_KEY = process.env.SASA_API_KEY;
const API_URL = 'https://sasa-dev-api.xyz/api/nanobanana';

cmd({
    pattern: 'nanobanana',
    alias: ['nano', 'banana'],
    desc: 'Generate AI images',
    category: 'ai',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const prompt = q?.trim();

        if (!prompt) {
            return reply(
                '╭─〔 *ɴᴀɴᴏʙᴀɴᴀɴᴀ ᴀɪ* 〕\n' +
                '│\n' +
                '│ 🍌 AI Image Generator\n' +
                '│\n' +
                '│ Image එක විස්තර කරන්න.\n' +
                '│\n' +
                '│ උදා: .nanobanana A cute 3D cartoon baby\n' +
                '╰──────────────\n\n' +
                '> ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ'
            );
        }

        if (!API_KEY) {
            return reply('❌ SASA_API_KEY environment variable එක සකසා නැහැ.');
        }

        await reply(
            '╭─〔 *ɴᴀɴᴏʙᴀɴᴀɴᴀ ᴀɪ* 〕\n' +
            '│ 🍌 Image එක generate කරමින්...\n' +
            '│ ⏳ කරුණාකර රැඳී සිටින්න.\n' +
            '╰──────────────'
        );

        const apiUrl = new URL(API_URL);
        apiUrl.searchParams.set('apikey', API_KEY);
        apiUrl.searchParams.set('p', prompt);
        apiUrl.searchParams.set('size', '1024x1024');

        const response = await fetch(apiUrl.toString(), {
            headers: { Accept: 'application/json, image/*' },
            signal: AbortSignal.timeout(120000)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('NanoBanana API Error:', response.status, errorText);

            return reply(`❌ API Error: HTTP ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';

        let imageBuffer;
        let imageUrl;

        if (contentType.startsWith('image/')) {
            imageBuffer = Buffer.from(await response.arrayBuffer());
        } else {
            const data = await response.json();

            if (
                data.status === false ||
                data.success === false ||
                data.error
            ) {
                return reply(
                    `❌ Image generate වුණේ නැහැ.\n${data.message || data.error || 'API error'}`
                );
            }

            imageUrl =
                data.result?.url ||
                data.result?.image ||
                data.result?.imageUrl ||
                data.result?.output ||
                data.imageUrl ||
                data.image ||
                data.url ||
                data.data?.url ||
                data.data?.image ||
                data.data?.imageUrl ||
                data.data?.output ||
                '';

            if (!imageUrl) {
                console.log('NanoBanana API response:', JSON.stringify(data));

                return reply(
                    '❌ API response එකේ image URL එක හමු වුණේ නැහැ.\n' +
                    'සැබෑ JSON response එක පරීක්ෂා කරන්න.'
                );
            }

            const parsedUrl = new URL(imageUrl);

            if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
                return reply('❌ Image URL එක වලංගු නැහැ.');
            }

            const imageResponse = await fetch(parsedUrl.toString(), {
                signal: AbortSignal.timeout(60000)
            });

            if (!imageResponse.ok) {
                return reply('❌ Generated image එක download කරන්න බැරි වුණා.');
            }

            const imageType = imageResponse.headers.get('content-type') || '';

            if (!imageType.startsWith('image/')) {
                return reply('❌ API එකෙන් image file එකක් ලැබුණේ නැහැ.');
            }

            imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        }

        if (!imageBuffer || imageBuffer.length === 0) {
            return reply('❌ Image file එක හිස්.');
        }

        return await conn.sendMessage(
            from,
            {
                image: imageBuffer,
                caption:
                    '╭━━〔 *ɴᴀɴᴏʙᴀɴᴀɴᴀ ᴀɪ* 〕━━╮\n' +
                    '┃ 🍌 AI Image Generated!\n' +
                    '┃\n' +
                    `┃ ✍️ Prompt: ${prompt}\n` +
                    '┃ 🖼️ Size: 1024x1024\n' +
                    '╰━━━━━━━━━━━━━━━━╯\n\n' +
                    '> ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ'
            },
            { quoted: mek }
        );

    } catch (error) {
        console.error('NanoBanana Plugin Error:', error);

        return reply(
            '❌ Image generate කිරීමේදී දෝෂයක් ඇති වුණා.\n' +
            'API එක වැඩ කරනවාදැයි පරීක්ෂා කර නැවත උත්සාහ කරන්න.\n\n' +
            '> ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ'
        );
    }
});
