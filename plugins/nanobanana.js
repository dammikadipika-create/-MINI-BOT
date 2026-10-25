const { cmd } = require('../command');

const API_KEY = process.env.SASA_API_KEY;
const API_URL = 'https://sasa-dev-api.xyz/api/nanobanana';

const sleep = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

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
                '│ 🍌 AI Image Generator\n' +
                '│\n' +
                '│ උදා: .nanobanana A cute cartoon baby\n' +
                '╰──────────────\n\n' +
                '> ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ'
            );
        }

        if (!API_KEY) {
            return reply(
                '❌ SASA_API_KEY GitHub Secret එක සකසා නැහැ.'
            );
        }

        const apiUrl = new URL(API_URL);
        apiUrl.searchParams.set('apikey', API_KEY);
        apiUrl.searchParams.set('p', prompt);
        apiUrl.searchParams.set('size', '1024x1024');

        await reply(
            '╭─〔 *ɴᴀɴᴏʙᴀɴᴀɴᴀ ᴀɪ* 〕\n' +
            '│ 🍌 Image එක generate කරමින්...\n' +
            '│ ⏳ කරුණාකර රැඳී සිටින්න.\n' +
            '╰──────────────'
        );

        let response;

        // Retry temporary server errors (503, 502, 504)
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                response = await fetch(apiUrl.toString(), {
                    headers: {
                        Accept: 'application/json, image/*'
                    },
                    signal: AbortSignal.timeout(90000)
                });

                if (
                    response.ok ||
                    ![502, 503, 504].includes(response.status)
                ) {
                    break;
                }

                await response.arrayBuffer().catch(() => {});

                if (attempt < 3) {
                    await sleep(attempt * 2000);
                }
            } catch (error) {
                if (attempt === 3) throw error;
                await sleep(attempt * 2000);
            }
        }

        if (!response) {
            throw new Error('API server එකෙන් response එකක් ලැබුණේ නැහැ.');
        }

        if (!response.ok) {
            const status = response.status;

            console.error('NanoBanana API HTTP Error:', status);

            if ([502, 503, 504].includes(status)) {
                return reply(
                    '╭─〔 *ɴᴀɴᴏʙᴀɴᴀɴᴀ ᴀɪ* 〕\n' +
                    '│ ⚠️ API server එක දැනට අක්‍රියයි.\n' +
                    `│ HTTP Error: ${status}\n` +
                    '│\n' +
                    '│ ටික වේලාවකින් නැවත උත්සාහ කරන්න.\n' +
                    '╰──────────────\n\n' +
                    '> ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ'
                );
            }

            const errorText = await response.text();
            console.error('API error details:', errorText.slice(0, 500));

            return reply(
                `❌ NanoBanana API Error: HTTP ${status}\n\n` +
                '> ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ'
            );
        }

        const contentType =
            response.headers.get('content-type') || '';

        let imageBuffer;

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
                    `❌ ${data.message || data.error || 'Image generation failed.'}`
                );
            }

            const imageUrl =
                data.result?.url ||
                data.result?.imageUrl ||
                data.result?.image ||
                data.result?.output ||
                data.data?.url ||
                data.data?.imageUrl ||
                data.data?.image ||
                data.imageUrl ||
                data.image ||
                data.url;

            if (!imageUrl) {
                console.error(
                    'NanoBanana response:',
                    JSON.stringify(data).slice(0, 2000)
                );

                return reply(
                    '❌ API response එකේ image URL එක හමු වුණේ නැහැ.'
                );
            }

            const parsedUrl = new URL(imageUrl);

            if (
                !['https:', 'http:'].includes(parsedUrl.protocol) ||
                !parsedUrl.hostname
            ) {
                return reply('❌ API image URL එක වලංගු නැහැ.');
            }

            const imageResponse = await fetch(parsedUrl.toString(), {
                signal: AbortSignal.timeout(60000)
            });

            if (!imageResponse.ok) {
                return reply(
                    `❌ Image download error: HTTP ${imageResponse.status}`
                );
            }

            const imageType =
                imageResponse.headers.get('content-type') || '';

            if (!imageType.startsWith('image/')) {
                return reply(
                    '❌ API එකෙන් image file එකක් ලැබුණේ නැහැ.'
                );
            }

            imageBuffer = Buffer.from(
                await imageResponse.arrayBuffer()
            );
        }

        if (!imageBuffer?.length) {
            return reply('❌ ලැබුණු image file එක හිස්.');
        }

        return await conn.sendMessage(
            from,
            {
                image: imageBuffer,
                caption:
                    '╭━━〔 *ɴᴀɴᴏʙᴀɴᴀɴᴀ ᴀɪ* 〕━━╮\n' +
                    '┃ ✅ AI Image Generated!\n' +
                    '┃\n' +
                    `┃ ✍️ Prompt: ${prompt}\n` +
                    '╰━━━━━━━━━━━━━━━━╯\n\n' +
                    '> ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ'
            },
            { quoted: mek }
        );

    } catch (error) {
        console.error('NanoBanana Plugin Error:', error);

        return reply(
            '❌ NanoBanana API එකට සම්බන්ධ වීම අසාර්ථකයි.\n' +
            'API server එක ක්‍රියාත්මකදැයි පරීක්ෂා කර නැවත උත්සාහ කරන්න.\n\n' +
            '> ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ'
        );
    }
});
