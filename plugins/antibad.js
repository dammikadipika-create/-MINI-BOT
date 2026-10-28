const { cmd } = require('../command');

const BOT_NAME = 'NIKKA X MD';
const FOOTER = '> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ';

// Customize this list to suit your group.
const BAD_WORDS = [
  'badword1',
  'badword2',
  'badword3'
];

let antiBadEnabled = true;
const initializedConnections = new WeakSet();

function getMessageText(message) {
  const msg = message?.message;
  if (!msg) return '';

  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    ''
  );
}

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[.,!?*_\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsBadWord(text) {
  const normalized = normalizeText(text);

  return BAD_WORDS.some(word => {
    const safeWord = normalizeText(word);
    if (!safeWord || safeWord.startsWith('badword')) return false;

    const escaped = safeWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, 'i').test(normalized);
  });
}

function makePanel(title, lines = []) {
  return [
    '╭━━━『 🤍 ɴɪᴋᴋᴀ x ᴍᴅ 🤍 』━━━╮',
    '┃',
    `┃  ✨ *${title}*`,
    '┃',
    ...lines.map(line => `┃  ${line}`),
    '┃',
    '╰━━━━━━━━━━━━━━━━━━━━━━╯',
    '',
    '      🤍 ──「 ɢʀᴏᴜᴘ ɢᴜᴀʀᴅ 」── 🤍',
    FOOTER
  ].join('\n');
}

async function handleMessages(conn, messages) {
  if (!antiBadEnabled) return;

  for (const message of messages || []) {
    try {
      const key = message?.key;
      const chatJid = key?.remoteJid;

      if (!key || !chatJid?.endsWith('@g.us')) continue;
      if (key.fromMe || message.message?.protocolMessage) continue;

      const text = getMessageText(message);
      if (!text || !containsBadWord(text)) continue;

      try {
        await conn.sendMessage(chatJid, { delete: key });
      } catch (error) {
        console.error('[ANTIBAD DELETE ERROR]', error.message);
      }

      await conn.sendMessage(chatJid, {
        text: makePanel('ANTIBAD WARNING', [
          '🚫 නරක වචනයක් හඳුනාගත්තා!',
          '🗑️ Message එක delete කිරීමට උත්සාහ කළා.',
          '🤍 කරුණාකර ගෞරවයෙන් කතා කරන්න.',
          '⚠️ නැවත මෙවැනි වචන භාවිතයෙන් වළකින්න.'
        ])
      });
    } catch (error) {
      console.error('[ANTIBAD ERROR]', error.message);
    }
  }
}

function initializeAntiBad(conn) {
  if (!conn || initializedConnections.has(conn)) return;
  if (!conn.ev || typeof conn.ev.on !== 'function') return;

  initializedConnections.add(conn);

  conn.ev.on('messages.upsert', async ({ messages }) => {
    await handleMessages(conn, messages);
  });

  console.log(`🤍 ${BOT_NAME} AntiBad listener initialized.`);
}

cmd({
  pattern: 'antibad',
  alias: ['badword'],
  react: '🤍',
  desc: 'Enable or disable AntiBad',
  category: 'group',
  filename: __filename
}, async (conn, mek, m, { reply, args }) => {
  initializeAntiBad(conn);

  const action = String(args?.[0] || '').toLowerCase();

  if (action === 'on') {
    antiBadEnabled = true;
    return reply(makePanel('ANTIBAD ENABLED', [
      '✅ AntiBad ක්‍රියාත්මකයි.',
      '🚫 ලැයිස්තුවේ ඇති නරක වචන හඳුනාගන්නවා.',
      '🗑️ Message එක delete කිරීමට උත්සාහ කරනවා.'
    ]));
  }

  if (action === 'off') {
    antiBadEnabled = false;
    return reply(makePanel('ANTIBAD DISABLED', [
      '❌ AntiBad අක්‍රිය කළා.'
    ]));
  }

  return reply(makePanel('ANTIBAD SETTINGS', [
    `📌 Status: ${antiBadEnabled ? '✅ ON' : '❌ OFF'}`,
    '➤ .antibad on',
    '➤ .antibad off',
    '📝 BAD_WORDS ලැයිස්තුව ඔබට වෙනස් කළ හැකියි.'
  ]));
});
