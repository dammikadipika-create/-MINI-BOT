const axios = require('axios')
const { cmd } = require('../command')

const API_URL = 'https://sasa-dev-api.xyz/api/slmixlk/download'
const API_KEY = process.env.SASA_API_KEY

function findMediaUrl(data) {
    if (!data || typeof data !== 'object') return null

    const keys = [
        'download_url',
        'downloadUrl',
        'video_url',
        'videoUrl',
        'audio_url',
        'audioUrl',
        'media_url',
        'mediaUrl',
        'url',
        'link'
    ]

    for (const key of keys) {
        const value = data[key]

        if (
            typeof value === 'string' &&
            /^https?:\/\//i.test(value) &&
            !value.includes('sasa-dev-api.xyz/api/slmixlk/download')
        ) {
            return value
        }
    }

    for (const value of Object.values(data)) {
        if (value && typeof value === 'object') {
            const result = findMediaUrl(value)
            if (result) return result
        }
    }

    return null
}

cmd({
    pattern: 'slmixlk',
    alias: ['slmix', 'slmixdl'],
    react: '⬇️',
    desc: 'Download media from SLmixLK',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        const input = args.join(' ').trim()

        if (!input) {
            return reply(
                '❌ *SLmixLK DOWNLOADER*\n\n' +
                'භාවිතය:\n.slmixlk SLmixLK_LINK'
            )
        }

        if (!API_KEY) {
            return reply(
                '❌ SASA_API_KEY GitHub Secret එක සකසා නැහැ.'
            )
        }

        if (!/^https?:\/\//i.test(input)) {
            return reply('❌ නිවැරදි SLmixLK link එකක් ලබා දෙන්න.')
        }

        const response = await axios.get(API_URL, {
            params: {
                apikey: API_KEY,
                url: input
            },
            timeout: 60000
        })

        const data = response.data

        if (
            data?.status === false ||
            data?.success === false ||
            data?.error
        ) {
            return reply(
                '❌ Download කරන්න බැරි වුණා.\n' +
                (data.error || data.message || 'API එකෙන් error එකක් ලැබුණා.')
            )
        }

        const mediaUrl = findMediaUrl(data)

        if (!mediaUrl) {
            console.log(
                '[SLmixLK API response]',
                JSON.stringify(data).slice(0, 4000)
            )

            return reply(
                '❌ API response එකෙන් download link එක හඳුනාගන්න බැරි වුණා. ' +
                'GitHub Actions logs පරීක්ෂා කරන්න.'
            )
        }

        const mediaResponse = await axios.get(mediaUrl, {
            responseType: 'arraybuffer',
            timeout: 120000,
            maxContentLength: 100 * 1024 * 1024,
            maxBodyLength: 100 * 1024 * 1024
        })

        const buffer = Buffer.from(mediaResponse.data)
        const contentType = String(
            mediaResponse.headers['content-type'] || ''
        ).toLowerCase()

        if (contentType.includes('json') || contentType.includes('text/html')) {
            return reply(
                '❌ API එකෙන් media file එක වෙනුවට webpage එකක් ලැබුණා.'
            )
        }

        const caption = '╭─〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕─●●►\n' +
            '│ ✅ SLmixLK Download Complete\n' +
            '╰───────────────────►'

        if (contentType.startsWith('video/')) {
            await conn.sendMessage(from, {
                video: buffer,
                mimetype: contentType,
                caption
            }, { quoted: mek })
        } else if (contentType.startsWith('audio/')) {
            await conn.sendMessage(from, {
                audio: buffer,
                mimetype: contentType,
                fileName: 'slmixlk-audio.mp3'
            }, { quoted: mek })
        } else if (contentType.startsWith('image/')) {
            await conn.sendMessage(from, {
                image: buffer,
                mimetype: contentType,
                caption
            }, { quoted: mek })
        } else {
            await conn.sendMessage(from, {
                document: buffer,
                mimetype: contentType || 'application/octet-stream',
                fileName: 'slmixlk-download',
                caption
            }, { quoted: mek })
        }

    } catch (error) {
        console.error(
            '[SLmixLK Downloader Error]',
            error.response?.data || error.message
        )

        return reply(
            '❌ Download අසාර්ථකයි.\n' +
            'Link එක සහ API එක පරීක්ෂා කර නැවත උත්සාහ කරන්න.'
        )
    }
})
