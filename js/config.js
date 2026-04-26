/* ═══════════════════════════════════════════════
   SCARED CAT — Game Config & Constants
   ═══════════════════════════════════════════════ */
'use strict';

// ─── STORAGE ───
const SAVE_KEY = 'scared_cat_v3';

// ─── STAT DECAY RATES (per real-world minute) ───
// hunger/fatigue/toilet INCREASE toward 100 (bad)
// mood DECREASES toward 0 (bad)
const RATES = {
  hunger:  0.14,
  fatigue: 0.09,
  toilet:  0.07,
  mood:   -0.05,
};
const HEALTH_RATE_NORMAL = -0.015;
const HEALTH_RATE_CRISIS  = -0.12; // 2+ stats critical

// ─── UTILITY ───
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// ─── LEVEL SYSTEM ───
// XP needed to REACH each level (index = level - 1)
const LEVEL_XP = [
  0, 100, 220, 370, 550, 760, 1000, 1270, 1570,
  1900, 2260, 2650, 3070, 3520, 4000, 4510, 5050, 5620, 6220, 6850
];
const MAX_LEVEL = 20;

function levelFromXP(xp) {
  let lv = 1;
  for (let i = 1; i < LEVEL_XP.length; i++) {
    if (xp >= LEVEL_XP[i]) lv = i + 1;
    else break;
  }
  return Math.min(lv, MAX_LEVEL);
}

// Returns { level, pct 0..1, curXP (within level), needed (for next) }
function xpProgress(xp) {
  const lv = levelFromXP(xp);
  if (lv >= MAX_LEVEL) return { level: lv, pct: 1, curXP: xp, needed: 0 };
  const base = LEVEL_XP[lv - 1];
  const next  = LEVEL_XP[lv];
  return { level: lv, pct: (xp - base) / (next - base), curXP: xp - base, needed: next - base };
}

// How much slower decay gets per level (up to 15% at Lv15)
function decayMult(level) {
  return 1 - Math.min((level - 1) * 0.01, 0.15);
}

// Coin multiplier by level
function coinMult(level) {
  if (level >= 15) return 1.3;
  if (level >= 10) return 1.2;
  if (level >= 5)  return 1.1;
  return 1.0;
}

function earnCoins(base, level) {
  return Math.round(base * coinMult(level));
}

function gainXP(curXP, curLevel, amount) {
  const newXP = curXP + amount;
  const newLv = levelFromXP(newXP);
  return { newXP, newLv, leveledUp: newLv > curLevel };
}

// ─── DAILY REWARDS (streak day 1-7, then cycles) ───
const DAILY_REWARDS = [
  { day: 1, coins:  50, xp:  25, bonus: null,          emoji: '🎁' },
  { day: 2, coins:  60, xp:  30, bonus: null,          emoji: '🎁' },
  { day: 3, coins:  80, xp:  40, bonus: null,          emoji: '🌟' },
  { day: 4, coins: 100, xp:  50, bonus: null,          emoji: '🌟' },
  { day: 5, coins: 150, xp:  75, bonus: null,          emoji: '💎' },
  { day: 6, coins: 200, xp: 100, bonus: null,          emoji: '💎' },
  { day: 7, coins: 300, xp: 150, bonus: 'food_tasty',  emoji: '👑' },
];

// ─── SHOP: FOOD ───
const FOOD_ITEMS = [
  {
    id: 'food_basic',   emoji: '🍚',
    name: 'Кибблы',     desc: 'Базовый корм',
    cost: 5,            hunger: -30, mood: 0,  health: 0, xp: 5
  },
  {
    id: 'food_tasty',   emoji: '🍗',
    name: 'Курочка',    desc: 'Вкусная еда',
    cost: 15,           hunger: -50, mood: 8,  health: 2, xp: 10
  },
  {
    id: 'food_premium', emoji: '🐟',
    name: 'Рыбка',      desc: 'Деликатес',
    cost: 35,           hunger: -80, mood: 18, health: 5, xp: 20
  },
];

// ─── SHOP: TOYS ───
const TOY_ITEMS = [
  {
    id: 'toy_ball',    emoji: '⚽',
    name: 'Мячик',     desc: 'Весёлый мяч',
    cost: 30,          mood: 25, fatigue: 5, xp: 15
  },
  {
    id: 'toy_feather', emoji: '🪶',
    name: 'Перышко',   desc: 'Интерактивная',
    cost: 25,          mood: 20, fatigue: 3, xp: 10
  },
  {
    id: 'toy_laser',   emoji: '🔴',
    name: 'Лазер',     desc: 'Лазер-охота!',
    cost: 50,          mood: 35, fatigue: 8, xp: 25
  },
];

// ─── SHOP: ACCESSORIES (cosmetic) ───
const ACC_ITEMS = [
  { id: 'acc_hat',     emoji: '🎩', name: 'Цилиндр',  desc: 'Стильная шляпа', cost: 100, slot: 'hat'  },
  { id: 'acc_bow',     emoji: '🎀', name: 'Бантик',   desc: 'Милый бантик',   cost:  80, slot: 'neck' },
  { id: 'acc_glasses', emoji: '🕶️',  name: 'Очки',     desc: 'Крутые очки',    cost: 150, slot: 'eyes' },
  { id: 'acc_crown',   emoji: '👑', name: 'Корона',    desc: 'Королевская!',   cost: 200, slot: 'hat'  },
  { id: 'acc_scarf',   emoji: '🧣', name: 'Шарф',     desc: 'Тёплый и уютный',cost: 120, slot: 'neck' },
];

// ─── XP REWARDS PER ACTION ───
const ACTION_XP = {
  bathroom:     5,
  sleep:        8,
  play:        10,
  clinic:      15,
  minigame_base: 20,
};

// ─── ROOM CONFIG ───
// Used to render paw nav labels and route paw-clicks
const PAW_CONFIG = [
  { id: 'kitchen',  icon: '🍔', label: 'Кухня'   },
  { id: 'bathroom', icon: '🚽', label: 'Ванная'  },
  { id: 'rest',     icon: '😴', label: 'Спальня' },
  { id: 'yard',     icon: '🎮', label: 'Игровая' },
  { id: 'clinic',   icon: '🏥', label: 'Клиника' },
];

// ─── THOUGHT BUBBLE EMOJIS ───
const THOUGHT_EMOJIS = {
  hunger:  '🍔',
  toilet:  '🚽',
  fatigue: '😴',
  mood:    '🎮',
  health:  '🏥',
};

// ─── COMPLAINT MESSAGES ───
function buildComplaint(stats, minutes) {
  if (minutes < 30) return null;
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  const timeStr = h > 0 ? `${h}ч${m > 0 ? ` ${m}мин` : ''}` : `${m}мин`;
  const issues = [];
  if (stats.hunger  >= 60) issues.push(`🍔 Голодаю (${Math.round(stats.hunger)}%)`);
  if (stats.toilet  >= 60) issues.push(`🚽 Нужен туалет (${Math.round(stats.toilet)}%)`);
  if (stats.mood    <= 40) issues.push(`🎮 Очень скучно (настр. ${Math.round(stats.mood)}%)`);
  if (stats.fatigue >= 60) issues.push(`😴 Устал (${Math.round(stats.fatigue)}%)`);
  if (stats.health  <= 60) issues.push(`🏥 Нехорошо себя чувствую (${Math.round(stats.health)}%)`);
  let msg = minutes < 120
    ? `Ты пропал(а) на ${timeStr}! 😿`
    : minutes < 360
    ? `${h}ч без тебя! Мне так одиноко... 😢`
    : minutes < 720
    ? `${h} часов одиночества!! Я так боюсь... 😭`
    : `${h} часов бросил(а) меня!! Мне плохо, помоги скорей! 😱`;
  if (issues.length) msg += '\n\nПока тебя не было:\n• ' + issues.join('\n• ');
  return msg;
}
