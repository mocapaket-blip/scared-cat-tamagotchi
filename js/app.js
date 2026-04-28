/* ═══════════════════════════════════════════════
   SCARED CAT — React App
   Depends on: config.js, engine.js (loaded first)
   ═══════════════════════════════════════════════ */

const { useState, useEffect, useRef, useCallback } = React;
const APP_VERSION = '1.0.8';

// ── TRUST LEVEL SYSTEM ──────────────────────────────────────────────────────
const TRUST_STAGES = [
  { min:1,  max:5,  name:'Настороженный',     emoji:'😾', color:'#9494bc',
    desc:'Кот держится на расстоянии, но уже не убегает при виде тебя.' },
  { min:6,  max:10, name:'Начинает доверять',  emoji:'🤔', color:'#c4a050',
    desc:'Иногда подходит сам. Ты движешься в правильном направлении.' },
  { min:11, max:15, name:'Маленький друг',      emoji:'🐾', color:'#d4a824',
    desc:'Позволяет себя погладить и уже начинает привязываться.' },
  { min:16, max:20, name:'Верный компаньон',    emoji:'💛', color:'#e8bc20',
    desc:'Встречает у двери и тихонько мурлычет только для тебя.' },
  { min:21, max:25, name:'Близкая душа',        emoji:'💜', color:'#b868e8',
    desc:'Делится с тобой своими секретами и тихими снами.' },
  { min:26, max:30, name:'Любимец',             emoji:'💕', color:'#e860b8',
    desc:'Засыпает рядом и каждый день ждёт твоего возвращения.' },
  { min:31, max:35, name:'Родная кошка',        emoji:'🏠', color:'#40b8d8',
    desc:'Там, где ты — там его дом. Больше никаких сомнений.' },
  { min:36, max:40, name:'Преданный друг',      emoji:'⭐', color:'#e8d420',
    desc:'Всегда рядом, в радости и в грусти. Настоящий друг.' },
  { min:41, max:45, name:'Неразлучные',         emoji:'💞', color:'#f04888',
    desc:'Вы понимаете друг друга без единого слова.' },
  { min:46, max:50, name:'Навсегда вместе',     emoji:'💖', color:'#ff6090',
    desc:'Самая крепкая связь, которая только бывает. Навсегда.' },
];

function getTrustStage(lv) {
  return TRUST_STAGES.find(s => lv >= s.min && lv <= s.max) || TRUST_STAGES[0];
}

// Points needed to complete level lv (gets harder each level)
function trustPointsNeeded(lv) { return 30 + lv * 4; }

function trustLevelFromPoints(pts) {
  let lv = 1, spent = 0;
  while (lv < 50) {
    const need = trustPointsNeeded(lv);
    if (pts < spent + need) break;
    spent += need;
    lv++;
  }
  return lv;
}

function trustProgress(pts) {
  const lv = trustLevelFromPoints(pts);
  if (lv >= 50) return { lv: 50, pct: 1, curPts: 0, needed: 0 };
  let spent = 0;
  for (let i = 1; i < lv; i++) spent += trustPointsNeeded(i);
  const needed = trustPointsNeeded(lv);
  const curPts = pts - spent;
  return { lv, pct: Math.min(1, curPts / needed), curPts, needed };
}
// ────────────────────────────────────────────────────────────────────────────

// ── FREELANCE ORDER SYSTEM ───────────────────────────────────────────────────
const ORDER_TYPES = [
  { id:'small',  label:'Мелкий заказ',      icon:'📝', color:'#5080c0',
    durationMs: 3*3600000,  min:90,  max:130, maxBoosts:0,
    desc:'Простая задача — быстро и без лишних нервов.' },
  { id:'medium', label:'Нормальный проект',  icon:'💼', color:'#50a060',
    durationMs: 6*3600000,  min:220, max:280, maxBoosts:1,
    desc:'Средний веб-проект. Одно ускорение доступно.' },
  { id:'large',  label:'Сложный заказ',      icon:'🏗️', color:'#9060c0',
    durationMs:10*3600000,  min:420, max:520, maxBoosts:2,
    desc:'Серьёзный заказ — высокая оплата, два ускорения.' },
  { id:'urgent', label:'СРОЧНЫЙ ДЕДЛАЙН',   icon:'🚨', color:'#d04030', urgent:true,
    durationMs:10*3600000,  min:630, max:780, maxBoosts:2,
    desc:'Клиент не ждёт! +50% к оплате. Исчезнет через 30 минут.' },
];

const TIMEZONES = [
  { label:'UTC−12',                      value:'Etc/GMT+12'          },
  { label:'UTC−10 (Гавайи)',             value:'Pacific/Honolulu'    },
  { label:'UTC−8  (Лос-Анджелес)',       value:'America/Los_Angeles' },
  { label:'UTC−6  (Чикаго)',             value:'America/Chicago'     },
  { label:'UTC−5  (Нью-Йорк)',           value:'America/New_York'    },
  { label:'UTC−4  (Галифакс)',           value:'America/Halifax'     },
  { label:'UTC−3  (Сан-Паулу)',          value:'America/Sao_Paulo'   },
  { label:'UTC+0  (Лондон)',             value:'Europe/London'       },
  { label:'UTC+1  (Берлин, Варшава)',    value:'Europe/Berlin'       },
  { label:'UTC+2  (Киев, Хельсинки)',    value:'Europe/Kiev'         },
  { label:'UTC+3  (Москва, Минск)',      value:'Europe/Moscow'       },
  { label:'UTC+4  (Баку, Тбилиси)',      value:'Asia/Baku'           },
  { label:'UTC+4  (Дубай, Абу-Даби)',    value:'Asia/Dubai'          },
  { label:'UTC+5  (Ташкент, Астана)',    value:'Asia/Tashkent'       },
  { label:'UTC+5  (Екатеринбург)',       value:'Asia/Yekaterinburg'  },
  { label:'UTC+5:30 (Индия)',            value:'Asia/Kolkata'        },
  { label:'UTC+6  (Омск, Дакка)',        value:'Asia/Omsk'           },
  { label:'UTC+7  (Новосибирск, Бангкок)', value:'Asia/Novosibirsk' },
  { label:'UTC+8  (Иркутск, Пекин)',     value:'Asia/Shanghai'       },
  { label:'UTC+9  (Якутск, Токио)',      value:'Asia/Tokyo'          },
  { label:'UTC+9:30 (Аделаида)',         value:'Australia/Adelaide'  },
  { label:'UTC+10 (Владивосток, Сидней)', value:'Asia/Vladivostok'  },
  { label:'UTC+11 (Магадан)',            value:'Asia/Magadan'        },
  { label:'UTC+12 (Камчатка, Окленд)',   value:'Asia/Kamchatka'      },
];

function getLocalHour(tz) {
  try {
    const s = new Intl.DateTimeFormat('en', { hour:'numeric', hour12:false, timeZone:tz }).format(new Date());
    return parseInt(s) % 24;
  } catch { return new Date().getHours(); }
}

function randBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function formatCountdownMs(ms) {
  if (ms <= 0) return '00:00:00';
  const s   = Math.floor(ms / 1000);
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function fmtDuration(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} м`;
}

function canBoostNow(active) {
  if (!active) return false;
  const type = ORDER_TYPES.find(t => t.id === active.type);
  if (!type || active.boostsUsed >= type.maxBoosts) return false;
  // Cooldown reference: last boost time, OR order start time if no boost yet
  const ref = active.lastBoostTime || active.startTime || 0;
  return Date.now() - ref >= 4 * 3600000;
}

function boostCooldownLeft(active) {
  if (!active) return 0;
  const ref = active.lastBoostTime || active.startTime || 0;
  return Math.max(0, ref + 4 * 3600000 - Date.now());
}
// ────────────────────────────────────────────────────────────────────────────

// ── SCARED LVL SYSTEM ───────────────────────────────────────────────────────
// Returns emoji icon + style info based on current scaredLvl
function scaredIcon(lvl) {
  if (lvl < 30) return { emoji:'😺', label:'Спокойный',        color:'#60d080', pulse:false };
  if (lvl < 50) return { emoji:'😿', label:'Немного грустный', color:'#c0c040', pulse:false };
  if (lvl < 70) return { emoji:'🙀', label:'Испуганный',       color:'#e08030', pulse:false };
  if (lvl < 85) return { emoji:'😱', label:'Очень напуган',    color:'#e04040', pulse:true  };
  return              { emoji:'💀', label:'Паника!',           color:'#ff2020', pulse:true  };
}

// fearMult: 1.0 at lvl=0, 0.30 at lvl=100
function fearMult(lvl) { return 1 - (lvl / 100) * 0.70; }

// Can this stat-action proceed? Returns null (ok) or block message string
function scaredBlock(lvl, action) {
  if (action === 'toilet' || action === 'bath') {
    if (lvl > 70) return '🙀 Кот слишком напуган, чтобы это сделать';
  }
  if (action === 'medicine') {
    if (lvl > 65) return '🙀 Кот не подпускает к себе';
  }
  return null;
}
// ────────────────────────────────────────────────────────────────────────────

const CAT_DEFAULT = window.CAT_PNG || 'cat.png';
const GIF_DEFAULT = window.CAT_GIF || 'cat-anim.gif';
// These are overridden by the active NFT skin; use useCatSkin() hook below
let CAT = CAT_DEFAULT;
let GIF = GIF_DEFAULT;

// ── TON Connect singleton ──
let _tonConnectUI = null;
function getTonConnect() {
  if (_tonConnectUI) return _tonConnectUI;
  try {
    const TONCUI = window.TON_CONNECT_UI;
    if (!TONCUI) return null;
    _tonConnectUI = new TONCUI.TonConnectUI({
      manifestUrl: 'https://mocapaket-blip.github.io/scared-cat-tamagotchi/tonconnect-manifest.json',
      actionsConfiguration: {
        // After wallet authorization, Telegram will restore the Mini App
        // instead of leaving the user inside the wallet app
        returnStrategy: 'back',
        twaReturnUrl:   'https://t.me/ScaredCatTamagotchibot', // menu-button Mini App
      },
    });
  } catch (e) { console.warn('[TON] init error', e); }
  return _tonConnectUI;
}

// ── Fetch user's Scared Cat NFTs via tonapi.io ──
async function fetchScaredCatNFTs(walletAddress) {
  try {
    const url = `https://tonapi.io/v2/accounts/${encodeURIComponent(walletAddress)}/nfts?limit=200&indirect_ownership=false`;
    const res  = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const data = await res.json();
    const nfts = (data.nft_items || []).filter(n => {
      const colAddr = (n.collection?.address || '').toLowerCase();
      const colName = (n.collection?.name   || '').toLowerCase();
      const nftName = (n.metadata?.name     || '').toLowerCase();
      const target  = SCARED_CAT_COLLECTION_ADDRESS.toLowerCase();
      // 3 ways to match — covers all tonapi response formats:
      // 1. raw address match   (0:13b9...)
      // 2. collection name     ("Scared Cats")
      // 3. individual NFT name ("Scared Cat #16356") — most reliable fallback
      return colAddr === target
          || colName.includes('scared')
          || nftName.startsWith('scared cat');
    });
    return nfts.map(n => {
      const attrs = (n.metadata?.attributes || []).reduce((m, a) => {
        m[a.trait_type?.toLowerCase() || a.trait_type] = a.value;
        return m;
      }, {});
      // Prefer tonapi cached preview (500x500) — works for Fragment/IPFS/any source
      const preview500 = (n.previews || []).find(p => p.resolution === '500x500');
      const preview100 = (n.previews || []).find(p => p.resolution === '100x100');
      const image = preview500?.url
        || preview100?.url
        || (n.metadata?.image || '').replace('ipfs://', 'https://ipfs.io/ipfs/');
      return {
        address:  n.address,
        name:     n.metadata?.name || 'Scared Cat',
        image,
        traits:   attrs,
      };
    });
  } catch (e) { console.warn('[TON] NFT fetch error', e); return []; }
}

// ── Backend URL (fill in after Railway deploy) ──
const BACKEND_URL = window.SCARED_CAT_BACKEND || 'https://scared-cat-tamagotchi-production.up.railway.app';

// Sync stats to backend so push notifications know the cat's state
// Sends stats + level + timestamp so server can calculate offline decay
function syncBackend(stats, level) {
  if (!BACKEND_URL) return;
  const chatId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  if (!chatId) return;
  fetch(`${BACKEND_URL}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, stats, level: level || 1, lastUpdate: Date.now() }),
  }).catch(() => {});
}

// ── Cloud Save / Load ──
const CLOUD_VERSION = 1;

function getChatId() {
  return String(window.Telegram?.WebApp?.initDataUnsafe?.user?.id || '');
}

async function cloudSave(chatId, state) {
  if (!chatId || !BACKEND_URL) return false;
  try {
    const res = await fetch(`${BACKEND_URL}/save`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId,
        state: { ...state, version: CLOUD_VERSION, lastUpdate: Date.now() },
      }),
    });
    const json = await res.json();
    return json.ok === true;
  } catch(e) { return false; }
}

async function cloudLoad(chatId) {
  if (!chatId || !BACKEND_URL) return null;
  try {
    const res  = await fetch(`${BACKEND_URL}/load/${encodeURIComponent(chatId)}`);
    const json = await res.json();
    return json.ok && json.state ? json.state : null;
  } catch(e) { return null; }
}

/* ══════════════════════════════════════════════════
   MINI-GAME 1 — Catch the Food 🍚
   ══════════════════════════════════════════════════ */
function CatchGameScreen({ level, onComplete, onBack }) {
  const DURATION = 35;

  // ── Item catalogue ──
  const ITEM_DEFS = [
    { type:'normal',  emojis:['🥩','🍱'], pts: 1, hunger: 3,  weight: 40 },
    { type:'tasty',   emojis:['🐟','🍗'], pts: 3, hunger: 6,  weight: 28 },
    { type:'premium', emojis:['🌭'],       pts: 6, hunger: 10, weight: 8,  coins: 3, glow:'#ffd700' },
    { type:'bad',     emojis:['👟','🧅','🌀'], pts: -2, hunger: 0, weight: 14 },
    { type:'mouse',   emojis:['🐭'],       pts: 8, hunger: 8,  weight: 4,  coins: 5 },
    { type:'freeze',  emojis:['❄️'],       pts: 0, hunger: 0,  weight: 3 },
    { type:'energy',  emojis:['⚡'],       pts:10, hunger: 0,  weight: 3 },
  ];

  function pickItem(lv) {
    const boost = lv >= 10 ? 6 : 0;
    const pool = ITEM_DEFS.map(d => ({
      ...d,
      w: d.type === 'premium' ? d.weight + boost : d.type === 'bad' ? Math.max(4, d.weight - boost/2) : d.weight
    }));
    const total = pool.reduce((s, d) => s + d.w, 0);
    let r = Math.random() * total;
    for (const d of pool) { r -= d.w; if (r <= 0) return d; }
    return pool[0];
  }

  // ── State ──
  const [timeLeft,    setTimeLeft]    = useState(DURATION);
  const [score,       setScore]       = useState(0);
  const [items,       setItems]       = useState([]);
  const [particles,   setParticles]   = useState([]);
  const [flash,       setFlash]       = useState(null);   // { text, color }
  const [comboText,   setComboText]   = useState(null);
  const [catMood,     setCatMood]     = useState('happy'); // happy | scared | excited
  const [shaking,     setShaking]     = useState(false);
  const [frozen,      setFrozen]      = useState(false);
  const [gameOver,    setGameOver]    = useState(false);

  const refs = useRef({
    nextId: 0, particleId: 0,
    combo: 0, wave: 0,
    frozen: false, over: false,
    hungerSum: 0, bonusCoins: 0,
    score: 0,
    flashTimer: null, comboTimer: null, catMoodTimer: null,
  });

  // keep refs.score in sync
  useEffect(() => { refs.current.score = score; }, [score]);
  useEffect(() => { refs.current.frozen = frozen; }, [frozen]);

  // ── Timer countdown ──
  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { refs.current.over = true; setGameOver(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameOver]);

  // ── Wave escalation (every 9s) ──
  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => {
      if (refs.current.over) return;
      refs.current.wave = Math.min(refs.current.wave + 1, 5);
    }, 9000);
    return () => clearInterval(t);
  }, [gameOver]);

  // ── Spawn items ──
  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => {
      if (refs.current.over) return;
      const wave = refs.current.wave;
      const count = 1 + Math.floor(wave / 2); // 1-3 items per tick
      for (let i = 0; i < count; i++) {
        const def = pickItem(level);
        const emoji = def.emojis[Math.floor(Math.random() * def.emojis.length)];
        const baseSpeed = 2.8 + wave * 0.5 + (level > 5 ? 0.4 : 0);
        setItems(prev => [...prev, {
          id:    ++refs.current.nextId,
          emoji, def,
          x:     18 + Math.random() * 330,
          y:     -60 - i * 80,
          speed: baseSpeed + Math.random() * 1.2,
          size:  def.type === 'premium' || def.type === 'mouse' ? 42 : 34,
        }]);
      }
    }, Math.max(320, 750 - refs.current.wave * 60));
    return () => clearInterval(t);
  }, [gameOver, level]);

  // ── Move items down ──
  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => {
      if (refs.current.frozen) return;
      setItems(prev => prev
        .map(it => ({ ...it, y: it.y + it.speed * 2.8 }))
        .filter(it => it.y < 720)
      );
    }, 28);
    return () => clearInterval(t);
  }, [gameOver]);

  // ── Add particle ──
  const addParticle = useCallback((x, y, emoji) => {
    const id = ++refs.current.particleId;
    setParticles(prev => [...prev, { id, x, y, emoji }]);
    setTimeout(() => setParticles(prev => prev.filter(p => p.id !== id)), 900);
  }, []);

  // ── Catch item handler ──
  const catchItem = useCallback((id, e) => {
    if (refs.current.over) return;
    if (e) { e.stopPropagation(); e.preventDefault(); }

    setItems(prev => {
      const it = prev.find(i => i.id === id);
      if (!it) return prev;
      const def = it.def;
      const x = it.x, y = it.y;

      // Powerup: freeze
      if (def.type === 'freeze') {
        setFrozen(true);
        setFlash({ text:'❄️ Заморозка!', color:'#60cfff' });
        setTimeout(() => setFrozen(false), 5000);
        addParticle(x, y, '❄️');
        return prev.filter(i => i.id !== id);
      }

      // Powerup: energy
      if (def.type === 'energy') {
        setScore(s => { refs.current.score = s + 10; return s + 10; });
        setFlash({ text:'⚡ +10!', color:'#ffe040' });
        addParticle(x, y, '⚡');
        return prev.filter(i => i.id !== id);
      }

      // Bad item
      if (def.type === 'bad') {
        refs.current.combo = 0;
        setScore(s => { const n = Math.max(0, s + def.pts); refs.current.score = n; return n; });
        setShaking(true); setTimeout(() => setShaking(false), 520);
        setCatMood('scared');
        clearTimeout(refs.current.catMoodTimer);
        refs.current.catMoodTimer = setTimeout(() => setCatMood('happy'), 1500);
        setFlash({ text:'👟 Фу! ' + def.pts, color:'#ff6060' });
        addParticle(x, y, '💢');
        try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium'); } catch(_) {}
        return prev.filter(i => i.id !== id);
      }

      // Good item
      refs.current.combo = (refs.current.combo || 0) + 1;
      const combo = refs.current.combo;
      const mult  = combo >= 4 ? 4 : combo >= 3 ? 3 : combo >= 2 ? 2 : 1;
      const gained = def.pts * mult;
      refs.current.score = (refs.current.score || 0) + gained;
      setScore(s => s + gained);

      // Bonus coins for premium/mouse
      if (def.coins) refs.current.bonusCoins += def.coins;
      // Hunger reduction
      if (def.hunger) refs.current.hungerSum += def.hunger;

      // Particles
      addParticle(x, y, def.type === 'premium' ? '✨' : def.type === 'mouse' ? '🌟' : '💛');
      if (mult >= 2) {
        setComboText(`×${mult} КОМБО!`);
        clearTimeout(refs.current.comboTimer);
        refs.current.comboTimer = setTimeout(() => setComboText(null), 900);
        setCatMood('excited');
        clearTimeout(refs.current.catMoodTimer);
        refs.current.catMoodTimer = setTimeout(() => setCatMood('happy'), 1200);
      }

      const flashMsg = def.type === 'premium' ? `🌭 +${gained}` : def.type === 'mouse' ? `🐭 +${gained}!` : `+${gained}`;
      setFlash({ text: flashMsg, color: def.type === 'premium' ? '#ffd700' : def.type === 'mouse' ? '#ff9f40' : '#a0ff80' });
      try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'); } catch(_) {}
      return prev.filter(i => i.id !== id);
    });
  }, [addParticle]);

  // ── Compute rewards ──
  const tier = score >= 300 ? 'gold' : score >= 150 ? 'silver' : 'bronze';
  const tierEmoji = tier === 'gold' ? '🥇' : tier === 'silver' ? '🥈' : '🥉';
  const tierLabel = tier === 'gold' ? 'Золото!' : tier === 'silver' ? 'Серебро!' : 'Бронза!';
  const baseCoins = tier === 'gold' ? 90 : tier === 'silver' ? 50 : 20;
  const earnedCoins = earnCoins(baseCoins + refs.current.bonusCoins, level);
  const xpGain = ACTION_XP.minigame_base + Math.min(Math.floor(score / 5) * 4, 80);
  const hungerReduce = Math.min(refs.current.hungerSum, 40);
  const bonusItem = tier === 'gold' ? 'food_premium' : null;

  // ── Circular SVG timer ──
  const R = 22, CIRC = 2 * Math.PI * R;
  const timerPct = timeLeft / DURATION;
  const timerColor = timerPct > 0.5 ? '#38d060' : timerPct > 0.25 ? '#f0a020' : '#e03030';

  // ── Game Over screen ──
  if (gameOver) return (
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,#1a0d00,#2d1500)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:28, animation:'screenFade 0.35s ease' }}>
      <div style={{ fontSize:58 }}>{tierEmoji}</div>
      <div style={{ fontSize:28, fontWeight:900, color:'#f5dfc0', textAlign:'center' }}>{tierLabel}</div>
      <div style={{ fontSize:16, color:'#c8a870', fontWeight:700 }}>Очки: {score}</div>
      <div style={{ background:'rgba(255,255,255,0.09)', borderRadius:22, padding:'18px 32px', width:'100%', textAlign:'center', display:'flex', flexDirection:'column', gap:6 }}>
        <div style={{ fontSize:22, fontWeight:900, color:'#ffd060' }}>+{earnedCoins} 🪙</div>
        <div style={{ fontSize:15, color:'#a0c880', fontWeight:700 }}>+{xpGain} XP</div>
        {hungerReduce > 0 && <div style={{ fontSize:14, color:'#f0c060', fontWeight:700 }}>🍔 Голод −{Math.round(hungerReduce)}%</div>}
        {bonusItem && <div style={{ fontSize:14, color:'#ffd060', fontWeight:800 }}>🎁 Премиум-еда ×1!</div>}
      </div>
      <button
        onClick={() => onComplete(earnedCoins, xpGain, hungerReduce, bonusItem)}
        style={{ background:'linear-gradient(155deg,#ffd060,#f0a020)', border:'none', borderRadius:22, padding:'16px 0', fontSize:18, fontWeight:900, color:'white', cursor:'pointer', boxShadow:'0 6px 0 #c07808', width:'100%', maxWidth:280 }}>
        Забрать! 🎉
      </button>
    </div>
  );

  // ── Gameplay ──
  return (
    <div
      style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,#0d1a00 0%,#1a2d00 40%,#101800 100%)', overflow:'hidden', touchAction:'none', overscrollBehavior:'none',
        animation: shaking ? 'screenShake 0.52s ease' : 'none' }}>

      {/* Header */}
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:20, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px 6px' }}>
        <button onPointerDown={e => { e.stopPropagation(); onBack(); }}
          style={{ background:'rgba(0,0,0,0.5)', border:'1.5px solid rgba(255,255,255,0.18)', borderRadius:12, width:38, height:38, cursor:'pointer', fontSize:18, color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>

        {/* Circular timer */}
        <div style={{ position:'relative', width:52, height:52 }}>
          <svg width="52" height="52" style={{ transform:'rotate(-90deg)' }}>
            <circle cx="26" cy="26" r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4"/>
            <circle cx="26" cy="26" r={R} fill="none" stroke={timerColor} strokeWidth="4"
              strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - timerPct)} strokeLinecap="round"
              style={{ transition:'stroke-dashoffset 1s linear, stroke 0.5s' }}/>
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, color:'white' }}>{timeLeft}</div>
        </div>

        <div style={{ fontSize:20, fontWeight:900, color:'#ffd060' }}>🎯 {score}</div>
      </div>

      {/* Freeze overlay */}
      {frozen && <div style={{ position:'absolute', inset:0, background:'rgba(80,200,255,0.08)', pointerEvents:'none', zIndex:5, borderRadius:0 }}/>}

      {/* Flash message */}
      {flash && <div key={flash.text + score} style={{ position:'absolute', top:'18%', left:'50%', transform:'translateX(-50%)', fontSize:20, fontWeight:900, color: flash.color, textShadow:'0 2px 8px rgba(0,0,0,0.8)', pointerEvents:'none', zIndex:30, animation:'slideUp 0.25s ease, toastIn 0.9s ease forwards', whiteSpace:'nowrap' }}>{flash.text}</div>}

      {/* Combo display */}
      {comboText && <div style={{ position:'absolute', top:'28%', left:0, right:0, textAlign:'center', fontSize:22, fontWeight:900, color:'#ffe040', textShadow:'0 0 16px #ffa000', pointerEvents:'none', zIndex:31, animation:'pulseCrit 0.4s ease infinite' }}>{comboText}</div>}

      {/* Particles */}
      {particles.map(p => (
        <div key={p.id} style={{ position:'absolute', left:p.x, top:p.y, fontSize:22, pointerEvents:'none', zIndex:25, animation:'heartPop 0.9s ease-out forwards' }}>{p.emoji}</div>
      ))}

      {/* Falling items */}
      {items.map(it => (
        <div key={it.id}
          onPointerDown={e => catchItem(it.id, e)}
          style={{ position:'absolute', left:it.x, top:it.y, fontSize:it.size, cursor:'pointer', userSelect:'none', touchAction:'none',
            filter: it.def.glow ? `drop-shadow(0 0 10px ${it.def.glow})` : 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))',
            zIndex:10 }}>
          {it.emoji}
        </div>
      ))}

      {/* Cat mood corner */}
      <div style={{ position:'absolute', bottom:18, right:14, width:70, pointerEvents:'none', zIndex:15,
        filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.7))',
        animation: catMood === 'scared' ? 'catShakeStrong 0.5s linear infinite' : catMood === 'excited' ? 'catFloat 1s ease-in-out infinite' : 'floatY 2.5s ease-in-out infinite' }}>
        <img src={CAT} alt="кот" style={{ width:'100%', display:'block' }} draggable="false"/>
        <div style={{ textAlign:'center', fontSize:16, marginTop:2 }}>
          {catMood === 'scared' ? '😨' : catMood === 'excited' ? '🤩' : '😊'}
        </div>
      </div>

      {/* Wave indicator */}
      <div style={{ position:'absolute', bottom:24, left:16, fontSize:11, color:'rgba(255,255,255,0.45)', fontWeight:700, pointerEvents:'none' }}>
        Волна {refs.current.wave + 1}/6
      </div>

      {/* Hint on start */}
      {score === 0 && timeLeft >= DURATION - 2 && (
        <div style={{ position:'absolute', top:'50%', left:0, right:0, textAlign:'center', color:'rgba(255,255,255,0.38)', fontSize:14, fontWeight:700, pointerEvents:'none' }}>
          Нажимай на еду! 👆
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MINI-GAME 2 — Memory Match 🧩
   ══════════════════════════════════════════════════ */
function MemoryGameScreen({ level, onComplete, onBack }) {
  const EMOJIS = ['🐱','🐭','🐹','🦊','🐻','🐼','🐸','🦁'];
  const DURATION = 60;

  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const makeCards = () => shuffle([...EMOJIS, ...EMOJIS].map((emoji, i) => ({
    id: i, emoji, face: false, matched: false
  })));

  const [cards, setCards] = useState(makeCards);
  const [flipped, setFlipped] = useState([]);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [moves, setMoves] = useState(0);
  const canFlip = useRef(true);

  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setGameOver(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameOver]);

  const flipCard = useCallback((idx) => {
    if (!canFlip.current || gameOver) return;
    if (cards[idx].face || cards[idx].matched) return;
    if (flipped.length >= 2) return;

    const newCards = cards.map((c, i) => i === idx ? { ...c, face: true } : c);
    const newFlipped = [...flipped, idx];
    setCards(newCards);
    setFlipped(newFlipped);
    setMoves(m => m + 1);

    if (newFlipped.length === 2) {
      canFlip.current = false;
      const [a, b] = newFlipped;
      if (newCards[a].emoji === newCards[b].emoji) {
        // Match!
        setTimeout(() => {
          setCards(prev => {
            const updated = prev.map((c, i) =>
              (i === a || i === b) ? { ...c, matched: true } : c
            );
            const allDone = updated.every(c => c.matched);
            if (allDone) { setWon(true); setGameOver(true); }
            return updated;
          });
          setFlipped([]);
          canFlip.current = true;
        }, 350);
      } else {
        // No match, flip back
        setTimeout(() => {
          setCards(prev => prev.map((c, i) =>
            (i === a || i === b) && !c.matched ? { ...c, face: false } : c
          ));
          setFlipped([]);
          canFlip.current = true;
        }, 850);
      }
    }
  }, [cards, flipped, gameOver]);

  const matchedPairs = cards.filter(c => c.matched).length / 2;
  const coinBase = won ? Math.round(60 + timeLeft * 1.5) : Math.max(0, matchedPairs * 12);
  const earnedCoins = earnCoins(coinBase, level);
  const xpGain = won ? ACTION_XP.minigame_base + 30 : ACTION_XP.minigame_base + matchedPairs * 3;

  if (gameOver) return (
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,#0a1828,#1a2e48)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, padding:32, animation:'screenFade 0.3s ease' }}>
      <div style={{ fontSize:64 }}>{won ? '🎉' : '⌛'}</div>
      <div style={{ fontSize:24, fontWeight:900, color:'#f5dfc0', textAlign:'center' }}>{won ? 'Победа!' : 'Время вышло!'}</div>
      <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:20, padding:'18px 36px', textAlign:'center' }}>
        <div style={{ fontSize:15, color:'#c8a060', fontWeight:700 }}>Пар найдено: {matchedPairs}/8</div>
        {won && <div style={{ fontSize:14, color:'#a0d880', fontWeight:700 }}>За {DURATION - timeLeft} сек • {moves} ходов</div>}
        <div style={{ fontSize:22, fontWeight:900, color:'#ffd060', marginTop:6 }}>+{earnedCoins} 🪙</div>
        <div style={{ fontSize:15, color:'#a0c880', fontWeight:700 }}>+{Math.round(xpGain)} XP</div>
      </div>
      <button onClick={() => onComplete(earnedCoins, Math.round(xpGain))} style={{ background:'linear-gradient(155deg,#ffd060,#f0a020)', border:'none', borderRadius:22, padding:'16px 48px', fontSize:18, fontWeight:900, color:'white', cursor:'pointer', boxShadow:'0 6px 0 #c07808', width:'100%', maxWidth:260 }}>
        Забрать! 🎉
      </button>
    </div>
  );

  const cardW = 76, gap = 8, cols = 4;
  return (
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,#0a1828 0%,#1a2e48 60%,#2a1818 100%)', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:10, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px 0' }}>
        <button onClick={onBack} style={{ background:'rgba(10,24,40,0.8)', border:'1.5px solid rgba(255,255,255,0.15)', borderRadius:12, width:38, height:38, cursor:'pointer', fontSize:18, color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
        <div style={{ display:'flex', gap:16 }}>
          <span style={{ fontSize:15, fontWeight:900, color:'#f5dfc0' }}>⏱ {timeLeft}с</span>
          <span style={{ fontSize:15, fontWeight:900, color:'#ffd060' }}>✅ {matchedPairs}/8</span>
        </div>
      </div>
      <div style={{ position:'absolute', top:58, left:16, right:16, height:5, background:'rgba(255,255,255,0.12)', borderRadius:99 }}>
        <div style={{ height:'100%', borderRadius:99, background:'linear-gradient(90deg,#60c8ff,#4090e0)', width:`${(timeLeft/DURATION)*100}%`, transition:'width 1s linear' }}/>
      </div>
      {/* 4×4 grid, centered */}
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', display:'grid', gridTemplateColumns:`repeat(${cols}, ${cardW}px)`, gap, padding:16 }}>
        {cards.map((card, idx) => (
          <div key={card.id} className="memory-card"
            onClick={() => flipCard(idx)}
            style={{
              width:cardW, height:cardW,
              background: card.matched
                ? 'linear-gradient(135deg,#406040,#284028)'
                : card.face
                ? 'linear-gradient(135deg,#4a3020,#2a1a10)'
                : 'linear-gradient(135deg,#1a2a40,#0e1a2c)',
              border: card.matched
                ? '2.5px solid #60c840'
                : card.face
                ? '2.5px solid #8a6040'
                : '2.5px solid #2a4060',
              fontSize: (card.face || card.matched) ? 34 : 22,
              boxShadow: card.matched ? '0 0 12px rgba(96,200,64,0.4)' : '0 4px 12px rgba(0,0,0,0.4)',
            }}>
            {(card.face || card.matched) ? card.emoji : '🐾'}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SHOP SCREEN 🛒
   ══════════════════════════════════════════════════ */
function ShopScreen({ coins, inventory, equipped, achievements, onBuy, onEquip, onBack,
                      ownedDecor, ownedBgs, roomLayout, onBuyDecor, onBuyBg, onSetBg }) {
  const [tab, setTab] = useState('food');
  const tabs = [
    { id:'food',  label:'🍽️ Еда'      },
    { id:'med',   label:'💊 Аптека'   },
    { id:'toys',  label:'🎮 Игрушки'  },
    { id:'acc',   label:'🎀 Аксессуары'},
    { id:'room',  label:'🏠 Комната'  },
  ];

  const itemsByTab = { food: FOOD_ITEMS, med: MED_ITEMS, toys: TOY_ITEMS, acc: ACC_ITEMS };
  const items = itemsByTab[tab] || [];

  return (
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,#f8f0e2,#f0e4cc)', animation:'screenFade 0.3s ease' }}>
      {/* Header */}
      <div style={{ position:'relative', zIndex:5, display:'flex', alignItems:'center', gap:12, padding:'14px 16px 0', borderBottom:'2px solid rgba(0,0,0,0.08)', paddingBottom:12 }}>
        <button onClick={onBack} style={{ background:'rgba(60,20,0,0.1)', border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:12, width:38, height:38, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
        <span style={{ fontSize:20, fontWeight:900, color:'#3a1808', flex:1 }}>Магазин</span>
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', background:'rgba(60,20,0,0.08)', borderRadius:99, border:'1.5px solid rgba(0,0,0,0.1)' }}>
          <span style={{ fontSize:16 }}>🪙</span>
          <span style={{ fontSize:16, fontWeight:900, color:'#3a1808' }}>{coins}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, padding:'12px 16px 8px' }}>
        {tabs.map(t => (
          <button key={t.id}
            className={tab === t.id ? 'shop-tab-active' : ''}
            onClick={() => setTab(t.id)}
            style={{ flex:1, padding:'9px 4px', borderRadius:14, border:'2px solid rgba(0,0,0,0.1)', cursor:'pointer', fontSize:13, fontWeight:800, fontFamily:"'Nunito',sans-serif", background: tab === t.id ? undefined : 'rgba(255,255,255,0.6)', color: tab === t.id ? undefined : '#5a3018', transition:'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Items */}
      <div style={{ overflowY:'auto', padding:'8px 16px 120px', height:'calc(100% - 130px)' }}>

        {/* ── ROOM TAB ── */}
        {tab === 'room' && (
          <div>
            {/* Background section */}
            <div style={{ fontSize:12, fontWeight:800, color:'rgba(60,24,8,0.5)', marginBottom:10, letterSpacing:0.5, textTransform:'uppercase' }}>Фон комнаты</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:18 }}>
              {BG_OVERLAYS.map(bg => {
                const isOwned  = (ownedBgs || []).includes(bg.id);
                const isActive = roomLayout && roomLayout.bg === bg.id;
                const canAfford = coins >= bg.cost;
                return (
                  <div key={bg.id} style={{ background: isActive ? 'rgba(255,210,60,0.18)' : 'rgba(255,255,255,0.55)', border:`2px solid ${isActive ? 'rgba(255,210,60,0.7)' : 'rgba(255,255,255,0.85)'}`, borderRadius:16, padding:'10px 6px', display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                    <div style={{ fontSize:32 }}>{bg.emoji}</div>
                    <div style={{ fontSize:11, fontWeight:800, color:'#3a1808', textAlign:'center' }}>{bg.name}</div>
                    {isOwned ? (
                      <button onClick={() => onSetBg && onSetBg(bg.id)}
                        style={{ marginTop:2, padding:'5px 10px', borderRadius:10, border:'none', cursor:'pointer', fontSize:11, fontWeight:800, fontFamily:"'Nunito',sans-serif", background: isActive ? 'linear-gradient(135deg,#80d060,#40a020)' : 'linear-gradient(135deg,#d0a060,#a07030)', color:'white', boxShadow: isActive ? '0 2px 0 #308010' : '0 2px 0 #705020' }}>
                        {isActive ? '✅ Активен' : 'Выбрать'}
                      </button>
                    ) : (
                      <button onClick={() => canAfford && onBuyBg && onBuyBg(bg)}
                        style={{ marginTop:2, padding:'5px 10px', borderRadius:10, border:'none', cursor: canAfford ? 'pointer' : 'default', fontSize:11, fontWeight:800, fontFamily:"'Nunito',sans-serif", background: canAfford ? 'linear-gradient(135deg,#ffd060,#f0a020)' : '#ccc', color:'white', boxShadow: canAfford ? '0 2px 0 #c07808' : 'none', opacity: canAfford ? 1 : 0.65 }}>
                        🪙 {bg.cost}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Decor section */}
            <div style={{ fontSize:12, fontWeight:800, color:'rgba(60,24,8,0.5)', marginBottom:10, letterSpacing:0.5, textTransform:'uppercase' }}>Декор</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {ROOM_ITEMS.map(item => {
                const isOwned   = !!(ownedDecor || {})[item.id];
                const isPlaced  = !!(roomLayout && roomLayout.items.some(i => i.id === item.id));
                const canAfford = coins >= item.cost;
                return (
                  <div key={item.id} className="item-card" style={{ padding:'12px 8px' }}>
                    <div style={{ fontSize:34 }}>{item.emoji}</div>
                    <div style={{ fontSize:12, fontWeight:900, color:'#3a1808', textAlign:'center' }}>{item.name}</div>
                    {isOwned ? (
                      <div style={{ fontSize:11, fontWeight:700, color: isPlaced ? '#508030' : '#8a6040' }}>
                        {isPlaced ? '✅ В комнате' : '📦 В запасе'}
                      </div>
                    ) : (
                      <button onClick={() => canAfford && onBuyDecor && onBuyDecor(item)}
                        style={{ marginTop:4, padding:'6px 12px', borderRadius:10, border:'none', cursor: canAfford ? 'pointer' : 'default', fontSize:12, fontWeight:800, fontFamily:"'Nunito',sans-serif", background: canAfford ? 'linear-gradient(135deg,#ffd060,#f0a020)' : '#ccc', color:'white', boxShadow: canAfford ? '0 2px 0 #c07808' : 'none', opacity: canAfford ? 1 : 0.65 }}>
                        🪙 {item.cost}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ACCESSORIES TAB ── */}
        {tab === 'acc' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {items.map(item => {
              const owned = !!achievements[item.id];
              const isEquipped = equipped[item.slot] === item.id;
              return (
                <div key={item.id} className="item-card" style={{ padding:'14px 10px' }}>
                  <div style={{ fontSize:44 }}>{item.emoji}</div>
                  <div style={{ fontSize:14, fontWeight:900, color:'#3a1808' }}>{item.name}</div>
                  <div style={{ fontSize:11, color:'#8a6040', textAlign:'center' }}>{item.desc}</div>
                  {owned ? (
                    <button onClick={() => onEquip(item)}
                      style={{ marginTop:6, padding:'8px 16px', borderRadius:12, border:'none', cursor:'pointer', fontSize:13, fontWeight:800, fontFamily:"'Nunito',sans-serif", background: isEquipped ? 'linear-gradient(135deg,#80d060,#50a030)' : 'linear-gradient(135deg,#d0a060,#a07030)', color:'white', boxShadow: isEquipped ? '0 3px 0 #408020' : '0 3px 0 #705020' }}>
                      {isEquipped ? '✅ Снять' : '👗 Надеть'}
                    </button>
                  ) : (
                    <button onClick={() => coins >= item.cost && onBuy(item)}
                      style={{ marginTop:6, padding:'8px 16px', borderRadius:12, border:'none', cursor: coins >= item.cost ? 'pointer' : 'default', fontSize:13, fontWeight:800, fontFamily:"'Nunito',sans-serif", background: coins >= item.cost ? 'linear-gradient(135deg,#ffd060,#f0a020)' : '#ccc', color:'white', boxShadow: coins >= item.cost ? '0 3px 0 #c07808' : 'none', opacity: coins >= item.cost ? 1 : 0.65 }}>
                      🪙 {item.cost}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── FOOD / TOYS TABS ── */}
        {(tab === 'food' || tab === 'toys') && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {items.map(item => {
              const count = inventory[item.id] || 0;
              const canAfford = coins >= item.cost;
              return (
                <div key={item.id} style={{ background:'rgba(255,255,255,0.65)', borderRadius:18, padding:'14px 16px', display:'flex', alignItems:'center', gap:14, border:'2px solid rgba(255,255,255,0.9)', boxShadow:'0 4px 12px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize:42, flexShrink:0 }}>{item.emoji}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:16, fontWeight:900, color:'#3a1808' }}>{item.name}</div>
                    <div style={{ fontSize:12, color:'#8a6040', marginTop:1 }}>{item.desc}</div>
                    <div style={{ display:'flex', gap:8, marginTop:4, flexWrap:'wrap' }}>
                      {item.hunger && <span style={{ fontSize:11, color:'#e05020', fontWeight:700 }}>🍔{item.hunger > 0 ? '+' : ''}{item.hunger}</span>}
                      {item.mood > 0 && tab === 'food' && <span style={{ fontSize:11, color:'#e08020', fontWeight:700 }}>😺+{item.mood}</span>}
                      {item.health > 0 && <span style={{ fontSize:11, color:'#20a040', fontWeight:700 }}>❤️+{item.health}</span>}
                      {item.mood && tab === 'toys' && <span style={{ fontSize:11, color:'#e08020', fontWeight:700 }}>😺+{item.mood}</span>}
                      <span style={{ fontSize:11, color:'#6080e0', fontWeight:700 }}>✨+{item.xp}XP</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    {count > 0 && <div style={{ fontSize:12, fontWeight:900, color:'#5a8020', background:'rgba(90,128,32,0.12)', borderRadius:99, padding:'2px 8px' }}>×{count}</div>}
                    <button onClick={() => canAfford && onBuy(item)}
                      style={{ padding:'9px 14px', borderRadius:13, border:'none', cursor: canAfford ? 'pointer' : 'default', fontSize:13, fontWeight:900, fontFamily:"'Nunito',sans-serif", background: canAfford ? 'linear-gradient(135deg,#ffd060,#f0a020)' : '#ccc', color:'white', boxShadow: canAfford ? '0 3px 0 #c07808' : 'none', opacity: canAfford ? 1 : 0.65, whiteSpace:'nowrap' }}>
                      🪙 {item.cost}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   DAILY REWARD MODAL 🎁
   ══════════════════════════════════════════════════ */
function DailyRewardModal({ streak, onClaim }) {
  const rewardIdx = ((streak || 1) - 1) % 7;
  const reward = DAILY_REWARDS[rewardIdx];
  const days = [1,2,3,4,5,6,7];

  return (
    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.75)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:24, backdropFilter:'blur(6px)' }}>
      <div style={{ background:'linear-gradient(160deg,#1a0d00,#2d1500)', borderRadius:28, padding:'28px 22px', maxWidth:320, width:'100%', boxShadow:'0 12px 50px rgba(0,0,0,0.6)', border:'2.5px solid rgba(255,200,80,0.5)', animation:'modalIn 0.4s ease', textAlign:'center' }}>
        <div style={{ fontSize:52, animation:'dailyBounce 1.2s ease-in-out infinite' }}>{reward.emoji}</div>
        <div style={{ fontSize:22, fontWeight:900, color:'#f5dfc0', marginTop:10 }}>Ежедневная награда!</div>
        <div style={{ fontSize:14, color:'#c8a060', marginTop:4 }}>Серия: {streak} {streak >= 7 ? '🔥🔥🔥' : streak >= 5 ? '🔥🔥' : streak >= 3 ? '🔥' : ''} дней подряд</div>

        {/* Streak dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:14 }}>
          {days.map(d => (
            <div key={d} style={{ width:30, height:30, borderRadius:10, background: d <= streak ? 'linear-gradient(135deg,#ffd060,#f0a020)' : 'rgba(255,255,255,0.08)', border:`2px solid ${d <= streak ? '#c07808' : 'rgba(255,255,255,0.15)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>
              {d <= streak ? '✓' : d}
            </div>
          ))}
        </div>

        {/* Reward */}
        <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:18, padding:'16px 20px', marginTop:18, display:'flex', justifyContent:'space-around' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:28, fontWeight:900, color:'#ffd060' }}>+{reward.coins}</div>
            <div style={{ fontSize:12, color:'#c8a060' }}>🪙 Монет</div>
          </div>
          <div style={{ width:1, background:'rgba(255,255,255,0.1)' }}/>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:28, fontWeight:900, color:'#a0c880' }}>+{reward.xp}</div>
            <div style={{ fontSize:12, color:'#c8a060' }}>✨ XP</div>
          </div>
          {reward.bonus && (
            <>
              <div style={{ width:1, background:'rgba(255,255,255,0.1)' }}/>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:28 }}>🍗</div>
                <div style={{ fontSize:11, color:'#c8a060' }}>Бонус!</div>
              </div>
            </>
          )}
        </div>

        <button onClick={onClaim} style={{ marginTop:20, width:'100%', background:'linear-gradient(155deg,#ffd060,#f0a020)', border:'none', borderRadius:18, padding:'16px', fontSize:17, fontWeight:900, color:'white', cursor:'pointer', boxShadow:'0 6px 0 #c07808', fontFamily:"'Nunito',sans-serif" }}>
          Забрать! 🎁
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   LEVEL UP MODAL ⭐
   ══════════════════════════════════════════════════ */
function LevelUpModal({ level, onClose }) {
  return (
    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.7)', zIndex:250, display:'flex', alignItems:'center', justifyContent:'center', padding:24, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'linear-gradient(160deg,#1a0a00,#2a1200)', borderRadius:28, padding:'32px 24px', maxWidth:300, width:'100%', textAlign:'center', border:'2.5px solid rgba(255,210,60,0.6)', boxShadow:'0 12px 50px rgba(255,180,0,0.25)', animation:'levelUp 0.5s ease' }}>
        <div style={{ fontSize:70 }}>⭐</div>
        <div style={{ fontSize:28, fontWeight:900, color:'#ffd060', marginTop:8 }}>УРОВЕНЬ {level}!</div>
        <div style={{ fontSize:14, color:'#c8a060', marginTop:8 }}>
          {level >= 15 ? '🔥 +30% монет, −15% распад' :
           level >= 10 ? '🌟 +20% монет, −10% распад' :
           level >= 5  ? '✨ +10% монет, −5% распад'  :
                         'Продолжай ухаживать за котиком!'}
        </div>
        <button onClick={onClose} style={{ marginTop:20, width:'100%', background:'linear-gradient(155deg,#ffd060,#f0a020)', border:'none', borderRadius:18, padding:'14px', fontSize:16, fontWeight:900, color:'white', cursor:'pointer', boxShadow:'0 5px 0 #c07808', fontFamily:"'Nunito',sans-serif" }}>
          Ура! 🎉
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   TOAST NOTIFICATION
   ══════════════════════════════════════════════════ */
function Toast({ msg }) {
  return (
    <div style={{ position:'absolute', bottom:200, left:'50%', transform:'translateX(-50%)', background:'rgba(20,8,0,0.88)', borderRadius:99, padding:'8px 20px', fontSize:14, fontWeight:800, color:'white', zIndex:400, whiteSpace:'nowrap', animation:'toastIn 2s ease forwards', pointerEvents:'none', backdropFilter:'blur(4px)', border:'1.5px solid rgba(255,255,255,0.15)' }}>
      {msg}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   THOUGHT BUBBLE
   ══════════════════════════════════════════════════ */
function ThoughtBubble({ emoji }) {
  return (
    <div style={{ position:'relative', animation:'thoughtBounce 2s ease-in-out infinite' }}>
      <div style={{ position:'absolute', bottom:-6, left:12, width:9, height:9, borderRadius:'50%', background:'white', border:'2.5px solid #1a0800' }}/>
      <div style={{ position:'absolute', bottom:-13, left:7, width:6, height:6, borderRadius:'50%', background:'white', border:'2px solid #1a0800' }}/>
      <div style={{ background:'white', border:'3px solid #1a0800', borderRadius:22, padding:'5px 8px', fontSize:26, boxShadow:'0 4px 14px rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', minWidth:46, animation:'bubblePop 0.3s ease' }}>
        {emoji}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PAW INDICATOR
   ══════════════════════════════════════════════════ */
// Per-stat themed gradients matching the mockup style
const PAW_THEMES = {
  hunger:  { bg:'linear-gradient(145deg,#fff4d8,#ffe8a8)', shadow:'rgba(200,140,20,0.3)',  border:'rgba(220,170,60,0.5)'  },
  toilet:  { bg:'linear-gradient(145deg,#d8f8e8,#a8eccc)', shadow:'rgba(20,160,80,0.3)',   border:'rgba(40,180,100,0.5)'  },
  fatigue: { bg:'linear-gradient(145deg,#dce8ff,#b8d0ff)', shadow:'rgba(60,80,200,0.25)',  border:'rgba(80,110,220,0.45)' },
  mood:    { bg:'linear-gradient(145deg,#e8e8ee,#d0d0dc)', shadow:'rgba(60,60,100,0.3)',   border:'rgba(80,80,140,0.4)'   },
  health:  { bg:'linear-gradient(145deg,#ffffff,#f0f8f0)', shadow:'rgba(30,140,60,0.25)',  border:'rgba(50,160,80,0.4)'   },
};

function PawIndicator({ pawId, icon, label, fill, critical, onClick }) {
  const theme = PAW_THEMES[pawId] || PAW_THEMES.hunger;
  const barColor = fill > 60 ? '#52c860' : fill > 40 ? '#f0b030' : fill > 20 ? '#e87030' : '#e83030';
  const critBg = 'linear-gradient(145deg,#fff0ec,#ffd8cc)';
  const critBorder = 'rgba(220,70,50,0.55)';
  const critShadow = 'rgba(220,60,40,0.4)';
  return (
    <div onClick={onClick} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:'pointer' }}>
      <div
        onPointerDown={e => e.currentTarget.style.transform='scale(0.85)'}
        onPointerUp={e => e.currentTarget.style.transform='scale(1)'}
        onPointerLeave={e => e.currentTarget.style.transform='scale(1)'}
        style={{
          position:'relative', width:56, height:56, borderRadius:20,
          background: critical ? critBg : theme.bg,
          boxShadow: critical
            ? `0 6px 16px ${critShadow}, inset 0 1.5px 0 rgba(255,255,255,0.95), 0 2px 0 rgba(180,80,60,0.2)`
            : `0 6px 16px ${theme.shadow}, inset 0 1.5px 0 rgba(255,255,255,0.95), 0 2px 0 rgba(100,60,20,0.12)`,
          display:'flex', alignItems:'center', justifyContent:'center',
          overflow:'hidden', transition:'transform 0.12s',
          border:`2px solid ${critical ? critBorder : theme.border}`,
          animation: critical ? 'pulseCrit 0.75s ease-in-out infinite' : 'none',
        }}>
        {/* Subtle fill bar at the bottom — shows stat level */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, height:`${Math.min(fill,100)*0.38}%`,
          background:`linear-gradient(to top, ${barColor}80, transparent)`,
          transition:'height 0.6s ease',
        }}/>
        {/* Top shine */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'40%', background:'linear-gradient(to bottom,rgba(255,255,255,0.6),transparent)', borderRadius:'20px 20px 0 0', pointerEvents:'none' }}/>
        <span style={{
          fontSize:28, lineHeight:1, zIndex:1,
          animation: critical ? 'pawShake 0.42s linear infinite' : 'none',
          display:'block',
          filter: critical ? 'drop-shadow(0 0 4px rgba(255,80,50,0.6))' : 'none',
        }}>{icon}</span>
      </div>
      <span style={{ fontSize:9, fontWeight:800, color: critical ? '#c03010' : '#6a3810', letterSpacing:0.3 }}>{label}</span>
    </div>
  );
}


/* ══════════════════════════════════════════════════
   FLOATING HEART
   ══════════════════════════════════════════════════ */
function FloatingHeart({ id, x, y, onDone, emoji }) {
  const defaults = ['❤️','💕','💖','💗'];
  const e = emoji || defaults[id % defaults.length];
  return (
    <div onAnimationEnd={onDone} style={{ position:'absolute', left:x, top:y||'38%', fontSize:22, animation:'heartPop 1.1s ease-out forwards', pointerEvents:'none', zIndex:30 }}>
      {e}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   NAV ITEM
   ══════════════════════════════════════════════════ */
function NavItem({ icon, label, active, dot, onClick }) {
  return (
    <button onClick={onClick} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, background:'none', border:'none', cursor:'pointer', padding:'8px 4px 4px', position:'relative', fontFamily:"'Nunito',sans-serif" }}>
      {dot && <div style={{ position:'absolute', top:6, right:'50%', marginRight:-16, width:9, height:9, borderRadius:99, background:'#ff4466', border:'2px solid #f0e4cc' }}/>}
      <div style={{
        width:42, height:42, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center',
        background: active ? 'linear-gradient(145deg,#fff3e0,#ffe0b0)' : 'transparent',
        boxShadow: active ? '0 3px 10px rgba(180,100,30,0.25), inset 0 1px 0 rgba(255,255,255,0.8)' : 'none',
        transition:'background 0.2s, box-shadow 0.2s',
      }}>
        <span style={{ fontSize:22, filter: active ? 'none' : 'grayscale(0.3) opacity(0.6)' }}>{icon}</span>
      </div>
      <span style={{ fontSize:10, fontWeight: active ? 900 : 600, color: active ? '#b06020' : '#a08060' }}>{label}</span>
    </button>
  );
}

/* ══════════════════════════════════════════════════
   TIMEZONE MODAL (first-run, one-time)
   ══════════════════════════════════════════════════ */
function TimezoneModal({ onSelect }) {
  const [search, setSearch] = React.useState('');
  const filtered = TIMEZONES.filter(tz =>
    tz.label.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.88)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:16, backdropFilter:'blur(6px)' }}>
      <div style={{ background:'linear-gradient(160deg,#1a1030,#0a0820)', borderRadius:28,
        padding:'28px 20px 20px', width:'100%', maxWidth:340,
        boxShadow:'0 12px 50px rgba(0,0,0,0.8), 0 0 0 1.5px rgba(160,120,255,0.3)',
        border:'1.5px solid rgba(160,120,255,0.25)', animation:'modalIn 0.35s ease' }}>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:42, marginBottom:8 }}>🌍</div>
          <div style={{ fontSize:20, fontWeight:900, color:'#f0e0ff', letterSpacing:-0.3 }}>Твой часовой пояс</div>
          <div style={{ fontSize:12, color:'#9080b0', marginTop:6, lineHeight:1.5 }}>
            Выбери один раз — это нужно для правильного расписания заказов и ночных механик.
            <br/><span style={{ color:'#d090ff', fontWeight:700 }}>Изменить потом нельзя.</span>
          </div>
        </div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Поиск города или UTC..."
          style={{ width:'100%', boxSizing:'border-box', padding:'10px 14px', borderRadius:14,
            border:'1.5px solid rgba(160,120,255,0.3)', background:'rgba(255,255,255,0.06)',
            color:'#f0e0ff', fontSize:13, fontFamily:"'Nunito',sans-serif", marginBottom:10,
            outline:'none' }}
        />
        <div style={{ maxHeight:260, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}>
          {filtered.map(tz => (
            <button key={tz.value + tz.label} onClick={() => onSelect(tz.value)}
              style={{ padding:'11px 14px', borderRadius:12, border:'1px solid rgba(160,120,255,0.2)',
                background:'rgba(255,255,255,0.04)', color:'#d0c0f0', fontSize:13, fontWeight:700,
                cursor:'pointer', textAlign:'left', fontFamily:"'Nunito',sans-serif",
                transition:'background 0.15s' }}
              onPointerOver={e => e.currentTarget.style.background='rgba(160,120,255,0.15)'}
              onPointerOut={e  => e.currentTarget.style.background='rgba(255,255,255,0.04)'}>
              {tz.label}
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', color:'#6050a0', padding:16, fontSize:13 }}>Не найдено</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   FREELANCE SCREEN
   ══════════════════════════════════════════════════ */
function FreelanceScreen({ freelance, timezone, coins, level, onTakeOrder, onBoost, onClaimOrder, onBack }) {
  const [now, setNow] = React.useState(Date.now());
  const [confirmOrder, setConfirmOrder] = React.useState(null); // { typeId, reward? }
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { active, fatigue, urgentOffer, completedOrder } = freelance;
  const fatigueLeft   = fatigue    ? Math.max(0, fatigue.endTime    - now) : 0;
  const urgentLeft    = urgentOffer ? Math.max(0, urgentOffer.endTime - now) : 0;
  const orderLeft     = active     ? Math.max(0, active.endTime     - now) : 0;
  const orderDuration = active     ? (ORDER_TYPES.find(t => t.id === active.type)?.durationMs || 1) : 1;
  const orderPct      = active     ? Math.max(0, 1 - orderLeft / orderDuration) : 0;
  const boostReady    = canBoostNow(active);
  const boostCd       = boostCooldownLeft(active);
  const fatigueOk     = !fatigue || fatigueLeft <= 20 * 60000;

  // Available order types (exclude urgent — shown separately)
  const availableOrders = ORDER_TYPES.filter(t => !t.urgent);

  const sectionStyle = { padding:'0 16px', marginBottom:16 };

  return (
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(170deg,#0e1420,#08101c)',
      fontFamily:"'Nunito',sans-serif", display:'flex', flexDirection:'column', animation:'screenFade 0.3s ease' }}>

      {/* Header */}
      <div style={{ padding:'14px 16px 10px', display:'flex', alignItems:'center', gap:10,
        borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.07)', border:'none',
          borderRadius:12, width:38, height:38, cursor:'pointer', fontSize:18, color:'#a0c0ff',
          display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
        <div>
          <div style={{ fontSize:18, fontWeight:900, color:'#c0e0ff', letterSpacing:-0.3 }}>💼 Работа</div>
          <div style={{ fontSize:11, color:'#5070a0', fontWeight:700 }}>Фриланс-заказы</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5,
          background:'rgba(255,200,60,0.12)', borderRadius:99, padding:'4px 12px',
          border:'1px solid rgba(255,200,60,0.25)' }}>
          <span style={{ fontSize:16 }}>🪙</span>
          <span style={{ fontSize:15, fontWeight:900, color:'#f5d060' }}>{coins}</span>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', paddingTop:12, paddingBottom:80 }}>

        {/* ── СРОЧНЫЙ ДЕДЛАЙН БАННЕР ── */}
        {urgentOffer && urgentLeft > 0 && (
          <div style={{ ...sectionStyle }}>
            <div style={{ background:'linear-gradient(135deg,#3a0808,#500c0c)',
              border:'2px solid #d04030', borderRadius:20, padding:'16px',
              boxShadow:'0 4px 24px rgba(200,40,20,0.4)', animation:'pulseCrit 1s ease-in-out infinite' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <span style={{ fontSize:26 }}>🚨</span>
                <div>
                  <div style={{ fontSize:15, fontWeight:900, color:'#ff6050' }}>СРОЧНЫЙ ДЕДЛАЙН!</div>
                  <div style={{ fontSize:11, color:'#d06050', fontWeight:700 }}>Исчезнет через: {formatCountdownMs(urgentLeft)}</div>
                </div>
              </div>
              <div style={{ fontSize:12, color:'#f0a090', marginBottom:12 }}>
                💰 {urgentOffer.baseReward} монет · 10 часов работы · до +20% бонус
              </div>
              {fatigue && fatigueLeft > 20 * 60000 ? (
                <div style={{ fontSize:12, color:'#a06050', textAlign:'center', padding:'8px',
                  background:'rgba(0,0,0,0.3)', borderRadius:10 }}>
                  ⛔ Нельзя взять во время усталости (осталось {formatCountdownMs(fatigueLeft)})
                </div>
              ) : (
                <button onClick={() => !active && setConfirmOrder({ typeId:'urgent', reward: urgentOffer.baseReward })}
                  disabled={!!active}
                  style={{ width:'100%', padding:'12px', borderRadius:14, border:'none', cursor: active ? 'not-allowed' : 'pointer',
                    background: active ? 'rgba(100,40,30,0.5)' : 'linear-gradient(135deg,#e03020,#c02010)',
                    color:'white', fontSize:14, fontWeight:900, fontFamily:"'Nunito',sans-serif",
                    opacity: active ? 0.5 : 1 }}>
                  {active ? 'Сначала заверши текущий заказ' : '🚀 Взять срочный заказ'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── АКТИВНЫЙ ЗАКАЗ ── */}
        {active && orderLeft > 0 && (() => {
          const type = ORDER_TYPES.find(t => t.id === active.type);
          const totalReward = Math.round(active.baseReward * (1 + active.bonusPct));
          return (
            <div style={{ ...sectionStyle }}>
              <div style={{ background:'rgba(255,255,255,0.04)', border:'1.5px solid rgba(255,255,255,0.10)',
                borderRadius:20, padding:'18px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <span style={{ fontSize:26 }}>{type?.icon}</span>
                  <div>
                    <div style={{ fontSize:14, fontWeight:900, color:'#d0e8ff' }}>{type?.label}</div>
                    <div style={{ fontSize:11, color:'#6080a0', fontWeight:700 }}>
                      В процессе • {formatCountdownMs(orderLeft)} осталось
                    </div>
                  </div>
                  <div style={{ marginLeft:'auto', textAlign:'right' }}>
                    <div style={{ fontSize:18, fontWeight:900, color:'#f5d060' }}>🪙 {totalReward}</div>
                    {active.bonusPct > 0 && <div style={{ fontSize:10, color:'#90d040', fontWeight:700 }}>+{Math.round(active.bonusPct*100)}% бонус</div>}
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ height:10, background:'rgba(255,255,255,0.08)', borderRadius:99,
                  overflow:'hidden', marginBottom:14, boxShadow:'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
                  <div style={{ height:'100%', borderRadius:99, transition:'width 1s linear',
                    background:`linear-gradient(90deg, ${type?.color || '#5080c0'}88, ${type?.color || '#5080c0'})`,
                    width:`${orderPct * 100}%`, boxShadow:`0 1px 6px ${type?.color || '#5080c0'}88` }}/>
                </div>
                {/* Boost button */}
                {type && type.maxBoosts > 0 && (
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <button onClick={onBoost} disabled={!boostReady}
                      style={{ flex:1, padding:'11px', borderRadius:14, border:`1.5px solid ${boostReady ? '#60c060' : 'rgba(255,255,255,0.1)'}`,
                        background: boostReady ? 'rgba(60,160,60,0.18)' : 'rgba(255,255,255,0.03)',
                        color: boostReady ? '#80e080' : '#405060', fontSize:13, fontWeight:900,
                        cursor: boostReady ? 'pointer' : 'not-allowed', fontFamily:"'Nunito',sans-serif" }}>
                      ⚡ Ускориться
                      {boostReady ? ' (+10%, −30 мин)' : ` (${formatCountdownMs(boostCd)})`}
                    </button>
                    <div style={{ fontSize:11, color:'#4060a0', fontWeight:700, textAlign:'right', minWidth:60 }}>
                      {active.boostsUsed}/{type.maxBoosts} исп.
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── ЗАКАЗ ВЫПОЛНЕН ── */}
        {completedOrder && (
          <div style={{ ...sectionStyle }}>
            <div style={{ background:'linear-gradient(135deg,rgba(60,160,30,0.18),rgba(80,200,40,0.08))',
              border:'2px solid rgba(80,200,40,0.4)', borderRadius:20, padding:'20px 16px',
              textAlign:'center', boxShadow:'0 4px 24px rgba(80,200,40,0.2)' }}>
              <div style={{ fontSize:36, marginBottom:8 }}>🎉</div>
              <div style={{ fontSize:16, fontWeight:900, color:'#80e050', marginBottom:4 }}>Заказ выполнен!</div>
              <div style={{ fontSize:26, fontWeight:900, color:'#f5d060', marginBottom:16 }}>
                🪙 +{completedOrder.reward}
              </div>
              <button onClick={onClaimOrder} style={{ padding:'14px 32px', borderRadius:18, border:'none',
                background:'linear-gradient(135deg,#50c030,#40a020)', color:'white', fontSize:15, fontWeight:900,
                cursor:'pointer', fontFamily:"'Nunito',sans-serif", boxShadow:'0 5px 18px rgba(80,200,40,0.4)',
                width:'100%' }}>
                Забрать награду 🐾
              </button>
            </div>
          </div>
        )}

        {/* ── УСТАЛОСТЬ ── */}
        {fatigue && fatigueLeft > 0 && (
          <div style={{ ...sectionStyle }}>
            <div style={{ background:'rgba(120,80,20,0.18)', border:'1.5px solid rgba(180,120,40,0.3)',
              borderRadius:16, padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:28 }}>😴</span>
              <div>
                <div style={{ fontSize:13, fontWeight:900, color:'#d0a060' }}>Хозяин устал</div>
                <div style={{ fontSize:11, color:'#806040', fontWeight:700 }}>
                  Отдых ещё: {formatCountdownMs(fatigueLeft)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ВЫБОР ЗАКАЗА ── */}
        {!active && (
          <div style={{ ...sectionStyle }}>
            <div style={{ fontSize:12, fontWeight:800, color:'#4060a0', letterSpacing:1,
              textTransform:'uppercase', marginBottom:10 }}>
              {fatigue && fatigueLeft > 0 ? '🔒 Заказы заблокированы — отдыхаем' : 'Доступные заказы'}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {availableOrders.map(type => {
                const disabled = !!(fatigue && fatigueLeft > 0) || !!completedOrder;
                return (
                  <div key={type.id} onClick={() => !disabled && setConfirmOrder({ typeId: type.id })}
                    style={{ background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                      border:`1.5px solid ${disabled ? 'rgba(255,255,255,0.06)' : type.color + '44'}`,
                      borderRadius:18, padding:'16px', cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.45 : 1, transition:'opacity 0.2s' }}
                    onPointerDown={e => { if (!disabled) e.currentTarget.style.transform='scale(0.98)'; }}
                    onPointerUp={e   => { e.currentTarget.style.transform='scale(1)'; }}
                    onPointerLeave={e=> { e.currentTarget.style.transform='scale(1)'; }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                      <span style={{ fontSize:28, lineHeight:1 }}>{type.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:900, color:'#c0d8f0' }}>{type.label}</div>
                        <div style={{ fontSize:11, color:'#4060a0', fontWeight:700, margin:'3px 0' }}>{type.desc}</div>
                        <div style={{ display:'flex', gap:10, marginTop:6, flexWrap:'wrap' }}>
                          <span style={{ fontSize:11, background:`${type.color}22`, color:type.color,
                            borderRadius:8, padding:'2px 8px', fontWeight:800 }}>
                            🪙 {type.min}–{type.max}
                          </span>
                          <span style={{ fontSize:11, background:'rgba(255,255,255,0.06)', color:'#6080a0',
                            borderRadius:8, padding:'2px 8px', fontWeight:700 }}>
                            ⏱ {fmtDuration(type.durationMs)}
                          </span>
                          {type.maxBoosts > 0 && (
                            <span style={{ fontSize:11, background:'rgba(80,200,80,0.12)', color:'#60c060',
                              borderRadius:8, padding:'2px 8px', fontWeight:700 }}>
                              ⚡×{type.maxBoosts}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── СТАТИСТИКА ── */}
        <div style={{ ...sectionStyle }}>
          <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:14, padding:'12px 14px' }}>
            <div style={{ fontSize:10, fontWeight:800, color:'#304060', letterSpacing:1,
              textTransform:'uppercase', marginBottom:6 }}>Статистика работы</div>
            <div style={{ fontSize:12, color:'#5080a0', fontWeight:700 }}>
              Выполнено заказов: <span style={{ color:'#80c0f0' }}>{freelance.completedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ПОДТВЕРЖДЕНИЕ ЗАКАЗА ── */}
      {confirmOrder && (() => {
        const type = ORDER_TYPES.find(t => t.id === confirmOrder.typeId);
        const reward = confirmOrder.reward != null
          ? confirmOrder.reward
          : `${type?.min}–${type?.max}`;
        return (
          <div style={{ position:'absolute', inset:0, zIndex:200, background:'rgba(0,0,0,0.75)',
            display:'flex', alignItems:'center', justifyContent:'center', padding:20,
            backdropFilter:'blur(5px)', animation:'screenFade 0.2s ease' }}>
            <div style={{ background:'linear-gradient(160deg,#141e30,#0a1020)',
              borderRadius:24, padding:'28px 22px', width:'100%', maxWidth:320,
              boxShadow:'0 12px 50px rgba(0,0,0,0.8), 0 0 0 1.5px rgba(80,140,255,0.25)',
              border:'1.5px solid rgba(80,140,255,0.2)', textAlign:'center' }}>
              <div style={{ fontSize:38, marginBottom:10 }}>{type?.icon}</div>
              <div style={{ fontSize:18, fontWeight:900, color:'#c0d8ff', marginBottom:6 }}>Вы уверены?</div>
              <div style={{ fontSize:14, fontWeight:800, color:'#80a0d0', marginBottom:4 }}>{type?.label}</div>
              <div style={{ fontSize:12, color:'#4060a0', marginBottom:16, lineHeight:1.5 }}>
                {type?.desc}<br/>
                <span style={{ color:'#f5d060', fontWeight:800 }}>🪙 {reward}</span>
                {'  '}
                <span style={{ color:'#6080a0', fontWeight:700 }}>⏱ {fmtDuration(type?.durationMs || 0)}</span>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setConfirmOrder(null)}
                  style={{ flex:1, padding:'13px', borderRadius:14, border:'1.5px solid rgba(255,255,255,0.12)',
                    background:'rgba(255,255,255,0.05)', color:'#7090b0', fontSize:14, fontWeight:800,
                    cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>
                  Отмена
                </button>
                <button onClick={() => {
                    onTakeOrder(confirmOrder.typeId, confirmOrder.reward);
                    setConfirmOrder(null);
                  }}
                  style={{ flex:1, padding:'13px', borderRadius:14, border:'none',
                    background:`linear-gradient(135deg, ${type?.color || '#5080c0'}, ${type?.color || '#3060a0'})`,
                    color:'white', fontSize:14, fontWeight:900, cursor:'pointer', fontFamily:"'Nunito',sans-serif",
                    boxShadow:`0 4px 18px ${type?.color || '#3060a0'}66` }}>
                  Взять! 💼
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCARED LEVEL MODAL
   ══════════════════════════════════════════════════ */
function ScaredModal({ scaredLvl, onClose }) {
  const info = scaredIcon(scaredLvl);
  const tips = scaredLvl >= 85
    ? ['😱 Кот в панике! Немедленно погладь его.', 'Лекарства, туалет и купание — недоступны.', 'Еда и сон работают очень плохо.']
    : scaredLvl >= 70
    ? ['🙀 Кот очень напуган.', 'Туалет и ванная — заблокированы.', 'Погладь кота или поиграй с ним.']
    : scaredLvl >= 50
    ? ['😿 Кот испуган.', 'Еда и игра восстанавливают меньше.', 'Регулярно гладь кота для успокоения.']
    : scaredLvl >= 30
    ? ['Кот немного тревожится.', 'Старайся почаще его гладить.']
    : ['😺 Кот спокоен и доволен!', 'Продолжай заботиться о нём.'];

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.72)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(5px)' }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'linear-gradient(160deg,#1a0a08,#100408)',
        borderRadius:28, padding:'28px 22px 24px', maxWidth:320, width:'100%',
        boxShadow:`0 12px 50px rgba(0,0,0,0.8), 0 0 0 1.5px ${info.color}44`,
        border:`1.5px solid ${info.color}33`, animation:'modalIn 0.35s ease' }}>
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <div style={{ fontSize:52, marginBottom:6, animation: info.pulse ? 'pulseCrit 1s ease-in-out infinite' : 'none' }}>
            {info.emoji}
          </div>
          <div style={{ fontSize:20, fontWeight:900, color:'#f5e0d0', letterSpacing:-0.3 }}>Уровень Напуганности</div>
          <div style={{ fontSize:14, fontWeight:800, color: info.color, marginTop:4 }}>{info.label}</div>
        </div>
        {/* Scared bar */}
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:700,
            color:'rgba(255,255,255,0.4)', marginBottom:5 }}>
            <span>Спокойствие</span>
            <span style={{ color: info.color, fontWeight:900 }}>{Math.round(scaredLvl)}/100</span>
            <span>Паника</span>
          </div>
          <div style={{ height:12, background:'rgba(255,255,255,0.08)', borderRadius:99, overflow:'hidden',
            boxShadow:'inset 0 2px 4px rgba(0,0,0,0.5)' }}>
            <div style={{ height:'100%', borderRadius:99, transition:'width 0.5s ease',
              background:`linear-gradient(90deg, #60d080, #e08030, ${info.color})`,
              width:`${scaredLvl}%`, boxShadow:`0 1px 8px ${info.color}88` }}/>
          </div>
        </div>
        {/* Tips */}
        <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:14, padding:'12px 14px', marginBottom:18 }}>
          {tips.map((tip, i) => (
            <div key={i} style={{ fontSize:12, color: i === 0 ? '#f0d0b0' : 'rgba(255,255,255,0.5)',
              fontWeight: i === 0 ? 800 : 600, marginBottom: i < tips.length-1 ? 5 : 0, lineHeight:1.4 }}>
              {tip}
            </div>
          ))}
        </div>
        <div style={{ background:'rgba(255,200,100,0.08)', borderRadius:12, padding:'10px 14px',
          border:'1px solid rgba(255,200,100,0.2)', marginBottom:18 }}>
          <div style={{ fontSize:11, fontWeight:800, color:'#d0a050', marginBottom:3 }}>Как успокоить:</div>
          <div style={{ fontSize:11, color:'rgba(255,220,160,0.7)', lineHeight:1.5 }}>
            👋 Погладь кота (−8) &nbsp;•&nbsp; 🎮 Мини-игра (−3)<br/>
            🍖 Корми из рук (−5) &nbsp;•&nbsp; 🎁 Ежедневка (−4)<br/>
            🧸 Игрушка (−1)
          </div>
        </div>
        <button onClick={onClose} style={{ width:'100%', padding:'14px', borderRadius:16, border:'none',
          background:`linear-gradient(135deg, ${info.color}dd, ${info.color}99)`,
          color:'white', fontSize:15, fontWeight:900, cursor:'pointer', fontFamily:"'Nunito',sans-serif",
          boxShadow:`0 4px 18px ${info.color}55` }}>
          Понятно {info.emoji}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   TRUST MODAL
   ══════════════════════════════════════════════════ */
function TrustModal({ trustPoints, onClose }) {
  const prog  = trustProgress(trustPoints);
  const stage = getTrustStage(prog.lv);
  const nextStage = getTrustStage(prog.lv + 1);
  const isMax = prog.lv >= 50;

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.72)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(5px)' }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'linear-gradient(160deg,#1a0e2e,#0e0818)',
        borderRadius:28, padding:'28px 22px 24px', maxWidth:320, width:'100%',
        boxShadow:`0 12px 50px rgba(0,0,0,0.7), 0 0 0 1.5px ${stage.color}55`,
        border:`1.5px solid ${stage.color}44`,
        animation:'modalIn 0.32s ease',
      }}>
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:46, lineHeight:1, marginBottom:8 }}>{stage.emoji}</div>
          <div style={{ fontSize:20, fontWeight:900, color:'#f0deff', letterSpacing:-0.3 }}>Уровень Доверия</div>
          <div style={{ marginTop:4, fontSize:13, fontWeight:700, color: stage.color }}>{stage.name}</div>
        </div>

        {/* Level badge */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:18 }}>
          <div style={{
            background:`linear-gradient(135deg, ${stage.color}33, ${stage.color}11)`,
            border:`1.5px solid ${stage.color}66`,
            borderRadius:16, padding:'8px 20px', textAlign:'center',
          }}>
            <div style={{ fontSize:28, fontWeight:900, color: stage.color, lineHeight:1 }}>{prog.lv}</div>
            <div style={{ fontSize:10, color:'#a090c0', fontWeight:700, marginTop:2 }}>уровень</div>
          </div>
          {!isMax && (
            <div style={{ color:'#6050a0', fontSize:20, fontWeight:900 }}>→</div>
          )}
          {!isMax && (
            <div style={{ background:'rgba(255,255,255,0.05)', border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'8px 20px', textAlign:'center' }}>
              <div style={{ fontSize:28, fontWeight:900, color:'#6050a0', lineHeight:1 }}>{prog.lv + 1}</div>
              <div style={{ fontSize:10, color:'#6050a0', fontWeight:700, marginTop:2 }}>следующий</div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {!isMax ? (
          <div style={{ marginBottom:8 }}>
            <div style={{ height:10, background:'rgba(255,255,255,0.08)', borderRadius:99, overflow:'hidden',
              boxShadow:'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
              <div style={{
                height:'100%', borderRadius:99,
                background:`linear-gradient(90deg, ${stage.color}aa, ${stage.color})`,
                width:`${prog.pct * 100}%`, transition:'width 0.6s ease',
                boxShadow:`0 1px 6px ${stage.color}88`,
              }}/>
            </div>
            <div style={{ marginTop:5, display:'flex', justifyContent:'space-between', fontSize:10, fontWeight:700, color:'#7060a0' }}>
              <span>{prog.curPts} / {prog.needed} очков</span>
              <span>до ур. {prog.lv + 1}: {prog.needed - prog.curPts} оч.</span>
            </div>
          </div>
        ) : (
          <div style={{ textAlign:'center', marginBottom:8, fontSize:13, fontWeight:800, color: stage.color }}>✨ Максимальный уровень доверия!</div>
        )}

        {/* Description */}
        <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:16, padding:'12px 14px', marginBottom:20, marginTop:12 }}>
          <div style={{ fontSize:12, color:'#c0b0e0', lineHeight:1.6, textAlign:'center' }}>{stage.desc}</div>
        </div>

        {/* All stages */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:10, fontWeight:800, color:'#6050a0', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Этапы доверия</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {TRUST_STAGES.map((s, i) => {
              const reached = prog.lv >= s.min;
              const current = prog.lv >= s.min && prog.lv <= s.max;
              return (
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'5px 10px', borderRadius:10,
                  background: current ? `${s.color}22` : 'transparent',
                  border: current ? `1px solid ${s.color}44` : '1px solid transparent',
                  opacity: reached ? 1 : 0.35,
                }}>
                  <span style={{ fontSize:14 }}>{s.emoji}</span>
                  <span style={{ fontSize:11, fontWeight: current ? 800 : 600,
                    color: current ? s.color : reached ? '#a090c0' : '#5040708' }}>
                    {s.name}
                  </span>
                  <span style={{ marginLeft:'auto', fontSize:9, color:'#5040708', fontWeight:700 }}>
                    {s.min}–{s.max}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={onClose} style={{
          width:'100%', padding:'13px', borderRadius:18, border:'none', cursor:'pointer',
          background:`linear-gradient(135deg, ${stage.color}cc, ${stage.color}88)`,
          color:'white', fontSize:15, fontWeight:900, fontFamily:"'Nunito',sans-serif",
          boxShadow:`0 5px 18px ${stage.color}55`,
        }}>Понятно 🐾</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   BOTTOM PANEL (paw nav + bottom nav)
   ══════════════════════════════════════════════════ */
function BottomPanel({ fills, isCrit, onPawClick, activeNav, setActiveNav, canClaimDaily }) {
  return (
    <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:20 }}>
      {/* Gradient fade above panel */}
      <div style={{ height:36, background:'linear-gradient(to bottom, transparent, rgba(195,158,95,0.4))', pointerEvents:'none' }}/>
      {/* Main panel */}
      <div style={{
        background:'linear-gradient(180deg,#f8ecd4,#eedfc2)',
        borderRadius:'30px 30px 0 0',
        boxShadow:'0 -8px 32px rgba(90,45,8,0.28), 0 -1px 0 rgba(255,255,255,0.6) inset',
        border:'1.5px solid rgba(225,185,115,0.5)',
        borderBottom:'none',
        padding:'14px 8px 0',
      }}>
        {/* Action buttons row */}
        <div style={{ display:'flex', justifyContent:'space-around', alignItems:'flex-end', marginBottom:10, paddingBottom:10, borderBottom:'1.5px solid rgba(180,130,70,0.15)' }}>
          <PawIndicator pawId="hunger"  icon="🍔" label="Голод"       fill={fills.hunger}  critical={isCrit(fills.hunger)}  onClick={() => onPawClick('kitchen')}/>
          <PawIndicator pawId="toilet"  icon="🧴" label="Гигиена"    fill={fills.toilet}  critical={isCrit(fills.toilet)}  onClick={() => onPawClick('bathroom')}/>
          <PawIndicator pawId="fatigue" icon="😴" label="Сон"        fill={fills.fatigue} critical={isCrit(fills.fatigue)} onClick={() => onPawClick('rest')}/>
          <PawIndicator pawId="mood"    icon="🎮" label="Настроение"  fill={fills.mood}    critical={isCrit(fills.mood)}    onClick={() => onPawClick('yard')}/>
          <PawIndicator pawId="health"  icon="🩺" label="Здоровье"   fill={fills.health}  critical={isCrit(fills.health)}  onClick={() => onPawClick('clinic')}/>
        </div>
        {/* Nav tabs */}
        <div style={{ display:'flex', paddingBottom:8 }}>
          <NavItem icon="🏠" label="Дом"     active={activeNav==='home'}    onClick={() => { setActiveNav('home'); onPawClick('home'); }}/>
          <NavItem icon="🛒" label="Магазин" active={activeNav==='shop'}    onClick={() => { setActiveNav('shop'); onPawClick('shop'); }}/>
          <NavItem icon="💼" label="Работа"  active={activeNav==='work'}    onClick={() => { setActiveNav('work'); }}/>
          <NavItem icon="🏆" label="Успехи"  active={activeNav==='achieve'} dot={canClaimDaily} onClick={() => { setActiveNav('achieve'); }}/>
          <NavItem icon="📷" label="Альбом"  active={activeNav==='album'}   onClick={() => { setActiveNav('album'); }}/>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SVG ROOMS
   ══════════════════════════════════════════════════ */
function HomeRoom() {
  return (
    <svg viewBox="0 0 390 650" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
      <defs>
        <linearGradient id="hwG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d4a868"/><stop offset="100%" stopColor="#b88040"/></linearGradient>
        <linearGradient id="hfG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6a3818"/><stop offset="100%" stopColor="#3e1c08"/></linearGradient>
        <linearGradient id="hsG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#080d20"/><stop offset="100%" stopColor="#101830"/></linearGradient>
        <linearGradient id="hcG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#7a4c22"/><stop offset="100%" stopColor="#9a6830"/></linearGradient>
        <linearGradient id="hcurtG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#5848a0"/><stop offset="100%" stopColor="#8068c8"/></linearGradient>
        <linearGradient id="hhouseG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f0ddb0"/><stop offset="100%" stopColor="#d4bc88"/></linearGradient>
        <linearGradient id="hroofG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e86830"/><stop offset="100%" stopColor="#b84018"/></linearGradient>
        <radialGradient id="hrugG" cx="50%" cy="40%" r="55%"><stop offset="0%" stopColor="#f0a0bc"/><stop offset="60%" stopColor="#e07898"/><stop offset="100%" stopColor="#c05070"/></radialGradient>
        <radialGradient id="hcrysG" cx="30%" cy="25%" r="65%"><stop offset="0%" stopColor="#e0c8ff"/><stop offset="40%" stopColor="#9060d8"/><stop offset="100%" stopColor="#3818a0"/></radialGradient>
        <radialGradient id="hglowG" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#d0a8ff" stopOpacity="0.8"/><stop offset="100%" stopColor="#8040d0" stopOpacity="0"/></radialGradient>
        <filter id="softShadow"><feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#3a1800" floodOpacity="0.4"/></filter>
      </defs>

      {/* ── Walls ── */}
      <rect x="0" y="0" width="390" height="285" fill="url(#hwG)"/>
      {/* Warm ambient shading on walls - darker at corners */}
      <rect x="0" y="0" width="60" height="285" fill="rgba(0,0,0,0.08)"/>
      <rect x="330" y="0" width="60" height="285" fill="rgba(0,0,0,0.06)"/>
      <rect x="0" y="200" width="390" height="85" fill="rgba(0,0,0,0.06)"/>
      {/* Subtle wall texture lines */}
      {[60,120,180,240].map((y,i)=><line key={i} x1="0" y1={y} x2="390" y2={y} stroke="#a07028" strokeWidth="0.5" opacity="0.15"/>)}

      {/* ── Window frame (left) ── */}
      {/* Curtain rods */}
      <rect x="18" y="14" width="196" height="8" rx="4" fill="#8a6030" stroke="#5a3810" strokeWidth="1.5"/>
      {/* Left curtain */}
      <path d="M18,22 C26,50 18,90 24,170 L18,190 L10,190 L8,22 Z" fill="url(#hcurtG)" opacity="0.92"/>
      {/* Right curtain */}
      <path d="M196,22 C188,50 196,90 188,170 L196,190 L204,190 L206,22 Z" fill="url(#hcurtG)" opacity="0.92"/>
      {/* Window glass night sky */}
      <rect x="30" y="22" width="152" height="170" rx="6" fill="url(#hsG)"/>
      {/* Stars */}
      {[[55,40],[78,28],[110,35],[140,22],[158,45],[70,75],[130,60],[90,95],[165,80]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r={i%3===0?1.5:1} fill="white" opacity={0.6+i*0.04}/>
      ))}
      {/* Moon crescent */}
      <circle cx="148" cy="52" r="22" fill="#fffbe8" opacity="0.95"/>
      <circle cx="158" cy="46" r="18" fill="url(#hsG)"/>
      {/* Window frame dividers */}
      <rect x="30" y="22" width="152" height="170" rx="6" fill="none" stroke="#5a3810" strokeWidth="5"/>
      <line x1="106" y1="22" x2="105" y2="192" stroke="#5a3810" strokeWidth="5"/>
      <line x1="30" y1="107" x2="182" y2="108" stroke="#5a3810" strokeWidth="5"/>
      {/* Window inner highlight */}
      <rect x="30" y="22" width="152" height="170" rx="6" fill="none" stroke="#9a7040" strokeWidth="2"/>

      {/* ── Shelf (right) ── */}
      <rect x="230" y="100" width="158" height="15" rx="6" fill="#c89840" stroke="#7a5010" strokeWidth="3" filter="url(#softShadow)"/>
      <rect x="241" y="115" width="9" height="44" rx="3" fill="#a07828" stroke="#5a3010" strokeWidth="2"/>
      <rect x="371" y="115" width="9" height="44" rx="3" fill="#a07828" stroke="#5a3010" strokeWidth="2"/>
      {/* Plant pot */}
      <ellipse cx="305" cy="101" rx="16" ry="8" fill="#c87840" stroke="#7a4010" strokeWidth="2"/>
      <path d="M289,101 L293,76 L317,76 L321,101 Z" fill="#c87840" stroke="#7a4010" strokeWidth="2" strokeLinejoin="round"/>
      {/* Plant leaves */}
      <ellipse cx="305" cy="66" rx="14" ry="10" fill="#48a830" transform="rotate(-20,305,66)"/>
      <ellipse cx="305" cy="66" rx="14" ry="10" fill="#38922a" transform="rotate(20,305,66)"/>
      <ellipse cx="305" cy="60" rx="10" ry="13" fill="#50b838"/>
      {/* Picture frame with heart */}
      <rect x="340" y="52" width="48" height="44" rx="6" fill="#c8a060" stroke="#7a4810" strokeWidth="3"/>
      <rect x="344" y="56" width="40" height="36" rx="4" fill="#f8f0e0"/>
      {/* Heart in frame */}
      <path d="M364,82 C364,82 352,72 352,65 C352,60 356,57 360,59 C362,60 364,63 364,63 C364,63 366,60 368,59 C372,57 376,60 376,65 C376,72 364,82 364,82 Z" fill="#e85070" opacity="0.9"/>

      {/* ── Cat house (right floor) ── */}
      <path d="M258,270 L258,182 L338,182 L338,270 Z" fill="url(#hhouseG)" stroke="#5a3010" strokeWidth="3.5" strokeLinejoin="round"/>
      {/* Roof */}
      <path d="M250,188 L298,142 L346,188 Z" fill="url(#hroofG)" stroke="#5a3010" strokeWidth="3.5" strokeLinejoin="round"/>
      {/* Door opening */}
      <ellipse cx="298" cy="262" rx="26" ry="30" fill="#3a1808" stroke="#5a3010" strokeWidth="2.5"/>
      <ellipse cx="298" cy="264" rx="20" ry="23" fill="#1a0a04"/>
      {/* Paw print on house */}
      <ellipse cx="298" cy="215" rx="10" ry="9" fill="#e8c090" stroke="#a07040" strokeWidth="1.5" opacity="0.7"/>
      <ellipse cx="284" cy="206" rx="5" ry="5" fill="#e8c090" stroke="#a07040" strokeWidth="1" opacity="0.7"/>
      <ellipse cx="298" cy="203" rx="5" ry="5" fill="#e8c090" stroke="#a07040" strokeWidth="1" opacity="0.7"/>
      <ellipse cx="312" cy="206" rx="5" ry="5" fill="#e8c090" stroke="#a07040" strokeWidth="1" opacity="0.7"/>

      {/* ── Floor ── */}
      <rect x="0" y="278" width="390" height="372" fill="url(#hfG)"/>
      <rect x="0" y="274" width="390" height="9" fill="#522810" stroke="#2a1000" strokeWidth="2"/>
      {/* Floor planks horizontal */}
      {[300,325,350,376,404,434,466,500,536].map((y,i)=>(
        <line key={i} x1="0" y1={y} x2="390" y2={y} stroke="#220e00" strokeWidth={i<4?3:2.5} opacity="0.6"/>
      ))}
      {/* Floor planks vertical */}
      {[78,156,234,312].map((x,i)=>(
        <line key={i} x1={x} y1="278" x2={x+1} y2="650" stroke="#220e00" strokeWidth="2" opacity="0.4"/>
      ))}

      {/* ── Oval rug — big fluffy pink like the mockup ── */}
      {/* Outer shadow */}
      <ellipse cx="195" cy="618" rx="135" ry="36" fill="#803050" opacity="0.4" filter="url(#softShadow)"/>
      {/* Main rug body */}
      <ellipse cx="195" cy="612" rx="132" ry="34" fill="url(#hrugG)"/>
      {/* Fluffy texture — lighter inner ring */}
      <ellipse cx="195" cy="610" rx="112" ry="26" fill="none" stroke="#f4b8d0" strokeWidth="3" opacity="0.6"/>
      <ellipse cx="195" cy="609" rx="90" ry="19" fill="none" stroke="#f8d0e0" strokeWidth="2" opacity="0.4"/>
      {/* Rug fringe dots around edge */}
      {[-120,-98,-76,-54,-32,-10,12,34,56,78,100,122].map((dx,i)=>(
        <circle key={i} cx={195+dx} cy={616+Math.abs(Math.sin(i*0.8))*14} r="4" fill="#d05880" opacity="0.7"/>
      ))}

      {/* ── Crystal ball (left floor) ── */}
      {/* Ambient glow on floor */}
      <ellipse cx="68" cy="580" rx="48" ry="14" fill="#8040d0" opacity="0.3" filter="url(#softShadow)"/>
      {/* Stand base */}
      <ellipse cx="68" cy="580" rx="24" ry="7" fill="#c8a030" stroke="#8a6010" strokeWidth="2.5"/>
      {/* Stand body */}
      <path d="M48,578 L52,558 L84,558 L88,578 Z" fill="#d4a828" stroke="#8a6010" strokeWidth="2.5" strokeLinejoin="round"/>
      <ellipse cx="68" cy="558" rx="18" ry="5" fill="#e8c040" stroke="#8a6010" strokeWidth="2"/>
      {/* Ball */}
      <circle cx="68" cy="524" r="34" fill="url(#hcrysG)" stroke="#5030c0" strokeWidth="3" filter="url(#softShadow)"/>
      {/* Ball inner glow */}
      <circle cx="68" cy="524" r="28" fill="none" stroke="rgba(160,100,255,0.4)" strokeWidth="2"/>
      {/* Ball shine */}
      <ellipse cx="56" cy="510" rx="11" ry="8" fill="white" opacity="0.55" transform="rotate(-25,56,510)"/>
      <ellipse cx="75" cy="508" rx="5" ry="4" fill="white" opacity="0.3"/>
      {/* Purple glow around ball */}
      <circle cx="68" cy="524" r="44" fill="url(#hglowG)" opacity="0.5"/>
    </svg>
  );
}

function KitchenRoom() {
  return (
    <svg viewBox="0 0 390 650" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
      <defs>
        <linearGradient id="kwG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ecdab0"/><stop offset="100%" stopColor="#dcc898"/></linearGradient>
        <linearGradient id="kfG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7a4e2c"/><stop offset="100%" stopColor="#5a3818"/></linearGradient>
        <linearGradient id="kskyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#aadcf8"/><stop offset="100%" stopColor="#d8f0ff"/></linearGradient>
        <linearGradient id="kcurtG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#e07840"/><stop offset="100%" stopColor="#f09858"/></linearGradient>
        <linearGradient id="kcounterG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f5e8c8"/><stop offset="100%" stopColor="#e0d0a8"/></linearGradient>
        <linearGradient id="kcabG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c8901c"/><stop offset="100%" stopColor="#a07010"/></linearGradient>
        <linearGradient id="kfridgeG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#e8f0f0"/><stop offset="100%" stopColor="#d8e8e8"/></linearGradient>
        <linearGradient id="kstoveG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#484848"/><stop offset="100%" stopColor="#303030"/></linearGradient>
        <radialGradient id="kbowlG" cx="50%" cy="30%" r="60%"><stop offset="0%" stopColor="#f8c8a0"/><stop offset="100%" stopColor="#e0a070"/></radialGradient>
        <filter id="kShadow"><feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#3a1800" floodOpacity="0.3"/></filter>
      </defs>

      {/* ── Walls ── */}
      <rect x="0" y="0" width="390" height="290" fill="url(#kwG)"/>
      {[60,120,180,240].map((y,i)=><line key={i} x1="0" y1={y} x2="390" y2={y} stroke="#c0a060" strokeWidth="0.5" opacity="0.2"/>)}

      {/* ── Window (left wall) ── */}
      {/* Curtain rod */}
      <rect x="18" y="14" width="170" height="8" rx="4" fill="#8a6030" stroke="#5a3010" strokeWidth="1.5"/>
      {/* Left orange curtain */}
      <path d="M18,22 C26,52 16,95 22,170 L18,185 L10,185 L8,22 Z" fill="url(#kcurtG)" opacity="0.9"/>
      {/* Right orange curtain */}
      <path d="M172,22 C164,52 174,95 168,170 L172,185 L180,185 L182,22 Z" fill="url(#kcurtG)" opacity="0.9"/>
      {/* Sunny sky */}
      <rect x="28" y="22" width="136" height="166" rx="6" fill="url(#kskyG)"/>
      {/* Sun */}
      <circle cx="110" cy="65" r="26" fill="#ffd040" opacity="0.9"/>
      <circle cx="110" cy="65" r="20" fill="#ffe860"/>
      {/* Sun rays */}
      {[0,45,90,135,180,225,270,315].map((a,i)=>{ const r=Math.PI*a/180; return <line key={i} x1={110+32*Math.cos(r)} y1={65+32*Math.sin(r)} x2={110+42*Math.cos(r)} y2={65+42*Math.sin(r)} stroke="#ffc020" strokeWidth="2.5" strokeLinecap="round"/>; })}
      {/* White clouds */}
      <ellipse cx="55" cy="48" rx="22" ry="10" fill="white" opacity="0.88"/>
      <ellipse cx="68" cy="41" rx="18" ry="12" fill="white" opacity="0.88"/>
      <ellipse cx="42" cy="52" rx="14" ry="8" fill="white" opacity="0.8"/>
      {/* Green hills far */}
      <ellipse cx="70" cy="188" rx="70" ry="40" fill="#78c840" opacity="0.8"/>
      <ellipse cx="140" cy="195" rx="55" ry="32" fill="#60b830" opacity="0.75"/>
      {/* Window frame */}
      <rect x="28" y="22" width="136" height="166" rx="6" fill="none" stroke="#5a3010" strokeWidth="5"/>
      <line x1="96" y1="22" x2="96" y2="188" stroke="#5a3010" strokeWidth="4.5"/>
      <line x1="28" y1="105" x2="164" y2="105" stroke="#5a3010" strokeWidth="4.5"/>
      {/* Windowsill with potted herb */}
      <rect x="22" y="186" width="148" height="10" rx="4" fill="#8a6030" stroke="#5a3010" strokeWidth="2"/>
      {/* Small herb pot on windowsill */}
      <path d="M72,186 L76,168 L90,168 L94,186 Z" fill="#c87840" stroke="#7a4010" strokeWidth="1.5" strokeLinejoin="round"/>
      <ellipse cx="83" cy="168" rx="12" ry="5" fill="#c87840" stroke="#7a4010" strokeWidth="1.5"/>
      <ellipse cx="83" cy="160" rx="9" ry="11" fill="#50b838"/>
      <ellipse cx="78" cy="156" rx="7" ry="9" fill="#48a830" transform="rotate(-15,78,156)"/>
      <ellipse cx="88" cy="157" rx="7" ry="9" fill="#40982a" transform="rotate(15,88,157)"/>

      {/* ── Upper cabinets (right) ── */}
      <rect x="220" y="12" width="168" height="116" rx="8" fill="url(#kcabG)" stroke="#5a3010" strokeWidth="3" filter="url(#kShadow)"/>
      {/* Cabinet doors */}
      <rect x="224" y="16" width="76" height="108" rx="6" fill="#d89a28" stroke="#7a5010" strokeWidth="2"/>
      <rect x="304" y="16" width="80" height="108" rx="6" fill="#d89a28" stroke="#7a5010" strokeWidth="2"/>
      {/* Door handles */}
      <rect x="256" y="67" width="16" height="6" rx="3" fill="#f0c060" stroke="#8a5010" strokeWidth="1.5"/>
      <rect x="336" y="67" width="16" height="6" rx="3" fill="#f0c060" stroke="#8a5010" strokeWidth="1.5"/>

      {/* ── Counter top ── */}
      <rect x="0" y="200" width="390" height="16" rx="0" fill="url(#kcounterG)" stroke="#8a6030" strokeWidth="2.5"/>
      {/* Counter edge highlight */}
      <rect x="0" y="200" width="390" height="4" fill="rgba(255,255,255,0.4)"/>

      {/* ── Lower cabinets ── */}
      <rect x="0" y="216" width="190" height="72" fill="url(#kcabG)" stroke="#5a3010" strokeWidth="2.5"/>
      <line x1="95" y1="216" x2="95" y2="288" stroke="#5a3010" strokeWidth="2.5"/>
      <rect x="32" y="248" width="26" height="6" rx="3" fill="#f0c060" stroke="#8a5010" strokeWidth="1.5"/>
      <rect x="127" y="248" width="26" height="6" rx="3" fill="#f0c060" stroke="#8a5010" strokeWidth="1.5"/>
      {/* Stove (center) */}
      <rect x="190" y="202" width="120" height="86" fill="url(#kstoveG)" stroke="#1a1a1a" strokeWidth="3"/>
      {/* Stove burners */}
      {[[220,228],[290,228],[220,262],[290,262]].map(([cx,cy],i)=>(
        <g key={i}>
          <circle cx={cx} cy={cy} r="18" fill="#404040" stroke="#1a1a1a" strokeWidth="2"/>
          <circle cx={cx} cy={cy} r="12" fill="#303030"/>
          <circle cx={cx} cy={cy} r="6" fill="#2a2a2a"/>
        </g>
      ))}
      {/* Stove knobs */}
      {[198,214,230,246].map((x,i)=>(
        <circle key={i} cx={x} cy="210" r="5" fill="#e0a040" stroke="#1a1a1a" strokeWidth="1.5"/>
      ))}
      {/* Right lower cabinet */}
      <rect x="310" y="216" width="80" height="72" fill="url(#kcabG)" stroke="#5a3010" strokeWidth="2.5"/>
      <rect x="327" y="248" width="26" height="6" rx="3" fill="#f0c060" stroke="#8a5010" strokeWidth="1.5"/>
      {/* Refrigerator (right wall) */}
      <rect x="330" y="12" width="60" height="188" rx="6" fill="url(#kfridgeG)" stroke="#8a9a9a" strokeWidth="3" filter="url(#kShadow)"/>
      <rect x="334" y="16" width="52" height="88" rx="4" fill="#dde8e8" stroke="#8a9a9a" strokeWidth="2"/>
      <rect x="334" y="108" width="52" height="88" rx="4" fill="#e8f0f0" stroke="#8a9a9a" strokeWidth="2"/>
      <rect x="356" y="56" width="8" height="22" rx="4" fill="#b0baba" stroke="#8a9a9a" strokeWidth="1.5"/>
      <rect x="356" y="148" width="8" height="22" rx="4" fill="#b0baba" stroke="#8a9a9a" strokeWidth="1.5"/>

      {/* ── Floor ── */}
      <rect x="0" y="288" width="390" height="362" fill="url(#kfG)"/>
      <rect x="0" y="284" width="390" height="7" fill="#6a4420" stroke="#3a1800" strokeWidth="1.5"/>
      {[310,336,362,390,420,452,486,522].map((y,i)=>(
        <line key={i} x1="0" y1={y} x2="390" y2={y} stroke="#3a1800" strokeWidth="2.2" opacity="0.5"/>
      ))}
      {[78,156,234,312].map((x,i)=>(
        <line key={i} x1={x} y1="288" x2={x} y2="650" stroke="#3a1800" strokeWidth="1.5" opacity="0.35"/>
      ))}

      {/* ── Cat food bowls on floor ── */}
      {/* Bowl 1 — water */}
      <ellipse cx="130" cy="600" rx="44" ry="16" fill="#909aa0" stroke="#5a6268" strokeWidth="2.5" filter="url(#kShadow)"/>
      <ellipse cx="130" cy="596" rx="36" ry="11" fill="#c8d8e0"/>
      <ellipse cx="130" cy="594" rx="28" ry="7" fill="#80b8e0" opacity="0.9"/>
      {/* Bowl 2 — food */}
      <ellipse cx="258" cy="600" rx="44" ry="16" fill="url(#kbowlG)" stroke="#8a6040" strokeWidth="2.5" filter="url(#kShadow)"/>
      <ellipse cx="258" cy="596" rx="36" ry="11" fill="#f0c890"/>
      {/* Kibble pieces */}
      {[[245,593,5],[258,591,6],[270,593,5],[252,598,5],[264,598,5]].map(([cx,cy,r],i)=>(
        <circle key={i} cx={cx} cy={cy} r={r} fill={i%2===0?"#c86020":"#d87030"} stroke="#8a4010" strokeWidth="1.5"/>
      ))}
      {/* Placemat under bowls */}
      <ellipse cx="194" cy="604" rx="90" ry="22" fill="#c04018" opacity="0.25"/>
    </svg>
  );
}

function BathroomRoom() {
  return (
    <svg viewBox="0 0 390 650" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
      <defs>
        <linearGradient id="bwG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e8f4f0"/><stop offset="100%" stopColor="#d8ece8"/></linearGradient>
        <linearGradient id="bfG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7a4e2c"/><stop offset="100%" stopColor="#5a3818"/></linearGradient>
        <linearGradient id="btubG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f8f4f0"/><stop offset="100%" stopColor="#e8e4e0"/></linearGradient>
        <linearGradient id="bwaterG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b8e0f8"/><stop offset="100%" stopColor="#90c8f0"/></linearGradient>
        <linearGradient id="bsinkG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f0f4f8"/><stop offset="100%" stopColor="#dce8f0"/></linearGradient>
        <linearGradient id="bmirG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#e8f8ff"/><stop offset="100%" stopColor="#c8e8f8"/></linearGradient>
        <linearGradient id="brugG" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#f0d0e8"/><stop offset="100%" stopColor="#d0a0c0"/></linearGradient>
        <radialGradient id="brugRG" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#f0d0e8"/><stop offset="100%" stopColor="#d0a0c0"/></radialGradient>
        <filter id="bShadow"><feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#204040" floodOpacity="0.25"/></filter>
      </defs>

      {/* ── Walls with mint-cream tile grid ── */}
      <rect x="0" y="0" width="390" height="292" fill="url(#bwG)"/>
      {/* Tile horizontal lines */}
      {[0,44,88,132,176,220,264].map((y,i)=><line key={i} x1="0" y1={y} x2="390" y2={y} stroke="#a8ccc4" strokeWidth="1.2" opacity="0.55"/>)}
      {/* Tile vertical lines */}
      {[0,44,88,132,176,220,264,308,352,390].map((x,i)=><line key={i} x1={x} y1="0" x2={x} y2="292" stroke="#a8ccc4" strokeWidth="1.2" opacity="0.55"/>)}
      {/* Tile highlights (every other) */}
      {[0,88,176,264].map((y,i)=>[0,88,176,264,352].map((x,j)=>(
        <rect key={i*10+j} x={x+1} y={y+1} width={43} height={43} fill="rgba(255,255,255,0.2)" rx="2"/>
      )))}

      {/* ── Mirror above sink (left) ── */}
      <rect x="22" y="14" width="148" height="130" rx="10" fill="#7a9a90" stroke="#4a7060" strokeWidth="3"/>
      <rect x="26" y="18" width="140" height="122" rx="8" fill="url(#bmirG)"/>
      {/* Mirror reflection shimmer */}
      <path d="M32,24 L42,18 L44,26 Z" fill="white" opacity="0.45"/>
      <path d="M38,30 L52,20 L54,32 Z" fill="white" opacity="0.3"/>
      {/* Mirror frame decorative corners */}
      <circle cx="26" cy="18" r="5" fill="#8aaa98" stroke="#4a7060" strokeWidth="1.5"/>
      <circle cx="166" cy="18" r="5" fill="#8aaa98" stroke="#4a7060" strokeWidth="1.5"/>
      <circle cx="26" cy="140" r="5" fill="#8aaa98" stroke="#4a7060" strokeWidth="1.5"/>
      <circle cx="166" cy="140" r="5" fill="#8aaa98" stroke="#4a7060" strokeWidth="1.5"/>

      {/* ── Sink ── */}
      <rect x="22" y="154" width="148" height="70" rx="10" fill="url(#bsinkG)" stroke="#7a9890" strokeWidth="3.5" filter="url(#bShadow)"/>
      {/* Basin */}
      <ellipse cx="96" cy="189" rx="50" ry="24" fill="#d8e8f0" stroke="#7a9890" strokeWidth="2.5"/>
      <ellipse cx="96" cy="191" rx="42" ry="18" fill="url(#bwaterG)" opacity="0.8"/>
      {/* Drain */}
      <circle cx="96" cy="194" r="5" fill="#90a8b0" stroke="#5a7880" strokeWidth="1.5"/>
      {/* Faucet */}
      <rect x="90" y="156" width="12" height="22" rx="5" fill="#c0ccd8" stroke="#8a9aa8" strokeWidth="2"/>
      <ellipse cx="96" cy="154" rx="14" ry="6" fill="#d0dce8" stroke="#8a9aa8" strokeWidth="2"/>
      {/* Hot/cold handles */}
      <circle cx="74" cy="165" r="7" fill="#e86060" stroke="#8a2020" strokeWidth="1.5"/>
      <circle cx="118" cy="165" r="7" fill="#6090e8" stroke="#204890" strokeWidth="1.5"/>

      {/* ── Shelf with toiletries ── */}
      <rect x="196" y="48" width="182" height="12" rx="5" fill="#9aba9a" stroke="#4a7050" strokeWidth="2.5"/>
      {/* Shampoo bottle */}
      <rect x="200" y="18" width="22" height="28" rx="8" fill="#e06090" stroke="#a03060" strokeWidth="2"/>
      <rect x="207" y="14" width="8" height="8" rx="3" fill="#c04070" stroke="#a03060" strokeWidth="1.5"/>
      {/* Soap dispenser */}
      <rect x="232" y="22" width="20" height="24" rx="6" fill="#60b8a0" stroke="#2a7060" strokeWidth="2"/>
      <rect x="239" y="16" width="6" height="10" rx="3" fill="#40988a" stroke="#2a7060" strokeWidth="1.5"/>
      {/* Toothbrush cup */}
      <path d="M262,25 L266,48 L282,48 L286,25 Z" fill="#f0e8c8" stroke="#8a7840" strokeWidth="2" strokeLinejoin="round"/>
      <rect x="268" y="20" width="4" height="22" rx="2" fill="#e04888"/>
      <rect x="274" y="20" width="4" height="22" rx="2" fill="#4888e0"/>
      {/* Small plant */}
      <path d="M298,28 L302,48 L316,48 L320,28 Z" fill="#d09050" stroke="#8a5020" strokeWidth="2" strokeLinejoin="round"/>
      <ellipse cx="309" cy="22" rx="14" ry="12" fill="#50b040"/>
      <ellipse cx="303" cy="18" rx="10" ry="10" fill="#44a038" transform="rotate(-20,303,18)"/>
      <ellipse cx="315" cy="19" rx="10" ry="10" fill="#3a9030" transform="rotate(20,315,19)"/>

      {/* ── Bathtub (right) ── */}
      <rect x="210" y="162" width="178" height="128" rx="18" fill="url(#btubG)" stroke="#a0a898" strokeWidth="4" filter="url(#bShadow)"/>
      {/* Tub inner */}
      <rect x="220" y="174" width="158" height="110" rx="14" fill="#e8eeec" stroke="#a0a898" strokeWidth="2.5"/>
      {/* Water in tub */}
      <rect x="220" y="218" width="158" height="66" rx="10" fill="url(#bwaterG)" opacity="0.75"/>
      {/* Bubbles */}
      {[[250,215,5],[270,210,4],[295,212,6],[320,208,4],[345,214,5],[265,225,3],[340,222,4]].map(([cx,cy,r],i)=>(
        <circle key={i} cx={cx} cy={cy} r={r} fill="white" opacity="0.7" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
      ))}
      {/* Tub faucet */}
      <rect x="284" y="163" width="10" height="18" rx="4" fill="#c8d0d8" stroke="#8a9098" strokeWidth="2"/>
      <rect x="280" y="175" width="18" height="8" rx="4" fill="#b8c0c8" stroke="#8a9098" strokeWidth="2"/>
      {/* Tub feet */}
      <ellipse cx="228" cy="292" rx="10" ry="5" fill="#b0b8b8" stroke="#7a8888" strokeWidth="2"/>
      <ellipse cx="380" cy="292" rx="10" ry="5" fill="#b0b8b8" stroke="#7a8888" strokeWidth="2"/>

      {/* ── Towel hooks ── */}
      <circle cx="350" cy="50" r="6" fill="#c8a060" stroke="#7a5020" strokeWidth="2"/>
      {/* Hanging towel */}
      <path d="M350,56 C345,68 340,90 342,110 L360,110 C358,90 353,68 350,56 Z" fill="#e86888" opacity="0.88" stroke="#b04060" strokeWidth="1.5"/>
      <line x1="344" y1="83" x2="358" y2="83" stroke="#b04060" strokeWidth="1.5" opacity="0.6"/>

      {/* ── Floor ── */}
      <rect x="0" y="292" width="390" height="358" fill="url(#bfG)"/>
      <rect x="0" y="288" width="390" height="7" fill="#6a4420" stroke="#3a1800" strokeWidth="1.5"/>
      {[312,338,366,396,428,462,498,536].map((y,i)=>(
        <line key={i} x1="0" y1={y} x2="390" y2={y} stroke="#3a1800" strokeWidth="2" opacity="0.45"/>
      ))}
      {[78,156,234,312].map((x,i)=>(
        <line key={i} x1={x} y1="292" x2={x} y2="650" stroke="#3a1800" strokeWidth="1.5" opacity="0.3"/>
      ))}

      {/* ── Fluffy pink bath rug ── */}
      <ellipse cx="155" cy="600" rx="115" ry="32" fill="#e8a0c0" stroke="#b06090" strokeWidth="3" filter="url(#bShadow)"/>
      <ellipse cx="155" cy="597" rx="98" ry="25" fill="url(#brugRG)"/>
      {/* Rug fringe dots */}
      {[-100,-80,-60,-40,-20,0,20,40,60,80,100].map((dx,i)=>(
        <circle key={i} cx={155+dx} cy="630" r="3.5" fill="#d880b8" opacity="0.7"/>
      ))}
    </svg>
  );
}

function RestRoom() {
  return (
    <svg viewBox="0 0 390 650" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
      <defs>
        <linearGradient id="rwG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c8b8e8"/><stop offset="100%" stopColor="#b8a8d8"/></linearGradient>
        <linearGradient id="rfG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7a4e2c"/><stop offset="100%" stopColor="#5a3818"/></linearGradient>
        <linearGradient id="rskyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0d1a38"/><stop offset="100%" stopColor="#1a2a50"/></linearGradient>
        <linearGradient id="rcurtG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#9070c8"/><stop offset="100%" stopColor="#b090e0"/></linearGradient>
        <linearGradient id="rbedG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e0c8f8"/><stop offset="100%" stopColor="#c8b0e8"/></linearGradient>
        <linearGradient id="rsheetG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f8f0ff"/><stop offset="100%" stopColor="#ecdcff"/></linearGradient>
        <linearGradient id="rbookshG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c89838"/><stop offset="100%" stopColor="#a07820"/></linearGradient>
        <radialGradient id="rnightG" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#fffbe8" stopOpacity="0.9"/><stop offset="100%" stopColor="#ffd860" stopOpacity="0"/></radialGradient>
        <filter id="rShadow"><feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1a0840" floodOpacity="0.35"/></filter>
      </defs>

      {/* ── Purple walls ── */}
      <rect x="0" y="0" width="390" height="290" fill="url(#rwG)"/>
      {[55,110,165,220,275].map((y,i)=><line key={i} x1="0" y1={y} x2="390" y2={y} stroke="#9880c0" strokeWidth="0.6" opacity="0.18"/>)}

      {/* ── Window (left) — night sky ── */}
      {/* Curtain rod */}
      <rect x="16" y="12" width="190" height="8" rx="4" fill="#8a6030" stroke="#5a3010" strokeWidth="1.5"/>
      {/* Left curtain */}
      <path d="M16,20 C24,52 14,96 20,172 L16,188 L8,188 L6,20 Z" fill="url(#rcurtG)" opacity="0.88"/>
      {/* Right curtain */}
      <path d="M188,20 C180,52 190,96 184,172 L188,188 L196,188 L198,20 Z" fill="url(#rcurtG)" opacity="0.88"/>
      {/* Night sky */}
      <rect x="26" y="20" width="154" height="170" rx="6" fill="url(#rskyG)"/>
      {/* Stars */}
      {[[45,38],[72,25],[100,42],[130,28],[155,50],[60,72],[120,58],[88,94],[148,82],[50,110],[135,100],[75,130]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r={i%4===0?2:i%3===0?1.5:1} fill="white" opacity={0.5+i*0.04}/>
      ))}
      {/* Large moon */}
      <circle cx="145" cy="55" r="28" fill="#fffbe8" opacity="0.95" filter="url(#rShadow)"/>
      <circle cx="156" cy="48" r="22" fill="url(#rskyG)"/>
      {/* Moon glow */}
      <circle cx="145" cy="55" r="38" fill="url(#rnightG)" opacity="0.4"/>
      {/* Window frame */}
      <rect x="26" y="20" width="154" height="170" rx="6" fill="none" stroke="#5a3010" strokeWidth="5"/>
      <line x1="103" y1="20" x2="102" y2="190" stroke="#5a3010" strokeWidth="4.5"/>
      <line x1="26" y1="105" x2="180" y2="105" stroke="#5a3010" strokeWidth="4.5"/>

      {/* ── Bookshelf (right) ── */}
      <rect x="234" y="14" width="154" height="200" rx="6" fill="url(#rbookshG)" stroke="#5a3010" strokeWidth="3" filter="url(#rShadow)"/>
      {/* Shelf boards */}
      {[78,136,192].map((y,i)=>(
        <rect key={i} x="238" y={y} width="146" height="8" rx="3" fill="#b88020" stroke="#5a3010" strokeWidth="2"/>
      ))}
      {/* Books row 1 */}
      <rect x="242" y="22" width="14" height="52" rx="2" fill="#e04848"/>
      <rect x="258" y="26" width="12" height="48" rx="2" fill="#4070e0"/>
      <rect x="272" y="22" width="16" height="52" rx="2" fill="#40b060"/>
      <rect x="290" y="28" width="10" height="46" rx="2" fill="#e0a040"/>
      <rect x="302" y="22" width="14" height="52" rx="2" fill="#8040d0"/>
      <rect x="318" y="26" width="12" height="48" rx="2" fill="#e06840"/>
      <rect x="332" y="22" width="50" height="52" rx="2" fill="#c8a860"/>
      {/* Books row 2 */}
      <rect x="242" y="86" width="18" height="46" rx="2" fill="#40a8c0"/>
      <rect x="262" y="90" width="12" height="42" rx="2" fill="#d04060"/>
      <rect x="276" y="86" width="14" height="46" rx="2" fill="#60c040"/>
      <rect x="292" y="92" width="16" height="40" rx="2" fill="#c07020"/>
      <rect x="310" y="86" width="10" height="46" rx="2" fill="#8060e0"/>
      {/* Small cat figurine on shelf */}
      <ellipse cx="340" cy="131" rx="12" ry="8" fill="#f0d8c0" stroke="#8a5020" strokeWidth="1.5"/>
      <circle cx="340" cy="122" r="9" fill="#f0d8c0" stroke="#8a5020" strokeWidth="1.5"/>
      <path d="M333,116 L331,108 L336,114 Z" fill="#f0d8c0" stroke="#8a5020" strokeWidth="1"/>
      <path d="M347,116 L349,108 L344,114 Z" fill="#f0d8c0" stroke="#8a5020" strokeWidth="1"/>
      {/* Books row 3 */}
      <rect x="242" y="144" width="20" height="44" rx="2" fill="#e86040"/>
      <rect x="264" y="148" width="14" height="40" rx="2" fill="#4060c0"/>
      <rect x="280" y="144" width="12" height="44" rx="2" fill="#50c068"/>

      {/* ── Night stand (left) ── */}
      <rect x="18" y="204" width="80" height="80" rx="8" fill="#c89838" stroke="#5a3010" strokeWidth="3"/>
      {/* Drawer */}
      <rect x="22" y="242" width="72" height="38" rx="5" fill="#b88828" stroke="#5a3010" strokeWidth="2"/>
      <rect x="50" y="259" width="16" height="6" rx="3" fill="#f0c060" stroke="#8a5010" strokeWidth="1.5"/>
      {/* Lamp on stand */}
      <rect x="50" y="188" width="8" height="18" rx="3" fill="#d0a040" stroke="#8a5010" strokeWidth="2"/>
      <path d="M36,188 L54,152 L72,188 Z" fill="#f8e060" stroke="#c0a020" strokeWidth="2" strokeLinejoin="round"/>
      <ellipse cx="54" cy="190" rx="20" ry="5" fill="#c09030" stroke="#8a5010" strokeWidth="2"/>
      {/* Lamp glow */}
      <ellipse cx="54" cy="170" rx="30" ry="22" fill="#fffbe0" opacity="0.18"/>

      {/* ── Floor ── */}
      <rect x="0" y="290" width="390" height="360" fill="url(#rfG)"/>
      <rect x="0" y="286" width="390" height="7" fill="#6a4420" stroke="#3a1800" strokeWidth="1.5"/>
      {[310,338,368,400,434,470,508,548].map((y,i)=>(
        <line key={i} x1="0" y1={y} x2="390" y2={y} stroke="#3a1800" strokeWidth="2.2" opacity="0.5"/>
      ))}
      {[78,156,234,312].map((x,i)=>(
        <line key={i} x1={x} y1="290" x2={x} y2="650" stroke="#3a1800" strokeWidth="1.5" opacity="0.3"/>
      ))}

      {/* ── Cat sleeping basket ── */}
      {/* Basket base */}
      <ellipse cx="195" cy="610" rx="110" ry="30" fill="#c89040" stroke="#7a5010" strokeWidth="3.5" filter="url(#rShadow)"/>
      <ellipse cx="195" cy="604" rx="96" ry="23" fill="#d8a050"/>
      {/* Basket weave texture lines */}
      {[-80,-52,-24,4,32,60,88].map((dx,i)=>(
        <line key={i} x1={195+dx} y1="582" x2={195+dx+8} y2="628" stroke="#a07028" strokeWidth="2.5" opacity="0.5"/>
      ))}
      {/* Soft pillow inside */}
      <ellipse cx="195" cy="598" rx="78" ry="18" fill="#f8e8f0" stroke="#d0a0c0" strokeWidth="2"/>
      <ellipse cx="195" cy="595" rx="64" ry="13" fill="#fce8f4"/>
      {/* Pillow dimple */}
      <ellipse cx="195" cy="594" rx="14" ry="6" fill="#f0d8ec" stroke="#d8b0d0" strokeWidth="1.5"/>
    </svg>
  );
}

function YardRoom() {
  return (
    <svg viewBox="0 0 390 650" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
      <defs>
        <linearGradient id="yskyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5ab0f0"/><stop offset="60%" stopColor="#98d0fc"/><stop offset="100%" stopColor="#c8e8ff"/></linearGradient>
        <linearGradient id="ygrassG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60c040"/><stop offset="100%" stopColor="#389820"/></linearGradient>
        <linearGradient id="ysunG" cx="35%" cy="30%" r="60%"><stop offset="0%" stopColor="#fff8a0"/><stop offset="100%" stopColor="#ffcc00"/></linearGradient>
        <radialGradient id="ysunRG" cx="35%" cy="30%" r="60%"><stop offset="0%" stopColor="#fff8a0"/><stop offset="100%" stopColor="#ffcc00"/></radialGradient>
        <linearGradient id="ytreeG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#50c840"/><stop offset="100%" stopColor="#389028"/></linearGradient>
        <linearGradient id="ypathG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d8c090"/><stop offset="100%" stopColor="#c0a870"/></linearGradient>
        <radialGradient id="yflower1G" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#fff060"/><stop offset="100%" stopColor="#ffc820"/></radialGradient>
        <radialGradient id="yflower2G" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#ff80c0"/><stop offset="100%" stopColor="#e04898"/></radialGradient>
        <filter id="yShadow"><feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#104008" floodOpacity="0.3"/></filter>
      </defs>

      {/* ── Sky ── */}
      <rect x="0" y="0" width="390" height="360" fill="url(#yskyG)"/>

      {/* ── Sun with rays ── */}
      {/* Glow */}
      <circle cx="340" cy="58" r="65" fill="#fffbe0" opacity="0.3"/>
      <circle cx="340" cy="58" r="44" fill="url(#ysunRG)" filter="url(#yShadow)"/>
      <circle cx="340" cy="58" r="36" fill="#ffee60"/>
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i)=>{ const rad=Math.PI*a/180; return <line key={i} x1={340+50*Math.cos(rad)} y1={58+50*Math.sin(rad)} x2={340+64*Math.cos(rad)} y2={58+64*Math.sin(rad)} stroke="#ffcc00" strokeWidth={i%3===0?3.5:2} strokeLinecap="round"/>; })}
      {/* Sun face */}
      <circle cx="329" cy="52" r="4" fill="#c88000" opacity="0.7"/>
      <circle cx="351" cy="52" r="4" fill="#c88000" opacity="0.7"/>
      <path d="M328,66 C332,72 348,72 352,66" stroke="#c88000" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7"/>

      {/* ── Clouds ── */}
      <ellipse cx="80" cy="55" rx="56" ry="24" fill="white" opacity="0.95"/>
      <ellipse cx="105" cy="44" rx="44" ry="26" fill="white" opacity="0.95"/>
      <ellipse cx="52" cy="62" rx="34" ry="18" fill="white" opacity="0.88"/>
      <ellipse cx="210" cy="78" rx="42" ry="18" fill="white" opacity="0.88"/>
      <ellipse cx="235" cy="68" rx="30" ry="20" fill="white" opacity="0.88"/>
      <ellipse cx="188" cy="82" rx="26" ry="14" fill="white" opacity="0.8"/>

      {/* ── Background hills ── */}
      <ellipse cx="80" cy="340" rx="160" ry="90" fill="#78d050" opacity="0.6"/>
      <ellipse cx="320" cy="345" rx="150" ry="80" fill="#68c040" opacity="0.55"/>

      {/* ── Fence ── */}
      {[18,50,82,114,146,178,210,242,274,306,338,370].map((x,i)=>(
        <rect key={i} x={x} y="238" width="20" height="90" rx="4" fill="#e8c878" stroke="#8a6020" strokeWidth="2"/>
      ))}
      {/* Top fence rail */}
      <rect x="12" y="260" width="372" height="14" rx="5" fill="#f0d890" stroke="#8a6020" strokeWidth="2.5"/>
      {/* Middle fence rail */}
      <rect x="12" y="296" width="372" height="10" rx="4" fill="#ecd080" stroke="#8a6020" strokeWidth="2"/>

      {/* ── Trees ── */}
      {/* Left tree */}
      <rect x="24" y="290" width="20" height="100" rx="6" fill="#8a5828" stroke="#5a3010" strokeWidth="2.5"/>
      <ellipse cx="34" cy="268" rx="56" ry="58" fill="#38a828" stroke="#1a5810" strokeWidth="3" filter="url(#yShadow)"/>
      <ellipse cx="34" cy="240" rx="44" ry="46" fill="url(#ytreeG)" stroke="#1a5810" strokeWidth="2.5"/>
      <ellipse cx="34" cy="218" rx="32" ry="34" fill="#60d048" stroke="#1a5810" strokeWidth="2"/>
      {/* Right tree */}
      <rect x="346" y="295" width="20" height="95" rx="6" fill="#8a5828" stroke="#5a3010" strokeWidth="2.5"/>
      <ellipse cx="356" cy="272" rx="52" ry="55" fill="#38a828" stroke="#1a5810" strokeWidth="3" filter="url(#yShadow)"/>
      <ellipse cx="356" cy="245" rx="40" ry="44" fill="url(#ytreeG)" stroke="#1a5810" strokeWidth="2.5"/>
      <ellipse cx="356" cy="224" rx="30" ry="32" fill="#60d048" stroke="#1a5810" strokeWidth="2"/>

      {/* ── Grass ground ── */}
      <rect x="0" y="355" width="390" height="295" fill="url(#ygrassG)"/>
      {/* Grass texture blades */}
      {[20,55,90,125,160,195,230,265,300,335,370].map((x,i)=>(
        <g key={i}>
          <path d={`M${x},355 C${x-4},340 ${x-8},330 ${x-6},318`} stroke="#48b030" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7"/>
          <path d={`M${x+8},355 C${x+12},338 ${x+16},328 ${x+14},316`} stroke="#50b838" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
        </g>
      ))}

      {/* ── Stone path ── */}
      <ellipse cx="195" cy="430" rx="80" ry="20" fill="url(#ypathG)" stroke="#a08050" strokeWidth="2" opacity="0.7"/>
      {[{cx:155,cy:410,rx:28,ry:12},{cx:205,cy:425,rx:25,ry:10},{cx:235,cy:412,rx:22,ry:10},{cx:172,cy:436,rx:24,ry:10},{cx:218,cy:443,rx:26,ry:11}].map((s,i)=>(
        <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill="#d8c090" stroke="#a08850" strokeWidth="1.5"/>
      ))}

      {/* ── Flowers (left bed) ── */}
      {[[68,490],[82,478],[54,482],[74,468],[60,460]].map(([x,y],i)=>(
        <g key={i}>
          <line x1={x} y1={y} x2={x+4} y2={y+30} stroke="#38a820" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Petals */}
          {[0,60,120,180,240,300].map((a,j)=>{ const rad=Math.PI*a/180; return <ellipse key={j} cx={x+7*Math.cos(rad)} cy={y+7*Math.sin(rad)} rx="5" ry="4" fill={i%2===0?"#ff80b8":"#ffee40"} opacity="0.9"/>; })}
          <circle cx={x} cy={y} r="5" fill={i%2===0?"#ffe040":"#ff60a0"}/>
        </g>
      ))}

      {/* ── Flowers (right bed) ── */}
      {[[318,488],[332,474],[310,470],[344,462],[326,458]].map(([x,y],i)=>(
        <g key={i}>
          <line x1={x} y1={y} x2={x-4} y2={y+32} stroke="#38a820" strokeWidth="2.5" strokeLinecap="round"/>
          {[0,60,120,180,240,300].map((a,j)=>{ const rad=Math.PI*a/180; return <ellipse key={j} cx={x+7*Math.cos(rad)} cy={y+7*Math.sin(rad)} rx="5" ry="4" fill={i%2===0?"#ff9040":"#a060ff"} opacity="0.9"/>; })}
          <circle cx={x} cy={y} r="5" fill={i%2===0?"#ffb020":"#c080ff"}/>
        </g>
      ))}

      {/* ── Ball toy on grass ── */}
      <circle cx="195" cy="570" r="26" fill="#e84040" stroke="#a01010" strokeWidth="3" filter="url(#yShadow)"/>
      <path d="M175,555 C178,568 182,575 195,578 C208,575 212,568 215,555" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8"/>
      <path d="M170,568 C175,560 182,558 195,560 C208,558 215,560 220,568" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7"/>

      {/* ── Butterfly ── */}
      <path d="M140,420 C124,408 118,416 128,424 C118,432 124,440 140,428 Z" fill="#ff90c8" opacity="0.85" stroke="#c04090" strokeWidth="1.5"/>
      <path d="M140,420 C156,408 162,416 152,424 C162,432 156,440 140,428 Z" fill="#ff80b8" opacity="0.85" stroke="#c04090" strokeWidth="1.5"/>
      <line x1="140" y1="420" x2="140" y2="428" stroke="#5a2040" strokeWidth="1.5"/>
      <path d="M138,418 C136,412 132,410 130,412" stroke="#5a2040" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M142,418 C144,412 148,410 150,412" stroke="#5a2040" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function ClinicRoom() {
  return (
    <svg viewBox="0 0 390 650" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
      <defs>
        <linearGradient id="clwG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e8f4ee"/><stop offset="100%" stopColor="#d8eae2"/></linearGradient>
        <linearGradient id="clfG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7a4e2c"/><stop offset="100%" stopColor="#5a3818"/></linearGradient>
        <linearGradient id="clcabG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e8f8f2"/><stop offset="100%" stopColor="#d0ece4"/></linearGradient>
        <linearGradient id="cltableG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f5f5f5"/><stop offset="100%" stopColor="#e5e8e8"/></linearGradient>
        <linearGradient id="clpotG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e8c068"/><stop offset="100%" stopColor="#c89838"/></linearGradient>
        <linearGradient id="clscreenG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#203868"/><stop offset="100%" stopColor="#102848"/></linearGradient>
        <filter id="clShadow"><feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#104028" floodOpacity="0.28"/></filter>
      </defs>

      {/* ── Walls — mint-white with subtle tile grid ── */}
      <rect x="0" y="0" width="390" height="290" fill="url(#clwG)"/>
      {[0,48,96,144,192,240,288].map((y,i)=><line key={i} x1="0" y1={y} x2="390" y2={y} stroke="#7ab898" strokeWidth="1.2" opacity="0.4"/>)}
      {[0,48,96,144,192,240,288,336,384].map((x,i)=><line key={i} x1={x} y1="0" x2={x} y2="290" stroke="#7ab898" strokeWidth="1.2" opacity="0.4"/>)}
      {/* Tile highlights */}
      {[0,96,192].map((y,i)=>[0,96,192,288].map((x,j)=>(
        <rect key={i*10+j} x={x+1} y={y+1} width={47} height={47} fill="rgba(255,255,255,0.22)" rx="2"/>
      )))}

      {/* ── Red cross sign (center top) ── */}
      <rect x="168" y="14" width="56" height="56" rx="10" fill="#e83030" stroke="#a00808" strokeWidth="3" filter="url(#clShadow)"/>
      <rect x="179" y="34" width="34" height="14" rx="4" fill="white"/>
      <rect x="188" y="24" width="14" height="34" rx="4" fill="white"/>
      {/* Shine on cross */}
      <rect x="175" y="18" width="10" height="8" rx="3" fill="rgba(255,255,255,0.4)"/>

      {/* ── Medical cabinet (left) ── */}
      <rect x="18" y="16" width="128" height="180" rx="8" fill="url(#clcabG)" stroke="#70a888" strokeWidth="3.5" filter="url(#clShadow)"/>
      {/* Cabinet divider */}
      <line x1="82" y1="20" x2="82" y2="194" stroke="#70a888" strokeWidth="2.5"/>
      {/* Cabinet shelves */}
      {[80,130,178].map((y,i)=>(
        <line key={i} x1="22" y1={y} x2="142" y2={y} stroke="#70a888" strokeWidth="2"/>
      ))}
      {/* Medicine bottles - left column */}
      <rect x="26" y="30" width="14" height="46" rx="5" fill="#e06888" stroke="#a03050" strokeWidth="2"/>
      <rect x="28" y="24" width="10" height="10" rx="3" fill="#c84870" stroke="#a03050" strokeWidth="1.5"/>
      <rect x="44" y="34" width="12" height="40" rx="5" fill="#4890e0" stroke="#1850a8" strokeWidth="2"/>
      <rect x="46" y="28" width="8" height="10" rx="3" fill="#3070c0" stroke="#1850a8" strokeWidth="1.5"/>
      <rect x="60" y="28" width="16" height="48" rx="5" fill="#38c888" stroke="#108858" strokeWidth="2"/>
      <rect x="63" y="22" width="10" height="10" rx="3" fill="#28a870" stroke="#108858" strokeWidth="1.5"/>
      {/* Labels */}
      <rect x="28" y="44" width="10" height="8" rx="1" fill="white" opacity="0.8"/>
      <rect x="46" y="46" width="8" height="6" rx="1" fill="white" opacity="0.8"/>
      <rect x="62" y="40" width="12" height="8" rx="1" fill="white" opacity="0.8"/>
      {/* Right column */}
      <rect x="90" y="30" width="12" height="44" rx="5" fill="#e0a040" stroke="#a86810" strokeWidth="2"/>
      <rect x="92" y="24" width="8" height="10" rx="3" fill="#c88020" stroke="#a86810" strokeWidth="1.5"/>
      <rect x="106" y="34" width="14" height="40" rx="5" fill="#a060d8" stroke="#6028a0" strokeWidth="2"/>
      <rect x="108" y="28" width="10" height="10" rx="3" fill="#8040c0" stroke="#6028a0" strokeWidth="1.5"/>
      {/* 2nd shelf items */}
      <rect x="26" y="86" width="50" height="38" rx="4" fill="#d8e8e0" stroke="#70a888" strokeWidth="2"/>
      <rect x="30" y="90" width="20" height="6" rx="2" fill="#70a888" opacity="0.6"/>
      <rect x="30" y="100" width="16" height="4" rx="2" fill="#70a888" opacity="0.4"/>
      <rect x="30" y="108" width="22" height="4" rx="2" fill="#70a888" opacity="0.4"/>
      <rect x="88" y="86" width="46" height="38" rx="4" fill="#f0f4f0" stroke="#70a888" strokeWidth="2"/>
      {/* Bandages */}
      <rect x="92" y="90" width="38" height="12" rx="6" fill="#f8e8d8" stroke="#c09070" strokeWidth="1.5"/>
      <rect x="104" y="92" width="14" height="8" rx="3" fill="#f0d0b8"/>
      {/* Syringe */}
      <rect x="92" y="108" width="38" height="10" rx="5" fill="#d0e8f0" stroke="#7098a8" strokeWidth="1.5"/>
      <rect x="128" y="110" width="8" height="6" rx="1" fill="#9ab8c8" stroke="#7098a8" strokeWidth="1"/>
      <rect x="92" y="111" width="6" height="4" rx="1" fill="#90b0c0"/>

      {/* ── Monitor / vitals screen (right top) ── */}
      <rect x="236" y="16" width="148" height="104" rx="10" fill="#2a4a78" stroke="#183060" strokeWidth="3.5" filter="url(#clShadow)"/>
      <rect x="242" y="22" width="136" height="88" rx="7" fill="url(#clscreenG)"/>
      {/* Heart rate line */}
      <polyline points="248,66 258,66 264,48 270,82 276,56 282,66 302,66 308,44 314,78 320,60 326,66 346,66 352,50 358,72 364,66 374,66" stroke="#40ff80" strokeWidth="2.5" fill="none"/>
      {/* Pulse dot */}
      <circle cx="364" cy="66" r="4" fill="#40ff80" opacity="0.9"/>
      {/* Screen labels */}
      <text x="248" y="88" fontSize="8" fill="#40d880" fontFamily="monospace" opacity="0.9">♥ 72 BPM</text>
      <text x="310" y="88" fontSize="8" fill="#40a8ff" fontFamily="monospace" opacity="0.9">T 38.2°</text>
      {/* Stand */}
      <rect x="302" y="120" width="10" height="30" rx="4" fill="#3060a0" stroke="#183060" strokeWidth="2"/>
      <rect x="286" y="148" width="42" height="8" rx="4" fill="#3060a0" stroke="#183060" strokeWidth="2"/>

      {/* ── Shelving unit (right middle) ── */}
      <rect x="236" y="160" width="148" height="128" rx="6" fill="url(#clcabG)" stroke="#70a888" strokeWidth="2.5"/>
      {[200,232].map((y,i)=>(
        <line key={i} x1="240" y1={y} x2="380" y2={y} stroke="#70a888" strokeWidth="2"/>
      ))}
      {/* IV bag */}
      <path d="M264,168 L256,196 L272,196 Z" fill="#c8e8f8" stroke="#7098b8" strokeWidth="2"/>
      <line x1="264" y1="196" x2="264" y2="216" stroke="#7098b8" strokeWidth="2" strokeDasharray="3,2"/>
      {/* First aid kit */}
      <rect x="286" y="168" width="48" height="28" rx="6" fill="#e83030" stroke="#a00808" strokeWidth="2.5"/>
      <rect x="295" y="176" width="30" height="10" rx="3" fill="white"/>
      <rect x="304" y="168" width="10" height="28" rx="3" fill="white"/>
      {/* Stethoscope */}
      <path d="M340,170 C336,180 330,186 328,196 C326,206 330,210 336,210" stroke="#5a3a88" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <circle cx="336" cy="212" r="6" fill="#5a3a88" stroke="#3a1860" strokeWidth="2"/>
      <line x1="340" y1="170" x2="350" y2="178" stroke="#5a3a88" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="352" cy="180" r="5" fill="#7858a0" stroke="#3a1860" strokeWidth="1.5"/>
      {/* Bandage roll */}
      <circle cx="262" cy="218" r="14" fill="#f8e8d8" stroke="#c09070" strokeWidth="2.5"/>
      <circle cx="262" cy="218" r="9" fill="#f0d8c8"/>
      <circle cx="262" cy="218" r="4" fill="#e8c8b8"/>
      {/* Pills */}
      {[[298,212],[312,216],[326,210],[340,214],[354,212]].map(([cx,cy],i)=>(
        <ellipse key={i} cx={cx} cy={cy} rx="8" ry="5" fill={['#f04060','#4080e0','#60c040','#f0a020','#c060d0'][i]} stroke="#1a1a1a" strokeWidth="1.5"/>
      ))}

      {/* ── Examination table ── */}
      <rect x="88" y="204" width="210" height="72" rx="10" fill="url(#cltableG)" stroke="#8aacac" strokeWidth="3.5" filter="url(#clShadow)"/>
      <rect x="92" y="208" width="202" height="52" rx="7" fill="#e8eef0" stroke="#8aacac" strokeWidth="2"/>
      {/* Table padding quilting */}
      {[115,140,165,190,215,240,265].map((x,i)=>(
        <line key={i} x1={x} y1="210" x2={x} y2="258" stroke="#c8d8dc" strokeWidth="1.5" opacity="0.7"/>
      ))}
      {[230,245].map((y,i)=>(
        <line key={i} x1="94" y1={y} x2="292" y2={y} stroke="#c8d8dc" strokeWidth="1.5" opacity="0.7"/>
      ))}
      {/* Table legs */}
      <rect x="100" y="274" width="12" height="16" rx="4" fill="#90aaaa" stroke="#608888" strokeWidth="2"/>
      <rect x="278" y="274" width="12" height="16" rx="4" fill="#90aaaa" stroke="#608888" strokeWidth="2"/>

      {/* ── Potted plant (corner accent) ── */}
      <path d="M356,228 L360,204 L376,204 L380,228 Z" fill="url(#clpotG)" stroke="#7a5010" strokeWidth="2" strokeLinejoin="round"/>
      <ellipse cx="368" cy="204" rx="14" ry="5" fill="#d0a040" stroke="#7a5010" strokeWidth="1.5"/>
      <ellipse cx="368" cy="194" rx="12" ry="14" fill="#44a838"/>
      <ellipse cx="360" cy="190" rx="9" ry="11" fill="#38982e" transform="rotate(-18,360,190)"/>
      <ellipse cx="376" cy="191" rx="9" ry="11" fill="#309828" transform="rotate(18,376,191)"/>
      <ellipse cx="368" cy="183" rx="7" ry="9" fill="#50b040"/>

      {/* ── Floor ── */}
      <rect x="0" y="290" width="390" height="360" fill="url(#clfG)"/>
      <rect x="0" y="286" width="390" height="7" fill="#6a4420" stroke="#3a1800" strokeWidth="1.5"/>
      {[310,336,364,394,426,460,496,534].map((y,i)=>(
        <line key={i} x1="0" y1={y} x2="390" y2={y} stroke="#3a1800" strokeWidth="2.2" opacity="0.48"/>
      ))}
      {[78,156,234,312].map((x,i)=>(
        <line key={i} x1={x} y1="290" x2={x} y2="650" stroke="#3a1800" strokeWidth="1.5" opacity="0.32"/>
      ))}

      {/* ── Health rug (green cross pattern) ── */}
      <ellipse cx="195" cy="598" rx="110" ry="28" fill="#60b880" stroke="#38886a" strokeWidth="3" filter="url(#clShadow)"/>
      <ellipse cx="195" cy="594" rx="92" ry="21" fill="#78cc98"/>
      {/* Cross pattern on rug */}
      <rect x="186" y="578" width="18" height="32" rx="4" fill="white" opacity="0.35"/>
      <rect x="176" y="588" width="38" height="12" rx="4" fill="white" opacity="0.35"/>
    </svg>
  );
}

/* ══════════════════════════════════════════════════
   INTERACTIVE HOTSPOT — pulsing tap target
   ══════════════════════════════════════════════════ */
function Hotspot({ emoji, label, posX, posY, initCdMs, onTap }) {
  const [cdMs, setCdMs] = useState(initCdMs || 0);
  useEffect(() => { setCdMs(initCdMs || 0); }, [initCdMs]);
  useEffect(() => {
    if (cdMs <= 0) return;
    const t = setInterval(() => setCdMs(c => Math.max(0, c - 1000)), 1000);
    return () => clearInterval(t);
  }, [cdMs > 0]);
  const cd = cdMs > 0;
  const cdLabel = cdMs > 90000 ? `${Math.ceil(cdMs/60000)}м` : `${Math.ceil(cdMs/1000)}с`;
  return (
    <div onPointerDown={e => { e.stopPropagation(); e.preventDefault(); if (!cd) onTap(); }}
      style={{ position:'absolute', left:posX, top:posY, transform:'translate(-50%,-50%)',
        width:66, height:66, borderRadius:99,
        background: cd ? 'rgba(0,0,0,0.58)' : 'rgba(255,255,255,0.17)',
        border: `2.5px solid ${cd ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.78)'}`,
        backdropFilter:'blur(6px)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        cursor: cd ? 'default' : 'pointer',
        animation: cd ? 'none' : 'thoughtBounce 2.2s ease-in-out infinite',
        boxShadow: cd ? 'none' : '0 0 22px rgba(255,255,180,0.42), 0 4px 12px rgba(0,0,0,0.45)',
        filter: cd ? 'grayscale(0.65)' : 'none',
        userSelect:'none', touchAction:'none', zIndex:12,
        transition:'all 0.2s' }}>
      <div style={{ fontSize:30, lineHeight:1 }}>{emoji}</div>
      <div style={{ fontSize: cd ? 12 : 9, fontWeight:800, marginTop:2, fontFamily:"'Nunito',sans-serif",
        color: cd ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.92)' }}>
        {cd ? cdLabel : label}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ROOM DEFINITIONS — all 5 interactive locations
   ══════════════════════════════════════════════════ */
const ROOM_DEFS = {
  kitchen: {
    RoomComp: KitchenRoom, bgColor:'#3a2008', roomName:'🍔 Голод', catDefaultX:'52%',
    minigameScreen:'minigame_catch', minigameLabel:'🎯 Поймай еду',
    objects:[
      { id:'bowl',   emoji:'🥣', label:'Миска',    posX:'38%', posY:'80%', catTargetX:'30%', thought:'😋', cooldownMin:5,  isCatTap:false,
        getEffect:(inv)=>{
          const f = ['food_premium','food_tasty','food_basic'].find(k=>inv[k]>0);
          if (!f) return { ok:false, msg:'Нет еды! Купи в магазине 🛒' };
          const it = FOOD_ITEMS.find(i=>i.id===f);
          return { ok:true, useItem:f, delta:{ hunger:it.hunger, mood:it.mood||0, health:it.health||0 }, xp:it.xp, particles:'🍖', msg:`${it.emoji} Кот поел!`, actionKey:'feedCount', premiumFed: f==='food_premium' };
        }},
      { id:'faucet', emoji:'🚰', label:'Водичка',  posX:'13%', posY:'37%', catTargetX:'8%',  thought:'💧', cooldownMin:2,  isCatTap:false,
        getEffect:()=>({ ok:true, delta:{ hunger:-5, mood:2 }, xp:1, particles:'💧', msg:'💧 Кот попил водички!' })},
      { id:'cat_k',  emoji:'🐾', label:'Котик',    posX:null,  posY:null,                    thought:'😺', cooldownMin:1,  isCatTap:true,
        getEffect:()=>({ ok:true, delta:{ mood:3 }, xp:0, particles:'💕', msg:'Мурр~ 💕' })},
    ]
  },
  bathroom: {
    RoomComp: BathroomRoom, bgColor:'#0a1f3a', roomName:'🚿 Гигиена', catDefaultX:'48%',
    objects:[
      { id:'bathtub', emoji:'🛁', label:'Купаться', posX:'68%', posY:'54%', catTargetX:'62%', thought:'🛁', cooldownMin:8,  isCatTap:false,
        getEffect:()=>({ ok:true, delta:{ toilet:-28, mood:5 }, xp:7, particles:'💦', msg:'🛁 Кот помылся!', actionKey:'bathroomCount' })},
      { id:'litter',  emoji:'🚽', label:'Лоток',    posX:'22%', posY:'66%', catTargetX:'16%', thought:'🚽', cooldownMin:4,  isCatTap:false,
        getEffect:()=>({ ok:true, delta:{ toilet:-15 }, xp:3, particles:'✨', msg:'🚽 Кот сходил!', actionKey:'bathroomCount' })},
      { id:'cat_b',  emoji:'🐾', label:'Котик',    posX:null,  posY:null,                    thought:'😺', cooldownMin:1,  isCatTap:true,
        getEffect:()=>({ ok:true, delta:{ mood:2 }, xp:0, particles:'💕', msg:'Мурр~ 💕' })},
    ]
  },
  rest: {
    RoomComp: RestRoom, bgColor:'#0e0820', roomName:'🛏️ Сон', catDefaultX:'42%',
    objects:[
      { id:'bed',     emoji:'🛏️', label:'Поспать',  posX:'20%', posY:'65%', catTargetX:'13%', thought:'💤', cooldownMin:10, isCatTap:false,
        getEffect:()=>({ ok:true, delta:{ fatigue:-38, mood:6 }, xp:8, particles:'💤', msg:'💤 Кот поспал!', actionKey:'sleepCount' })},
      { id:'curtain', emoji:'🌙', label:'Шторы',    posX:'70%', posY:'27%', catTargetX:'65%', thought:'🌙', cooldownMin:20, isCatTap:false,
        getEffect:()=>({ ok:true, delta:{ fatigue:-10 }, xp:2, particles:'🌙', msg:'🌙 Шторы закрыты!' })},
      { id:'cat_r',  emoji:'🐾', label:'Котик',    posX:null,  posY:null,                    thought:'😴', cooldownMin:1,  isCatTap:true,
        getEffect:()=>({ ok:true, delta:{ mood:2 }, xp:0, particles:'💕', msg:'Кот зевает~ 😴' })},
    ]
  },
  yard: {
    RoomComp: YardRoom, bgColor:'#082010', roomName:'🎮 Настроение', catDefaultX:'48%',
    minigameScreen:'minigame_memory', minigameLabel:'🧩 Карточки',
    objects:[
      { id:'ball',  emoji:'⚽', label:'Мяч',     posX:'22%', posY:'68%', catTargetX:'16%', thought:'⚽', cooldownMin:3, isCatTap:false,
        getEffect:()=>({ ok:true, delta:{ mood:10, fatigue:3 }, xp:5, particles:'⭐', msg:'⚽ Кот играет!', actionKey:'playCount' })},
      { id:'yarn',  emoji:'🧶', label:'Клубок',  posX:'72%', posY:'63%', catTargetX:'67%', thought:'🧶', cooldownMin:3, isCatTap:false,
        getEffect:()=>({ ok:true, delta:{ mood:7 }, xp:4, particles:'💛', msg:'🧶 Кот играет!', actionKey:'playCount' })},
      { id:'cat_y', emoji:'🐾', label:'Котик',   posX:null,  posY:null,                    thought:'😻', cooldownMin:1, isCatTap:true,
        getEffect:()=>({ ok:true, delta:{ mood:3 }, xp:0, particles:'💕', msg:'Мурр~ 💕' })},
    ]
  },
  clinic: {
    RoomComp: ClinicRoom, bgColor:'#081828', roomName:'🏥 Здоровье', catDefaultX:'38%',
    objects:[
      { id:'cabinet', emoji:'🗄️', label:'Аптечка', posX:'75%', posY:'42%', catTargetX:'68%', thought:'💊', cooldownMin:0, isCatTap:false,
        getEffect:(inv)=>{
          const m = ['med_premium','med_basic'].find(k=>inv[k]>0);
          if (!m) return { ok:false, needShop:true, msg:'Нет лекарств! Купи в магазине 🛒' };
          const it = MED_ITEMS.find(i=>i.id===m);
          return { ok:true, useItem:m, delta:{ health:it.health, mood:it.mood||0 }, xp:it.xp, particles:'💊', msg:`💊 Кот вылечен! +${it.health}HP`, actionKey:'clinicCount' };
        }},
      { id:'cat_cl', emoji:'🐾', label:'Котик', posX:null, posY:null, thought:'🤧', cooldownMin:1, isCatTap:true,
        getEffect:()=>({ ok:true, delta:{ mood:2 }, xp:0, particles:'💕', msg:'Апчхи! 🤧' })},
    ]
  },
};

/* ══════════════════════════════════════════════════
   UNIFIED ROOM SCREEN
   ══════════════════════════════════════════════════ */
function RoomScreen({ roomId, fills, isCrit, activeNav, setActiveNav, onPawClick,
                      hearts, removeHeart, inventory, stats, level,
                      cooldowns, onObjectAction, onMinigame, onBack, activeNFT }) {
  const def      = ROOM_DEFS[roomId];
  const PANEL_H  = 192;

  const [catLeft,    setCatLeft]    = useState(def.catDefaultX);
  const [catFacing,  setCatFacing]  = useState(1);
  const [catThought, setCatThought] = useState(null);
  const [catWalking, setCatWalking] = useState(false);
  const [particles,  setParticles]  = useState([]);
  const pId      = useRef(0);
  const walkTimer= useRef(null);
  useEffect(() => () => clearTimeout(walkTimer.current), []);

  // Reset cat on room change
  useEffect(() => {
    setCatLeft(def.catDefaultX); setCatFacing(1);
    setCatThought(null); setCatWalking(false);
  }, [roomId]);

  function spawnPtc(emoji) {
    const id = ++pId.current;
    setParticles(p => [...p, { id, emoji }]);
    setTimeout(() => setParticles(p => p.filter(x=>x.id!==id)), 1100);
  }

  function handleTap(obj) {
    const cdKey = `${roomId}_${obj.id}`;
    if ((cooldowns[cdKey] || 0) > Date.now()) return;
    const result = obj.getEffect(inventory, stats);
    if (!result.ok) {
      setCatThought('😿');
      setTimeout(() => setCatThought(null), 1400);
      onObjectAction({ msg: result.msg, goToShop: result.needShop });
      return;
    }
    clearTimeout(walkTimer.current);
    if (!obj.isCatTap && obj.catTargetX) {
      const tNum = parseFloat(obj.catTargetX);
      const cNum = parseFloat(catLeft);
      setCatFacing(tNum > cNum ? 1 : -1);
      setCatLeft(obj.catTargetX);
    }
    setCatWalking(true);
    const delay = obj.isCatTap ? 80 : 520;
    setTimeout(() => {
      setCatThought(obj.thought);
      spawnPtc(result.particles || '✨');
      onObjectAction({
        cdKey, cooldownMs: obj.cooldownMin * 60000,
        delta: result.delta, xp: result.xp,
        useItem: result.useItem, msg: result.msg,
        actionKey: result.actionKey,
        premiumFed: result.premiumFed || false,
      });
    }, delay);
    if (!obj.isCatTap) {
      walkTimer.current = setTimeout(() => {
        setCatLeft(def.catDefaultX); setCatFacing(1); setCatWalking(false);
        setTimeout(() => setCatThought(null), 700);
      }, 1650);
    } else {
      setCatWalking(false);
      setTimeout(() => setCatThought(null), 1200);
    }
  }

  return (
    <div style={{ position:'absolute', inset:0, background:def.bgColor, animation:'screenFade 0.3s ease' }}>
      {/* Room + hotspots */}
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:PANEL_H, overflow:'hidden' }}>
        <def.RoomComp/>
        {def.objects.filter(o=>!o.isCatTap && o.posX).map(obj => {
          const cdKey = `${roomId}_${obj.id}`;
          const initCd = Math.max(0, (cooldowns[cdKey]||0) - Date.now());
          return <Hotspot key={obj.id} emoji={obj.emoji} label={obj.label} posX={obj.posX} posY={obj.posY} initCdMs={initCd} onTap={()=>handleTap(obj)}/>;
        })}
      </div>

      {/* Floating hearts */}
      {hearts.map(h => <FloatingHeart key={h.id} id={h.id} x={h.x} y={h.y} onDone={()=>removeHeart(h.id)} emoji={h.emoji}/>)}

      {/* Particles near cat */}
      {particles.map(p => (
        <div key={p.id} style={{ position:'absolute', left:catLeft, bottom:PANEL_H+148, transform:'translateX(-50%)', fontSize:26, pointerEvents:'none', zIndex:35, animation:'heartPop 1s ease-out forwards' }}>{p.emoji}</div>
      ))}

      {/* Cat — also tappable for the cat-tap hotspot */}
      <div
        onPointerDown={() => { const o=def.objects.find(x=>x.isCatTap); if(o) handleTap(o); }}
        style={{ position:'absolute', bottom:PANEL_H+18, left:catLeft, width:130,
          filter:'drop-shadow(0 6px 18px rgba(0,0,0,0.7))',
          transform:`scaleX(${catFacing})`, transformOrigin:'center',
          transition:'left 0.55s ease-in-out',
          animation: catWalking ? 'catWalkBob 0.38s linear infinite' : 'floatY 2.5s ease-in-out infinite',
          cursor:'pointer', zIndex:16, userSelect:'none', touchAction:'none' }}>
        <img src={CAT} alt="кот" style={{ width:'100%', display:'block' }} draggable="false"/>
      </div>

      {/* Thought bubble follows cat */}
      {catThought && (
        <div style={{ position:'absolute', bottom:PANEL_H+150,
          left:`calc(${catLeft} + ${catFacing===1?'75px':'-46px'})`,
          transition:'left 0.55s ease-in-out', pointerEvents:'none', zIndex:62 }}>
          <ThoughtBubble emoji={catThought}/>
        </div>
      )}

      {/* Header */}
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:60, display:'flex', alignItems:'center', gap:10, padding:'14px 14px 0' }}>
        <button onClick={onBack}
          style={{ background:'rgba(0,0,0,0.55)', border:'1.5px solid rgba(255,255,255,0.18)', borderRadius:12, width:38, height:38, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0 }}>←</button>
        <span style={{ fontSize:17, fontWeight:900, color:'#f5dfc0', textShadow:'0 1px 6px rgba(0,0,0,0.6)', flex:1 }}>{def.roomName}</span>
        {onMinigame && (
          <button onClick={onMinigame}
            style={{ background:'rgba(255,210,60,0.18)', border:'1.5px solid rgba(255,210,60,0.55)', borderRadius:14, padding:'7px 11px', cursor:'pointer', fontSize:11, fontWeight:900, color:'#ffd060', fontFamily:"'Nunito',sans-serif", flexShrink:0 }}>
            {def.minigameLabel || '🎮 Мини-игра'}
          </button>
        )}
      </div>

      <BottomPanel fills={fills} isCrit={isCrit} onPawClick={onPawClick} activeNav={activeNav} setActiveNav={setActiveNav} canClaimDaily={false}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   COMPLAINT OVERLAY
   ══════════════════════════════════════════════════ */
function ComplaintOverlay({ text, onClose }) {
  return (
    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.72)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'linear-gradient(160deg,#f8f0e2,#f0e4cc)', borderRadius:28, padding:'28px 24px', maxWidth:320, width:'100%', boxShadow:'0 8px 40px rgba(0,0,0,0.5)', border:'3px solid #1a0800', animation:'complaintIn 0.35s ease', textAlign:'center' }}>
        <img src={CAT} alt="кот" style={{ width:110, marginBottom:12 }} draggable="false"/>
        <div style={{ fontSize:20, fontWeight:900, color:'#3a1808', marginBottom:10 }}>Кот скучал! 😿</div>
        <div style={{ fontSize:13, color:'#5a3018', lineHeight:1.7, marginBottom:22, whiteSpace:'pre-line' }}>{text}</div>
        <button onClick={onClose} style={{ background:'linear-gradient(155deg,#ffd060,#f0a020)', border:'none', borderRadius:18, padding:'14px 36px', fontSize:16, fontWeight:900, color:'white', cursor:'pointer', boxShadow:'0 5px 0 #c07808', width:'100%', fontFamily:"'Nunito',sans-serif" }}>
          Прости, котик! 😊
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PHASE 3 — RETURN HOME MODAL
   ══════════════════════════════════════════════════ */
function ReturnModal({ returnData, onClaim }) {
  const { minsAway, statsBefore, statsAfter, bonus } = returnData;
  const h = Math.floor(minsAway / 60);
  const m = Math.floor(minsAway % 60);
  const timeStr = h > 0 ? `${h} ч${m > 0 ? ' ' + m + ' мин' : ''}` : `${m} мин`;

  // Derive severity label for the title
  const rawMinsTotal = minsAway;
  const titleText = rawMinsTotal >= 360
    ? 'Кот очень соскучился! 😢'
    : rawMinsTotal >= 120
    ? 'Пока тебя не было... 😿'
    : 'Кот тебя ждал! 🐱';

  const STAT_CFG = [
    { key:'hunger',  icon:'🍔', label:'Голод',        neg:true  },
    { key:'fatigue', icon:'😴', label:'Сон',          neg:true  },
    { key:'toilet',  icon:'🚽', label:'Гигиена',      neg:true  },
    { key:'mood',    icon:'🎮', label:'Настроение',   neg:false },
    { key:'health',  icon:'🏥', label:'Здоровье',     neg:false },
  ];

  return (
    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.82)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:18, backdropFilter:'blur(8px)' }}>
      <div style={{ background:'linear-gradient(160deg,#1c0a00,#301800)', border:'2px solid rgba(255,180,60,0.38)', borderRadius:28, padding:'24px 20px 26px', maxWidth:340, width:'100%', boxShadow:'0 14px 60px rgba(0,0,0,0.75)', animation:'returnModalIn 0.4s cubic-bezier(0.34,1.56,0.64,1)', textAlign:'center' }}>

        {/* Sad cat — gentle float, desaturated, NOT shaking */}
        <div style={{ position:'relative', display:'inline-block', marginBottom:6 }}>
          <div style={{ animation:'floatY 2.8s ease-in-out infinite', display:'inline-block' }}>
            <img src={CAT} alt="кот"
              style={{ width:110, filter:'saturate(0.35) brightness(0.78)', display:'block' }}
              draggable="false"/>
          </div>
          {/* Tear drops */}
          <div style={{ position:'absolute', bottom:8, left:'20%', fontSize:18, animation:'floatY 2s ease-in-out infinite 0.4s', pointerEvents:'none' }}>💧</div>
          <div style={{ position:'absolute', bottom:4, right:'18%', fontSize:14, animation:'floatY 2.2s ease-in-out infinite 0.9s', pointerEvents:'none' }}>💧</div>
        </div>

        <div style={{ fontSize:19, fontWeight:900, color:'#f5dfc0', marginBottom:4 }}>{titleText}</div>
        <div style={{ fontSize:13, color:'#c8a060', marginBottom:16 }}>
          Тебя не было <strong style={{ color:'#ffd060' }}>{timeStr}</strong>
        </div>

        {/* Stat delta grid */}
        <div style={{ background:'rgba(0,0,0,0.32)', borderRadius:16, padding:'12px 14px', marginBottom:14, textAlign:'left' }}>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.38)', fontWeight:800, marginBottom:8, textTransform:'uppercase', letterSpacing:0.6 }}>Пока тебя не было:</div>
          {STAT_CFG.map(({ key, icon, label, neg }) => {
            const delta = Math.round(statsAfter[key] - statsBefore[key]);
            if (Math.abs(delta) < 2) return null;
            const isBad = neg ? delta > 0 : delta < 0;
            // Show as fill-bar change (invert sign for neg stats so "-60%" means "lost 60% of bar")
            const fillDelta = neg ? -delta : delta;
            return (
              <div key={key} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                <span style={{ fontSize:16, width:22 }}>{icon}</span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.65)', flex:1 }}>{label}</span>
                {/* Mini bar */}
                <div style={{ width:52, height:6, background:'rgba(255,255,255,0.12)', borderRadius:99, overflow:'hidden', flexShrink:0 }}>
                  <div style={{ height:'100%', width:`${Math.max(0, Math.min(100, 100 + fillDelta))}%`, background: isBad ? '#ff6050' : '#60d040', borderRadius:99, transition:'width 0.6s ease' }}/>
                </div>
                <span style={{ fontSize:12, fontWeight:900, color: isBad ? '#ff7060' : '#70e060', width:36, textAlign:'right' }}>
                  {fillDelta > 0 ? '+' : ''}{fillDelta}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Return bonus */}
        {bonus.coins > 0 && (
          <div style={{ background:'linear-gradient(135deg,rgba(255,210,60,0.14),rgba(255,130,20,0.14))', border:'1.5px solid rgba(255,210,60,0.38)', borderRadius:16, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ fontSize:36, animation:'dailyBounce 1.4s ease-in-out infinite' }}>🎁</div>
            <div style={{ textAlign:'left' }}>
              <div style={{ fontSize:11, color:'#ffd060', fontWeight:800, textTransform:'uppercase', letterSpacing:0.4 }}>Бонус за ожидание</div>
              <div style={{ fontSize:17, fontWeight:900, color:'#f5dfc0' }}>+{bonus.coins} 🪙 &nbsp;+{bonus.xp} XP</div>
            </div>
          </div>
        )}

        <button onClick={onClaim} style={{ background:'linear-gradient(155deg,#ffd060,#f0a020)', border:'none', borderRadius:18, padding:'15px 36px', fontSize:17, fontWeight:900, color:'white', cursor:'pointer', boxShadow:'0 5px 0 #c07808', width:'100%', fontFamily:"'Nunito',sans-serif" }}>
          Я дома! 🏠
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PHASE 3 — DRAGGABLE ROOM ITEM
   ══════════════════════════════════════════════════ */
function DraggableRoomItem({ item, x, y, editMode, onMove, onRemove }) {
  const ref     = useRef(null);
  const active  = useRef(false);
  const origin  = useRef(null);

  const onPointerDown = (e) => {
    if (!editMode) return;
    e.stopPropagation();
    active.current = true;
    ref.current.setPointerCapture(e.pointerId);
    const rootEl  = document.getElementById('root');
    const rootRect = rootEl ? rootEl.getBoundingClientRect() : { left:0, top:0 };
    origin.current = {
      ptrX: e.clientX - rootRect.left,
      ptrY: e.clientY - rootRect.top,
      startX: x,
      startY: y,
    };
  };

  const onPointerMove = (e) => {
    if (!active.current || !origin.current) return;
    const rootEl   = document.getElementById('root');
    const rootRect = rootEl ? rootEl.getBoundingClientRect() : { left:0, top:0 };
    const curX = e.clientX - rootRect.left;
    const curY = e.clientY - rootRect.top;
    onMove(
      clamp(origin.current.startX + (curX - origin.current.ptrX), 4, 340),
      clamp(origin.current.startY + (curY - origin.current.ptrY), 56, 455),
    );
  };

  const onPointerUp = () => { active.current = false; };

  return (
    <div ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position:'absolute', left:x, top:y, zIndex:13,
        fontSize:36, userSelect:'none', touchAction:'none',
        cursor: editMode ? 'move' : 'default',
        filter:'drop-shadow(0 3px 10px rgba(0,0,0,0.55))',
        lineHeight:1,
      }}
    >
      {item.emoji}
      {editMode && (
        <div onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{ position:'absolute', top:-9, right:-9, background:'#ff3050', color:'white', borderRadius:99, width:20, height:20, fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, cursor:'pointer', zIndex:2, boxShadow:'0 2px 6px rgba(0,0,0,0.4)' }}>
          ✕
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PHASE 3 — ROOM EDIT PANEL
   ══════════════════════════════════════════════════ */
function RoomEditPanel({ ownedDecor, roomLayout, onPlace, onDone }) {
  const owned   = ROOM_ITEMS.filter(item => ownedDecor[item.id]);
  const unplaced = owned.filter(item => !roomLayout.items.some(i => i.id === item.id));

  return (
    <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:50, animation:'slideUp 0.28s ease' }}>
      <div style={{ background:'rgba(10,4,0,0.92)', borderTop:'1.5px solid rgba(255,200,60,0.22)', borderRadius:'22px 22px 0 0', padding:'14px 14px 28px', backdropFilter:'blur(12px)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <span style={{ fontSize:13, fontWeight:800, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:0.6 }}>
            🎨 Декор комнаты
          </span>
          <button onClick={onDone}
            style={{ background:'linear-gradient(135deg,#70d050,#40a020)', border:'none', borderRadius:12, padding:'7px 18px', fontSize:13, fontWeight:900, color:'white', cursor:'pointer', fontFamily:"'Nunito',sans-serif", boxShadow:'0 3px 0 #308010' }}>
            Готово ✓
          </button>
        </div>
        {owned.length === 0 ? (
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.35)', textAlign:'center', padding:'10px 0' }}>
            Купи декор в магазине 🛒
          </div>
        ) : (
          <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:4 }}>
            {unplaced.map(item => (
              <button key={item.id} onClick={() => onPlace(item.id)}
                style={{ flexShrink:0, background:'rgba(255,255,255,0.08)', border:'1.5px solid rgba(255,255,255,0.18)', borderRadius:14, padding:'10px 12px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5, fontFamily:"'Nunito',sans-serif" }}>
                <span style={{ fontSize:30 }}>{item.emoji}</span>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.65)', fontWeight:700, whiteSpace:'nowrap' }}>{item.name}</span>
              </button>
            ))}
            {unplaced.length === 0 && owned.length > 0 && (
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', alignSelf:'center', padding:'0 8px' }}>
                Все предметы размещены!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PHASE 2 — Achievements, Missions, Stats, Sound
   ══════════════════════════════════════════════════ */
/* ══ ACHIEVEMENT TOAST BANNER ══ */
function AchievementToastBanner({ achievement, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3400);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ position:'absolute', top:14, left:12, right:12, zIndex:600, background:'linear-gradient(135deg,#1a0e00,#2e1800)', border:'2px solid rgba(255,200,60,0.7)', borderRadius:22, padding:'14px 16px', display:'flex', alignItems:'center', gap:14, boxShadow:'0 8px 32px rgba(0,0,0,0.65)', animation:'achievementIn 3.4s ease forwards', pointerEvents:'none' }}>
      <div style={{ fontSize:40 }}>{achievement.icon}</div>
      <div>
        <div style={{ fontSize:11, color:'#ffd060', fontWeight:800, letterSpacing:0.5, textTransform:'uppercase' }}>🏆 Достижение!</div>
        <div style={{ fontSize:16, fontWeight:900, color:'#f5dfc0' }}>{achievement.name}</div>
        <div style={{ fontSize:12, color:'#c8a860' }}>{achievement.desc} · +{achievement.coins} 🪙</div>
      </div>
    </div>
  );
}

/* ══ MISSION CARD ══ */
function MissionCard({ mission, onClaim }) {
  const pct  = Math.min(100, Math.round((mission.progress / mission.target) * 100));
  const done = mission.completed;
  return (
    <div style={{ background: done && !mission.claimed ? 'rgba(80,180,60,0.1)' : 'rgba(255,255,255,0.06)', borderRadius:18, padding:'14px 16px', marginBottom:10, border:`1.5px solid ${done ? 'rgba(80,200,60,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ fontSize:34 }}>{mission.icon}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#f5dfc0' }}>{mission.desc}</div>
          <div style={{ fontSize:12, color:'#c8a060', marginTop:1 }}>+{mission.coins} 🪙</div>
          <div style={{ marginTop:7, height:5, background:'rgba(255,255,255,0.1)', borderRadius:99, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:99, background: done ? '#60c840' : 'linear-gradient(90deg,#ffd060,#f0a020)', width:`${pct}%`, transition:'width 0.4s ease', animation: pct === 0 ? 'none' : 'progressFill 0.5s ease' }}/>
          </div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:2, fontWeight:700 }}>{mission.progress}/{mission.target}</div>
        </div>
        {done && !mission.claimed && (
          <button onClick={() => onClaim(mission)} style={{ padding:'10px 14px', borderRadius:14, border:'none', cursor:'pointer', fontSize:13, fontWeight:900, background:'linear-gradient(135deg,#60c840,#409020)', color:'white', boxShadow:'0 3px 0 #208010', fontFamily:"'Nunito',sans-serif", animation:'missionClaim 0.3s ease', flexShrink:0 }}>
            Забрать!
          </button>
        )}
        {mission.claimed && <div style={{ fontSize:26 }}>✅</div>}
        {!done && <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', fontWeight:700, flexShrink:0 }}>{pct}%</div>}
      </div>
    </div>
  );
}

/* ══ ACHIEVEMENT CARD ══ */
function AchievementCard({ achievement, unlocked }) {
  return (
    <div style={{ background: unlocked ? 'rgba(255,210,60,0.09)' : 'rgba(255,255,255,0.04)', borderRadius:18, padding:'14px 16px', marginBottom:10, border:`1.5px solid ${unlocked ? 'rgba(255,210,60,0.35)' : 'rgba(255,255,255,0.07)'}`, opacity: unlocked ? 1 : 0.7, display:'flex', alignItems:'center', gap:14 }}>
      <div style={{ fontSize:36, filter: unlocked ? 'none' : 'grayscale(1)' }}>{achievement.icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:15, fontWeight:900, color: unlocked ? '#ffd060' : '#c8a060' }}>{achievement.name}</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:1 }}>{achievement.desc}</div>
        <div style={{ fontSize:12, fontWeight:700, marginTop:3, color: unlocked ? '#80e060' : 'rgba(255,255,255,0.25)' }}>
          {unlocked ? '✅ Выполнено' : `+${achievement.coins} 🪙`}
        </div>
      </div>
      {unlocked && <div style={{ fontSize:22 }}>🏆</div>}
      {!unlocked && <div style={{ fontSize:14, fontWeight:900, color:'rgba(255,255,255,0.2)' }}>+{achievement.coins}🪙</div>}
    </div>
  );
}

/* ══ STATISTICS VIEW ══ */
function StatsView({ actionCounts, level, dailyStreak }) {
  const rows = [
    { icon:'🍔', label:'Кормлений',        value: actionCounts.feedCount     || 0 },
    { icon:'🚿', label:'Уборок туалета',    value: actionCounts.bathroomCount || 0 },
    { icon:'😴', label:'Снов',              value: actionCounts.sleepCount    || 0 },
    { icon:'🎮', label:'Игровых сессий',    value: actionCounts.playCount     || 0 },
    { icon:'🏥', label:'Визитов в клинику', value: actionCounts.clinicCount   || 0 },
    { icon:'⚽', label:'Использ. игрушек',  value: actionCounts.toyCount      || 0 },
    { icon:'🏆', label:'Мини-игр сыграно',  value: actionCounts.minigameWins  || 0 },
    { icon:'🛒', label:'Покупок',           value: actionCounts.buyCount      || 0 },
    { icon:'🔥', label:'Макс. серия',       value: actionCounts.maxStreak     || 0 },
    { icon:'⭐', label:'Текущий уровень',   value: level },
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
      {rows.map(r => (
        <div key={r.label} style={{ background:'rgba(255,255,255,0.06)', borderRadius:16, padding:'14px 12px', display:'flex', alignItems:'center', gap:10, border:'1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize:26 }}>{r.icon}</span>
          <div>
            <div style={{ fontSize:22, fontWeight:900, color:'#f5dfc0' }}>{r.value}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.38)', fontWeight:700, lineHeight:1.3 }}>{r.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══ FULL ACHIEVEMENTS SCREEN ══ */
function AchievementsScreen({ onBack, canClaimDaily, onShowDaily, achievements, actionCounts, level, dailyStreak, dailyMissions, onClaimMission }) {
  const [tab, setTab] = useState('missions');
  const tabs = [
    { id:'missions',  label:'📋 Задания'    },
    { id:'achiev',    label:'🏆 Успехи'     },
    { id:'stats',     label:'📊 Статистика' },
  ];
  const unlockedCount = ACHIEVEMENTS.filter(a => achievements[a.id]).length;

  return (
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,#110800,#220f00)', animation:'screenFade 0.3s ease', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px 0', flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.08)', border:'1.5px solid rgba(255,255,255,0.12)', borderRadius:12, width:38, height:38, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>←</button>
        <span style={{ fontSize:20, fontWeight:900, color:'#f5dfc0', flex:1 }}>Успехи и задания</span>
        <span style={{ fontSize:13, color:'#ffd060', fontWeight:800 }}>{unlockedCount}/{ACHIEVEMENTS.length} 🏆</span>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, padding:'12px 16px 8px', flexShrink:0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, padding:'9px 4px', borderRadius:14, border:'2px solid rgba(255,255,255,0.1)', cursor:'pointer', fontSize:12, fontWeight:800, fontFamily:"'Nunito',sans-serif", background: tab===t.id ? 'linear-gradient(135deg,#ffd060,#f0a020)' : 'rgba(255,255,255,0.07)', color: tab===t.id ? 'white' : 'rgba(255,255,255,0.55)', boxShadow: tab===t.id ? '0 3px 0 #c07808' : 'none', transition:'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto', padding:'4px 16px 32px' }}>

        {/* ── MISSIONS TAB ── */}
        {tab === 'missions' && (
          <div>
            {/* Daily reward banner */}
            {canClaimDaily && (
              <div onClick={onShowDaily} style={{ background:'linear-gradient(135deg,rgba(255,210,60,0.18),rgba(255,150,20,0.18))', border:'2px solid rgba(255,210,60,0.5)', borderRadius:20, padding:'16px 18px', marginBottom:14, cursor:'pointer', display:'flex', alignItems:'center', gap:14, animation:'dailyBounce 2s ease-in-out infinite' }}>
                <div style={{ fontSize:42 }}>🎁</div>
                <div>
                  <div style={{ fontSize:16, fontWeight:900, color:'#ffd060' }}>Ежедневная награда!</div>
                  <div style={{ fontSize:13, color:'#c8a060' }}>Нажми, чтобы забрать ✨</div>
                </div>
                <div style={{ marginLeft:'auto', fontSize:24 }}>→</div>
              </div>
            )}
            {/* Today's missions */}
            <div style={{ fontSize:13, fontWeight:800, color:'rgba(255,255,255,0.45)', marginBottom:10, letterSpacing:0.5, textTransform:'uppercase' }}>
              Задания на сегодня
            </div>
            {(dailyMissions.missions || []).map(m => (
              <MissionCard key={m.id} mission={m} onClaim={onClaimMission}/>
            ))}
            {/* Tip */}
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.25)', textAlign:'center', marginTop:12, lineHeight:1.6 }}>
              Задания обновляются каждый день в 00:00 🌙
            </div>
          </div>
        )}

        {/* ── ACHIEVEMENTS TAB ── */}
        {tab === 'achiev' && (
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:'rgba(255,255,255,0.45)', marginBottom:10, letterSpacing:0.5, textTransform:'uppercase' }}>
              {unlockedCount} из {ACHIEVEMENTS.length} разблокировано
            </div>
            {/* Unlocked first */}
            {ACHIEVEMENTS.filter(a => achievements[a.id]).map(a => (
              <AchievementCard key={a.id} achievement={a} unlocked={true}/>
            ))}
            {/* Then locked */}
            {ACHIEVEMENTS.filter(a => !achievements[a.id]).map(a => (
              <AchievementCard key={a.id} achievement={a} unlocked={false}/>
            ))}
          </div>
        )}

        {/* ── STATS TAB ── */}
        {tab === 'stats' && (
          <StatsView actionCounts={actionCounts} level={level} dailyStreak={dailyStreak}/>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   NFT SKIN SCREEN — wallet + gallery
   ══════════════════════════════════════════════════ */
function NFTSkinScreen({ walletAddress, ownedNFTs, activeNFT, onConnect, onDisconnect, onSelectNFT, onManualAddress, onBack, loading }) {
  const [tab, setTab] = useState(walletAddress ? 'gallery' : 'connect');
  const [showManual, setShowManual] = useState(false);
  const [manualInput, setManualInput] = useState('');

  const tierCfg = activeNFT ? (NFT_TIER_BONUSES[SCARED_CAT_MODELS[activeNFT.name]?.tier] || NFT_TIER_BONUSES.common) : null;

  return (
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,#0a0820,#140a30)', animation:'screenFade 0.3s ease', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 16px 0', flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,0.1)', border:'1.5px solid rgba(255,255,255,0.2)', borderRadius:12, width:38, height:38, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>←</button>
        <span style={{ fontSize:19, fontWeight:900, color:'white', flex:1 }}>🎨 NFT Скины</span>
        {walletAddress && (
          <button onClick={onDisconnect} style={{ background:'rgba(255,60,60,0.15)', border:'1.5px solid rgba(255,60,60,0.4)', borderRadius:12, padding:'6px 10px', cursor:'pointer', fontSize:11, fontWeight:800, color:'#ff8080', fontFamily:"'Nunito',sans-serif" }}>
            Отключить
          </button>
        )}
      </div>

      {/* Wallet status strip */}
      <div style={{ margin:'14px 16px 0', padding:'12px 16px', borderRadius:18,
        background: walletAddress ? 'rgba(60,255,120,0.1)' : 'rgba(255,255,255,0.06)',
        border: `1.5px solid ${walletAddress ? 'rgba(60,255,120,0.35)' : 'rgba(255,255,255,0.15)'}`,
        display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ fontSize:28 }}>{walletAddress ? '👛' : '🔗'}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:900, color: walletAddress ? '#60ff90' : '#c0b0ff' }}>
            {walletAddress ? 'Кошелёк подключён' : 'Кошелёк не подключён'}
          </div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', marginTop:2, fontFamily:'monospace', wordBreak:'break-all' }}>
            {walletAddress ? `${walletAddress.slice(0,8)}...${walletAddress.slice(-6)}` : 'Подключи TON-кошелёк для выбора NFT скина'}
          </div>
        </div>
      </div>

      {/* Active skin badge */}
      {activeNFT && tierCfg && (
        <div style={{ margin:'10px 16px 0', padding:'10px 14px', borderRadius:16,
          background:`linear-gradient(135deg,${tierCfg.glow}22,${tierCfg.color}18)`,
          border:`1.5px solid ${tierCfg.color}55`,
          display:'flex', alignItems:'center', gap:12 }}>
          <img src={activeNFT.image} alt={activeNFT.name}
            style={{ width:44, height:44, borderRadius:10, objectFit:'cover', border:`2px solid ${tierCfg.color}` }}
            onError={e => { e.target.src = CAT_DEFAULT; }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:900, color:'white' }}>✅ Активный скин</div>
            <div style={{ fontSize:14, fontWeight:900, color: tierCfg.color }}>{activeNFT.name}</div>
            <div style={{ fontSize:10, color: tierCfg.color, opacity:0.85 }}>{tierCfg.label}</div>
          </div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', textAlign:'right', lineHeight:1.5 }}>
            <div>−{Math.round((1-calcNFTBonus(activeNFT).decayMult)*100)}% распад</div>
            <div>+{Math.round((calcNFTBonus(activeNFT).earnMult-1)*100)}% монеты</div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px 24px' }}>
        {!walletAddress ? (
          /* ── Connect screen ── */
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:300, gap:20, textAlign:'center' }}>
            <div style={{ fontSize:72 }}>🐱</div>
            <div style={{ fontSize:16, fontWeight:900, color:'white' }}>Подключи TON кошелёк</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.7 }}>
              Если у тебя есть NFT из коллекции<br/>
              <span style={{ color:'#c080ff', fontWeight:800 }}>Scared Cat</span>, выбери его как скин!<br/>
              Редкие коты дают пассивные бонусы 🔮
            </div>
            {/* Rarity table */}
            <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:16, padding:'14px 18px', width:'100%', textAlign:'left' }}>
              {Object.entries(NFT_TIER_BONUSES).map(([k, t]) => (
                <div key={k} style={{ display:'flex', alignItems:'center', gap:10, padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ width:10, height:10, borderRadius:99, background:t.color, boxShadow:`0 0 6px ${t.glow}` }}/>
                  <div style={{ fontSize:11, color:'white', fontWeight:800, flex:1 }}>{t.label}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>−{Math.round((1-t.decayMult)*100)}% / +{Math.round((t.earnMult-1)*100)}%</div>
                </div>
              ))}
            </div>
            <button onClick={onConnect} disabled={loading}
              style={{ background:'linear-gradient(135deg,#6040ff,#a060ff)', border:'none', borderRadius:22, padding:'16px 48px', fontSize:17, fontWeight:900, color:'white', cursor:loading?'default':'pointer', boxShadow:'0 6px 0 #3020a0', width:'100%', fontFamily:"'Nunito',sans-serif", opacity:loading?0.7:1 }}>
              {loading ? '⏳ Подключаем...' : '👛 Подключить кошелёк'}
            </button>

            {/* Manual address fallback */}
            <div style={{ width:'100%' }}>
              <button onClick={() => setShowManual(v => !v)}
                style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif", textDecoration:'underline', padding:'4px 0' }}>
                {showManual ? '▲ Скрыть' : '✏️ Ввести адрес вручную'}
              </button>
              {showManual && (
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:6 }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', lineHeight:1.5 }}>
                    Если кошелёк не подключается автоматически — вставь свой TON-адрес:
                  </div>
                  <input
                    value={manualInput}
                    onChange={e => setManualInput(e.target.value)}
                    placeholder="EQ... или UQ..."
                    style={{ background:'rgba(255,255,255,0.1)', border:'1.5px solid rgba(255,255,255,0.2)', borderRadius:14, padding:'12px 14px', fontSize:13, color:'white', fontFamily:'monospace', outline:'none', width:'100%' }}
                  />
                  <button
                    onClick={() => { onManualAddress(manualInput); setShowManual(false); setManualInput(''); }}
                    disabled={!manualInput.trim() || loading}
                    style={{ background:'rgba(96,64,255,0.4)', border:'1.5px solid rgba(120,80,255,0.6)', borderRadius:14, padding:'12px', fontSize:14, fontWeight:800, color:'white', cursor:'pointer', fontFamily:"'Nunito',sans-serif", opacity:(!manualInput.trim() || loading)?0.5:1 }}>
                    🔍 Найти NFT
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : loading ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:250, gap:16 }}>
            <div style={{ fontSize:48, animation:'dailyBounce 1s ease-in-out infinite' }}>🔍</div>
            <div style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,0.7)' }}>Ищем твоих котов...</div>
          </div>
        ) : ownedNFTs.length === 0 ? (
          /* ── No NFTs ── */
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:250, gap:16, textAlign:'center' }}>
            <div style={{ fontSize:56 }}>😿</div>
            <div style={{ fontSize:15, fontWeight:900, color:'white' }}>NFT не найдены</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>
              В этом кошельке нет NFT из коллекции<br/>Scared Cat. Возможно, они в другом кошельке?
            </div>
            <button onClick={onDisconnect} style={{ background:'rgba(255,255,255,0.1)', border:'1.5px solid rgba(255,255,255,0.2)', borderRadius:16, padding:'12px 32px', fontSize:14, fontWeight:800, color:'white', cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>
              Сменить кошелёк
            </button>
          </div>
        ) : (
          /* ── NFT Gallery ── */
          <div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', fontWeight:700, marginBottom:10 }}>
              Найдено котов: {ownedNFTs.length} — выбери активный скин
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
              {ownedNFTs.map(nft => {
                const model  = SCARED_CAT_MODELS[nft.name];
                const tKey   = model?.tier || 'common';
                const tCfg   = NFT_TIER_BONUSES[tKey];
                const isActive = activeNFT?.address === nft.address;
                const bonus  = calcNFTBonus(nft);
                return (
                  <div key={nft.address}
                    onPointerDown={() => onSelectNFT(isActive ? null : nft)}
                    style={{ borderRadius:18, overflow:'hidden', cursor:'pointer',
                      border:`2.5px solid ${isActive ? tCfg.color : 'rgba(255,255,255,0.12)'}`,
                      background: isActive ? `${tCfg.color}18` : 'rgba(255,255,255,0.06)',
                      boxShadow: isActive ? `0 0 18px ${tCfg.glow}60` : 'none',
                      transition:'all 0.2s', userSelect:'none', touchAction:'none' }}>
                    {/* NFT image */}
                    <div style={{ position:'relative', aspectRatio:'1', overflow:'hidden', background:'#111' }}>
                      <img src={nft.image} alt={nft.name}
                        style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                        onError={e => { e.target.src = CAT_DEFAULT; }}/>
                      {isActive && (
                        <div style={{ position:'absolute', top:6, right:6, background:tCfg.color, borderRadius:99, width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>✅</div>
                      )}
                      {/* Tier badge */}
                      <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,0.75))', padding:'18px 8px 6px' }}>
                        <div style={{ fontSize:9, fontWeight:800, color:tCfg.color }}>{tCfg.label}</div>
                      </div>
                    </div>
                    {/* Info */}
                    <div style={{ padding:'8px 10px' }}>
                      <div style={{ fontSize:12, fontWeight:900, color:'white', marginBottom:3 }}>{nft.name}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>
                        −{Math.round((1-bonus.decayMult)*100)}% распад · +{Math.round((bonus.earnMult-1)*100)}% монеты
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCARED CAT SVG — standing 4-legged emoji black cat
   ══════════════════════════════════════════════════ */
function ScaredCatSVG({ emotion = 'normal', jumping = false }) {
  // Eye vertical radius per emotion (both eyes same for symmetry)
  const EY = { normal:15, scared:19, happy:8, sad:11, sick:9, excited:18 };
  const ey  = EY[emotion] || 15;
  const pupH = emotion === 'happy'  ? 4
             : emotion === 'scared' ? ey
             : Math.round(ey * 0.68);
  const pupW = emotion === 'scared' ? 3 : 5;

  const earTilt = (emotion === 'scared' || emotion === 'sick') ? 'rotate(-10,65,95)' : '';

  const idleAnim = jumping
    ? 'catScaredJump 0.68s cubic-bezier(0.36,0.07,0.19,0.97) forwards'
    : emotion === 'happy'  || emotion === 'excited' ? 'catHappyBounce 0.95s ease-in-out infinite'
    : emotion === 'sad'    || emotion === 'sick'    ? 'catSadDroop 2.4s ease-in-out infinite'
    : emotion === 'scared'                          ? 'catShake 0.45s linear infinite'
    :                                                 'catIdleBreathe 3.4s ease-in-out infinite';
  const sadFilter = emotion === 'sad' ? 'saturate(0.45)' : '';

  const C = React.createElement;
  return C('div', { style:{ width:'100%', animation:idleAnim, filter:sadFilter, transformOrigin:'bottom center' } },
    C('svg', { viewBox:'0 0 200 215', xmlns:'http://www.w3.org/2000/svg',
               style:{ width:'100%', display:'block', overflow:'visible' } },
      C('defs', null,
        /* body gradient — dark navy with slight purple */
        C('radialGradient', { id:'sc_bg', cx:'45%', cy:'30%', r:'65%' },
          C('stop', { offset:'0%',   stopColor:'#52506e' }),
          C('stop', { offset:'45%',  stopColor:'#25233c' }),
          C('stop', { offset:'100%', stopColor:'#0d0c1e' })
        ),
        /* gloss highlight on back arch */
        C('radialGradient', { id:'sc_hl', cx:'50%', cy:'40%', r:'55%' },
          C('stop', { offset:'0%',   stopColor:'#9e9cbe', stopOpacity:'0.90' }),
          C('stop', { offset:'50%',  stopColor:'#4e4c70', stopOpacity:'0.45' }),
          C('stop', { offset:'100%', stopColor:'#25233c', stopOpacity:'0'   })
        ),
        /* eye green gradient */
        C('radialGradient', { id:'sc_eg', cx:'30%', cy:'20%', r:'68%' },
          C('stop', { offset:'0%',   stopColor:'#ccff00' }),
          C('stop', { offset:'38%',  stopColor:'#66bb00' }),
          C('stop', { offset:'100%', stopColor:'#1a5500' })
        ),
        /* drop shadow */
        C('filter', { id:'sc_sh' },
          C('feDropShadow', { dx:'0', dy:'9', stdDeviation:'10', floodColor:'#000', floodOpacity:'0.60' })
        ),
        /* eye inner glow */
        C('filter', { id:'sc_ef' },
          C('feGaussianBlur', { stdDeviation:'2.8', result:'b' }),
          C('feMerge', null,
            C('feMergeNode', { in:'b' }),
            C('feMergeNode', { in:'SourceGraphic' })
          )
        )
      ),

      /* ── ground shadow ── */
      C('ellipse', { cx:'100', cy:'210', rx:'78', ry:'9', fill:'#000', opacity:'0.30' }),

      /* ── tail (behind body) ── */
      C('path', { d:'M 158,152 C 176,128 194,98 191,66 C 188,42 174,34 163,42 C 154,48 157,66 146,58',
                  fill:'none', stroke:'#0d0c1e', strokeWidth:'19', strokeLinecap:'round' }),
      C('path', { d:'M 158,152 C 176,128 194,98 191,66 C 188,42 174,34 163,42 C 154,48 157,66 146,58',
                  fill:'none', stroke:'#302e50', strokeWidth:'9',  strokeLinecap:'round' }),

      /* ── back legs ── */
      C('rect', { x:'116', y:'160', width:'23', height:'44', rx:'11', fill:'#1a1930', stroke:'#0d0c1e', strokeWidth:'3.5' }),
      C('rect', { x:'143', y:'160', width:'23', height:'44', rx:'11', fill:'#1a1930', stroke:'#0d0c1e', strokeWidth:'3.5' }),

      /* ── body (main arch oval) ── */
      C('ellipse', { cx:'108', cy:'122', rx:'66', ry:'54',
                     fill:'url(#sc_bg)', stroke:'#0d0c1e', strokeWidth:'5.5',
                     filter:'url(#sc_sh)' }),

      /* ── body gloss (arched highlight) ── */
      C('ellipse', { cx:'100', cy:'88', rx:'52', ry:'27',
                     fill:'url(#sc_hl)', transform:'rotate(-10,100,88)' }),

      /* ── front legs ── */
      C('rect', { x:'46', y:'162', width:'23', height:'42', rx:'11', fill:'#22203e', stroke:'#0d0c1e', strokeWidth:'3.5' }),
      C('rect', { x:'73', y:'164', width:'23', height:'40', rx:'11', fill:'#22203e', stroke:'#0d0c1e', strokeWidth:'3.5' }),

      /* ── head ── */
      C('circle', { cx:'65', cy:'96', r:'42',
                    fill:'url(#sc_bg)', stroke:'#0d0c1e', strokeWidth:'5.5' }),
      /* head forehead sheen */
      C('ellipse', { cx:'52', cy:'76', rx:'24', ry:'16',
                     fill:'rgba(100,98,148,0.28)', transform:'rotate(-22,52,76)' }),

      /* ── ears ── */
      C('polygon', { points:'40,75 28,38 64,68', transform:earTilt,
                     fill:'#0d0c1e', stroke:'#0d0c1e', strokeWidth:'2', strokeLinejoin:'round' }),
      C('polygon', { points:'42,74 33,44 62,69', transform:earTilt, fill:'#2e1a38' }),
      C('polygon', { points:'80,68 82,32 102,62', fill:'#0d0c1e', stroke:'#0d0c1e', strokeWidth:'2', strokeLinejoin:'round' }),
      C('polygon', { points:'81,68 84,37 100,63', fill:'#1e1434' }),

      /* ── left eye ── */
      C('ellipse', { cx:'50', cy:'96', rx:'14', ry:ey,
                     fill:'url(#sc_eg)', stroke:'#0d0c1e', strokeWidth:'3.5',
                     filter:'url(#sc_ef)',
                     style:{ animation: jumping ? 'none' : 'catEyeBlink 4.5s ease-in-out infinite' } }),
      C('ellipse', { cx:'50', cy:'97', rx:pupW, ry:pupH, fill:'#040210' }),
      C('circle',  { cx:'43', cy:'86', r:'5.5', fill:'white', opacity:'0.94' }),
      C('circle',  { cx:'58', cy:'105', r:'2',  fill:'white', opacity:'0.42' }),

      /* ── right eye ── */
      C('ellipse', { cx:'80', cy:'96', rx:'14', ry:ey,
                     fill:'url(#sc_eg)', stroke:'#0d0c1e', strokeWidth:'3.5',
                     filter:'url(#sc_ef)',
                     style:{ animation: jumping ? 'none' : 'catEyeBlink 4.5s ease-in-out 0.28s infinite' } }),
      C('ellipse', { cx:'80', cy:'97', rx:pupW, ry:pupH, fill:'#040210' }),
      C('circle',  { cx:'73', cy:'86', r:'5.5', fill:'white', opacity:'0.94' }),
      C('circle',  { cx:'88', cy:'105', r:'2',  fill:'white', opacity:'0.42' }),

      /* ── nose ── */
      C('path', { d:'M 60,114 L 65,119 L 70,114 L 65,110 Z',
                  fill:'#cc3366', stroke:'#0d0c1e', strokeWidth:'1.2' }),

      /* ── sick overlay ── */
      emotion === 'sick' && C('ellipse', { cx:'100', cy:'130', rx:'98', ry:'108', fill:'#3adf3a', opacity:'0.16' })
    )
  );
}

/* ══════════════════════════════════════════════════
   ROOT APP
   ══════════════════════════════════════════════════ */
function App() {
  // ─────────────────── ALL useState HOOKS (must be first, no code between) ───────────────────
  // Core state
  const [screen,      setScreen]      = useState('home');
  const [stats,       setStats]       = useState(_INIT.stats);
  const [coins,       setCoins]       = useState(_INIT.coins);
  const [xp,          setXP]          = useState(_INIT.xp);
  const [inventory,   setInventory]   = useState(_INIT.inventory);
  const [equipped,    setEquipped]    = useState(_INIT.equipped);
  const [dailyStreak, setDailyStreak] = useState(_INIT.dailyStreak);
  const [lastDaily,   setLastDaily]   = useState(_INIT.lastDaily);
  const [achievements,  setAchievements]  = useState(_INIT.achievements);
  const [highScores,    setHighScores]    = useState(_INIT.highScores);
  const [actionCounts,  setActionCounts]  = useState(_INIT.actionCounts);
  const [dailyMissions, setDailyMissions] = useState(_INIT.dailyMissions);
  const [roomLayout,  setRoomLayout]  = useState(_INIT.roomLayout  || defaultRoomLayout());
  const [ownedDecor,  setOwnedDecor]  = useState(_INIT.ownedDecor  || {});
  const [ownedBgs,    setOwnedBgs]    = useState(_INIT.ownedBgs    || ['bg_default']);
  const [editMode,    setEditMode]    = useState(false);
  const [returnData,  setReturnData]  = useState(_INIT.returnData  || null);
  // UI state
  const [complaint,      setComplaint]      = useState(null);
  const [showDailyModal, setShowDailyModal] = useState(_INIT.canClaimDaily);
  const [pendingStreak,  setPendingStreak]  = useState(_INIT.pendingStreak);
  const [levelUpModal,   setLevelUpModal]   = useState(null);
  const [hearts,         setHearts]         = useState([]);
  const [activeNav,      setActiveNav]      = useState('home');
  const [catX,           setCatX]           = useState(111);
  const [catFacing,      setCatFacing]      = useState(1);
  const [showGif,        setShowGif]        = useState(false);
  const [actionDone,     setActionDone]     = useState(false);
  const [cooldowns,      setCooldowns]      = useState({});
  // NFT Skin System
  const [walletAddress,  setWalletAddress]  = useState(_INIT.walletAddress || null);
  const [ownedNFTs,      setOwnedNFTs]      = useState(_INIT.ownedNFTs     || []);
  const [activeNFT,      setActiveNFT]      = useState(_INIT.activeNFT     || null);
  const [nftLoading,     setNftLoading]     = useState(false);
  const [skinFlash,      setSkinFlash]      = useState(false);
  const [trustPoints,    setTrustPoints]    = useState(_INIT.trustPoints   || 0);
  const [showTrustModal, setShowTrustModal] = useState(false);
  // Freelance system
  const [timezone,  setTimezone]  = useState(_INIT.timezone  || null);
  const [freelance, setFreelance] = useState(_INIT.freelance || defaultFreelance());
  // Scared Level
  const [scaredLvl,       setScaredLvl]       = useState(_INIT.scaredLvl ?? 85);
  const [showScaredModal, setShowScaredModal] = useState(false);
  // Cloud sync
  const [syncStatus,     setSyncStatus]     = useState(null); // null | 'syncing' | 'ok' | 'error'
  // Toast/queue
  const [toast,          setToast]          = useState(null);
  const [toastKey,       setToastKey]       = useState(0);
  const [achToast,       setAchToast]       = useState(null);
  const [achQueue,       setAchQueue]       = useState([]);

  // ─────────────────── DERIVED VALUES (after all hooks) ───────────────────
  const level      = levelFromXP(xp);
  const xpProg     = xpProgress(xp);
  const nftBonus   = calcNFTBonus(activeNFT);
  const trustProg  = trustProgress(trustPoints);
  const trustLv    = trustProg.lv;
  const trustStage = getTrustStage(trustLv);
  CAT = activeNFT ? activeNFT.image : CAT_DEFAULT;
  GIF = activeNFT ? activeNFT.image : GIF_DEFAULT;

  const createdAt      = useRef(_INIT.createdAt);
  const walkRef        = useRef({ x: 111, dir: 1 });
  const gifTimer       = useRef(null);
  const heartId        = useRef(0);
  const toastTimer     = useRef(null);
  const cloudSyncTimer = useRef(null);
  const wasCritRef     = useRef({ hunger: false, fatigue: false, toilet: false, mood: false, health: false });
  const nftBonusRef    = useRef(nftBonus);
  nftBonusRef.current  = nftBonus; // always fresh inside callbacks

  const day = Math.max(1, Math.floor((Date.now() - createdAt.current) / 86400000) + 1);

  // ── Telegram init ──
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) { tg.expand(); tg.ready(); }
  }, []);

  // ── Persist state (local + debounced cloud) ──
  useEffect(() => {
    const snapshot = {
      stats, coins, xp,
      createdAt: createdAt.current,
      lastDaily, dailyStreak,
      inventory, equipped, achievements, highScores,
      actionCounts, dailyMissions,
      roomLayout, ownedDecor, ownedBgs,
      walletAddress, ownedNFTs, activeNFT,
      trustPoints,
      timezone, freelance,
      scaredLvl,
      lastUpdate: Date.now(),
    };
    // Always save locally immediately
    saveState(snapshot);

    // Debounced cloud save — fires 8s after last change
    const chatId = getChatId();
    if (chatId && BACKEND_URL) {
      if (cloudSyncTimer.current) clearTimeout(cloudSyncTimer.current);
      cloudSyncTimer.current = setTimeout(() => {
        cloudSave(chatId, snapshot).catch(() => {});
      }, 8000);
    }
    return () => {
      if (cloudSyncTimer.current) clearTimeout(cloudSyncTimer.current);
    };
  }, [stats, coins, xp, lastDaily, dailyStreak, inventory, equipped, actionCounts, dailyMissions, roomLayout, ownedDecor, ownedBgs, walletAddress, ownedNFTs, activeNFT, trustPoints, timezone, freelance, scaredLvl]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cloud Load on startup — sync from cloud if it's newer than local ──
  useEffect(() => {
    const chatId = getChatId();
    if (!chatId || !BACKEND_URL) return;
    (async () => {
      try {
        const cloud = await cloudLoad(chatId);
        if (!cloud) return; // no cloud save yet
        const localTs = _INIT.lastUpdate || 0;
        const cloudTs = cloud.lastUpdate  || 0;
        if (cloudTs <= localTs) return; // local is same or newer — no need to overwrite

        // Cloud is newer — apply it
        if (cloud.stats)        setStats(cloud.stats);
        if (cloud.coins  != null) setCoins(cloud.coins);
        if (cloud.xp     != null) setXP(cloud.xp);
        if (cloud.inventory)    setInventory({ ...defaultInventory(), ...cloud.inventory });
        if (cloud.equipped)     setEquipped(cloud.equipped);
        if (cloud.dailyStreak != null) setDailyStreak(cloud.dailyStreak);
        if (cloud.lastDaily   != null) setLastDaily(cloud.lastDaily);
        if (cloud.achievements) setAchievements(cloud.achievements);
        if (cloud.highScores)   setHighScores(cloud.highScores);
        if (cloud.actionCounts) setActionCounts({ ...defaultActionCounts(), ...cloud.actionCounts });
        if (cloud.dailyMissions) setDailyMissions(getOrUpdateDailyMissions(cloud.dailyMissions));
        if (cloud.roomLayout)   setRoomLayout(cloud.roomLayout);
        if (cloud.ownedDecor)   setOwnedDecor(cloud.ownedDecor);
        if (cloud.ownedBgs)     setOwnedBgs(cloud.ownedBgs);
        if (cloud.walletAddress != null) setWalletAddress(cloud.walletAddress);
        if (cloud.ownedNFTs)    setOwnedNFTs(cloud.ownedNFTs);
        if (cloud.activeNFT  != null)   setActiveNFT(cloud.activeNFT);
        if (cloud.trustPoints != null)  setTrustPoints(cloud.trustPoints);
        if (cloud.timezone)     setTimezone(cloud.timezone);
        if (cloud.freelance)    setFreelance({ ...defaultFreelance(), ...cloud.freelance });
        if (cloud.scaredLvl != null)    setScaredLvl(cloud.scaredLvl);
        if (cloud.createdAt)    createdAt.current = cloud.createdAt;

        showToast('☁️ Прогресс загружен с облака');
        console.log(`[cloud] loaded from cloud (cloud ts: ${cloudTs}, local ts: ${localTs})`);
      } catch(e) {
        console.warn('[cloud] load error:', e);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Achievement checking (runs after actionCounts or level changes) ──
  useEffect(() => {
    const newOnes = checkNewAchievements(achievements, actionCounts, level);
    if (newOnes.length === 0) return;
    setAchievements(prev => {
      const upd = { ...prev };
      newOnes.forEach(a => { upd[a.id] = true; });
      return upd;
    });
    const coinsWon = newOnes.reduce((s, a) => s + a.coins, 0);
    if (coinsWon > 0) setCoins(c => c + coinsWon);
    setAchQueue(q => [...q, ...newOnes]);
    playSound('achievement');
  }, [actionCounts, level]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Show achievement toasts one at a time ──
  useEffect(() => {
    if (!achToast && achQueue.length > 0) {
      setAchToast(achQueue[0]);
      setAchQueue(q => q.slice(1));
    }
  }, [achToast, achQueue]);

  // ── Refresh daily missions if date changed ──
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (dailyMissions.date !== today) {
      setDailyMissions(getOrUpdateDailyMissions(null));
    }
  }, []);

  // ── In-app decay tick (every 10 seconds) ──
  useEffect(() => {
    const t = setInterval(() => {
      setStats(p => {
        // NFT bonus: multiply decay minutes by nftBonus.decayMult (<1 = slower decay)
        const next = applyDecay(p, (10 / 60) * nftBonus.decayMult, level);
        // HapticFeedback when a stat first crosses into critical
        const wc = wasCritRef.current;
        const nowCrit = {
          hunger:  next.hunger  >= 75,
          fatigue: next.fatigue >= 75,
          toilet:  next.toilet  >= 75,
          mood:    next.mood    <= 25,
          health:  next.health  <= 25,
        };
        const newCrit = Object.keys(nowCrit).some(k => nowCrit[k] && !wc[k]);
        if (newCrit) {
          try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('warning'); } catch(_) {}
        }
        wasCritRef.current = nowCrit;
        // ── Scared LvL drift (per 10s tick) ──
        setScaredLvl(prev => {
          let delta = 0.08; // baseline drift upward
          if (next.hunger  >= 70) delta += 0.05;
          if (next.fatigue >= 70) delta += 0.04;
          if (next.toilet  >= 70) delta += 0.04;
          if (next.mood    <= 30) delta += 0.06;
          if (next.health  <= 30) delta += 0.08;
          return Math.min(100, prev + delta);
        });
        return next;
      });
    }, 10000);
    return () => clearInterval(t);
  }, [level]);

  // ── Freelance timer: check order completion, fatigue, urgent every 10s ──
  useEffect(() => {
    const check = () => {
      const now = Date.now();
      setFreelance(prev => {
        let next = { ...prev };
        // Check order completion
        if (next.active && next.active.endTime <= now) {
          const reward = Math.round(next.active.baseReward * (1 + next.active.bonusPct));
          next.completedOrder = { type: next.active.type, reward };
          const orderType = ORDER_TYPES.find(t => t.id === next.active.type);
          const dur = orderType ? orderType.durationMs : 6 * 3600000;
          const fatDur = Math.round(dur * (0.60 + Math.random() * 0.05));
          next.fatigue = { endTime: now + fatDur };
          next.active = null;
          next.completedCount = (next.completedCount || 0) + 1;
        }
        // Check fatigue expiry
        if (next.fatigue && next.fatigue.endTime <= now) next.fatigue = null;
        // Check urgent offer expiry
        if (next.urgentOffer && next.urgentOffer.endTime <= now) next.urgentOffer = null;
        // Check if time to try spawning urgent offer
        if (!next.urgentOffer && !next.active && next.nextUrgentAttempt && next.nextUrgentAttempt <= now && timezone) {
          const hour = getLocalHour(timezone);
          const fatOk = !next.fatigue || (next.fatigue.endTime - now) <= 20 * 60000;
          if (hour >= 6 && fatOk) {
            const baseReward = randBetween(630, 780);
            next.urgentOffer = { endTime: now + 30 * 60000, baseReward };
            next.nextUrgentAttempt = now + (3 + Math.random() * 2) * 86400000;
          } else {
            next.nextUrgentAttempt = now + 30 * 60000; // retry in 30 min
          }
        }
        return next;
      });
    };
    check();
    const t = setInterval(check, 10000);
    return () => clearInterval(t);
  }, [timezone]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync stats to backend for push notifications ──
  useEffect(() => {
    syncBackend(stats, level); // immediate on every stats change
  }, [stats, level]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save to cloud immediately when app is hidden (user switches away) ──
  useEffect(() => {
    const chatId = getChatId();
    if (!chatId || !BACKEND_URL) return;

    function onVisibilityChange() {
      if (document.hidden) {
        // App going to background — save immediately, don't wait for debounce
        if (cloudSyncTimer.current) clearTimeout(cloudSyncTimer.current);
        const snapshot = {
          stats, coins, xp,
          createdAt: createdAt.current,
          lastDaily, dailyStreak,
          inventory, equipped, achievements, highScores,
          actionCounts, dailyMissions,
          roomLayout, ownedDecor, ownedBgs,
          walletAddress, ownedNFTs, activeNFT,
          trustPoints, timezone, freelance,
          lastUpdate: Date.now(),
        };
        cloudSave(chatId, snapshot).catch(() => {});
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [stats, coins, xp, lastDaily, dailyStreak, inventory, equipped, achievements, highScores, actionCounts, dailyMissions, roomLayout, ownedDecor, ownedBgs, walletAddress, ownedNFTs, activeNFT, trustPoints, timezone, freelance]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Walking cat animation ──
  useEffect(() => {
    if (screen !== 'home' || showGif) return;
    const t = setInterval(() => {
      const s = walkRef.current;
      s.x += s.dir * 1.4;
      if (s.x >= 245) { s.x = 245; s.dir = -1; setCatFacing(-1); }
      if (s.x <= 12)  { s.x = 12;  s.dir =  1; setCatFacing(1); }
      setCatX(s.x);
    }, 50);
    return () => clearInterval(t);
  }, [screen, showGif]);

  // ── Fills (higher = better for display) ──
  const fills = {
    hunger:  Math.round(100 - stats.hunger),
    toilet:  Math.round(100 - stats.toilet),
    fatigue: Math.round(100 - stats.fatigue),
    mood:    Math.round(stats.mood),
    health:  Math.round(stats.health),
  };
  const isCrit = (v) => v <= 20;

  // ── Thought bubble: show worst need ──
  const sortedFills = Object.entries(fills).sort((a, b) => a[1] - b[1]);
  const worstKey    = sortedFills[0]?.[0] || 'mood';
  // Phase 3: emotion state
  const catEmoState = showGif ? 'neutral' : getCatState(stats, level);
  const catEmoCfg   = CAT_STATES[catEmoState] || CAT_STATES.neutral;
  const thoughtEmoji = fills[worstKey] > 65 ? catEmoCfg.thought : (THOUGHT_EMOJIS[worstKey] || '😿');

  // ── Helpers ──
  // ── afterAction: increment lifetime count + update daily missions ──
  const afterAction = useCallback((key, amount = 1) => {
    setActionCounts(prev => ({ ...prev, [key]: (prev[key] || 0) + amount }));
    setDailyMissions(prev => ({
      ...prev,
      missions: prev.missions.map(m => {
        if (m.actionKey !== key || m.completed) return m;
        const np = Math.min((m.progress || 0) + amount, m.target);
        return { ...m, progress: np, completed: np >= m.target };
      }),
    }));
  }, []);

  const spawnHearts = useCallback((n = 3, baseX = 100, particleEmoji = null) => {
    const hs = Array.from({ length: n }, () => ({
      id:    ++heartId.current,
      x:     baseX + Math.random() * 120,
      y:     '38%',
      emoji: particleEmoji,
    }));
    setHearts(p => [...p, ...hs]);
  }, []);

  const removeHeart = useCallback((id) => setHearts(p => p.filter(h => h.id !== id)), []);

  const showToast = useCallback((msg) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    setToastKey(k => k + 1);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const applyXP = useCallback((amount) => {
    setXP(prev => {
      const { newXP, newLv, leveledUp } = gainXP(prev, levelFromXP(prev), amount);
      if (leveledUp) setTimeout(() => setLevelUpModal(newLv), 400);
      return newXP;
    });
  }, []);

  // applyTrust — adds trust points and shows toast on level-up
  const applyTrust = useCallback((pts) => {
    setTrustPoints(prev => {
      const lvBefore = trustLevelFromPoints(prev);
      const next     = prev + pts;
      const lvAfter  = trustLevelFromPoints(next);
      if (lvAfter > lvBefore) {
        const stage = getTrustStage(lvAfter);
        setTimeout(() => showToast(`${stage.emoji} Доверие: уровень ${lvAfter} — «${stage.name}»!`), 350);
      }
      return next;
    });
  }, [showToast]);

  // ── Freelance handlers ──
  const handleTakeOrder = useCallback((typeId, overrideReward) => {
    const type = ORDER_TYPES.find(t => t.id === typeId);
    if (!type) return;
    const baseReward = overrideReward != null ? overrideReward : randBetween(type.min, type.max);
    const now = Date.now();
    setFreelance(prev => ({
      ...prev,
      active: { type: typeId, startTime: now, endTime: now + type.durationMs, baseReward, bonusPct: 0, boostsUsed: 0, lastBoostTime: null },
      urgentOffer: typeId === 'urgent' ? null : prev.urgentOffer,
    }));
    showToast(`💼 Заказ принят! ${type.label}`);
  }, [showToast]);

  const handleBoost = useCallback(() => {
    setFreelance(prev => {
      if (!prev.active || !canBoostNow(prev.active)) return prev;
      const newEndTime = prev.active.endTime - 30 * 60000;
      return {
        ...prev,
        active: {
          ...prev.active,
          endTime:      newEndTime,
          bonusPct:     prev.active.bonusPct + 0.10,
          boostsUsed:   prev.active.boostsUsed + 1,
          lastBoostTime: Date.now(),
        },
      };
    });
    showToast('⚡ Ускорение применено! −30 мин, +10%');
  }, [showToast]);

  const handleClaimOrder = useCallback(() => {
    setFreelance(prev => {
      if (!prev.completedOrder) return prev;
      const { reward } = prev.completedOrder;
      setCoins(c => c + reward);
      applyXP(Math.round(reward / 4));
      applyTrust(3);
      showToast(`✅ Получено: ${reward} монет!`);
      return { ...prev, completedOrder: null };
    });
  }, [showToast, applyXP, applyTrust]);

  // ── Actions ──
  const handleFeed = useCallback((item) => {
    const count = inventory[item.id] || 0;
    if (count <= 0) return;
    setInventory(prev => ({ ...prev, [item.id]: prev[item.id] - 1 }));
    const fm = fearMult(scaredLvl);
    const hungerRaw   = item.hunger || 0;
    const hungerGain  = hungerRaw * fm;               // scared → less hunger restored
    // At scaredLvl > 80, floor: can't restore hunger below the fear-floor
    const fearFloor   = scaredLvl > 80 ? (scaredLvl - 80) * 0.6 : 0;
    setStats(prev => ({
      ...prev,
      hunger: Math.max(fearFloor, clamp(prev.hunger - hungerGain, 0, 100)),
      mood:   clamp(prev.mood   + (item.mood   || 0) * fm, 0, 100),
      health: clamp(prev.health + (item.health || 0),      0, 100),
    }));
    // Feeding slightly calms the cat
    setScaredLvl(p => Math.max(0, p - 0.5));
    const earned = earnCoins(8, level);
    setCoins(c => c + earned);
    applyXP(item.xp);
    applyTrust(1);
    afterAction('feedCount');
    if (item.id === 'food_premium') afterAction('premiumFed');
    spawnHearts(3, 80);
    playSound('feed');
    showToast(`${item.emoji} +${earned}🪙 +${item.xp}XP`);
  }, [inventory, level, scaredLvl, applyXP, applyTrust, afterAction, spawnHearts, showToast]);

  const handleUseToy = useCallback((item) => {
    const count = inventory[item.id] || 0;
    if (count <= 0) return;
    setInventory(prev => ({ ...prev, [item.id]: prev[item.id] - 1 }));
    const fm = fearMult(scaredLvl);
    setStats(prev => ({
      ...prev,
      mood:    clamp(prev.mood    + item.mood * fm,    0, 100),
      fatigue: clamp(prev.fatigue + (item.fatigue || 0), 0, 100),
    }));
    // Playing a little calms the cat
    setScaredLvl(p => Math.max(0, p - 1));
    const earned = earnCoins(5, level);
    setCoins(c => c + earned);
    applyXP(item.xp);
    applyTrust(2);
    afterAction('toyCount');
    afterAction('playCount');
    spawnHearts(4, 100);
    playSound('toy');
    showToast(`${item.emoji} +${earned}🪙 +${item.xp}XP`);
  }, [inventory, level, scaredLvl, applyXP, applyTrust, afterAction, spawnHearts, showToast]);

  // roomKey: 'bathroomCount' | 'sleepCount' | 'clinicCount'
  const handleRoomAction = useCallback((statChanges, baseXP, baseCoins, roomKey) => {
    // ── Scared LvL blocks / reduces effects ──
    const isToilet   = roomKey === 'bathroomCount' && (statChanges.toilet != null);
    const isBath     = roomKey === 'bathroomCount' && (statChanges.toilet == null);
    const isMedicine = roomKey === 'clinicCount';
    const isSleep    = roomKey === 'sleepCount';

    const blockMsg = isToilet   ? scaredBlock(scaredLvl, 'toilet')
                   : isBath     ? scaredBlock(scaredLvl, 'bath')
                   : isMedicine ? scaredBlock(scaredLvl, 'medicine')
                   : null;
    if (blockMsg) { showToast(blockMsg); return; }

    const fm = fearMult(scaredLvl);
    setStats(prev => {
      const s = { ...prev };
      Object.entries(statChanges).forEach(([k, v]) => {
        // Sleep and mood recovery reduced by fear
        const mult = (isSleep && (k === 'fatigue' || k === 'mood')) ? fm : 1;
        s[k] = clamp((s[k] || 0) + v * mult, 0, 100);
      });
      return s;
    });
    const earned = earnCoins(baseCoins, level);
    setCoins(c => c + earned);
    applyXP(baseXP);
    applyTrust(1);
    if (roomKey) afterAction(roomKey);
    spawnHearts(3, 120);
    playSound('action');
    showToast(`+${earned}🪙 +${baseXP}XP`);
    setActionDone(true);
    setTimeout(() => { setScreen('home'); setActionDone(false); }, 1800);
  }, [level, scaredLvl, applyXP, applyTrust, afterAction, spawnHearts, showToast]);

  // ── NFT Wallet handlers ──
  // ── TON Connect: persistent listener (fires when user returns from wallet app) ──
  useEffect(() => {
    const tc = getTonConnect();
    if (!tc) return;

    // Helper: load NFTs when wallet connects
    async function onWalletConnected(wallet) {
      const addr = wallet.account.address;
      setWalletAddress(addr);
      setNftLoading(true);
      const nfts = await fetchScaredCatNFTs(addr);
      setOwnedNFTs(nfts);
      setNftLoading(false);
    }

    // Check if wallet already restored from previous session
    // (tc.connectionRestored is a Promise that resolves when TON Connect
    //  has finished reading its own localStorage — works on every app restart)
    const restored = tc.connectionRestored;
    if (restored && typeof restored.then === 'function') {
      restored.then(() => {
        if (tc.wallet) {
          onWalletConnected(tc.wallet).catch(() => {});
        }
      }).catch(() => {});
    } else {
      // Older version: check wallet synchronously after a tiny tick
      setTimeout(() => {
        if (tc.wallet) onWalletConnected(tc.wallet).catch(() => {});
      }, 300);
    }

    // Subscribe to future status changes (fires when user returns from wallet app)
    const unsub = tc.onStatusChange(wallet => {
      if (wallet) {
        onWalletConnected(wallet).catch(() => {});
      } else {
        // User disconnected
        setWalletAddress(null);
        setOwnedNFTs([]);
        setActiveNFT(null);
      }
    });

    return () => { try { unsub(); } catch(_) {} };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnectWallet = useCallback(async () => {
    const tc = getTonConnect();
    if (!tc) { showToast('TON Connect недоступен 😿'); return; }
    try {
      await tc.openModal();
      // Status is handled by the persistent useEffect above
    } catch (e) { showToast('Ошибка подключения 😿'); }
  }, [showToast]);

  const handleDisconnectWallet = useCallback(async () => {
    const tc = getTonConnect();
    try { await tc?.disconnect(); } catch(_) {}
    // State cleared by the persistent onStatusChange listener above
    setWalletAddress(null);
    setOwnedNFTs([]);
    setActiveNFT(null);
    showToast('Кошелёк отключён');
  }, [showToast]);

  // Manual address fallback — user pastes their TON address directly
  const handleManualWallet = useCallback(async (addr) => {
    const clean = (addr || '').trim();
    if (!clean) return;
    // Basic TON address sanity check (EQ/UQ prefix or raw hex ≥ 40 chars)
    const looksLikeTON = /^(EQ|UQ|0:)[A-Za-z0-9_\-]{40,}$/.test(clean) || /^[0-9a-fA-F]{64}$/.test(clean);
    if (!looksLikeTON) { showToast('Неверный формат адреса 😿'); return; }
    setWalletAddress(clean);
    setNftLoading(true);
    const nfts = await fetchScaredCatNFTs(clean);
    setOwnedNFTs(nfts);
    setNftLoading(false);
    if (nfts.length > 0) showToast(`🎉 Найдено ${nfts.length} NFT!`);
    else showToast('NFT коллекции не найдены 😿');
  }, [showToast]);

  // ── Manual cloud sync (sync button) ──
  const handleManualSync = useCallback(async () => {
    const chatId = getChatId();
    if (!chatId) { showToast('Синхронизация недоступна вне Telegram 😿'); return; }
    if (!BACKEND_URL) { showToast('Сервер недоступен 😿'); return; }

    setSyncStatus('syncing');
    showToast('☁️ Синхронизация...');

    try {
      // 1. Save current local state to cloud
      const snapshot = {
        stats, coins, xp,
        createdAt: createdAt.current,
        lastDaily, dailyStreak,
        inventory, equipped, achievements, highScores,
        actionCounts, dailyMissions,
        roomLayout, ownedDecor, ownedBgs,
        walletAddress, ownedNFTs, activeNFT,
        lastUpdate: Date.now(),
      };
      await cloudSave(chatId, snapshot);

      // 2. Load latest from cloud (could be from another device)
      const cloud = await cloudLoad(chatId);
      if (cloud && cloud.lastUpdate > snapshot.lastUpdate) {
        // Another device saved something newer — apply it
        if (cloud.stats)        setStats(cloud.stats);
        if (cloud.coins  != null) setCoins(cloud.coins);
        if (cloud.xp     != null) setXP(cloud.xp);
        if (cloud.inventory)    setInventory({ ...defaultInventory(), ...cloud.inventory });
        if (cloud.equipped)     setEquipped(cloud.equipped);
        if (cloud.dailyStreak != null) setDailyStreak(cloud.dailyStreak);
        if (cloud.lastDaily   != null) setLastDaily(cloud.lastDaily);
        if (cloud.achievements) setAchievements(cloud.achievements);
        if (cloud.highScores)   setHighScores(cloud.highScores);
        if (cloud.actionCounts) setActionCounts({ ...defaultActionCounts(), ...cloud.actionCounts });
        if (cloud.dailyMissions) setDailyMissions(getOrUpdateDailyMissions(cloud.dailyMissions));
        if (cloud.roomLayout)   setRoomLayout(cloud.roomLayout);
        if (cloud.ownedDecor)   setOwnedDecor(cloud.ownedDecor);
        if (cloud.ownedBgs)     setOwnedBgs(cloud.ownedBgs);
        if (cloud.walletAddress != null) setWalletAddress(cloud.walletAddress);
        if (cloud.ownedNFTs)    setOwnedNFTs(cloud.ownedNFTs);
        if (cloud.activeNFT  != null)   setActiveNFT(cloud.activeNFT);
        showToast('☁️ Загружены данные с другого устройства!');
      } else {
        showToast('✅ Данные синхронизированы!');
      }
      setSyncStatus('ok');
      setTimeout(() => setSyncStatus(null), 3000);
    } catch(e) {
      setSyncStatus('error');
      showToast('❌ Ошибка синхронизации, данные сохранены локально');
      setTimeout(() => setSyncStatus(null), 3000);
    }
  }, [stats, coins, xp, lastDaily, dailyStreak, inventory, equipped, achievements, highScores, actionCounts, dailyMissions, roomLayout, ownedDecor, ownedBgs, walletAddress, ownedNFTs, activeNFT, trustPoints, showToast]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectNFT = useCallback((nft) => {
    setActiveNFT(nft);
    if (nft) {
      setSkinFlash(true);
      setTimeout(() => setSkinFlash(false), 800);
      const tier = SCARED_CAT_MODELS[nft.name]?.tier || 'common';
      const tCfg = NFT_TIER_BONUSES[tier];
      showToast(`✨ Скин "${nft.name}" активирован! ${tCfg.label}`);
    } else {
      showToast('Скин сброшен — обычный кот');
    }
  }, [showToast]);

  // ── Tap-object handler for new interactive rooms ──
  const handleTapObject = useCallback(({ cdKey, cooldownMs, delta, xp, useItem, msg, actionKey, premiumFed, goToShop }) => {
    if (goToShop) { setScreen('shop'); setActiveNav('shop'); return; }
    if (!delta) { showToast(msg || '...'); return; }
    // Stats
    setStats(prev => {
      const s = { ...prev };
      Object.entries(delta).forEach(([k, v]) => { s[k] = clamp((s[k]||0)+v, 0, 100); });
      return s;
    });
    // Inventory
    if (useItem) setInventory(prev => ({ ...prev, [useItem]: Math.max(0,(prev[useItem]||0)-1) }));
    // XP + coins (with NFT earn bonus)
    if (xp > 0) applyXP(xp);
    const coinReward = Math.round(earnCoins(Math.ceil((xp||0)/2), level) * nftBonusRef.current.earnMult);
    if (coinReward > 0) setCoins(c => c + coinReward);
    // Action tracking
    if (actionKey) afterAction(actionKey);
    if (premiumFed) afterAction('premiumFed');
    // Cooldown
    if (cdKey && cooldownMs > 0) setCooldowns(prev => ({ ...prev, [cdKey]: Date.now() + cooldownMs }));
    // Feedback
    spawnHearts(2, 140);
    playSound('action');
    showToast(msg || '✨');
  }, [level, applyXP, afterAction, spawnHearts, showToast]);

  const handleMinigameComplete = useCallback((earnedCoins, xpGain, hungerReduce = 0, bonusItem = null) => {
    const finalCoins = Math.round(earnedCoins * nftBonusRef.current.earnMult);
    setCoins(c => c + finalCoins);
    applyXP(xpGain);
    if (hungerReduce > 0) setStats(prev => ({ ...prev, hunger: clamp(prev.hunger - hungerReduce, 0, 100) }));
    if (bonusItem)        setInventory(prev => ({ ...prev, [bonusItem]: (prev[bonusItem] || 0) + 1 }));
    afterAction('minigameWins');
    // Mini-games calm the cat (−3 scared)
    setScaredLvl(p => Math.max(0, p - 3));
    playSound('coin');
    showToast(`🎉 +${earnedCoins}🪙 +${xpGain}XP${bonusItem ? ' +🎁' : ''}`);
    setScreen('home');
  }, [applyXP, afterAction, showToast]);

  const handleShopBuy = useCallback((item) => {
    if (coins < item.cost) { showToast('Недостаточно монет 😿'); return; }
    setCoins(c => c - item.cost);
    afterAction('buyCount');
    playSound('buy');
    if (item.id.startsWith('acc_')) {
      setAchievements(prev => ({ ...prev, [item.id]: true }));
      showToast(`${item.emoji} ${item.name} куплено!`);
    } else {
      setInventory(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
      showToast(`${item.emoji} +1 ${item.name}`);
    }
  }, [coins, afterAction, showToast]);

  const handleShopEquip = useCallback((item) => {
    setEquipped(prev => {
      const wasEquipped = prev[item.slot] === item.id;
      if (!wasEquipped) {
        afterAction('equipCount');
        playSound('tap');
      }
      return { ...prev, [item.slot]: wasEquipped ? null : item.id };
    });
  }, [afterAction]);

  const handleClaimMission = useCallback((mission) => {
    setDailyMissions(prev => ({
      ...prev,
      missions: prev.missions.map(m => m.id === mission.id ? { ...m, claimed: true } : m),
    }));
    setCoins(c => c + mission.coins);
    playSound('mission');
    showToast(`📋 +${mission.coins}🪙`);
  }, [showToast]);

  const handleClaimDaily = useCallback(() => {
    const rewardIdx = ((pendingStreak || 1) - 1) % 7;
    const reward = DAILY_REWARDS[rewardIdx];
    setCoins(c => c + reward.coins);
    applyXP(reward.xp);
    if (reward.bonus) setInventory(prev => ({ ...prev, [reward.bonus]: (prev[reward.bonus] || 0) + 1 }));
    // Update max streak in actionCounts
    setActionCounts(prev => ({ ...prev, maxStreak: Math.max(prev.maxStreak || 0, pendingStreak) }));
    setDailyStreak(pendingStreak);
    setLastDaily(Date.now());
    setShowDailyModal(false);
    // Daily reward calms the cat a bit
    setScaredLvl(p => Math.max(0, p - 4));
    playSound('daily');
    showToast(`🎁 +${reward.coins}🪙 +${reward.xp}XP`);
  }, [pendingStreak, applyXP, showToast]);

  const handleCatClick = useCallback(() => {
    playSound('tap');
    walkRef.current.x = 111; walkRef.current.dir = 1;
    setCatX(111); setCatFacing(1);
    // Spawn emotion-specific particles
    const cs  = getCatState(stats, level);
    const pEmoji = CAT_STATES[cs]?.particle || '❤️';
    spawnHearts(3, 80, pEmoji);
    applyTrust(2); // +2 trust for petting the cat
    // Petting strongly calms the cat (−8 scared)
    setScaredLvl(p => Math.max(0, p - 8));
    if (showGif) return;
    setShowGif(true);
    clearTimeout(gifTimer.current);
    gifTimer.current = setTimeout(() => setShowGif(false), 3000);
  }, [showGif, stats, level, spawnHearts, applyTrust]);

  const handlePawClick = useCallback((dest) => {
    if (dest === 'home')  { setScreen('home'); setActionDone(false); setActiveNav('home'); return; }
    if (dest === 'shop')  { setScreen('shop'); setActiveNav('shop'); return; }
    setScreen(dest); setActionDone(false); setShowGif(false);
  }, []);

  // ── Phase 3: Return Home ──
  const handleClaimReturn = useCallback(() => {
    if (!returnData) return;
    const { bonus } = returnData;
    if (bonus.coins > 0) setCoins(c => c + bonus.coins);
    if (bonus.xp    > 0) applyXP(bonus.xp);
    playSound('coin');
    showToast(`🏠 Добро пожаловать! +${bonus.coins}🪙 +${bonus.xp}XP`);
    setReturnData(null);
  }, [returnData, applyXP, showToast]);

  // ── Phase 3: Room customization ──
  const handleBuyDecor = useCallback((item) => {
    if (coins < item.cost) { showToast('Недостаточно монет 😿'); return; }
    setCoins(c => c - item.cost);
    setOwnedDecor(prev => ({ ...prev, [item.id]: true }));
    afterAction('buyCount');
    playSound('buy');
    showToast(`${item.emoji} ${item.name} куплено!`);
  }, [coins, afterAction, showToast]);

  const handleBuyBg = useCallback((bg) => {
    if (coins < bg.cost) { showToast('Недостаточно монет 😿'); return; }
    setCoins(c => c - bg.cost);
    setOwnedBgs(prev => prev.includes(bg.id) ? prev : [...prev, bg.id]);
    setRoomLayout(prev => ({ ...prev, bg: bg.id }));
    afterAction('buyCount');
    playSound('buy');
    showToast(`${bg.emoji} ${bg.name} куплен!`);
  }, [coins, afterAction, showToast]);

  const handleSetBg = useCallback((bgId) => {
    setRoomLayout(prev => ({ ...prev, bg: bgId }));
    playSound('tap');
    showToast('🏠 Фон изменён!');
  }, [showToast]);

  const handlePlaceDecor = useCallback((itemId) => {
    const item = ROOM_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    setRoomLayout(prev => {
      if (prev.items.some(i => i.id === itemId)) return prev; // already placed
      return { ...prev, items: [...prev.items, { id: itemId, x: 60 + Math.random() * 220, y: 80 + Math.random() * 180 }] };
    });
  }, []);

  const handleMoveDecor = useCallback((itemId, x, y) => {
    setRoomLayout(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === itemId ? { ...i, x, y } : i),
    }));
  }, []);

  const handleRemoveDecor = useCallback((itemId) => {
    setRoomLayout(prev => ({ ...prev, items: prev.items.filter(i => i.id !== itemId) }));
  }, []);

  // ─────────────────────── RENDER ───────────────────────

  // Mini-games
  if (screen === 'minigame_catch') return (
    <CatchGameScreen level={level} onComplete={handleMinigameComplete} onBack={() => setScreen('kitchen')}/>
  );
  if (screen === 'minigame_memory') return (
    <MemoryGameScreen level={level} onComplete={handleMinigameComplete} onBack={() => setScreen('yard')}/>
  );

  // NFT Skins
  if (screen === 'nft_skins') return (
    <div style={{ width:'100%', height:'100%', position:'relative', overflow:'hidden' }}>
      <NFTSkinScreen
        walletAddress={walletAddress}
        ownedNFTs={ownedNFTs}
        activeNFT={activeNFT}
        loading={nftLoading}
        onConnect={handleConnectWallet}
        onDisconnect={handleDisconnectWallet}
        onSelectNFT={handleSelectNFT}
        onManualAddress={handleManualWallet}
        onBack={() => setScreen('home')}/>
      {toast && <Toast key={toastKey} msg={toast}/>}
    </div>
  );

  // Shop
  if (screen === 'shop') return (
    <div style={{ width:'100%', height:'100%', position:'relative', overflow:'hidden' }}>
      <ShopScreen
        coins={coins} inventory={inventory} equipped={equipped} achievements={achievements}
        onBuy={handleShopBuy} onEquip={handleShopEquip}
        onBack={() => { setScreen('home'); setActiveNav('home'); }}
        ownedDecor={ownedDecor} ownedBgs={ownedBgs} roomLayout={roomLayout}
        onBuyDecor={handleBuyDecor} onBuyBg={handleBuyBg} onSetBg={handleSetBg}/>
      {toast && <Toast key={toastKey} msg={toast}/>}
      {achToast && <AchievementToastBanner achievement={achToast} onDone={() => setAchToast(null)}/>}
    </div>
  );

  // Freelance / Work screen
  if (activeNav === 'work' && screen === 'home') return (
    <div style={{ width:'100%', height:'100%', position:'relative', overflow:'hidden', background:'#08101c' }}>
      {!timezone && <TimezoneModal onSelect={(tz) => { setTimezone(tz); showToast('🌍 Часовой пояс сохранён'); }}/>}
      {timezone && (
        <FreelanceScreen
          freelance={freelance}
          timezone={timezone}
          coins={coins}
          level={level}
          onTakeOrder={(typeId, reward) => {
            if (freelance.active || freelance.fatigue) return;
            if (typeId === 'urgent') { handleTakeOrder(typeId, reward); return; }
            handleTakeOrder(typeId);
          }}
          onBoost={handleBoost}
          onClaimOrder={handleClaimOrder}
          onBack={() => setActiveNav('home')}
        />
      )}
      {toast && <Toast key={toastKey} msg={toast}/>}
    </div>
  );

  // Achievements
  if (activeNav === 'achieve' && screen === 'home') return (
    <div style={{ width:'100%', height:'100%', position:'relative', overflow:'hidden' }}>
      <AchievementsScreen
        onBack={() => setActiveNav('home')}
        canClaimDaily={showDailyModal}
        onShowDaily={() => { setShowDailyModal(true); }}
        achievements={achievements}
        actionCounts={actionCounts}
        level={level}
        dailyStreak={dailyStreak}
        dailyMissions={dailyMissions}
        onClaimMission={handleClaimMission}/>
      {showDailyModal && <DailyRewardModal streak={pendingStreak} onClaim={handleClaimDaily}/>}
      {toast && <Toast key={toastKey} msg={toast}/>}
      {achToast && <AchievementToastBanner achievement={achToast} onDone={() => setAchToast(null)}/>}
    </div>
  );

  // ── All 5 interactive room screens ──
  if (ROOM_DEFS[screen]) return (
    <div style={{ width:'100%', height:'100%', position:'relative', overflow:'hidden' }}>
      <RoomScreen
        roomId={screen}
        fills={fills} isCrit={isCrit}
        activeNav={activeNav} setActiveNav={setActiveNav}
        onPawClick={handlePawClick}
        hearts={hearts} removeHeart={removeHeart}
        inventory={inventory} stats={stats} level={level}
        cooldowns={cooldowns}
        onObjectAction={handleTapObject}
        onMinigame={ROOM_DEFS[screen].minigameScreen ? () => setScreen(ROOM_DEFS[screen].minigameScreen) : null}
        onBack={() => { setScreen('home'); setActiveNav('home'); }}
        activeNFT={activeNFT}/>
      {toast && <Toast key={toastKey} msg={toast}/>}
      {complaint && <ComplaintOverlay text={complaint} onClose={() => setComplaint(null)}/>}
    </div>
  );

  // ── HOME SCREEN ──
  const PANEL_H = 192;
  const scaredInfo = scaredIcon(scaredLvl);
  // Emotion-state derived values (Phase 3)
  const catAnimStyle  = showGif ? 'none' : catEmoCfg.anim;
  const catFilterStr  = catEmoCfg.filter === 'none' ? 'drop-shadow(0 8px 22px rgba(0,0,0,0.65))' : `drop-shadow(0 8px 22px rgba(0,0,0,0.65)) ${catEmoCfg.filter}`;
  // Map engine state → SVG emotion expression
  const SVG_EMO_MAP = { veryScared:'scared', scared:'scared', sick:'sick', hungry:'normal',
    tired:'sad', dirty:'normal', sad:'sad', playful:'excited', happy:'happy', special:'excited', neutral:'normal' };
  const svgEmotion  = SVG_EMO_MAP[catEmoState] || 'normal';
  const activeBgObj   = BG_OVERLAYS.find(b => b.id === roomLayout.bg);

  return (
    <div style={{ width:'100%', height:'100%', position:'relative', overflow:'hidden', background:'#3a2010', fontFamily:"'Nunito',sans-serif" }}>

      {/* Version badge */}
      <div style={{ position:'absolute', top:8, right:10, zIndex:50, pointerEvents:'none',
        background:'rgba(0,0,0,0.35)', borderRadius:8, padding:'2px 7px',
        fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.55)', letterSpacing:0.5 }}>
        v{APP_VERSION}
      </div>

      {/* Room background */}
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:PANEL_H-30, overflow:'hidden' }}>
        <HomeRoom/>
        {/* BG colour overlay */}
        {activeBgObj && activeBgObj.color !== 'transparent' && (
          <div style={{ position:'absolute', inset:0, background:activeBgObj.color, pointerEvents:'none', zIndex:2 }}/>
        )}
      </div>

      {/* Edit-mode dim overlay */}
      {editMode && (
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.32)', zIndex:11, pointerEvents:'none' }}/>
      )}

      {/* Placed room decor items */}
      {roomLayout.items.map(placed => {
        const itemDef = ROOM_ITEMS.find(r => r.id === placed.id);
        if (!itemDef) return null;
        return (
          <DraggableRoomItem
            key={placed.id}
            item={itemDef}
            x={placed.x} y={placed.y}
            editMode={editMode}
            onMove={(nx, ny) => handleMoveDecor(placed.id, nx, ny)}
            onRemove={() => handleRemoveDecor(placed.id)}
          />
        );
      })}

      {/* Floating hearts / particles */}
      {hearts.map(h => <FloatingHeart key={h.id} id={h.id} x={h.x} y={h.y} onDone={() => removeHeart(h.id)} emoji={h.emoji}/>)}

      {/* ── HEADER ── */}
      <div style={{ position:'relative', zIndex:20, padding:'10px 12px 0', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>

        {/* Left info card — dark warm card like in mockup */}
        <div style={{
          background:'rgba(45,18,4,0.78)',
          backdropFilter:'blur(10px)',
          borderRadius:20,
          padding:'10px 14px 10px',
          boxShadow:'0 6px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,220,150,0.15)',
          border:'1.5px solid rgba(200,150,70,0.3)',
          minWidth:158,
        }}>
          <div style={{ fontSize:19, fontWeight:900, color:'#f5dfc0', letterSpacing:-0.3, lineHeight:1 }}>Scared Cat 🐱</div>
          <div style={{ fontSize:11, color:'#c8a870', fontWeight:700, marginTop:3, marginBottom:5 }}>День {day} • Ур. {level}</div>
          {/* XP bar */}
          <div style={{ height:5, background:'rgba(255,255,255,0.10)', borderRadius:99, overflow:'hidden', boxShadow:'inset 0 1px 2px rgba(0,0,0,0.4)' }}>
            <div style={{ height:'100%', borderRadius:99, background:'linear-gradient(90deg,#70e028,#a8f040)', width:`${xpProg.pct * 100}%`, transition:'width 0.5s ease', boxShadow:'0 1px 4px rgba(100,230,30,0.5)' }}/>
          </div>
          <div style={{ marginTop:2, marginBottom:8, fontSize:9, fontWeight:800, color:'#90d040' }}>
            XP: {xpProg.curXP} / {xpProg.needed || '—'}
            {level >= MAX_LEVEL && <span style={{ marginLeft:4, color:'#ffd060' }}>MAX 🌟</span>}
          </div>
          {/* Trust level row */}
          <div onClick={() => setShowTrustModal(true)} style={{ cursor:'pointer' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:11 }}>🤍</span>
                <span style={{ fontSize:10, fontWeight:800, color:'#d0b8f0', letterSpacing:0.2 }}>Доверие</span>
                <span style={{ fontSize:10, fontWeight:900, color: trustStage.color }}>• {trustLv}</span>
              </div>
              <span style={{ fontSize:9, fontWeight:700, color:'#7060a0' }}>{trustStage.name}</span>
            </div>
            {/* Trust progress bar — different style from XP */}
            <div style={{ height:5, background:'rgba(160,120,255,0.12)', borderRadius:99, overflow:'hidden', boxShadow:'inset 0 1px 2px rgba(0,0,0,0.5)' }}>
              <div style={{
                height:'100%', borderRadius:99,
                background:`linear-gradient(90deg, ${trustStage.color}99, ${trustStage.color})`,
                width:`${trustProg.pct * 100}%`, transition:'width 0.6s ease',
                boxShadow:`0 1px 5px ${trustStage.color}88`,
              }}/>
            </div>
            <div style={{ marginTop:2, fontSize:9, fontWeight:700, color:'#7060a0' }}>
              {trustProg.curPts} / {trustProg.needed || '—'} оч.
            </div>
          </div>
          {/* Scared LvL row */}
          <div onClick={() => setShowScaredModal(true)}
            style={{ cursor:'pointer', marginTop:7, paddingTop:7, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:12, animation: scaredInfo.pulse ? 'pulseCrit 1s ease-in-out infinite' : 'none' }}>
                  {scaredInfo.emoji}
                </span>
                <span style={{ fontSize:10, fontWeight:800, color:'rgba(255,200,160,0.8)', letterSpacing:0.2 }}>Страх</span>
              </div>
              <span style={{ fontSize:9, fontWeight:700, color: scaredInfo.color }}>{scaredInfo.label}</span>
            </div>
            <div style={{ height:4, background:'rgba(255,255,255,0.08)', borderRadius:99, overflow:'hidden', marginTop:4,
              boxShadow:'inset 0 1px 2px rgba(0,0,0,0.5)' }}>
              <div style={{
                height:'100%', borderRadius:99,
                background:`linear-gradient(90deg, #60d08088, ${scaredInfo.color})`,
                width:`${scaredLvl}%`, transition:'width 0.6s ease',
                boxShadow:`0 1px 4px ${scaredInfo.color}88`,
              }}/>
            </div>
          </div>
        </div>

        {/* Right buttons cluster */}
        <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
          {/* Coins row */}
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            {/* Coin counter */}
            <div style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'rgba(38,16,2,0.78)', borderRadius:99, boxShadow:'0 3px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,220,120,0.15)', border:'1.5px solid rgba(200,150,70,0.35)', backdropFilter:'blur(8px)' }}>
              <span style={{ fontSize:16 }}>🪙</span>
              <span style={{ fontSize:15, fontWeight:900, color:'#f5dfc0', letterSpacing:-0.3 }}>{coins}</span>
            </div>
          </div>
          {/* Icon buttons row */}
          <div style={{ display:'flex', gap:7 }}>
            {/* NFT / Wallet */}
            <button onClick={() => { setScreen('nft_skins'); setActiveNav(''); }}
              style={{ width:42, height:42, borderRadius:14, background: activeNFT ? 'rgba(70,30,140,0.8)' : 'rgba(38,16,2,0.78)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: activeNFT ? '0 4px 14px rgba(110,50,240,0.55)' : '0 4px 14px rgba(0,0,0,0.5)', cursor:'pointer', fontSize:20, border: walletAddress ? '1.5px solid rgba(130,90,255,0.7)' : '1.5px solid rgba(200,150,70,0.3)', position:'relative', overflow:'hidden', backdropFilter:'blur(8px)' }}>
              {activeNFT
                ? <img src={activeNFT.image} alt="NFT" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:12 }}/>
                : <span>🎨</span>
              }
              {walletAddress && !activeNFT && (
                <div style={{ position:'absolute', bottom:3, right:3, width:8, height:8, borderRadius:'50%', background:'#60ff90', border:'1.5px solid rgba(0,0,0,0.5)' }}/>
              )}
            </button>
            {/* Shop */}
            <button onClick={() => { setScreen('shop'); setActiveNav('shop'); }}
              style={{ width:42, height:42, borderRadius:14, background:'rgba(38,16,2,0.78)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,220,120,0.1)', cursor:'pointer', fontSize:20, border:'1.5px solid rgba(200,150,70,0.3)', backdropFilter:'blur(8px)' }}>
              🛒
            </button>
            {/* Cloud sync */}
            <button onClick={handleManualSync} disabled={syncStatus === 'syncing'}
              title="Синхронизировать прогресс"
              style={{ width:42, height:42, borderRadius:14, cursor: syncStatus==='syncing' ? 'default' : 'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', border: `1.5px solid ${syncStatus==='ok' ? 'rgba(80,255,120,0.55)' : syncStatus==='error' ? 'rgba(255,80,80,0.55)' : 'rgba(200,150,70,0.3)'}`, background: syncStatus==='ok' ? 'rgba(30,130,50,0.5)' : syncStatus==='error' ? 'rgba(140,30,30,0.5)' : 'rgba(38,16,2,0.78)', boxShadow:'0 4px 14px rgba(0,0,0,0.5)', backdropFilter:'blur(8px)', transition:'background 0.3s, border 0.3s', opacity: syncStatus==='syncing' ? 0.6 : 1 }}>
              {syncStatus === 'syncing' ? '⏳' : syncStatus === 'ok' ? '✅' : syncStatus === 'error' ? '❌' : '☁️'}
            </button>
          </div>
        </div>
      </div>

      {/* Thought bubble follows cat */}
      <div style={{ position:'absolute', zIndex:16, pointerEvents:'none', left: catX + (catFacing === 1 ? 96 : -52), bottom: PANEL_H + 24 + 128, transition:'left 0.1s linear' }}>
        <ThoughtBubble emoji={thoughtEmoji}/>
      </div>

      {/* Emotion glow ring behind cat */}
      {catEmoCfg.glow !== 'none' && (
        <div style={{ position:'absolute', zIndex:14, bottom: PANEL_H + 30, left: catX + 10, width:108, height:80, borderRadius:'50%', background:catEmoCfg.glow, filter:'blur(22px)', pointerEvents:'none', transition:'left 0.1s linear' }}/>
      )}

      {/* Walking / tapped cat — emotion animation + filter */}
      <div onClick={handleCatClick}
           style={{ position:'absolute', zIndex:15, bottom: PANEL_H + 24, left: catX, width:118, cursor:'pointer', transition: showGif ? 'left 0.25s ease-out' : 'none' }}>
        {/* Outer div handles scaleX (facing direction) */}
        <div style={{ transform:`scaleX(${catFacing})`, transformOrigin:'center' }}>
          <div style={{ filter: catFilterStr, animation: catAnimStyle, position:'relative' }}>
            <img src={CAT} alt="кот" style={{ width:'100%', display:'block', userSelect:'none', pointerEvents:'none', opacity: showGif ? 0 : 1, transition:'opacity 0.2s' }} draggable="false"/>
            {showGif && (
              <img src={GIF} alt="анимация"
                   style={{ position:'absolute', inset:0, width:'100%', display:'block', userSelect:'none', pointerEvents:'none' }}
                   draggable="false"/>
            )}
            {skinFlash && (
              <div style={{ position:'absolute', inset:'-20%', borderRadius:'50%', background:'radial-gradient(circle, rgba(180,100,255,0.9) 0%, rgba(80,200,255,0.5) 50%, transparent 75%)', animation:'nftFlash 0.6s ease-out forwards', pointerEvents:'none', zIndex:10 }}/>
            )}
          </div>
        </div>
      </div>

      {/* Accessory overlays */}
      {equipped.hat && (
        <div style={{ position:'absolute', zIndex:16, bottom: PANEL_H + 24 + 115, left: catX + (catFacing === 1 ? 40 : 20), fontSize:28, pointerEvents:'none', transition:'left 0.1s linear' }}>
          {ACC_ITEMS.find(a => a.id === equipped.hat)?.emoji || ''}
        </div>
      )}

      {/* Bottom panel (hidden in edit mode, replaced by RoomEditPanel) */}
      {!editMode && (
        <BottomPanel fills={fills} isCrit={isCrit} onPawClick={handlePawClick} activeNav={activeNav} setActiveNav={setActiveNav}
          canClaimDaily={showDailyModal || (dailyMissions.missions || []).some(m => m.completed && !m.claimed)}/>
      )}

      {/* Room edit panel */}
      {editMode && (
        <RoomEditPanel
          ownedDecor={ownedDecor}
          roomLayout={roomLayout}
          onPlace={handlePlaceDecor}
          onDone={() => setEditMode(false)}
        />
      )}

      {/* Toast */}
      {toast && <Toast key={toastKey} msg={toast}/>}

      {/* Achievement toast banner */}
      {achToast && <AchievementToastBanner achievement={achToast} onDone={() => setAchToast(null)}/>}

      {/* Modals */}
      {showDailyModal && !returnData && <DailyRewardModal streak={pendingStreak} onClaim={handleClaimDaily}/>}
      {levelUpModal   && !returnData && <LevelUpModal     level={levelUpModal}  onClose={() => setLevelUpModal(null)}/>}
      {returnData     && <ReturnModal returnData={returnData} onClaim={handleClaimReturn}/>}
      {showTrustModal  && <TrustModal trustPoints={trustPoints} onClose={() => setShowTrustModal(false)}/>}
      {showScaredModal && <ScaredModal scaredLvl={scaredLvl} onClose={() => setShowScaredModal(false)}/>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
