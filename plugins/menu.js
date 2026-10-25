const { cmd, commands } = require('../command');
const path = require('path');

const BOT_NAME = 'THENUVA X MD';
const FOOTER =
'> ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa';

// Public image URL
const MENU_IMAGE_URL = 'https://i.ibb.co/67DRMzkf/b5fbf712e8fd.jpg';

function createMenu() {
const groups = new Map();

for (const item of commands) {
if (!item || typeof item.function !== 'function') continue;


const filename = item.filename
  ? path.basename(item.filename).replace(/\.js$/i, '')
  : 'Other';

const commandName = item.pattern || item.name;
if (!commandName) continue;

if (!groups.has(filename)) groups.set(filename, []);

groups.get(filename).push('.' + String(commandName));


}

let text =
`╭━━〔 *${BOT_NAME}* 〕━━╮\n` +
'┃\n' +
'┃  📋 *ᴄᴏᴍᴍᴀɴᴅ ᴍᴇɴᴜ*\n' +
'┃  ━━━━━━━━━━━━━\n' +
`┃  ⚙️ Commands: ${commands.length}\n` +
'┃\n';

for (const [name, list] of groups) {
text += `┃  📂 *${name}*\n`;


for (const command of [...new Set(list)]) {
  text += `┃  ▸ ${command}\n`;
}

text += '┃\n';


}

return text + '╰━━━━━━━━━━━━━━╯\n\n' + FOOTER;
}

async function sendMenu(conn, mek, from, reply) {
try {
const caption = createMenu();


return await conn.sendMessage(
  from,
  {
    image: { url: MENU_IMAGE_URL },
    caption
  },
  { quoted: mek }
);


} catch (error) {
console.error('[THENUVA MENU ERROR]', error);


return reply(`❌ Menu error: ${error.message}\n\n${FOOTER}`);


}
}

cmd({
pattern: 'menu',
alias: ['menulist', 'menulistall'],
react: '📋',
desc: 'Show complete menu',
category: 'main',
filename: __filename
}, async (conn, mek, m, { from, reply }) => {
return sendMenu(conn, mek, from, reply);
});

cmd({
pattern: 'download',
alias: ['downloads', 'fullmenu'],
desc: 'Show complete menu',
category: 'main',
filename: __filename
}, async (conn, mek, m, { from, reply }) => {
return sendMenu(conn, mek, from, reply);
});
