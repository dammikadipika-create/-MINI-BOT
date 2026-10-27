const { cmd, commands } = require('../command');

const BOT_NAME = 'ɴɪᴋᴋᴀ x ᴍᴅ';
const FOOTER = 'ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ';

const categoryInfo = {
    main: { title: 'ᴍᴀɪɴ ᴍᴇɴᴜ', emoji: '🏠' },
    owner: { title: 'ᴏᴡɴᴇʀ ᴍᴇɴᴜ', emoji: '👑' },
    download: { title: 'ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ', emoji: '📥' },
    downloads: { title: 'ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ', emoji: '📥' },
    search: { title: 'sᴇᴀʀᴄʜ ᴍᴇɴᴜ', emoji: '🔎' },
    group: { title: 'ɢʀᴏᴜᴘ ᴍᴇɴᴜ', emoji: '👥' },
    admin: { title: 'ᴀᴅᴍɪɴ ᴍᴇɴᴜ', emoji: '🛡️' },
    tools: { title: 'ᴛᴏᴏʟs ᴍᴇɴᴜ', emoji: '🧰' },
    ai: { title: 'ᴀɪ ᴍᴇɴᴜ', emoji: '🤖' },
    fun: { title: 'ғᴜɴ ᴍᴇɴᴜ', emoji: '🎭' },
    convert: { title: 'ᴄᴏɴᴠᴇʀᴛ ᴍᴇɴᴜ', emoji: '🔄' },
    other: { title: 'ᴏᴛʜᴇʀ ᴍᴇɴᴜ', emoji: '📌' }
};

// Automatically choose an emoji for new categories too
function getCategoryInfo(category) {
    const key = String(category || 'other').toLowerCase();

    if (categoryInfo[key]) {
        return categoryInfo[key];
    }

    let emoji = '📂';

    if (/owner|sudo|creator/.test(key)) emoji = '👑';
    else if (/download|media|video|music|song/.test(key)) emoji = '📥';
    else if (/search|find|google|wiki/.test(key)) emoji = '🔎';
    else if (/group|member/.test(key)) emoji = '👥';
    else if (/admin|moderation/.test(key)) emoji = '🛡️';
    else if (/tool|utility|tools/.test(key)) emoji = '🧰';
    else if (/ai|gpt|artificial/.test(key)) emoji = '🤖';
    else if (/fun|game|joke/.test(key)) emoji = '🎭';
    else if (/convert|sticker|image/.test(key)) emoji = '🔄';
    else if (/main|general|home/.test(key)) emoji = '🏠';

    return {
        title: `${key.replace(/[-_]/g, ' ').toUpperCase()} MENU`,
        emoji
    };
}

// Choose a command emoji automatically
function getCommandEmoji(command, categoryEmoji) {
    // Use the command's own reaction emoji when available
    if (command.react && typeof command.react === 'string') {
        return command.react;
    }

    const pattern = String(command.pattern || '').toLowerCase();
    const description = String(command.desc || '').toLowerCase();
    const text = `${pattern} ${description}`;

    if (/song|mp3|audio|music/.test(text)) return '🎵';
    if (/video|mp4|youtube|ytmp4/.test(text)) return '🎬';
    if (/download|dl\b/.test(text)) return '📥';
    if (/sticker|toimg|photo|image/.test(text)) return '🖼️';
    if (/owner|sudo|broadcast|restart|update/.test(text)) return '👑';
    if (/group|kick|add|promote|demote/.test(text)) return '👥';
    if (/admin|ban|mute|unmute|delete/.test(text)) return '🛡️';
    if (/search|google|wiki|weather/.test(text)) return '🔎';
    if (/ai|gpt|chatbot|ask/.test(text)) return '🤖';
    if (/ping|alive|status|uptime/.test(text)) return '⚡';
    if (/sticker|convert|toaudio|tovideo/.test(text)) return '🔄';

    return categoryEmoji || '✨';
}

cmd(
    {
        pattern: 'menu',
        alias: ['help', 'commands'],
        desc: 'Displays all commands by category',
        category: 'main',
        filename: __filename
    },
    async (danuwa, mek, m, { from, reply, pushName }) => {
        try {
            const categories = {};
            const seenCommands = new Set();

            // Collect registered commands automatically
            const commandEntries = Object.values(commands);

            for (const data of commandEntries) {
                if (!data || !data.pattern) continue;

                const pattern = String(data.pattern).trim();
                if (!pattern) continue;

                // Prevent duplicate commands
                const uniqueKey = pattern.toLowerCase();

                if (seenCommands.has(uniqueKey)) continue;
                seenCommands.add(uniqueKey);

                const category = String(
                    data.category || 'other'
                ).toLowerCase();

                if (!categories[category]) {
                    categories[category] = [];
                }

                const info = getCategoryInfo(category);

                categories[category].push({
                    pattern,
                    desc: data.desc || 'No description',
                    emoji: getCommandEmoji(data, info.emoji)
                });
            }

            const totalCommands = Object.values(categories)
                .reduce((total, list) => total + list.length, 0);

            const categoryCount = Object.keys(categories).length;

            let menuText = `
╭━━〔 *${BOT_NAME}* 〕━━╮
┃
┃ 👋 ʜᴇʟʟᴏ: ${pushName || 'User'}
┃ 🤖 ʙᴏᴛ: ${BOT_NAME}
┃ 📚 ᴄᴏᴍᴍᴀɴᴅs: ${totalCommands}
┃ 📂 ᴄᴀᴛᴇɢᴏʀɪᴇs: ${categoryCount}
┃ 🔰 ᴘʀᴇғɪx: .
┃
╰━━━━━━━━━━━━━━━━━━╯

`;

            // Sort categories alphabetically
            const sortedCategories = Object.keys(categories).sort();

            for (const category of sortedCategories) {
                const info = getCategoryInfo(category);
                const list = categories[category];

                // Sort commands alphabetically
                list.sort((a, b) =>
                    a.pattern.localeCompare(b.pattern)
                );

                menuText += `
╭━━〔 ${info.emoji} *${info.title}* 〕━━
┃
`;

                for (const command of list) {
                    menuText += `┃ ${command.emoji} .${command.pattern}\n`;
                    menuText += `┃   └ ${command.desc}\n`;
                }

                menuText += `┃\n╰━━━━━━━━━━━━━━━━━━╯\n\n`;
            }

            menuText += `> ${FOOTER}`;

            await danuwa.sendMessage(
                from,
                {
                    image: {
                        url: 'https://i.ibb.co/67DRMzkf/b5fbf712e8fd.jpg'
                    },
                    caption: menuText.trim()
                },
                { quoted: mek }
            );

        } catch (error) {
            console.error('[NIKKA X MD] MENU ERROR:', error);

            await reply(
                '❌ NIKKA X MD menu එක සෑදීමේදී දෝෂයක් ඇති වුණා. Logs පරීක්ෂා කරන්න.'
            );
        }
    }
);
