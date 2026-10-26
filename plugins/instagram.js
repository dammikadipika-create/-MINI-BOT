const axios = require('axios')
const { cmd } = require('../command')

const API_URL = 'https://sasa-dev-api.xyz/api/instagram/dl'

const FOOTER =
    'ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ'

cmd({
    pattern: 'instagram',
    alias: ['ig', 'igdl', 'insta'],
    react: '📸',
    desc: 'Download Instagram photos and videos',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const url = q ? q.trim() : ''

        if (!url) {
            return reply(
                '╭━━〔 📸 INSTAGRAM DOWNLOADER 〕━━╮\n' +
                '┃\n' +
                '┃ ❖ භාවිතය:\n' +
                '┃ .instagram Instagram_Link\n' +
                '┃\n' +
                '┃ ❖ උදාහරණය:\n' +
                '┃ .ig https://www.instagram.com/reel/...\n' +
                '┃\n' +
                '╰━━━━━━━━━━━━━━━━━━━━╯\n\n' +
                FOOTER
            )
        }

        if (!/^https?:\/\/(www\.)?instagram\.com\//i.test(url)) {
            return reply('❌ වලංගු Instagram link එකක් ලබා දෙන්න.')
        }

        const apiKey = process.env.SASA_API_KEY

        if (!apiKey) {
            return reply(
                '❌ SASA_API_KEY එක සකස් කර නැහැ.\n\n' +
                'GitHub Secrets වල SASA_API_KEY එක එකතු කරන්න.'
            )
        }

        await reply('⏳ Instagram media එක ලබාගනිමින් පවතී...')

        const response = await axios.get(API_URL, {
            params: {
                apikey: apiKey,
                url: url,
                raw: 'false'
            },
            timeout: 60000
        })

        const data = response.data

        if (
            !data ||
            data.status === false ||
            data.error
        ) {
            console.error('Instagram API Error:', data)

            return reply(
                '❌ Instagram download එක අසාර්ථකයි.\n' +
                'Link එක පරීක්ෂා කර නැවත උත්සාහ කරන්න.'
            )
        }

        // Extract media links from common API response formats
        const mediaUrls = []

        function extractMedia(obj) {
            if (!obj) return

            if (typeof obj === 'string') {
                if (
                    /^https?:\/\//i.test(obj) &&
                    /\.(mp4|m4v|mov|jpg|jpeg|png|webp)(\?.*)?$/i.test(obj)
                ) {
                    mediaUrls.push(obj)
                }
                return
            }

            if (Array.isArray(obj)) {
                for (const item of obj) {
                    extractMedia(item)
                }
                return
            }

            if (typeof obj === 'object') {
                for (const [key, value] of Object.entries(obj)) {
                    const mediaKey =
                        /^(url|downloadurl|download_url|videourl|video_url|imageurl|image_url|link|src)$/i.test(key)

                    if (
                        mediaKey &&
                        typeof value === 'string' &&
                        /^https?:\/\//i.test(value)
                    ) {
                        mediaUrls.push(value)
                    } else if (
                        value &&
                        typeof value === 'object'
                    ) {
                        extractMedia(value)
                    }
                }
            }
        }

        extractMedia(data)

        const uniqueUrls = [...new Set(mediaUrls)]

        if (uniqueUrls.length === 0) {
            console.error(
                'Instagram API response format:',
                JSON.stringify(data).slice(0, 3000)
            )

            return reply(
                '⚠️ API එකෙන් media link එකක් හඳුනාගන්න බැරි වුණා.\n\n' +
                'SASA API response format එක පරීක්ෂා කළ යුතුයි.'
            )
        }

        for (const mediaUrl of uniqueUrls.slice(0, 5)) {
            const isImage =
                /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(mediaUrl)

            const caption =
                (isImage ? '📸' : '🎬') +
                ' *INSTAGRAM DOWNLOADED*\n\n' +
                FOOTER

            if (isImage) {
                await conn.sendMessage(
                    from,
                    {
                        image: { url: mediaUrl },
                        caption
                    },
                    { quoted: mek }
                )
            } else {
                await conn.sendMessage(
                    from,
                    {
                        video: { url: mediaUrl },
                        caption
                    },
                    { quoted: mek }
                )
            }
        }
    } catch (error) {
        console.error(
            'Instagram Downloader Error:',
            error.response?.data || error.message
        )

        if (error.response?.status === 401) {
            return reply('❌ API key එක වැරදියි. SASA API key එක පරීක්ෂා කරන්න.')
        }

        if (error.code === 'ECONNABORTED') {
            return reply('⏳ API එකෙන් ප්‍රතිචාර ලැබීමට වැඩි කාලයක් ගත වෙනවා. නැවත උත්සාහ කරන්න.')
        }

        return reply(
            '❌ Instagram download කිරීමේදී දෝෂයක් ඇතිවුණා.\n\n' +
            FOOTER
        )
    }
})
