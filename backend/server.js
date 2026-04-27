/* ═══════════════════════════════════════════════
   SCARED CAT — Notification Backend
   Deploy to Railway: railway up
   ═══════════════════════════════════════════════ */
'use strict';

// Load .env locally (Railway uses its own env vars)
try { require('fs').readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const [k, ...rest] = line.split('=');
  const v = rest.join('=');
  if (k && v && !process.env[k.trim()]) process.env[k.trim()] = v.trim();
}); } catch(_) {}

const express  = require('express');
const fetch    = require('node-fetch');
const fs       = require('fs');
const path     = require('path');

const app      = express();
const PORT     = process.env.PORT || 3000;
const TOKEN    = process.env.BOT_TOKEN;
const TG_API   = `https://api.telegram.org/bot${TOKEN}`;

// Persist users to disk so data survives Railway restarts
const DATA_FILE = path.join('/tmp', 'scared_cat_users.json');

if (!TOKEN) { console.error('❌ BOT_TOKEN not set!'); process.exit(1); }

// ── User store (persisted to /tmp/scared_cat_users.json) ──
// chatId → { stats, lastSeen, notified: { hunger, toilet, fatigue, mood, health } }
let users = new Map();

function loadUsers() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const obj = JSON.parse(raw);
    users = new Map(Object.entries(obj));
    console.log(`[boot] loaded ${users.size} users from disk`);
  } catch(_) {
    console.log('[boot] no saved users, starting fresh');
  }
}

function saveUsers() {
  try {
    const obj = {};
    for (const [k, v] of users.entries()) obj[k] = v;
    fs.writeFileSync(DATA_FILE, JSON.stringify(obj));
  } catch(e) {
    console.warn('[save] could not write users file:', e.message);
  }
}

loadUsers();

// ── Middleware ──
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Routes ──

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, users: users.size, uptime: Math.floor(process.uptime()) + 's' });
});

// Self-ping to prevent Railway cold starts affecting the schedule
app.get('/ping', (req, res) => res.json({ pong: true }));

// Frontend calls this to register / update stats
// Body: { chatId: "123456789", stats: { hunger, fatigue, toilet, mood, health } }
app.post('/update', (req, res) => {
  const { chatId, stats } = req.body || {};
  if (!chatId || !stats) return res.status(400).json({ error: 'Missing chatId or stats' });

  const id  = String(chatId);
  const old = users.get(id) || { notified: {} };

  users.set(id, {
    stats:    stats,
    lastSeen: Date.now(),
    notified: old.notified || {},
  });

  saveUsers();
  console.log(`[update] user=${id} hunger=${stats.hunger} mood=${stats.mood} health=${stats.health}`);
  res.json({ ok: true });
});

// ── Telegram helpers ──
async function sendMessage(chatId, text) {
  try {
    const res = await fetch(`${TG_API}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    const json = await res.json();
    if (!json.ok) console.warn(`[tg] sendMessage failed for ${chatId}:`, json.description);
    return json.ok;
  } catch (e) {
    console.error('[tg] fetch error:', e.message);
    return false;
  }
}

// ── Notification checker (runs every 20 min) ──
async function checkAndNotify() {
  const now = Date.now();
  console.log(`[notify] checking ${users.size} users at ${new Date().toISOString()}`);

  for (const [chatId, data] of users.entries()) {
    // Skip users not seen for 48 h (probably quit the game)
    if (now - data.lastSeen > 48 * 3600_000) continue;

    const s = data.stats;
    const n = data.notified;
    const lines = [];

    // ── Check each stat ──
    if (s.hunger >= 75) {
      if (!n.hunger) { lines.push('🍔 Кот <b>очень голоден</b>! Покорми его скорее!'); n.hunger = true; }
    } else if (s.hunger < 55) { n.hunger = false; }

    if (s.toilet >= 75) {
      if (!n.toilet) { lines.push('🚽 Кот <b>не может терпеть</b>! Срочно в ванную!'); n.toilet = true; }
    } else if (s.toilet < 55) { n.toilet = false; }

    if (s.fatigue >= 75) {
      if (!n.fatigue) { lines.push('😴 Кот <b>совсем устал</b> и хочет спать!'); n.fatigue = true; }
    } else if (s.fatigue < 55) { n.fatigue = false; }

    if (s.mood <= 25) {
      if (!n.mood) { lines.push('😔 Кот <b>загрустил</b>... Поиграй с ним!'); n.mood = true; }
    } else if (s.mood > 45) { n.mood = false; }

    if (s.health <= 30) {
      if (!n.health) { lines.push('🏥 Кот <b>заболевает</b>! Нужна срочная помощь!'); n.health = true; }
    } else if (s.health > 50) { n.health = false; }

    if (lines.length > 0) {
      const text = '😿 <b>Твой кот нуждается в тебе!</b>\n\n'
        + lines.join('\n')
        + '\n\n<a href="https://t.me/ScaredCatTamagotchibot">👆 Открой игру и помоги коту!</a>';
      const ok = await sendMessage(chatId, text);
      if (ok) {
        console.log(`[notify] sent to ${chatId}: ${lines.length} alert(s)`);
        saveUsers(); // save updated notified flags
      }
    }
  }
}

// Self-ping every 14 min to keep the process warm between notify cycles
function selfPing() {
  const host = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${PORT}`;
  fetch(`${host}/ping`).catch(() => {});
}

// Run notify immediately on start, then every 20 minutes
setTimeout(checkAndNotify, 5000); // small delay so server is fully up first
setInterval(checkAndNotify, 20 * 60 * 1000);
setInterval(selfPing, 14 * 60 * 1000);

// ── Start ──
app.listen(PORT, () => {
  console.log(`✅ Scared Cat backend running on port ${PORT}`);
  console.log(`   Bot token: ${TOKEN ? TOKEN.slice(0, 10) + '...' : '❌ MISSING'}`);
  console.log(`   Users loaded: ${users.size}`);
});
