const { cmd, commands } = require("../command");

const BOT_NAME = "ɴɪᴋᴋᴀ x ᴍᴅ";
const FOOTER = "ɴɪᴋᴋᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ";

const categoryInfo = {
    main: {
        title: "ᴍᴀɪɴ ᴍᴇɴᴜ",
        emoji: "🏠"
    },
    owner: {
        title: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ",
        emoji: "👑"
    },
    download: {
        title: "ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ",
        emoji: "📥"
    },
    downloads: {
        title: "ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ",
        emoji: "📥"
    },
    search: {
        title: "sᴇᴀʀᴄʜ ᴍᴇɴᴜ",
        emoji: "🔎"
    },
    group: {
        title: "ɢʀᴏᴜᴘ ᴍᴇɴᴜ",
        emoji: "👥"
    },
    admin: {
        title: "ᴀᴅᴍɪɴ ᴍᴇɴᴜ",
        emoji: "🛡️"
    },
    tools: {
        title: "ᴛᴏᴏʟs ᴍᴇɴᴜ",
        emoji: "🧰"
    },
    ai: {
        title: "ᴀɪ ᴍᴇɴᴜ",
        emoji: "🤖"
    },
    fun: {
        title: "ғᴜɴ ᴍᴇɴᴜ",
        emoji: "🎭"
    },
    convert: {
        title: "ᴄᴏɴᴠᴇʀᴛ ᴍᴇɴᴜ",
        emoji: "🔄"
    },
    other: {
        title: "ᴏᴛʜᴇʀ ᴍᴇɴᴜ",
        emoji: "📌"
    }
};

cmd(
    {
        pattern: "menu",
        alias: ["help", "commands"],
        desc: "Displays all commands by category",
        category: "main",
        filename: __filename
    },
    async (
        danuwa,
        mek,
        m,
        { from, reply, pushName }
    ) => {
        try {
            const categories = {};

            // Collect registered commands by category
            for (const key of Object.keys(commands)) {
                const data = commands[key];

                if (!data || !data.pattern) continue;

                const category = String(
                    data.category || "other"
                ).toLowerCase();

                if (!categories[category]) {
                    categories[category] = [];
                }

                // Prevent duplicate patterns in each category
                const alreadyExists = categories[category].some(
                    item => item.pattern === data.pattern
                );

                if (!alreadyExists) {
                    categories[category].push({
                        pattern: data.pattern,
                        desc: data.desc || "No description"
                    });
                }
            }

            const totalCommands = Object.values(categories)
                .reduce((total, list) => total + list.length, 0);

            let menuText = `
╭━━〔 *${BOT_NAME}* 〕━━╮
┃
┃ 👋 ʜᴇʟʟᴏ: ${pushName || "User"}
┃ 🤖 ʙᴏᴛ: ${BOT_NAME}
┃ 📚 ᴄᴏᴍᴍᴀɴᴅs: ${totalCommands}
┃ 📂 ᴄᴀᴛᴇɢᴏʀɪᴇs: ${Object.keys(categories).length}
┃ 🔰 ᴘʀᴇғɪx: .
┃
╰━━━━━━━━━━━━━━━━━━╯

`;

            // Sort categories alphabetically
            const sortedCategories = Object.keys(categories).sort();

            for (const category of sortedCategories) {
                const info = categoryInfo[category] || {
                    title: `${category.toUpperCase()} MENU`,
                    emoji: "📂"
                };

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
                    menuText += `┃ ✦ .${command.pattern}\n`;
                    menuText += `┃   └ ${command.desc}\n`;
                }

                menuText += `┃\n╰━━━━━━━━━━━━━━━━━━╯\n\n`;
            }

            menuText += `
> ${FOOTER}
`;

            await danuwa.sendMessage(from, {
    image: {
        url: "https://i.ibb.co/67DRMzkf/b5fbf712e8fd.jpg"
    },
    caption: menuText.trim()
}, {
    quoted: mek
});

        } catch (error) {
            console.error("MENU ERROR:", error);

            await reply(
                "❌ Menu එක හදද්දී දෝෂයක් ඇති වුණා. නැවත උත්සාහ කරන්න."
            );
        }
    }
);
