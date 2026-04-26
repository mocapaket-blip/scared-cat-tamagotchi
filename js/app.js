/* ═══════════════════════════════════════════════
   SCARED CAT — React App
   Depends on: config.js, engine.js (loaded first)
   ═══════════════════════════════════════════════ */

const { useState, useEffect, useRef, useCallback } = React;
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
      const col = n.collection?.address || '';
      return col === SCARED_CAT_COLLECTION_ADDRESS || col.toLowerCase().includes('scared');
    });
    return nfts.map(n => {
      const attrs = (n.metadata?.attributes || []).reduce((m, a) => {
        m[a.trait_type?.toLowerCase() || a.trait_type] = a.value;
        return m;
      }, {});
      return {
        address:  n.address,
        name:     n.metadata?.name || 'Scared Cat',
        image:    (n.metadata?.image || '').replace('ipfs://', 'https://ipfs.io/ipfs/'),
        traits:   attrs,
      };
    });
  } catch (e) { console.warn('[TON] NFT fetch error', e); return []; }
}

// ── Backend URL (fill in after Railway deploy) ──
const BACKEND_URL = window.SCARED_CAT_BACKEND || 'https://scared-cat-tamagotchi-production.up.railway.app';

// Sync stats to backend so push notifications know the cat's state
function syncBackend(stats) {
  if (!BACKEND_URL) return;
  const chatId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  if (!chatId) return;
  fetch(`${BACKEND_URL}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, stats }),
  }).catch(() => {}); // silent — don't break the game on network errors
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
function PawShape({ fillColor, baseColor, clipId }) {
  const dots = (c) => (
    <g>
      <ellipse cx="14" cy="44" rx="11" ry="10" fill={c}/>
      <ellipse cx="31" cy="32" rx="11" ry="10" fill={c}/>
      <ellipse cx="49" cy="32" rx="11" ry="10" fill={c}/>
      <ellipse cx="66" cy="44" rx="11" ry="10" fill={c}/>
      <ellipse cx="40" cy="72" rx="26" ry="20" fill={c}/>
    </g>
  );
  return (
    <g>
      <g opacity="0.15">
        <ellipse cx="14" cy="44" rx="13" ry="12" fill="#1a0800"/>
        <ellipse cx="31" cy="32" rx="13" ry="12" fill="#1a0800"/>
        <ellipse cx="49" cy="32" rx="13" ry="12" fill="#1a0800"/>
        <ellipse cx="66" cy="44" rx="13" ry="12" fill="#1a0800"/>
        <ellipse cx="40" cy="72" rx="28" ry="22" fill="#1a0800"/>
      </g>
      {dots(baseColor)}
      <g clipPath={`url(#${clipId})`}>{dots(fillColor)}</g>
      <g clipPath={`url(#${clipId})`} opacity="0.25">
        <ellipse cx="28" cy="60" rx="12" ry="22" fill="white"/>
      </g>
    </g>
  );
}

function PawIndicator({ pawId, icon, label, fill, critical, onClick }) {
  // Smooth 4-step gradient: green → yellow → orange → red
  const fillColor = fill > 60 ? '#38c060'
                  : fill > 40 ? '#d4a010'
                  : fill > 20 ? '#e06020'
                  :             '#e02020';
  const baseColor = critical ? '#ffc8c8' : '#ddd0c0';
  const clipY = 92 * (1 - fill / 100);
  const clipH = Math.max(0, 92 * fill / 100);
  return (
    <div onClick={onClick} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, cursor:'pointer' }}>
      <div style={{ position:'relative', animation: critical ? 'pulseCrit 0.75s ease-in-out infinite' : 'none', transition:'transform 0.12s' }}
           onPointerDown={e => e.currentTarget.style.transform='scale(0.88)'}
           onPointerUp={e => e.currentTarget.style.transform='scale(1)'}
           onPointerLeave={e => e.currentTarget.style.transform='scale(1)'}>
        <svg viewBox="0 0 80 92" width="50" height="60" style={{display:'block'}}>
          <defs><clipPath id={pawId}><rect x="0" y={clipY} width="80" height={clipH}/></clipPath></defs>
          <PawShape fillColor={fillColor} baseColor={baseColor} clipId={pawId}/>
        </svg>
        {/* Icon shakes when critical */}
        <div style={{ position:'absolute', left:'50%', bottom:4, transform:'translateX(-50%)', fontSize:15, lineHeight:1, pointerEvents:'none', filter:'drop-shadow(0 1px 2px rgba(0,0,0,0.35))', animation: critical ? 'pawShake 0.42s linear infinite' : 'none', display:'inline-block' }}>{icon}</div>
      </div>
      <span style={{ fontSize:8, fontWeight:800, color:'#2a1008', letterSpacing:0.1 }}>{label}</span>
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
    <button onClick={onClick} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, background:'none', border:'none', cursor:'pointer', padding:'6px 4px 2px', position:'relative', fontFamily:"'Nunito',sans-serif" }}>
      {dot && <div style={{ position:'absolute', top:4, right:'50%', marginRight:-14, width:8, height:8, borderRadius:99, background:'#ff5070', border:'2px solid white' }}/>}
      <span style={{ fontSize:22, filter: active ? 'none' : 'grayscale(0.5) opacity(0.55)' }}>{icon}</span>
      <span style={{ fontSize:10, fontWeight: active ? 800 : 600, color: active ? '#a04820' : '#806048' }}>{label}</span>
      {active && <div style={{ width:18, height:3, borderRadius:99, background:'#c06030', marginTop:1 }}/>}
    </button>
  );
}

/* ══════════════════════════════════════════════════
   BOTTOM PANEL (paw nav + bottom nav)
   ══════════════════════════════════════════════════ */
function BottomPanel({ fills, isCrit, onPawClick, activeNav, setActiveNav, canClaimDaily }) {
  return (
    <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'12px 12px 0', zIndex:20, height:192, display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'8px 4px', display:'flex', justifyContent:'space-around', alignItems:'flex-end', flex:1, marginBottom:10 }}>
        <PawIndicator pawId="ph"  icon="🍔" label="Голод"      fill={fills.hunger}  critical={isCrit(fills.hunger)}  onClick={() => onPawClick('kitchen')}/>
        <PawIndicator pawId="pt"  icon="🚽" label="Гигиена"   fill={fills.toilet}  critical={isCrit(fills.toilet)}  onClick={() => onPawClick('bathroom')}/>
        <PawIndicator pawId="pf"  icon="😴" label="Сон"       fill={fills.fatigue} critical={isCrit(fills.fatigue)} onClick={() => onPawClick('rest')}/>
        <PawIndicator pawId="pm"  icon="🎮" label="Настроение" fill={fills.mood}    critical={isCrit(fills.mood)}    onClick={() => onPawClick('yard')}/>
        <PawIndicator pawId="phh" icon="🏥" label="Здоровье"  fill={fills.health}  critical={isCrit(fills.health)}  onClick={() => onPawClick('clinic')}/>
      </div>
      <div style={{ display:'flex', borderTop:'1.5px solid rgba(0,0,0,0.07)', background:'rgba(255,255,255,0.65)', marginLeft:-12, marginRight:-12, paddingBottom:10, flexShrink:0 }}>
        <NavItem icon="🏠" label="Дом"      active={activeNav==='home'}    onClick={() => { setActiveNav('home'); onPawClick('home'); }}/>
        <NavItem icon="🛒" label="Магазин"  active={activeNav==='shop'}    dot={false} onClick={() => { setActiveNav('shop'); onPawClick('shop'); }}/>
        <NavItem icon="🏆" label="Успехи"   active={activeNav==='achieve'} dot={canClaimDaily} onClick={() => { setActiveNav('achieve'); }}/>
        <NavItem icon="📷" label="Альбом"   active={activeNav==='album'}   onClick={() => { setActiveNav('album'); }}/>
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
        <linearGradient id="hwG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b89060"/><stop offset="100%" stopColor="#cca870"/></linearGradient>
        <linearGradient id="hfG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5a3018"/><stop offset="100%" stopColor="#3a1e08"/></linearGradient>
        <linearGradient id="hsG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0e1b28"/><stop offset="100%" stopColor="#1a2e42"/></linearGradient>
        <linearGradient id="hcG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#a06828"/><stop offset="100%" stopColor="#c88840"/></linearGradient>
        <linearGradient id="hhG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ddbf98"/><stop offset="100%" stopColor="#c49e70"/></linearGradient>
        <radialGradient id="hrG" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#c888a0"/><stop offset="100%" stopColor="#9a6070"/></radialGradient>
      </defs>
      <rect x="0" y="0" width="390" height="290" fill="url(#hwG)"/>
      {[45,90,135,180,225,272].map((y,i)=><line key={i} x1="0" y1={y} x2="390" y2={y} stroke="#9a7840" strokeWidth="0.6" opacity="0.22"/>)}
      <path d="M46,0 L58,38 L44,64 L60,100 L41,140" stroke="#1a0800" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M58,38 L74,47" stroke="#1a0800" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M185,14 L177,50 L193,82 L181,122" stroke="#1a0800" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M16,0 C24,40 16,84 26,162 L16,188 L7,188 L5,0 Z" fill="url(#hcG)" stroke="#1a0800" strokeWidth="3"/>
      <path d="M194,0 C186,40 194,84 183,162 L194,188 L203,188 L205,0 Z" fill="url(#hcG)" stroke="#1a0800" strokeWidth="3"/>
      <rect x="34" y="12" width="136" height="170" rx="7" fill="url(#hsG)"/>
      {[48,62,78,96,115,136,155,168].map((x,i)=><line key={i} x1={x} y1={14} x2={x-7} y2={180} stroke="#2a4860" strokeWidth="1" opacity="0.45"/>)}
      <rect x="34" y="12" width="136" height="170" rx="7" fill="none" stroke="#1a0800" strokeWidth="5.5"/>
      <line x1="102" y1="12" x2="101" y2="182" stroke="#1a0800" strokeWidth="5.5"/>
      <line x1="34" y1="97" x2="170" y2="98" stroke="#1a0800" strokeWidth="5.5"/>
      <line x1="102" y1="12" x2="101" y2="182" stroke="#7a5028" strokeWidth="3"/>
      <line x1="34" y1="97" x2="170" y2="98" stroke="#7a5028" strokeWidth="3"/>
      <polygon points="56,15,84,70,66,72,40,40" fill="#07101c" opacity="0.96"/>
      <polygon points="84,70,110,84,100,120,74,110" fill="#07101c" opacity="0.90"/>
      <polygon points="134,92,160,106,152,148,130,132" fill="#07101c" opacity="0.85"/>
      <path d="M272,172 L272,260 L368,260 L368,172 L320,122 Z" fill="url(#hhG)" stroke="#1a0800" strokeWidth="4" strokeLinejoin="round"/>
      <path d="M263,177 L320,122 L377,177" fill="#ddbf98" stroke="#1a0800" strokeWidth="4" strokeLinejoin="round"/>
      <ellipse cx="320" cy="248" rx="30" ry="26" fill="#e8a888" stroke="#1a0800" strokeWidth="2.8"/>
      <ellipse cx="320" cy="250" rx="23" ry="19" fill="#080406"/>
      <rect x="0" y="278" width="390" height="372" fill="url(#hfG)"/>
      <rect x="0" y="274" width="390" height="8" fill="#7a5028" stroke="#1a0800" strokeWidth="1.5"/>
      {[298,322,346,370,395,422,450,480,512,548].map((y,i)=><line key={i} x1="0" y1={y} x2="390" y2={y+1} stroke="#1a0800" strokeWidth={i<5?2.8:2.2} opacity="0.6"/>)}
      {[82,170,258,345].map((x,i)=><line key={i} x1={x} y1="278" x2={x+2} y2="650" stroke="#1a0800" strokeWidth="1.8" opacity="0.4"/>)}
      <path d="M73,610 C80,597 96,606 112,599 C128,592 140,604 156,598 C172,592 182,606 198,601 C214,596 224,608 240,603 C256,598 268,610 282,605 C294,601 304,612 302,621 C298,630 284,632 268,634 C252,636 240,624 226,628 C212,632 200,622 186,626 C172,630 162,620 146,624 C130,628 120,618 104,622 C90,626 80,616 75,620 C70,624 68,613 73,610 Z" fill="url(#hrG)" stroke="#1a0800" strokeWidth="3.5"/>
    </svg>
  );
}

function KitchenRoom() {
  return (
    <svg viewBox="0 0 390 650" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
      <defs>
        <linearGradient id="kwG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c8a070"/><stop offset="100%" stopColor="#d8b080"/></linearGradient>
        <linearGradient id="ksG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#1a3050"/><stop offset="100%" stopColor="#2a4468"/></linearGradient>
        <linearGradient id="kfG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7a4a20"/><stop offset="100%" stopColor="#5a3010"/></linearGradient>
      </defs>
      <rect x="0" y="0" width="390" height="295" fill="url(#kwG)"/>
      {[50,100,150,200,250].map((y,i)=><line key={i} x1="0" y1={y} x2="390" y2={y} stroke="#9a7840" strokeWidth="0.7" opacity="0.2"/>)}
      <path d="M195,0 L200,45 L185,80 L200,118 L180,162 L195,192" stroke="#1a0800" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M200,45 L220,55" stroke="#1a0800" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M185,80 L165,90" stroke="#1a0800" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <rect x="22" y="10" width="140" height="160" rx="7" fill="url(#ksG)"/>
      {[32,48,65,82,100,118,138,152].map((x,i)=><line key={i} x1={x} y1={12} x2={x-8} y2={168} stroke="#2a4860" strokeWidth="1" opacity="0.4"/>)}
      <rect x="22" y="10" width="140" height="160" rx="7" fill="none" stroke="#1a0800" strokeWidth="5.5"/>
      <line x1="92" y1="10" x2="91" y2="170" stroke="#1a0800" strokeWidth="5.5"/>
      <line x1="22" y1="90" x2="162" y2="91" stroke="#1a0800" strokeWidth="5.5"/>
      <line x1="92" y1="10" x2="91" y2="170" stroke="#7a5028" strokeWidth="3"/>
      <line x1="22" y1="90" x2="162" y2="91" stroke="#7a5028" strokeWidth="3"/>
      <rect x="218" y="14" width="170" height="150" rx="6" fill="#7a4a20" stroke="#1a0800" strokeWidth="4"/>
      <rect x="218" y="14" width="170" height="14" rx="6" fill="#9a6030" stroke="#1a0800" strokeWidth="3"/>
      <line x1="305" y1="28" x2="305" y2="164" stroke="#1a0800" strokeWidth="3.5"/>
      <rect x="222" y="28" width="79" height="132" rx="4" fill="#6a3e18" stroke="#1a0800" strokeWidth="2.5"/>
      <rect x="244" y="86" width="18" height="8" rx="4" fill="#c09040" stroke="#1a0800" strokeWidth="1.5"/>
      <rect x="22" y="178" width="130" height="9" rx="4" fill="#8a6028" stroke="#1a0800" strokeWidth="2.5"/>
      <path d="M50,187 L50,230" stroke="#888" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M44,220 L56,220 L58,242 L42,242 Z" fill="#909090" stroke="#1a0800" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M84,187 L84,222" stroke="#888" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="84" cy="238" r="16" fill="#909090" stroke="#1a0800" strokeWidth="2.5"/>
      <rect x="0" y="192" width="390" height="15" fill="#a07838" stroke="#1a0800" strokeWidth="2.5"/>
      <rect x="0" y="207" width="126" height="80" fill="#7a4a20" stroke="#1a0800" strokeWidth="2.5"/>
      <rect x="126" y="118" width="134" height="170" rx="6" fill="#646464" stroke="#1a0800" strokeWidth="4"/>
      {[[162,145],[228,145],[162,182],[228,182]].map(([cx,cy],i)=>(
        <g key={i}><circle cx={cx} cy={cy} r="20" fill="#4a4a4a" stroke="#1a0800" strokeWidth="2.5"/><circle cx={cx} cy={cy} r="14" fill="#3a3a3a"/><circle cx={cx} cy={cy} r="7" fill="#2e2e2e"/></g>
      ))}
      <rect x="260" y="207" width="130" height="80" fill="#7a4a20" stroke="#1a0800" strokeWidth="2.5"/>
      <rect x="0" y="282" width="390" height="368" fill="url(#kfG)"/>
      {[307,334,361,390,420,452,486,522,560].map((y,i)=><line key={i} x1="0" y1={y} x2="390" y2={y} stroke="#1a0800" strokeWidth="2.8" opacity="0.65"/>)}
      {[78,156,234,312].map((x,i)=><line key={i} x1={x} y1="282" x2={x} y2="650" stroke="#1a0800" strokeWidth="2.8" opacity="0.65"/>)}
      <ellipse cx="152" cy="600" rx="54" ry="19" fill="#909090" stroke="#1a0800" strokeWidth="3.5"/>
      <ellipse cx="152" cy="594" rx="44" ry="14" fill="#c0c0c0"/>
      <ellipse cx="152" cy="591" rx="37" ry="10" fill="#6090c8" opacity="0.88"/>
      <ellipse cx="248" cy="600" rx="54" ry="19" fill="#909090" stroke="#1a0800" strokeWidth="3.5"/>
      <ellipse cx="248" cy="594" rx="44" ry="14" fill="#c0c0c0"/>
      <ellipse cx="248" cy="591" rx="37" ry="10" fill="#c06828"/>
      {[[234,589,6],[249,587,7],[262,589,6],[241,595,5],[255,595,5]].map(([cx,cy,r],i)=>(
        <circle key={i} cx={cx} cy={cy} r={r} fill={i%2===0?"#a04818":"#b05020"} stroke="#1a0800" strokeWidth="1.5"/>
      ))}
    </svg>
  );
}

function BathroomRoom() {
  return (
    <svg viewBox="0 0 390 650" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
      <defs>
        <linearGradient id="bwG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d8ecf8"/><stop offset="100%" stopColor="#e8f4fc"/></linearGradient>
        <linearGradient id="bfG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c0c8d0"/><stop offset="100%" stopColor="#a0aab5"/></linearGradient>
      </defs>
      <rect x="0" y="0" width="390" height="290" fill="url(#bwG)"/>
      {[0,40,80,120,160,200,240,280].map((y,i)=><line key={i} x1="0" y1={y} x2="390" y2={y} stroke="#90b8d0" strokeWidth="1.5" opacity="0.5"/>)}
      {[0,48,96,144,192,240,288,336,384].map((x,i)=><line key={i} x1={x} y1={0} x2={x} y2={290} stroke="#90b8d0" strokeWidth="1.5" opacity="0.5"/>)}
      <rect x="35" y="18" width="115" height="140" rx="8" fill="#b8d8f0" stroke="#1a0800" strokeWidth="4"/>
      <rect x="28" y="155" width="128" height="56" rx="8" fill="#e8f0f8" stroke="#1a0800" strokeWidth="3.5"/>
      <ellipse cx="92" cy="183" rx="40" ry="20" fill="#d8e8f5" stroke="#1a0800" strokeWidth="3"/>
      <ellipse cx="92" cy="183" rx="30" ry="14" fill="#c0d8f0"/>
      <rect x="86" y="157" width="12" height="18" rx="4" fill="#c0c8d0" stroke="#1a0800" strokeWidth="2.5"/>
      <rect x="250" y="175" width="130" height="115" rx="12" fill="#eef4f8" stroke="#1a0800" strokeWidth="4"/>
      <rect x="256" y="182" width="118" height="68" rx="10" fill="#e4eef8" stroke="#1a0800" strokeWidth="3"/>
      <rect x="248" y="162" width="136" height="22" rx="8" fill="#f4f8fc" stroke="#1a0800" strokeWidth="4"/>
      <circle cx="316" cy="162" r="8" fill="#c0ccd8" stroke="#1a0800" strokeWidth="2"/>
      <rect x="0" y="278" width="390" height="372" fill="url(#bfG)"/>
      {[290,350,410,470,530,590,650].map((y,i)=><line key={i} x1="0" y1={y} x2="390" y2={y} stroke="#1a0800" strokeWidth="1.8" opacity="0.35"/>)}
      {[78,156,234,312].map((x,i)=><line key={i} x1={x} y1="278" x2={x} y2="650" stroke="#1a0800" strokeWidth="1.8" opacity="0.35"/>)}
      <ellipse cx="185" cy="608" rx="95" ry="26" fill="#80b8e0" opacity="0.65" stroke="#1a0800" strokeWidth="3"/>
    </svg>
  );
}

function RestRoom() {
  return (
    <svg viewBox="0 0 390 650" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
      <defs>
        <linearGradient id="rwG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b8a0d8"/><stop offset="100%" stopColor="#cebae8"/></linearGradient>
        <linearGradient id="rfG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7a5040"/><stop offset="100%" stopColor="#5a3828"/></linearGradient>
        <radialGradient id="rbG" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#f0c8d8"/><stop offset="100%" stopColor="#e0a8c0"/></radialGradient>
      </defs>
      <rect x="0" y="0" width="390" height="290" fill="url(#rwG)"/>
      {[45,90,135,180,225,272].map((y,i)=><line key={i} x1="0" y1={y} x2="390" y2={y} stroke="#9880b8" strokeWidth="0.6" opacity="0.2"/>)}
      <rect x="28" y="14" width="118" height="138" rx="7" fill="#0e1428"/>
      <rect x="28" y="14" width="118" height="138" rx="7" fill="none" stroke="#1a0800" strokeWidth="5"/>
      <line x1="87" y1="14" x2="87" y2="152" stroke="#1a0800" strokeWidth="5"/>
      <line x1="28" y1="83" x2="146" y2="83" stroke="#1a0800" strokeWidth="5"/>
      <circle cx="68" cy="50" r="20" fill="#fff8d0" opacity="0.95"/>
      <circle cx="78" cy="43" r="15" fill="#0e1428"/>
      <rect x="220" y="60" width="160" height="140" rx="6" fill="#8a6040" stroke="#1a0800" strokeWidth="3.5"/>
      {[108,155].map((y,i)=><line key={i} x1="220" y1={y} x2="380" y2={y} stroke="#1a0800" strokeWidth="2.5"/>)}
      <rect x="0" y="278" width="390" height="372" fill="url(#rfG)"/>
      {[298,325,352,382,414,448,484,522].map((y,i)=><line key={i} x1="0" y1={y} x2="390" y2={y} stroke="#1a0800" strokeWidth="2.2" opacity="0.55"/>)}
      <ellipse cx="195" cy="612" rx="105" ry="32" fill="#e8b8c8" stroke="#1a0800" strokeWidth="4"/>
      <ellipse cx="195" cy="606" rx="88" ry="24" fill="url(#rbG)" stroke="#1a0800" strokeWidth="3"/>
      <rect x="138" y="586" width="60" height="36" rx="18" fill="#f8d0e0" stroke="#1a0800" strokeWidth="3"/>
    </svg>
  );
}

function YardRoom() {
  return (
    <svg viewBox="0 0 390 650" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
      <defs>
        <linearGradient id="ysG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#70b8f0"/><stop offset="100%" stopColor="#a8d8fc"/></linearGradient>
        <linearGradient id="ygG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#58b840"/><stop offset="100%" stopColor="#409028"/></linearGradient>
      </defs>
      <rect x="0" y="0" width="390" height="370" fill="url(#ysG)"/>
      <circle cx="340" cy="60" r="42" fill="#ffe860" stroke="#1a0800" strokeWidth="3"/>
      {[0,45,90,135,180,225,270,315].map((a,i)=>{ const r=Math.PI*a/180; return <line key={i} x1={340+52*Math.cos(r)} y1={60+52*Math.sin(r)} x2={340+68*Math.cos(r)} y2={60+68*Math.sin(r)} stroke="#1a0800" strokeWidth="3" strokeLinecap="round"/>; })}
      <ellipse cx="80" cy="70" rx="48" ry="24" fill="white" opacity="0.92"/>
      <ellipse cx="110" cy="60" rx="38" ry="20" fill="white" opacity="0.92"/>
      <ellipse cx="55" cy="78" rx="30" ry="18" fill="white" opacity="0.85"/>
      {[20,56,92,128,164,200,236,272,308,344,380].map((x,i)=>(<rect key={i} x={x} y="180" width="28" height="100" rx="4" fill="#d4a050" stroke="#1a0800" strokeWidth="2.5"/>))}
      <rect x="14" y="218" width="368" height="16" rx="4" fill="#e8b860" stroke="#1a0800" strokeWidth="3"/>
      <rect x="20" y="250" width="22" height="120" rx="6" fill="#8a5028" stroke="#1a0800" strokeWidth="3"/>
      <ellipse cx="31" cy="240" rx="50" ry="55" fill="#38a030" stroke="#1a0800" strokeWidth="3.5"/>
      <ellipse cx="31" cy="210" rx="38" ry="42" fill="#48b838" stroke="#1a0800" strokeWidth="3"/>
      <rect x="348" y="255" width="22" height="115" rx="6" fill="#8a5028" stroke="#1a0800" strokeWidth="3"/>
      <ellipse cx="359" cy="240" rx="48" ry="52" fill="#38a030" stroke="#1a0800" strokeWidth="3.5"/>
      <ellipse cx="359" cy="212" rx="36" ry="40" fill="#48b838" stroke="#1a0800" strokeWidth="3"/>
      <rect x="0" y="348" width="390" height="302" fill="url(#ygG)"/>
      <circle cx="270" cy="570" r="34" fill="#e05888" stroke="#1a0800" strokeWidth="3.5"/>
      <path d="M270,538 C265,500 255,480 260,460" stroke="#e05888" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function ClinicRoom() {
  return (
    <svg viewBox="0 0 390 650" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
      <defs>
        <linearGradient id="clwG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d8eae0"/><stop offset="100%" stopColor="#e8f4ec"/></linearGradient>
        <linearGradient id="clfG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b0c0c8"/><stop offset="100%" stopColor="#90a0a8"/></linearGradient>
      </defs>
      <rect x="0" y="0" width="390" height="290" fill="url(#clwG)"/>
      {[0,44,88,132,176,220,264].map((y,i)=><line key={i} x1="0" y1={y} x2="390" y2={y} stroke="#88b898" strokeWidth="1.5" opacity="0.4"/>)}
      {[0,52,104,156,208,260,312,364].map((x,i)=><line key={i} x1={x} y1={0} x2={x} y2={290} stroke="#88b898" strokeWidth="1.5" opacity="0.4"/>)}
      <rect x="170" y="20" width="52" height="52" rx="8" fill="#e83030" stroke="#1a0800" strokeWidth="3"/>
      <rect x="180" y="38" width="32" height="12" rx="3" fill="white"/>
      <rect x="188" y="30" width="12" height="32" rx="3" fill="white"/>
      <rect x="22" y="18" width="120" height="160" rx="8" fill="#d0dce0" stroke="#1a0800" strokeWidth="3.5"/>
      <rect x="26" y="38" width="54" height="130" rx="4" fill="#c8d8dc" stroke="#1a0800" strokeWidth="2.5"/>
      <rect x="82" y="38" width="56" height="130" rx="4" fill="#c8d8dc" stroke="#1a0800" strokeWidth="2.5"/>
      <rect x="238" y="50" width="145" height="10" rx="4" fill="#8ab0b8" stroke="#1a0800" strokeWidth="2.5"/>
      <rect x="238" y="60" width="145" height="80" rx="4" fill="#c0d8e0" stroke="#1a0800" strokeWidth="2.5"/>
      {[{x:248,c:'#e83030'},{x:278,c:'#3090e0'},{x:308,c:'#30c060'},{x:338,c:'#e8a030'}].map((b,i)=>(
        <g key={i}><rect x={b.x} y="64" width="22" height="38" rx="5" fill={b.c} stroke="#1a0800" strokeWidth="2"/><rect x={b.x+3} y="60" width="16" height="8" rx="3" fill="#f8f8f8" stroke="#1a0800" strokeWidth="1.5"/></g>
      ))}
      <rect x="100" y="202" width="190" height="68" rx="8" fill="#e8f0f4" stroke="#1a0800" strokeWidth="3.5"/>
      <rect x="104" y="206" width="182" height="60" rx="6" fill="#c8dce8"/>
      <rect x="0" y="278" width="390" height="372" fill="url(#clfG)"/>
      {[290,340,390,440,490,540,590,640].map((y,i)=><line key={i} x1="0" y1={y} x2="390" y2={y} stroke="#1a0800" strokeWidth="1.8" opacity="0.35"/>)}
      {[78,156,234,312].map((x,i)=><line key={i} x1={x} y1="278" x2={x} y2="650" stroke="#1a0800" strokeWidth="1.8" opacity="0.35"/>)}
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
                      cooldowns, onObjectAction, onMinigame, onBack }) {
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
        style={{ position:'absolute', bottom:PANEL_H+18, left:catLeft, width:112,
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
  // Toast/queue
  const [toast,          setToast]          = useState(null);
  const [toastKey,       setToastKey]       = useState(0);
  const [achToast,       setAchToast]       = useState(null);
  const [achQueue,       setAchQueue]       = useState([]);

  // ─────────────────── DERIVED VALUES (after all hooks) ───────────────────
  const level    = levelFromXP(xp);
  const xpProg   = xpProgress(xp);
  const nftBonus = calcNFTBonus(activeNFT);
  CAT = activeNFT ? activeNFT.image : CAT_DEFAULT;
  GIF = activeNFT ? activeNFT.image : GIF_DEFAULT;

  const createdAt  = useRef(_INIT.createdAt);
  const walkRef    = useRef({ x: 111, dir: 1 });
  const gifTimer   = useRef(null);
  const heartId    = useRef(0);
  const toastTimer = useRef(null);
  const wasCritRef  = useRef({ hunger: false, fatigue: false, toilet: false, mood: false, health: false });
  const nftBonusRef = useRef(nftBonus);
  nftBonusRef.current = nftBonus; // always fresh inside callbacks

  const day = Math.max(1, Math.floor((Date.now() - createdAt.current) / 86400000) + 1);

  // ── Telegram init ──
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) { tg.expand(); tg.ready(); }
  }, []);

  // ── Persist state ──
  useEffect(() => {
    saveState({
      stats, coins, xp,
      createdAt: createdAt.current,
      lastDaily, dailyStreak,
      inventory, equipped, achievements, highScores,
      actionCounts, dailyMissions,
      roomLayout, ownedDecor, ownedBgs,
      walletAddress, ownedNFTs, activeNFT,
    });
  }, [stats, coins, xp, lastDaily, dailyStreak, inventory, equipped, actionCounts, dailyMissions, roomLayout, ownedDecor, ownedBgs, walletAddress, ownedNFTs, activeNFT]);

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
        return next;
      });
    }, 10000);
    return () => clearInterval(t);
  }, [level]);

  // ── Sync stats to backend every 5 min for push notifications ──
  useEffect(() => {
    syncBackend(stats);                         // immediate on mount
    const t = setInterval(() => syncBackend(stats), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [stats]);

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

  // ── Actions ──
  const handleFeed = useCallback((item) => {
    const count = inventory[item.id] || 0;
    if (count <= 0) return;
    setInventory(prev => ({ ...prev, [item.id]: prev[item.id] - 1 }));
    setStats(prev => ({
      ...prev,
      hunger: clamp(prev.hunger + item.hunger, 0, 100),
      mood:   clamp(prev.mood   + (item.mood   || 0), 0, 100),
      health: clamp(prev.health + (item.health || 0), 0, 100),
    }));
    const earned = earnCoins(8, level);
    setCoins(c => c + earned);
    applyXP(item.xp);
    afterAction('feedCount');
    if (item.id === 'food_premium') afterAction('premiumFed');
    spawnHearts(3, 80);
    playSound('feed');
    showToast(`${item.emoji} +${earned}🪙 +${item.xp}XP`);
  }, [inventory, level, applyXP, afterAction, spawnHearts, showToast]);

  const handleUseToy = useCallback((item) => {
    const count = inventory[item.id] || 0;
    if (count <= 0) return;
    setInventory(prev => ({ ...prev, [item.id]: prev[item.id] - 1 }));
    setStats(prev => ({
      ...prev,
      mood:    clamp(prev.mood    + item.mood,    0, 100),
      fatigue: clamp(prev.fatigue + (item.fatigue || 0), 0, 100),
    }));
    const earned = earnCoins(5, level);
    setCoins(c => c + earned);
    applyXP(item.xp);
    afterAction('toyCount');
    afterAction('playCount');
    spawnHearts(4, 100);
    playSound('toy');
    showToast(`${item.emoji} +${earned}🪙 +${item.xp}XP`);
  }, [inventory, level, applyXP, afterAction, spawnHearts, showToast]);

  // roomKey: 'bathroomCount' | 'sleepCount' | 'clinicCount'
  const handleRoomAction = useCallback((statChanges, baseXP, baseCoins, roomKey) => {
    setStats(prev => {
      const s = { ...prev };
      Object.entries(statChanges).forEach(([k, v]) => { s[k] = clamp((s[k] || 0) + v, 0, 100); });
      return s;
    });
    const earned = earnCoins(baseCoins, level);
    setCoins(c => c + earned);
    applyXP(baseXP);
    if (roomKey) afterAction(roomKey);
    spawnHearts(3, 120);
    playSound('action');
    showToast(`+${earned}🪙 +${baseXP}XP`);
    setActionDone(true);
    setTimeout(() => { setScreen('home'); setActionDone(false); }, 1800);
  }, [level, applyXP, afterAction, spawnHearts, showToast]);

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
    if (showGif) return;
    setShowGif(true);
    clearTimeout(gifTimer.current);
    gifTimer.current = setTimeout(() => setShowGif(false), 3000);
  }, [showGif, stats, level, spawnHearts]);

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
        onBack={() => { setScreen('home'); setActiveNav('home'); }}/>
      {toast && <Toast key={toastKey} msg={toast}/>}
      {complaint && <ComplaintOverlay text={complaint} onClose={() => setComplaint(null)}/>}
    </div>
  );

  // ── HOME SCREEN ──
  const PANEL_H = 192;
  // Emotion-state derived values (Phase 3)
  const catAnimStyle  = showGif ? 'none' : catEmoCfg.anim;
  const catFilterStr  = catEmoCfg.filter === 'none' ? 'drop-shadow(0 8px 22px rgba(0,0,0,0.65))' : `drop-shadow(0 8px 22px rgba(0,0,0,0.65)) ${catEmoCfg.filter}`;
  const activeBgObj   = BG_OVERLAYS.find(b => b.id === roomLayout.bg);

  return (
    <div style={{ width:'100%', height:'100%', position:'relative', overflow:'hidden', background:'#3a2010', fontFamily:"'Nunito',sans-serif" }}>

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
      <div style={{ position:'relative', zIndex:20, padding:'12px 16px 0' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:21, fontWeight:900, color:'#f5dfc0', letterSpacing:-0.5, textShadow:'0 1px 6px rgba(0,0,0,0.6)' }}>Scared Cat 🐱</div>
            <div style={{ fontSize:11, color:'#c8a870', fontWeight:700, marginTop:1 }}>День {day} • Ур. {level}</div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'rgba(20,8,0,0.6)', borderRadius:99, boxShadow:'0 2px 10px rgba(0,0,0,0.45)', border:'1.5px solid rgba(255,255,255,0.12)' }}>
              <span style={{ fontSize:15 }}>🪙</span>
              <span style={{ fontSize:14, fontWeight:900, color:'#f5dfc0' }}>{coins}</span>
            </div>
            {/* NFT / Wallet button */}
            <button onClick={() => { setScreen('nft_skins'); setActiveNav(''); }}
              style={{ width:38, height:38, borderRadius:12, background: activeNFT ? `rgba(${activeNFT ? '80,40,160' : '20,8,0'},0.7)` : 'rgba(20,8,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: activeNFT ? '0 2px 10px rgba(120,60,255,0.5)' : '0 2px 10px rgba(0,0,0,0.45)', cursor:'pointer', fontSize:18, border: walletAddress ? '1.5px solid rgba(120,80,255,0.6)' : '1.5px solid rgba(255,255,255,0.12)', position:'relative', overflow:'hidden' }}>
              {activeNFT
                ? <img src={activeNFT.image} alt="NFT" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:10 }}/>
                : <span>👛</span>
              }
              {walletAddress && !activeNFT && (
                <div style={{ position:'absolute', bottom:2, right:2, width:8, height:8, borderRadius:'50%', background:'#60ff90', border:'1px solid rgba(0,0,0,0.5)' }}/>
              )}
            </button>
            {/* Edit mode button */}
            <button onClick={() => setEditMode(e => !e)}
              style={{ width:38, height:38, borderRadius:12, background: editMode ? 'rgba(255,200,60,0.25)' : 'rgba(20,8,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.45)', cursor:'pointer', fontSize:18, border: editMode ? '1.5px solid rgba(255,200,60,0.6)' : '1.5px solid rgba(255,255,255,0.12)' }}>
              🎨
            </button>
            <button onClick={() => { setScreen('shop'); setActiveNav('shop'); }}
              style={{ width:38, height:38, borderRadius:12, background:'rgba(20,8,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.45)', cursor:'pointer', fontSize:18, border:'1.5px solid rgba(255,255,255,0.12)' }}>
              🛒
            </button>
          </div>
        </div>
        {/* XP bar */}
        <div style={{ marginTop:8, height:5, background:'rgba(255,255,255,0.12)', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:99, background:'linear-gradient(90deg,#a0e060,#60c820)', width:`${xpProg.pct * 100}%`, transition:'width 0.4s ease' }}/>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:2 }}>
          <span style={{ fontSize:9, color:'rgba(255,255,255,0.35)', fontWeight:700 }}>XP {xpProg.curXP}/{xpProg.needed || '—'}</span>
          {level >= MAX_LEVEL && <span style={{ fontSize:9, color:'#ffd060', fontWeight:700 }}>MAX 🌟</span>}
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
           style={{ position:'absolute', zIndex:15, bottom: PANEL_H + 24, left: catX, width:130, cursor:'pointer', transition: showGif ? 'left 0.25s ease-out' : 'none' }}>
        {/* Outer div handles scaleX (facing direction) */}
        <div style={{ transform:`scaleX(${catFacing})`, transformOrigin:'center' }}>
          {/* Inner div handles emotion animation + filter */}
          <div style={{ filter: catFilterStr, animation: catAnimStyle, position:'relative' }}>
            <img src={CAT} alt="кот" style={{ width:'100%', display:'block', userSelect:'none', pointerEvents:'none', opacity: showGif ? 0 : 1, transition:'opacity 0.2s' }} draggable="false"/>
            {showGif && (
              <img src={GIF} alt="анимация"
                   style={{ position:'absolute', inset:0, width:'100%', display:'block', userSelect:'none', pointerEvents:'none' }}
                   draggable="false"/>
            )}
            {/* NFT skin-switch sparkle flash */}
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
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
