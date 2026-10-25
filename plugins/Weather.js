const { cmd } = require('../command');

const axios = require('axios');

const API_KEY = process.env.SASA_API_KEY ||
    'Sasa_Dev_Api_79346efacb553ec6ee94f2f6453dec8658ec5e7b';

const API_URL = 'https://sasa-dev-api.xyz/api/weather/forecast';

cmd({
    pattern: 'weather',
    alias: ['forecast', 'climate'],
    desc: 'Get weather forecast for a city',
    category: 'search',
    react: '🌦️',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(
                '🌦️ *THENUVA X MD WEATHER*\n\n' +
                '📍 Usage: .weather Colombo\n' +
                '📍 Usage: .weather Colombo 3\n\n' +
                '📝 Enter a city and forecast days (1–7).'
            );
        }

        const parts = q.trim().split(/\s+/);
        let days = 3;

        if (/^\d+$/.test(parts[parts.length - 1])) {
            days = Number(parts.pop());
        }

        const city = parts.join(' ').trim();

        if (!city) {
            return reply('❌ Please enter a city name.\nExample: .weather Colombo');
        }

        if (!Number.isInteger(days) || days < 1 || days > 7) {
            return reply('❌ Days must be between 1 and 7.');
        }

        await conn.sendMessage(from, {
            react: { text: '⏳', key: mek.key }
        });

        const response = await axios.get(API_URL, {
            params: {
                apikey: API_KEY,
                city,
                days
            },
            timeout: 20000
        });

        const data = response.data;

        if (data.status === false || data.error) {
            return reply(
                '❌ *Weather API Error*\n\n' +
                (data.error || 'Could not retrieve the forecast.')
            );
        }

        // Support common API response structures.
        const weather = data.data || data.forecast || data;

        let output =
            '╭━━〔 🌦️ *ᴡᴇᴀᴛʜᴇʀ ꜰᴏʀᴇᴄᴀꜱᴛ* 〕━━╮\n' +
            `┃ 📍 *City:* ${city}\n` +
            `┃ 📅 *Days:* ${days}\n` +
            '╰━━━━━━━━━━━━━━━━━━╯\n\n';

        if (Array.isArray(weather)) {
            output += weather.map((item, index) => {
                return (
                    `🌤️ *Day ${index + 1}*\n` +
                    JSON.stringify(item, null, 2)
                );
            }).join('\n\n');
        } else if (typeof weather === 'object' && weather !== null) {
            output += '```json\n' +
                JSON.stringify(weather, null, 2) +
                '\n```';
        } else {
            output += String(weather);
        }

        output += '\n\n> ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ';

        return reply(output);

    } catch (error) {
        console.error(
            'Weather plugin error:',
            error.response?.data || error.message
        );

        if (error.response?.status === 401) {
            return reply('❌ Invalid API key. Please check your SASA DEV API key.');
        }

        if (error.response?.status === 400) {
            return reply('❌ Invalid city or forecast request. Please check the city name.');
        }

        return reply(
            '❌ Could not get the weather forecast.\n' +
            'Please try again later.'
        );
    }
});
