const fs = require('fs');
const path = require('path');
const { cmd, commands } = require('../command');

const PLUGIN_DIR = __dirname;

const BOT_NAME = 'THENUVA X MD';

const FOOTER =
  '> ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa';

// මෙතනට download කරන්න ඕනෑ image/document එකේ URL එක දාන්න
const DOWNLOAD_MEDIA_URL = 'https://example.com/your-menu-image.jpg';

function getPluginFiles(dir) {
  let files = [];

  try {
    const entries = fs.readdirSync(dir, {
      withFileTypes: true
    });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        files = files.concat(getPluginFiles(fullPath));
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.js')
      ) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error('[THENUVA MENU]', error.message);
  }

  return files;
}

cmd({
  pattern: 'menu',
  alias: ['menulist', 'menulistall'],
  react: '📋',
  desc: 'Show bot menu',
  category: 'main',
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    const files = getPluginFiles(PLUGIN_DIR);

    const loadedFiles = files.filter(file => {
      try {
        return Boolean(require.cache[require.resolve(file)]);
      } catch {
        return false;
      }
    });

    const commandMap = new Map();

    for (const command of commands) {
      if (!command || typeof command.function !== 'function') {
        continue;
      }

      const pluginName = command.filename
        ? path.basename(command.filename)
        : 'Unknown';

      if (!commandMap.has(pluginName)) {
        commandMap.set(pluginName, []);
      }

      const name = command.pattern || command.name;

      if (name) {
        commandMap.get(pluginName).push('.' + String(name));
      }
    }

    let output =
      `╭─〔 *${BOT_NAME}* 〕─●●►\n` +
      '┃\n' +
      '┃ 📋 *ᴍᴇɴᴜ ᴘᴀɴᴇʟ*\n' +
      '┃ ─────────────\n' +
      `┃ 📁 Plugin files : ${files.length}\n` +
      `┃ ✅ Loaded plugins : ${loadedFiles.length}\n` +
      `┃ ⚙️ Commands : ${commands.length}\n` +
      '┃\n';

    for (const file of loadedFiles) {
      const name = path.basename(file);
      const list = commandMap.get(name) || [];

      output +=
        `┃ 📂 *${name}*\n` +
        `┃ ➜ ${list.length ? list.join(', ') : 'No commands'}\n\n`;
    }

    output += '╰━━━━━━━━━━━━●●►\n\n' + FOOTER;

    // Menu text එක document එකක් ලෙස යැවීම.
    // WhatsApp විසින් document එකට Download control එක පෙන්විය හැක.
    const buffer = Buffer.from(output, 'utf8');

    return await conn.sendMessage(
      from,
      {
        document: buffer,
        mimetype: 'text/plain',
        fileName: 'THENUVA-X-MD-MENU.txt',
        caption: `*${BOT_NAME}*\n\n${FOOTER}`
      },
      { quoted: mek }
    );

  } catch (error) {
    console.error('[THENUVA MENU ERROR]', error);

    return reply(
      `❌ Menu error: ${error.message}\n\n${FOOTER}`
    );
  }
});
