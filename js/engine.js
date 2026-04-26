/* ═══════════════════════════════════════════════
   SCARED CAT — Game Engine
   Depends on: config.js (must load first)
   ═══════════════════════════════════════════════ */
'use strict';

// ─── CAT ASSETS ───
// Using file paths (works on GitHub Pages; cat.png & cat-anim.gif in repo root)
window.CAT_PNG = 'cat.png';
window.CAT_GIF = 'cat-anim.gif';

// ─── DEFAULT STATE ───
function defaultStats() {
  return { hunger: 10, fatigue: 10, toilet: 5, mood: 90, health: 90 };
}

function defaultInventory() {
  return {
    food_basic:   3,
    food_tasty:   0,
    food_premium: 0,
    toy_ball:     0,
    toy_feather:  0,
    toy_laser:    0,
  };
}

function defaultState() {
  return {
    stats:        defaultStats(),
    coins:        125,
    xp:           0,
    createdAt:    Date.now(),
    lastUpdate:   Date.now(),
    lastDaily:    null,
    dailyStreak:  0,
    inventory:    defaultInventory(),
    equipped:     { hat: null, neck: null, eyes: null },
    achievements: {},
    highScores:   { catch: 0, memory: 0 },
    actionCounts: defaultActionCounts(),
    dailyMissions: getOrUpdateDailyMissions(null),
    roomLayout:   defaultRoomLayout(),
    ownedDecor:   {},
    ownedBgs:     ['bg_default'],
  };
}

// ─── DECAY ───
function applyDecay(stats, minutes, level) {
  if (minutes <= 0) return { ...stats };
  const lv  = level || 1;
  const m   = decayMult(lv);
  const s   = { ...stats };
  s.hunger  = clamp(s.hunger  + RATES.hunger  * m * minutes, 0, 100);
  s.fatigue = clamp(s.fatigue + RATES.fatigue * m * minutes, 0, 100);
  s.toilet  = clamp(s.toilet  + RATES.toilet  * m * minutes, 0, 100);
  s.mood    = clamp(s.mood    + RATES.mood    * m * minutes, 0, 100);
  const crits = [s.hunger >= 80, s.fatigue >= 80, s.toilet >= 80, s.mood <= 20]
                .filter(Boolean).length;
  const hRate = crits >= 2 ? HEALTH_RATE_CRISIS : HEALTH_RATE_NORMAL;
  s.health = clamp(s.health + hRate * minutes, 0, 100);
  return s;
}

// ─── DAILY REWARD CHECK ───
function checkDailyReward(lastDaily, streak) {
  if (!lastDaily) return { canClaim: true, newStreak: 1 };
  const diffMs   = Date.now() - lastDaily;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return { canClaim: false, newStreak: streak };
  if (diffDays === 1) return { canClaim: true,  newStreak: Math.min((streak || 0) + 1, 7) };
  return { canClaim: true, newStreak: 1 }; // streak broken
}

// ─── PERSISTENCE ───
function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function saveState(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, lastUpdate: Date.now() }));
  } catch (e) { /* storage full or blocked */ }
}

// ─── BOOT INIT (runs once before React mounts) ───
const _INIT = (() => {
  try {
    const saved = loadState();
    if (saved && saved.stats) {
      const now        = Date.now();
      const rawMins    = Math.max(0, (now - (saved.lastUpdate || now)) / 60000);
      const minsAway   = Math.min(rawMins, 720); // cap offline at 12 h
      const xp         = saved.xp || 0;
      const lv         = levelFromXP(xp);
      const statsBefore = { ...saved.stats };
      const stats      = applyDecay(saved.stats, minsAway, lv);
      const daily      = checkDailyReward(saved.lastDaily, saved.dailyStreak || 0);
      const bonus      = calcReturnBonus(rawMins);
      // Show ReturnModal only if away ≥ 30 min
      const returnData = rawMins >= 30
        ? { minsAway: rawMins, statsBefore, statsAfter: stats, bonus }
        : null;
      return {
        stats,
        coins:       saved.coins        ?? 125,
        xp,
        createdAt:   saved.createdAt    || now,
        lastDaily:   saved.lastDaily    || null,
        dailyStreak: saved.dailyStreak  || 0,
        inventory:   { ...defaultInventory(), ...(saved.inventory || {}) },
        equipped:    saved.equipped     || { hat: null, neck: null, eyes: null },
        achievements:  saved.achievements  || {},
        highScores:    saved.highScores    || { catch: 0, memory: 0 },
        actionCounts:  { ...defaultActionCounts(), ...(saved.actionCounts || {}) },
        dailyMissions: getOrUpdateDailyMissions(saved.dailyMissions || null),
        roomLayout:    saved.roomLayout  || defaultRoomLayout(),
        ownedDecor:    saved.ownedDecor  || {},
        ownedBgs:      saved.ownedBgs    || ['bg_default'],
        complaint:     null,
        canClaimDaily: daily.canClaim,
        pendingStreak: daily.newStreak,
        returnData,
      };
    }
  } catch (e) {
    console.warn('[ScaredCat] State load error:', e);
  }

  // Fresh start
  const def = defaultState();
  return {
    ...def,
    complaint:     null,
    canClaimDaily: true,
    pendingStreak: 1,
    actionCounts:  defaultActionCounts(),
    dailyMissions: getOrUpdateDailyMissions(null),
    returnData:    null,
  };
})();
