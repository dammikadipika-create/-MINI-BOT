
'use strict';

const { cmd } = require('../command');

const BOT_NAME = 'NIKKA X MD';
const FOOTER = '> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴɪᴋᴋᴀ x ᴍᴅ';

let antiBadEnabled = true;
const initializedConnections = new WeakSet();

// English profanity roots and common romanized Sinhala profanity.
// This is a starter set, not a complete language detector.
const ENGLISH_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard',
  'motherfucker', 'bullshit', 'dickhead', 'cunt',
  'slut', 'whore', 'dick', 'pussy'
];

const SINGLISH_WORDS = [
  'huththo', 'huththa', 'huththaa', 'pakaya',
  'kariyo', 'ponnaya', 'wesige', 'wesiy',
  'walaththa', 'balla', 'paraya'
];

// Sinhala-script examples. Extend this set as needed.
const SINHALA_WORDS = [
  'හුත්', 'පකය', 'පක', 'කැරි', 'වේසි',
  'වල්', 'පොන්න', 'බල්ලා'
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
    msg.buttonsResponseMessage?.selectedDisplayText ||
    msg.listResponseMessage?.title ||
    ''
  );
}

function normalizeText(text) {
  return String(text || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[.,!?*_~`'"()[\]{}<>:;|\\/-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsBadWord(text) {
  const normalized = normalizeText(text);
  const compact = normalized.replace(/\s+/g, '');

  // English words: match complete words, including inflected forms.
  for (const word of ENGLISH_WORDS) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z])${escaped}(?:[a-z]*)($|[^a-z])`, 'i');

    if (regex.test(normalized) || regex.test(compact)) {
      return true;
    }
  }

  // Romanized Sinhala: match common spellings and joined variants.
  for (const word of SINGLISH_WORDS) {
    if (normalized.includes(word) || compact.includes(word)) {
      return true;
    }
  }

  // Sinhala Unicode: substring matching catches some suffix variations,
  // but may also flag words containing these roots unintentionally.
  for (const word of SINHALA_WORDS) {
    if (normalized.includes(word)) {
      return true;
    }
  }

  return false;
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
      if (!text || !containsBadWord(text)) continue;

      let deleted = false;

      try {
        await conn.sendMessage(chatJid, { delete: key });
        deleted = true;
      } catch (error) {
        console.error('[ANTIBAD DELETE ERROR]', error);
      }

      await conn.sendMessage(chatJid, {
        text: makePanel('ANTIBAD WARNING', [
          '🚫 නුසුදුසු වචනයක් හඳුනාගත්තා!',
          deleted
            ? '🗑️ Message එක delete කළා.'
            : '❌ Delete කරන්න බැරි වුණා.',
          '🤍 කරුණාකර ගෞරවයෙන් කතා කරන්න.',
          '⚠️ නැවත මෙවැනි වචන භාවිතයෙන් වළකින්න.'
        ])
      });
    } catch (error) {
      console.error('[ANTIBAD MESSAGE ERROR]', error);
    }
  }
}

function initializeAntiBad(conn) {
  if (!conn || typeof conn !== 'object') return;
  if (initializedConnections.has(conn)) return;

  if (!conn.ev || typeof conn.ev.on !== 'function') {
    console.error('[ANTIBAD] Connection event emitter unavailable.');
    return;
  }

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
      '🇱🇰 Sinhala / Singlish වචන පරීක්ෂා කරනවා.',
      '🇬🇧 English profanity patterns පරීක්ෂා කරනවා.',
      '🗑️ හඳුනාගත් messages delete කිරීමට උත්සාහ කරනවා.'
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
    '🤍 External API අවශ්‍ය නැහැ.'
  ]));
});
