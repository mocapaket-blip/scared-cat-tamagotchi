/* ═══════════════════════════════════════════════
   SCARED CAT — Notification + Cloud Sync Backend
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

if (!TOKEN) { console.error('❌ BOT_TOKEN not set!'); process.exit(1); }

// ─── Disk paths ───
const USERS_FILE = path.join('/tmp', 'scared_cat_users.json');
const SAVES_FILE = path.join('/tmp', 'scared_cat_saves.json');

// ─── Notification users store ───
// chatId → { stats, lastSeen, notified: { hunger, toilet, fatigue, mood, health } }
let users = new Map();

function loadUsers() {
  try {
    const obj = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    users = new Map(Object.entries(obj));
    console.log(`[boot] loaded ${users.size} notification users`);
  } catch(_) { console.log('[boot] no notification users, starting fresh'); }
}

function saveUsers() {
  try {
    const obj = {};
    for (const [k, v] of users.entries()) obj[k] = v;
    fs.writeFileSync(USERS_FILE, JSON.stringify(obj));
  } catch(e) { console.warn('[saveUsers]', e.message); }
}

// ─── Cloud saves store ───
// chatId → { version, lastUpdate, stats, coins, xp, inventory, ... }
let saves = new Map();

function loadSaves() {
  try {
    const obj = JSON.parse(fs.readFileSync(SAVES_FILE, 'utf8'));
    saves = new Map(Object.entries(obj));
    console.log(`[boot] loaded ${saves.size} cloud saves`);
  } catch(_) { console.log('[boot] no cloud saves, starting fresh'); }
}

function persistSaves() {
  try {
    const obj = {};
    for (const [k, v] of saves.entries()) obj[k] = v;
    fs.writeFileSync(SAVES_FILE, JSON.stringify(obj));
  } catch(e) { console.warn('[persistSaves]', e.message); }
}

loadUsers();
loadSaves();

// ── Middleware ──
app.use(express.json({ limit: '1mb' }));
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
  res.json({ ok: true, users: users.size, saves: saves.size, uptime: Math.floor(process.uptime()) + 's' });
});

// Self-ping
app.get('/ping', (req, res) => res.json({ pong: true }));

// ── CLOUD SYNC: Save full game state ──
// Body: { chatId, state: { version, lastUpdate, stats, coins, ... } }
app.post('/save', (req, res) => {
  const { chatId, state } = req.body || {};
  if (!chatId || !state) return res.status(400).json({ error: 'Missing chatId or state' });

  const id       = String(chatId);
  const existing = saves.get(id);
  const incomingTs  = state.lastUpdate || 0;
  const existingTs  = existing?.lastUpdate || 0;

  // Last-write-wins: only overwrite if incoming data is newer
  if (!existing || incomingTs >= existingTs) {
    saves.set(id, { ...state, chatId: id });
    persistSaves();
    console.log(`[save] user=${id} ts=${incomingTs} coins=${state.coins} xp=${state.xp}`);
    return res.json({ ok: true, saved: true });
  }

  // Incoming is older — reject but return current cloud state so client can merge
  console.log(`[save] user=${id} rejected (cloud newer: ${existingTs} > ${incomingTs})`);
  res.json({ ok: true, saved: false, serverTs: existingTs });
});

// ── CLOUD SYNC: Load game state ──
app.get('/load/:chatId', (req, res) => {
  const id   = String(req.params.chatId);
  const data = saves.get(id);
  if (!data) return res.json({ ok: false, state: null });
  console.log(`[load] user=${id} ts=${data.lastUpdate}`);
  res.json({ ok: true, state: data });
});

// ── NOTIFICATION: Register/update cat stats ──
// Body: { chatId, stats, level, lastUpdate }
app.post('/update', (req, res) => {
  const { chatId, stats, level, lastUpdate } = req.body || {};
  if (!chatId || !stats) return res.status(400).json({ error: 'Missing chatId or stats' });

  const id  = String(chatId);
  const old = users.get(id) || { notified: {} };

  users.set(id, {
    stats,
    level:    level || 1,
    lastSeen: lastUpdate || Date.now(),
    notified: old.notified || {},
  });
  saveUsers();

  console.log(`[update] user=${id} lv=${level} hunger=${stats.hunger?.toFixed(0)} mood=${stats.mood?.toFixed(0)} health=${stats.health?.toFixed(0)}`);
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
    if (!json.ok) {
      console.warn(`[tg] ❌ failed for ${chatId}: ${json.description}`);
      // If bot can't reach user — remove from notification list
      if (json.description?.includes('Forbidden') || json.description?.includes('blocked')) {
        users.delete(chatId);
        saveUsers();
        console.log(`[tg] removed blocked user ${chatId}`);
      }
    } else {
      console.log(`[tg] ✅ sent to ${chatId}`);
    }
    return json.ok;
  } catch (e) { console.error('[tg] error:', e.message); return false; }
}

// ── Decay calculator (mirrors game engine) ──
// Applies offline stat decay so server knows CURRENT cat state
function applyDecay(stats, minutes, level) {
  if (minutes <= 0) return { ...stats };
  const m = 1 - Math.min(((level || 1) - 1) * 0.01, 0.15);
  const s = { ...stats };
  s.hunger  = Math.min(s.hunger  + 0.22 * m * minutes, 100);
  s.fatigue = Math.min(s.fatigue + 0.07 * m * minutes, 100);
  s.toilet  = Math.min(s.toilet  + 0.11 * m * minutes, 100);
  s.mood    = Math.max(s.mood    - 0.16 * m * minutes, 0);
  const crits = [s.hunger >= 80, s.fatigue >= 80, s.toilet >= 80, s.mood <= 20].filter(Boolean).length;
  s.health  = Math.max(s.health  + (crits >= 2 ? -0.10 : -0.02) * minutes, 0);
  return s;
}

// ── Notification checker (every 10 min) ──
async function checkAndNotify() {
  const now = Date.now();
  console.log(`[notify] checking ${users.size} users at ${new Date().toISOString()}`);

  for (const [chatId, data] of users.entries()) {
    if (now - data.lastSeen > 48 * 3600_000) continue; // skip inactive >48h

    // Apply offline decay — server knows current stat values even without client
    const minutesAway = (now - data.lastSeen) / 60000;
    const s = applyDecay(data.stats, minutesAway, data.level);
    const n = data.notified;
    console.log(`[notify] user=${chatId} away=${minutesAway.toFixed(0)}min hunger=${s.hunger.toFixed(0)} mood=${s.mood.toFixed(0)} health=${s.health.toFixed(0)}`);
    const lines = [];

    if (s.hunger  >= 75) { if (!n.hunger)  { lines.push('🍔 Кот <b>очень голоден</b>! Покорми его скорее!');          n.hunger  = true; } } else if (s.hunger  < 55) { n.hunger  = false; }
    if (s.toilet  >= 75) { if (!n.toilet)  { lines.push('🚽 Кот <b>не может терпеть</b>! Срочно в ванную!');          n.toilet  = true; } } else if (s.toilet  < 55) { n.toilet  = false; }
    if (s.fatigue >= 75) { if (!n.fatigue) { lines.push('😴 Кот <b>совсем устал</b> и хочет спать!');                  n.fatigue = true; } } else if (s.fatigue < 55) { n.fatigue = false; }
    if (s.mood    <= 25) { if (!n.mood)    { lines.push('😔 Кот <b>загрустил</b>... Поиграй с ним!');                  n.mood    = true; } } else if (s.mood    > 45) { n.mood    = false; }
    if (s.health  <= 30) { if (!n.health)  { lines.push('🏥 Кот <b>заболевает</b>! Нужна срочная помощь!');            n.health  = true; } } else if (s.health  > 50) { n.health  = false; }

    if (lines.length > 0) {
      const text = '😿 <b>Твой кот нуждается в тебе!</b>\n\n'
        + lines.join('\n')
        + '\n\n<a href="https://t.me/ScaredCatTamagotchibot">👆 Открой игру и помоги коту!</a>';
      const ok = await sendMessage(chatId, text);
      if (ok) { saveUsers(); }
      console.log(`[notify] sent to ${chatId}: ${lines.length} alert(s)`);
    }
  }
}

// Self-ping every 14 min to stay warm
function selfPing() {
  const host = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${PORT}`;
  fetch(`${host}/ping`).catch(() => {});
}

setTimeout(checkAndNotify, 5000);
setInterval(checkAndNotify, 10 * 60 * 1000); // every 10 min
setInterval(selfPing, 8 * 60 * 1000);        // ping every 8 min

// ── Start ──
app.listen(PORT, () => {
  console.log(`✅ Scared Cat backend running on port ${PORT}`);
  console.log(`   Bot token: ${TOKEN ? TOKEN.slice(0, 10) + '...' : '❌ MISSING'}`);
  console.log(`   Users: ${users.size} | Saves: ${saves.size}`);
});
