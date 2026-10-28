const { cmd } = require('../command');

const BOT_NAME = 'NIKKA X MD';
const FOOTER = '> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ';

let antiBadEnabled = true;
const initializedConnections = new WeakSet();

// Local detection patterns. No external API required.
const BAD_PATTERNS = [
  // Common English profanity patterns
  /\bf+u+c+k+\w*/i,
  /\bs+h+i+t+\w*/i,
  /\bb+i+t+c+h+\w*/i,
  /\ba+s+s+h+o+l+e+\w*/i,
  /\bb+a+s+t+a+r+d+\w*/i,
  /\bd+i+c+k+\w*/i,
  /\bc+u+n+t+\w*/i,
  /\bm+o+t+h+e+r+f+u+c+k+\w*/i,

  // Common romanized/Singlish profanity patterns
  /\bh+u+t+h+t+h+o+\w*/i,
  /\bh+u+t+h+a+\w*/i,
  /\bp+a+k+a+y+a+\w*/i,
  /\bw+a+l+a+t+h+a+\w*/i
];

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
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[0@]/g, char => char === '0' ? 'o' : 'a')
    .replace(/[1!]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[4]/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[^a-z\u0D80-\u0DFF\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsBadLanguage(text) {
  const original = String(text || '');
  const normalized = normalizeText(original);
  const compact = normalized.replace(/\s+/g, '');

  return BAD_PATTERNS.some(pattern =>
    pattern.test(original) ||
    pattern.test(normalized) ||
    pattern.test(compact)
  );
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

async function processMessages(conn, messages) {
  if (!antiBadEnabled) return;

  for (const message of messages || []) {
    try {
      const key = message?.key;
      const chatJid = key?.remoteJid;

      if (!key || !chatJid?.endsWith('@g.us')) continue;
      if (key.fromMe || message.message?.protocolMessage) continue;

      const text = getMessageText(message);
      if (!text || !containsBadLanguage(text)) continue;

      let deleted = false;

      try {
        await conn.sendMessage(chatJid, { delete: key });
        deleted = true;
      } catch (error) {
        console.error('[ANTIBAD DELETE ERROR]', error.message);
      }

      await conn.sendMessage(chatJid, {
        text: makePanel('ANTIBAD WARNING', [
          '🚫 නුසුදුසු භාෂාවක් හඳුනාගත්තා!',
          deleted
            ? '🗑️ Message එක delete කළා.'
            : '⚠️ Message එක delete කරන්න බැරි වුණා.',
          '🤍 කරුණාකර group එකේ ගෞරවයෙන් කතා කරන්න.',
          '🛡️ නැවත මෙවැනි වචන භාවිතයෙන් වළකින්න.'
        ])
      });
    } catch (error) {
      console.error('[ANTIBAD ERROR]', error.message);
    }
  }
}

function initializeAntiBad(conn) {
  if (!conn || typeof conn !== 'object') return;
  if (initializedConnections.has(conn)) return;
  if (!conn.ev || typeof conn.ev.on !== 'function') return;

  initializedConnections.add(conn);

  conn.ev.on('messages.upsert', async ({ messages }) => {
    await processMessages(conn, messages);
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
      '🔎 Local word-pattern detection සක්‍රියයි.',
      '🗑️ හඳුනාගත් messages delete කිරීමට උත්සාහ කරනවා.',
      '⚠️ සෑම slang වචනයක්ම හඳුනාගැනීම සහතික කළ නොහැක.'
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
    '🤍 API අවශ්‍ය නැහැ.',
    '⚠️ Local patterns නිසා සමහර වචන මඟහැරෙන්න පුළුවන්.'
  ]));
});
