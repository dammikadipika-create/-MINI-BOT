// DARK-DILA MD — Currency Converter
// API: SASA DEV API

const axios = require('axios');
const { cmd } = require('../command');

const API_URL = 'https://sasa-dev-api.xyz/api/currency';

const API_KEY = process.env.SASA_API_KEY ||
    'Sasa_Dev_Api_79346efacb553ec6ee94f2f6453dec8658ec5e7b';

const FOOTER =
    'ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ';

cmd({
    pattern: 'currency',
    alias: ['convert', 'exchange', 'rate'],
    react: '💱',
    desc: 'Convert currencies',
    category: 'tools',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(
                '╭━━〔 *ᴄᴜʀʀᴇɴᴄʏ ᴄᴏɴᴠᴇʀᴛᴇʀ* 〕━━╮\n' +
                '┃\n' +
                '┃ 💱 *Usage:*\n' +
                '┃ .currency 100 USD LKR\n' +
                '┃ .currency 50 EUR USD\n' +
                '┃ .currency 1000 LKR INR\n' +
                '┃\n' +
                '┃ 🌍 Enter the amount and currency codes.\n' +
                '╰━━━━━━━━━━━━━━━━━━━━╯\n\n' +
                `> ${FOOTER}`
            );
        }

        const args = q.trim().split(/\s+/);

        if (
            args.length !== 3 ||
            !Number.isFinite(Number(args[0])) ||
            Number(args[0]) <= 0
        ) {
            return reply(
                '❌ *Invalid Format!*\n\n' +
                'Example:\n' +
                '.currency 100 USD LKR\n\n' +
                `> ${FOOTER}`
            );
        }

        const amount = Number(args[0]);
        const fromCurrency = args[1].toUpperCase();
        const toCurrency = args[2].toUpperCase();

        if (
            !/^[A-Z]{3}$/.test(fromCurrency) ||
            !/^[A-Z]{3}$/.test(toCurrency)
        ) {
            return reply(
                '❌ Use valid 3-letter currency codes.\n\n' +
                'Example: .currency 100 USD LKR'
            );
        }

        await reply('⏳ *Checking exchange rates...*');

        const response = await axios.get(API_URL, {
            params: {
                apikey: API_KEY,
                from: fromCurrency,
                to: toCurrency,
                amount: amount
            },
            timeout: 30000
        });

        const data = response.data;

        if (
            !data ||
            data.status === false ||
            data.error
        ) {
            return reply(
                '❌ *Currency Conversion Failed!*\n\n' +
                `${data?.error || 'Unable to convert this currency.'}\n\n` +
                `> ${FOOTER}`
            );
        }

        console.log(
            '[DARK-DILA MD Currency API]',
            JSON.stringify(data)
        );

        const result = data.result || data.data || data;

        const converted =
            result.convertedAmount ??
            result.converted_amount ??
            result.conversion_result ??
            result.converted ??
            result.result;

        const rate =
            result.rate ??
            result.exchangeRate ??
            result.exchange_rate;

        if (
            converted === undefined ||
            converted === null ||
            typeof converted === 'object'
        ) {
            return reply(
                '⚠️ *Unexpected API Response!*\n\n' +
                'The API response format needs to be checked.\n' +
                'Check the GitHub Actions logs for the response.\n\n' +
                `> ${FOOTER}`
            );
        }

        let message =
            '╭━━〔 *ᴄᴜʀʀᴇɴᴄʏ ʀᴇsᴜʟᴛ* 〕━━╮\n' +
            '┃\n' +
            `┃ 💰 Amount: ${amount} ${fromCurrency}\n` +
            `┃ 💱 Result: ${converted} ${toCurrency}\n`;

        if (rate !== undefined && rate !== null) {
            message += `┃ 📊 Exchange Rate: ${rate}\n`;
        }

        message +=
            '┃\n' +
            '╰━━━━━━━━━━━━━━━━━━━━╯\n\n' +
            `> ${FOOTER}`;

        return reply(message);

    } catch (error) {
        console.error(
            '[DARK-DILA MD Currency Error]',
            error.response?.data || error.message
        );

        let errorMessage = 'Unable to contact the currency API.';

        if (error.response?.status === 401) {
            errorMessage = 'Invalid API key.';
        } else if (error.response?.status === 429) {
            errorMessage = 'API request limit reached. Try again later.';
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'API request timed out. Please try again.';
        }

        return reply(
            `❌ *${errorMessage}*\n\n> ${FOOTER}`
        );
    }
});
