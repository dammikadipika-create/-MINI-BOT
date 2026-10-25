const { cmd } = require('../command');
const axios = require('axios');

const API_KEY = process.env.SASA_API_KEY;

cmd({
    pattern: 'cinesubzdl',
    alias: ['csdl', 'cinesubtitle'],
    desc: 'Get CineSubz download information',
    category: 'download',
    react: '🎬',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(
                '╭─〔 *🎬 CINESUBZ DOWNLOAD* 〕\n' +
                '│\n' +
                '│ 📌 *Usage:* .cinesubzdl URL\n' +
                '│\n' +
                '│ Example:\n' +
                '│ .cinesubzdl https://example.com/movie\n' +
                '│\n' +
                '╰━━━━━━━━━━━━━━━━━━\n\n' +
                '> ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ'
            );
        }

        if (!API_KEY) {
            return reply('❌ SASA_API_KEY GitHub Secret එක set කරලා නැහැ.');
        }

        const url = q.trim();

        if (!/^https?:\/\/\S+$/i.test(url)) {
            return reply('❌ කරුණාකර නිවැරදි HTTP/HTTPS URL එකක් දෙන්න.');
        }

        await reply('⏳ *CineSubz API එක පරීක්ෂා කරමින්...*');

        const response = await axios.get(
            'https://sasa-dev-api.xyz/api/cinesubz/dl',
            {
                params: {
                    apikey: API_KEY,
                    url: url,
                    raw: false
                },
                timeout: 30000
            }
        );

        const data = response.data;

        if (!data || data.status === false || data.success === false) {
            return reply(
                '❌ *Request එක සාර්ථක වුණේ නැහැ.*\n\n' +
                'URL එක සහ API response එක පරීක්ෂා කරන්න.'
            );
        }

        let output = '╭─〔 *🎬 CINESUBZ RESULT* 〕\n';
        output += '│\n';

        if (typeof data === 'string') {
            output += data.slice(0, 3000);
        } else {
            const result = data.data || data.result || data;

            if (typeof result === 'string') {
                output += result.slice(0, 3000);
            } else {
                const title = result.title || result.name;
                const message = result.message || result.msg;
                const resultUrl = result.url || result.link;
                const downloadUrl = result.downloadUrl ||
                    result.download_url ||
                    result.download;

                if (title) output += `│ 🎞️ Title: ${title}\n`;
                if (message) output += `│ 📝 ${message}\n`;

                if (resultUrl && /^https?:\/\//i.test(resultUrl)) {
                    output += `│ 🔗 Link: ${resultUrl}\n`;
                }

                if (downloadUrl && /^https?:\/\//i.test(downloadUrl)) {
                    output += `│ 📥 Link: ${downloadUrl}\n`;
                }

                if (!title && !message && !resultUrl && !downloadUrl) {
                    output += JSON.stringify(data, null, 2).slice(0, 3000);
                }
            }
        }

        output += '\n╰━━━━━━━━━━━━━━━━━━\n';
        output += '> ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ';

        return reply(output);

    } catch (error) {
        console.error(
            'CineSubz DL Error:',
            error.response?.data || error.message
        );

        if (error.response?.status === 401 ||
            error.response?.status === 403) {
            return reply('❌ API key එක හෝ API access එක පරීක්ෂා කරන්න.');
        }

        if (error.response?.status === 400) {
            return reply(
                '❌ API request එක වැරදියි.\n' +
                'URL එක සහ අවශ්‍ය parameters පරීක්ෂා කරන්න.'
            );
        }

        return reply(
            '❌ CineSubz API එකෙන් response එක ලබාගන්න බැරි වුණා.\n' +
            'ටික වේලාවකින් නැවත උත්සාහ කරන්න.'
        );
    }
});
