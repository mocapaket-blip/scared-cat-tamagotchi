/* ═══════════════════════════════════════════════
   SCARED CAT — Game Config & Constants
   ═══════════════════════════════════════════════ */
'use strict';

// ─── STORAGE ───
const SAVE_KEY = 'scared_cat_v3';

// ─── STAT DECAY RATES (per real-world minute) ───
// hunger/fatigue/toilet INCREASE toward 100 (bad)
// mood/health DECREASE toward 0 (bad)
// Tuned to match My Talking Tom feel: 3–6 check-ins/day
//   Голод     → critical in ~5.5 h  (fastest)
//   Настроение→ critical in ~6.5 h  (very fast)
//   Гигиена   → critical in ~11.5 h (medium)
//   Сон       → critical in ~15 h   (slow)
//   Здоровье  → very slow solo, fast under crisis (2+ crit)
const RATES = {
  hunger:  0.22,   // 🍔 Голод — fastest
  fatigue: 0.07,   // 😴 Сон   — slowest
  toilet:  0.11,   // 🚽 Гигиена — medium
  mood:   -0.16,   // 🎮 Настроение — very fast
};
const HEALTH_RATE_NORMAL = -0.02;   // ❤️ normal: ~57 h alone
const HEALTH_RATE_CRISIS  = -0.18;  // ❤️ crisis (2+ bad): ~8.5 h

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
  { id: 'kitchen',  icon: '🍔', label: 'Голод'      },
  { id: 'bathroom', icon: '🚽', label: 'Гигиена'    },
  { id: 'rest',     icon: '😴', label: 'Сон'        },
  { id: 'yard',     icon: '🎮', label: 'Настроение' },
  { id: 'clinic',   icon: '🏥', label: 'Здоровье'   },
];

// ─── THOUGHT BUBBLE EMOJIS ───
const THOUGHT_EMOJIS = {
  hunger:  '🍔',
  toilet:  '🚽',
  fatigue: '😴',
  mood:    '🎮',
  health:  '🏥',
};

// ─── ACTION COUNTS DEFAULT ───
function defaultActionCounts() {
  return {
    feedCount:     0,
    bathroomCount: 0,
    sleepCount:    0,
    playCount:     0,
    clinicCount:   0,
    toyCount:      0,
    premiumFed:    0,
    minigameWins:  0,
    buyCount:      0,
    equipCount:    0,
    maxStreak:     0,
  };
}

// ─── ACHIEVEMENTS (15 milestones) ───
const ACHIEVEMENTS = [
  { id:'ach_first_meal',  icon:'🍚', name:'Первый обед',      desc:'Покорми кота впервые',          coins: 50,  check:(c)=>c.feedCount>=1       },
  { id:'ach_fed_10',      icon:'🍗', name:'Гурман',           desc:'Покорми кота 10 раз',           coins:100,  check:(c)=>c.feedCount>=10      },
  { id:'ach_premium',     icon:'🐟', name:'Деликатес',        desc:'Дай коту премиум еду',          coins: 80,  check:(c)=>c.premiumFed>=1      },
  { id:'ach_clean_5',     icon:'🚿', name:'Чистюля',          desc:'Убери туалет 5 раз',            coins: 80,  check:(c)=>c.bathroomCount>=5   },
  { id:'ach_sleep_5',     icon:'😴', name:'Сладкий сон',      desc:'Уложи кота спать 5 раз',       coins: 80,  check:(c)=>c.sleepCount>=5      },
  { id:'ach_play_5',      icon:'🎮', name:'Игривый',          desc:'Поиграй с котом 5 раз',         coins: 80,  check:(c)=>c.playCount>=5       },
  { id:'ach_healthy_3',   icon:'🏥', name:'Здоровяк',         desc:'Вылечи кота 3 раза',            coins:100,  check:(c)=>c.clinicCount>=3     },
  { id:'ach_toy_3',       icon:'⚽', name:'Игрушечник',       desc:'Используй игрушку 3 раза',      coins: 80,  check:(c)=>c.toyCount>=3        },
  { id:'ach_minigame_1',  icon:'🏆', name:'Игрок',            desc:'Заверши 1 мини-игру',           coins:100,  check:(c)=>c.minigameWins>=1    },
  { id:'ach_minigame_5',  icon:'🥇', name:'Чемпион',          desc:'Заверши 5 мини-игр',            coins:200,  check:(c)=>c.minigameWins>=5    },
  { id:'ach_shop_1',      icon:'🛒', name:'Покупатель',       desc:'Купи первый предмет',           coins: 50,  check:(c)=>c.buyCount>=1        },
  { id:'ach_dressed',     icon:'🎩', name:'Стиляга',          desc:'Надень аксессуар на кота',      coins: 80,  check:(c)=>c.equipCount>=1      },
  { id:'ach_level_5',     icon:'⭐', name:'Опытный хозяин',   desc:'Достигни 5 уровня',             coins:150,  check:(c,l)=>l>=5               },
  { id:'ach_level_10',    icon:'🌟', name:'Мастер заботы',    desc:'Достигни 10 уровня',            coins:300,  check:(c,l)=>l>=10              },
  { id:'ach_streak_7',    icon:'💎', name:'Верный хозяин',    desc:'Войди 7 дней подряд',           coins:300,  check:(c)=>c.maxStreak>=7       },
];

// Returns array of newly-unlocked achievements (not yet in unlockedMap)
function checkNewAchievements(unlockedMap, actionCounts, level) {
  return ACHIEVEMENTS.filter(a => !unlockedMap[a.id] && a.check(actionCounts, level));
}

// ─── DAILY MISSIONS POOL ───
const MISSIONS_POOL = [
  { id:'m_feed_2',    icon:'🍔', desc:'Покорми кота 2 раза',          target:2, coins:30, actionKey:'feedCount'     },
  { id:'m_feed_5',    icon:'🍗', desc:'Покорми кота 5 раз',           target:5, coins:65, actionKey:'feedCount'     },
  { id:'m_bathroom',  icon:'🚿', desc:'Убери туалет',                 target:1, coins:25, actionKey:'bathroomCount' },
  { id:'m_sleep',     icon:'😴', desc:'Уложи кота спать',             target:1, coins:25, actionKey:'sleepCount'    },
  { id:'m_play',      icon:'🎮', desc:'Поиграй с котом',              target:1, coins:25, actionKey:'playCount'     },
  { id:'m_minigame',  icon:'🏆', desc:'Сыграй в мини-игру',          target:1, coins:50, actionKey:'minigameWins'  },
  { id:'m_clinic',    icon:'🏥', desc:'Навести кота в клинике',       target:1, coins:25, actionKey:'clinicCount'   },
  { id:'m_toy',       icon:'⚽', desc:'Используй игрушку',           target:1, coins:30, actionKey:'toyCount'      },
  { id:'m_premium',   icon:'🐟', desc:'Дай коту премиум еду',        target:1, coins:40, actionKey:'premiumFed'    },
  { id:'m_shop',      icon:'🛒', desc:'Купи что-нибудь в магазине',  target:1, coins:35, actionKey:'buyCount'      },
];

// Seeded deterministic RNG (based on date) so missions are same per calendar day
function seededRng(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };
}

function generateDailyMissions(dateStr) {
  const seed = dateStr.split('-').reduce((a, n, i) => a + parseInt(n) * (i + 1) * 137, 0);
  const rng  = seededRng(seed);
  const pool = [...MISSIONS_POOL];
  const result = [];
  while (result.length < 3 && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length);
    result.push({ ...pool[idx], progress: 0, completed: false, claimed: false });
    pool.splice(idx, 1);
  }
  return result;
}

// Returns current day's missions (generates new ones if date changed)
function getOrUpdateDailyMissions(saved) {
  const today = new Date().toISOString().split('T')[0];
  if (saved && saved.date === today) return saved;
  return { date: today, missions: generateDailyMissions(today) };
}

// ─── SOUND SYSTEM (Web Audio API — no files needed) ───
let _audioCtx = null;

function getAudioCtx() {
  try {
    const Cls = window.AudioContext || window.webkitAudioContext;
    if (!Cls) return null;
    if (!_audioCtx) _audioCtx = new Cls();
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    return _audioCtx;
  } catch (e) { return null; }
}

function _note(ctx, freq, start, dur, vol, type) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type || 'triangle';
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o.connect(g); g.connect(ctx.destination);
  o.start(start); o.stop(start + dur + 0.02);
}

function playSound(type) {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    switch (type) {
      case 'coin':
        _note(ctx,  880, t,       0.12, 0.18);
        _note(ctx, 1320, t+0.12,  0.15, 0.15);
        break;
      case 'feed':
        _note(ctx,  440, t,       0.08, 0.14, 'sine');
        _note(ctx,  660, t+0.08,  0.12, 0.11, 'sine');
        break;
      case 'toy':
        _note(ctx,  660, t,       0.07, 0.15, 'sine');
        _note(ctx,  880, t+0.07,  0.07, 0.13, 'sine');
        _note(ctx,  660, t+0.14,  0.1,  0.1,  'sine');
        break;
      case 'action':
        _note(ctx,  440, t,       0.1,  0.12, 'sine');
        _note(ctx,  554, t+0.1,   0.12, 0.1,  'sine');
        break;
      case 'levelup':
        _note(ctx,  440, t,       0.12, 0.22);
        _note(ctx,  554, t+0.12,  0.12, 0.22);
        _note(ctx,  659, t+0.24,  0.12, 0.22);
        _note(ctx,  880, t+0.36,  0.38, 0.28);
        break;
      case 'achievement':
        _note(ctx,  659, t,       0.1,  0.22);
        _note(ctx,  880, t+0.1,   0.1,  0.22);
        _note(ctx, 1100, t+0.2,   0.1,  0.22);
        _note(ctx, 1320, t+0.3,   0.38, 0.28);
        break;
      case 'daily':
        _note(ctx,  523, t,       0.12, 0.22);
        _note(ctx,  659, t+0.12,  0.12, 0.22);
        _note(ctx,  784, t+0.24,  0.12, 0.22);
        _note(ctx, 1047, t+0.36,  0.42, 0.28);
        break;
      case 'mission':
        _note(ctx,  659, t,       0.1,  0.2);
        _note(ctx,  784, t+0.1,   0.14, 0.2);
        _note(ctx, 1046, t+0.24,  0.32, 0.2);
        break;
      case 'tap':
        _note(ctx,  880, t,       0.06, 0.11, 'sine');
        break;
      case 'buy':
        _note(ctx,  660, t,       0.08, 0.15);
        _note(ctx,  880, t+0.08,  0.08, 0.13);
        _note(ctx, 1100, t+0.16,  0.15, 0.15);
        break;
    }
  } catch (e) { /* silently fail */ }
}

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

// ─── PHASE 3: RETURN BONUS ───
function calcReturnBonus(minsAway) {
  if (minsAway < 30) return { coins: 0, xp: 0 };
  const t = Math.min(minsAway / 720, 1); // 0..1 over 12 h
  return {
    coins: Math.round(50 + t * 130),  // 50 → 180
    xp:    Math.round(20 + t * 80),   // 20 → 100
  };
}

// ─── PHASE 3: CAT EMOTION STATE MACHINE ───
const CAT_STATES = {
  veryScared: { anim:'catShakeStrong 0.18s linear infinite', filter:'saturate(0.45) brightness(0.72)', thought:'😱', particle:'💦', glow:'rgba(220,20,20,0.38)'   },
  scared:     { anim:'catShake 0.26s linear infinite',       filter:'saturate(0.6)  brightness(0.82)', thought:'😨', particle:'💦', glow:'rgba(180,20,20,0.28)'   },
  sick:       { anim:'none',                                 filter:'saturate(0.28) hue-rotate(80deg)',thought:'🤒', particle:'💊', glow:'rgba(30,200,30,0.28)'   },
  hungry:     { anim:'catWalkBob 0.55s ease-in-out infinite',filter:'sepia(0.35)',                     thought:'🍔', particle:'🍔', glow:'rgba(255,120,20,0.28)'  },
  tired:      { anim:'none',                                 filter:'brightness(0.8) saturate(0.65)', thought:'😴', particle:'💤', glow:'rgba(80,80,200,0.28)'   },
  dirty:      { anim:'none',                                 filter:'saturate(0.48) brightness(0.86)',thought:'🚽', particle:'💨', glow:'rgba(110,85,20,0.28)'   },
  sad:        { anim:'none',                                 filter:'saturate(0.42) brightness(0.88)',thought:'😿', particle:'💧', glow:'rgba(80,80,255,0.28)'   },
  playful:    { anim:'catWalkBob 0.38s ease-in-out infinite',filter:'brightness(1.08)',                thought:'🎮', particle:'⭐', glow:'rgba(255,210,20,0.22)'  },
  happy:      { anim:'catWalkBob 0.45s ease-in-out infinite',filter:'brightness(1.06) saturate(1.1)', thought:'😺', particle:'❤️', glow:'rgba(255,90,110,0.22)'  },
  special:    { anim:'catFloat 2s ease-in-out infinite',     filter:'brightness(1.16) saturate(1.3)', thought:'✨', particle:'✨', glow:'rgba(255,195,20,0.38)'  },
  neutral:    { anim:'catWalkBob 0.48s ease-in-out infinite',filter:'none',                           thought:'😐', particle:'❤️', glow:'none'                   },
};

function getCatState(stats, level) {
  // Count how many stats are in a bad zone (not yet critical but concerning)
  const badCount = [
    stats.hunger  >= 65,
    stats.toilet  >= 65,
    stats.fatigue >= 65,
    stats.mood    <= 35,
    stats.health  <= 35,
  ].filter(Boolean).length;

  // Desperate: health near zero OR 4+ stats bad simultaneously
  if (stats.health <= 18 || badCount >= 4)                              return 'veryScared';
  // Scared: 2+ stats bad, OR any single one deeply critical
  if (badCount >= 2 || stats.hunger >= 80 || stats.toilet >= 80 || stats.fatigue >= 80) return 'scared';
  // Individual negatives (lower thresholds for faster reactions)
  if (stats.health  <= 38)  return 'sick';
  if (stats.hunger  >= 58)  return 'hungry';
  if (stats.mood    <= 30)  return 'sad';
  if (stats.fatigue >= 62)  return 'tired';
  if (stats.toilet  >= 62)  return 'dirty';
  // Positives
  if (level >= 10 && stats.mood >= 80 && stats.health >= 85)            return 'special';
  if (stats.mood >= 78 && stats.health >= 65)                           return 'happy';
  if (stats.mood >= 62)                                                 return 'playful';
  return 'neutral';
}

// ─── PHASE 3: ROOM CUSTOMIZATION ───
const ROOM_ITEMS = [
  { id:'ri_candle',   emoji:'🕯️', name:'Свеча',        cost: 60 },
  { id:'ri_web',      emoji:'🕸️', name:'Паутина',      cost: 50 },
  { id:'ri_bat',      emoji:'🦇', name:'Летучая мышь', cost: 70 },
  { id:'ri_skull',    emoji:'💀', name:'Череп',        cost: 80 },
  { id:'ri_crystal',  emoji:'🔮', name:'Кристалл',     cost: 90 },
  { id:'ri_mushroom', emoji:'🍄', name:'Гриб',         cost: 55 },
  { id:'ri_spider',   emoji:'🕷️', name:'Паук',         cost: 65 },
  { id:'ri_pumpkin',  emoji:'🎃', name:'Тыква',        cost: 75 },
  { id:'ri_potion',   emoji:'🧪', name:'Зелье',        cost: 85 },
  { id:'ri_scroll',   emoji:'📜', name:'Свиток',       cost: 60 },
  { id:'ri_bones',    emoji:'🦴', name:'Кости',        cost: 45 },
  { id:'ri_moon',     emoji:'🌙', name:'Луна',         cost:100 },
];

const BG_OVERLAYS = [
  { id:'bg_default', name:'Обычная', color:'transparent',         emoji:'🏠', cost:  0 },
  { id:'bg_night',   name:'Ночь',    color:'rgba(20,10,60,0.45)', emoji:'🌙', cost:120 },
  { id:'bg_autumn',  name:'Осень',   color:'rgba(80,30,0,0.38)',  emoji:'🍂', cost:150 },
  { id:'bg_horror',  name:'Ужас',    color:'rgba(80,0,0,0.38)',   emoji:'👻', cost:180 },
  { id:'bg_forest',  name:'Лес',     color:'rgba(0,60,20,0.38)',  emoji:'🌲', cost:150 },
];

function defaultRoomLayout() {
  return { bg: 'bg_default', items: [] };
}
