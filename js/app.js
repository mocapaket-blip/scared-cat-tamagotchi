/* ═══════════════════════════════════════════════
   SCARED CAT — React App
   Depends on: config.js, engine.js (loaded first)
   ═══════════════════════════════════════════════ */

const { useState, useEffect, useRef, useCallback } = React;
const CAT = window.CAT_PNG || 'cat.png';
const GIF = window.CAT_GIF || 'cat-anim.gif';

/* ══════════════════════════════════════════════════
   MINI-GAME 1 — Catch the Food 🍚
   ══════════════════════════════════════════════════ */
function CatchGameScreen({ level, onComplete, onBack }) {
  const DURATION = 30;
  const FOOD_EMOJIS = ['🍚','🍗','🐟','🍖','🧁','🐾'];
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [score, setScore] = useState(0);
  const [items, setItems] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const nextId = useRef(0);
  const gameOverRef = useRef(false);

  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { gameOverRef.current = true; setGameOver(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameOver]);

  // Spawn falling items
  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => {
      if (gameOverRef.current) return;
      setItems(prev => [...prev, {
        id:    ++nextId.current,
        emoji: FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)],
        x:     15 + Math.random() * 310,
        y:     -60,
        speed: 3 + Math.random() * 2.5,
        size:  30 + Math.floor(Math.random() * 18),
      }]);
    }, 750);
    return () => clearInterval(t);
  }, [gameOver]);

  // Move items down
  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => {
      setItems(prev => prev
        .map(it => ({ ...it, y: it.y + it.speed * 2.5 }))
        .filter(it => it.y < 680)
      );
    }, 30);
    return () => clearInterval(t);
  }, [gameOver]);

  const catchItem = useCallback((id) => {
    setItems(prev => prev.filter(it => it.id !== id));
    setScore(prev => prev + 1);
  }, []);

  const baseCoins = Math.min(score * 6, 120);
  const earnedCoins = earnCoins(baseCoins, level);
  const xpGain = ACTION_XP.minigame_base + Math.floor(score * 2);

  if (gameOver) return (
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,#1a0d00,#2d1500)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, padding:32, animation:'screenFade 0.3s ease' }}>
      <div style={{ fontSize:64 }}>🏆</div>
      <div style={{ fontSize:26, fontWeight:900, color:'#f5dfc0', textAlign:'center' }}>
        {score >= 15 ? 'Отлично!' : score >= 8 ? 'Неплохо!' : 'В следующий раз лучше!'}
      </div>
      <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:20, padding:'18px 36px', textAlign:'center' }}>
        <div style={{ fontSize:16, color:'#c8a060', fontWeight:700 }}>Поймано: {score} 🐾</div>
        <div style={{ fontSize:22, fontWeight:900, color:'#ffd060', marginTop:6 }}>+{earnedCoins} 🪙</div>
        <div style={{ fontSize:15, color:'#a0c880', fontWeight:700 }}>+{xpGain} XP</div>
      </div>
      <button onClick={() => onComplete(earnedCoins, xpGain)} style={{ background:'linear-gradient(155deg,#ffd060,#f0a020)', border:'none', borderRadius:22, padding:'16px 48px', fontSize:18, fontWeight:900, color:'white', cursor:'pointer', boxShadow:'0 6px 0 #c07808', width:'100%', maxWidth:260 }}>
        Забрать! 🎉
      </button>
    </div>
  );

  return (
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,#1a0d00 0%,#2d1500 40%,#3a1e08 100%)', overflow:'hidden', touchAction:'none' }}>
      {/* Header bar */}
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:10, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px 0' }}>
        <button onClick={onBack} style={{ background:'rgba(20,8,0,0.7)', border:'1.5px solid rgba(255,255,255,0.15)', borderRadius:12, width:38, height:38, cursor:'pointer', fontSize:18, color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <div style={{ fontSize:16, fontWeight:900, color:'#f5dfc0' }}>⏱ {timeLeft}с</div>
          <div style={{ fontSize:16, fontWeight:900, color:'#ffd060' }}>🎯 {score}</div>
        </div>
      </div>
      {/* Timer bar */}
      <div style={{ position:'absolute', top:58, left:16, right:16, height:6, background:'rgba(255,255,255,0.15)', borderRadius:99 }}>
        <div style={{ height:'100%', borderRadius:99, background:'linear-gradient(90deg,#ffd060,#f06020)', width:`${(timeLeft/DURATION)*100}%`, transition:'width 1s linear' }}/>
      </div>
      {/* Instructions */}
      {score === 0 && timeLeft >= 28 && (
        <div style={{ position:'absolute', top:'50%', left:0, right:0, textAlign:'center', color:'rgba(255,255,255,0.4)', fontSize:14, fontWeight:700, pointerEvents:'none' }}>
          Нажимай на еду! 👆
        </div>
      )}
      {/* Falling items */}
      {items.map(it => (
        <div key={it.id} className="catch-item"
          style={{ left: it.x, top: it.y, fontSize: it.size }}
          onClick={() => catchItem(it.id)}
          onTouchStart={(e) => { e.preventDefault(); catchItem(it.id); }}>
          {it.emoji}
        </div>
      ))}
      {/* Cat at bottom */}
      <div style={{ position:'absolute', bottom:30, left:'50%', transform:'translateX(-50%)', width:90, filter:'drop-shadow(0 6px 14px rgba(0,0,0,0.7))', pointerEvents:'none' }}>
        <img src={CAT} alt="кот" style={{ width:'100%', display:'block' }} draggable="false"/>
      </div>
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
function ShopScreen({ coins, inventory, equipped, achievements, onBuy, onEquip, onBack }) {
  const [tab, setTab] = useState('food');
  const tabs = [
    { id:'food',  label:'🍽️ Еда'      },
    { id:'toys',  label:'🎮 Игрушки'  },
    { id:'acc',   label:'🎀 Аксессуары'},
  ];

  const itemsByTab = { food: FOOD_ITEMS, toys: TOY_ITEMS, acc: ACC_ITEMS };
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
        {tab === 'acc' ? (
          // Accessories grid
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
        ) : (
          // Food / Toys list
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
                      {item.mood > 0 && <span style={{ fontSize:11, color:'#e08020', fontWeight:700 }}>😺+{item.mood}</span>}
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
  const fillColor = critical ? '#ff2828' : fill > 58 ? '#42cc78' : fill > 28 ? '#f5a020' : '#ff5840';
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
        <div style={{ position:'absolute', left:'50%', bottom:4, transform:'translateX(-50%)', fontSize:15, lineHeight:1, pointerEvents:'none', filter:'drop-shadow(0 1px 2px rgba(0,0,0,0.35))' }}>{icon}</div>
      </div>
      <span style={{ fontSize:8, fontWeight:800, color:'#2a1008', letterSpacing:0.1 }}>{label}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   FLOATING HEART
   ══════════════════════════════════════════════════ */
function FloatingHeart({ id, x, y, onDone }) {
  const emojis = ['❤️','💕','💖','💗'];
  const e = emojis[id % emojis.length];
  return (
    <div onAnimationEnd={onDone} style={{ position:'absolute', left:x, top:y||'38%', fontSize:20, animation:'heartPop 1.1s ease-out forwards', pointerEvents:'none', zIndex:30 }}>
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
    <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(180deg,#f8f0e2,#f2e8d4)', borderRadius:'26px 26px 0 0', boxShadow:'0 -6px 32px rgba(0,0,0,0.4)', padding:'12px 12px 0', zIndex:20, height:192, display:'flex', flexDirection:'column' }}>
      <div style={{ background:'rgba(255,255,255,0.5)', borderRadius:18, padding:'8px 4px', display:'flex', justifyContent:'space-around', alignItems:'flex-end', border:'1.5px solid rgba(255,255,255,0.85)', flex:1, marginBottom:10 }}>
        <PawIndicator pawId="ph"  icon="🍔" label="Кухня"   fill={fills.hunger}  critical={isCrit(fills.hunger)}  onClick={() => onPawClick('kitchen')}/>
        <PawIndicator pawId="pt"  icon="🚽" label="Ванная"  fill={fills.toilet}  critical={isCrit(fills.toilet)}  onClick={() => onPawClick('bathroom')}/>
        <PawIndicator pawId="pf"  icon="😴" label="Спальня" fill={fills.fatigue} critical={isCrit(fills.fatigue)} onClick={() => onPawClick('rest')}/>
        <PawIndicator pawId="pm"  icon="🎮" label="Игровая" fill={fills.mood}    critical={isCrit(fills.mood)}    onClick={() => onPawClick('yard')}/>
        <PawIndicator pawId="phh" icon="🏥" label="Клиника" fill={fills.health}  critical={isCrit(fills.health)}  onClick={() => onPawClick('clinic')}/>
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
   ACTION BUTTON (reusable)
   ══════════════════════════════════════════════════ */
function ActionBtn({ emoji, label, color, onClick, done, disabled }) {
  const grads = {
    orange:'linear-gradient(155deg,#ffd060,#f0a020)',
    blue:  'linear-gradient(155deg,#80d0f8,#40a8e0)',
    purple:'linear-gradient(155deg,#d0a8f8,#a070e0)',
    green: 'linear-gradient(155deg,#80e890,#40c050)',
    teal:  'linear-gradient(155deg,#70e8d8,#30c0a8)',
    red:   'linear-gradient(155deg,#f09080,#e05040)',
  };
  const shadows = {
    orange:'0 6px 0 #c07808', blue:'0 6px 0 #2878b0', purple:'0 6px 0 #7040b0',
    green:'0 6px 0 #208030',  teal:'0 6px 0 #108878',   red:'0 6px 0 #a03020',
  };
  const [pressed, setPressed] = useState(false);
  const isDisabled = done || disabled;
  return (
    <button disabled={isDisabled}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => { setPressed(false); if (!isDisabled) onClick?.(); }}
      onPointerLeave={() => setPressed(false)}
      style={{ background: isDisabled ? '#c8c0b8' : grads[color] || grads.orange, border:'none', borderRadius:22, padding:'14px 32px', cursor: isDisabled ? 'default' : 'pointer', display:'flex', alignItems:'center', gap:10, boxShadow: (pressed || isDisabled) ? 'none' : (shadows[color] || shadows.orange), transform: pressed ? 'translateY(5px)' : 'translateY(0)', transition:'all 0.12s', fontFamily:"'Nunito',sans-serif" }}>
      <span style={{ fontSize:28 }}>{done ? '✅' : emoji}</span>
      <span style={{ fontSize:15, fontWeight:900, color:'white', textShadow:'0 2px 4px rgba(0,0,0,0.25)' }}>{done ? 'Готово!' : label}</span>
    </button>
  );
}

/* ══════════════════════════════════════════════════
   KITCHEN SCREEN — food choices + minigame
   ══════════════════════════════════════════════════ */
function KitchenScreen({ inventory, coins, level, fills, isCrit, activeNav, setActiveNav, onPawClick, hearts, removeHeart, thoughtEmoji, onFeed, onMinigame, onBack }) {
  const PANEL_H = 192;
  const catX = 82, catFacing = 1;

  return (
    <div style={{ position:'absolute', inset:0, animation:'screenFade 0.3s ease', background:'#5a3010' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:PANEL_H }}>
        <KitchenRoom/>
      </div>
      {hearts.map(h => <FloatingHeart key={h.id} id={h.id} x={h.x} y={h.y} onDone={() => removeHeart(h.id)}/>)}
      {/* Header */}
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:60, display:'flex', alignItems:'center', gap:12, padding:'14px 16px 0' }}>
        <button onClick={onBack} style={{ background:'rgba(20,8,0,0.6)', border:'1.5px solid rgba(255,255,255,0.15)', borderRadius:12, width:38, height:38, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>←</button>
        <span style={{ fontSize:18, fontWeight:900, color:'#f5dfc0', textShadow:'0 1px 6px rgba(0,0,0,0.6)' }}>🍽️ Кухня</span>
      </div>
      {/* Cat */}
      <div style={{ position:'absolute', bottom:PANEL_H+22, left:catX, width:115, filter:'drop-shadow(0 6px 16px rgba(0,0,0,0.7))', transform:`scaleX(${catFacing})`, transformOrigin:'center', pointerEvents:'none' }}>
        <img src={CAT} alt="кот" style={{ width:'100%', display:'block' }} draggable="false"/>
      </div>
      {/* Thought bubble */}
      {thoughtEmoji && (
        <div style={{ position:'absolute', bottom:PANEL_H+130, left: catX + (catFacing===1 ? 90 : -55), pointerEvents:'none', zIndex:62 }}>
          <ThoughtBubble emoji={thoughtEmoji}/>
        </div>
      )}
      {/* Food action panel */}
      <div style={{ position:'absolute', bottom:PANEL_H+10, left:0, right:0, padding:'0 12px', zIndex:55, animation:'slideUp 0.4s ease' }}>
        <div style={{ display:'flex', gap:8 }}>
          {FOOD_ITEMS.map(item => {
            const count = inventory[item.id] || 0;
            return (
              <div key={item.id} style={{ flex:1, background:'rgba(0,0,0,0.55)', borderRadius:18, padding:'10px 6px', textAlign:'center', border:'1.5px solid rgba(255,255,255,0.12)', backdropFilter:'blur(4px)' }}>
                <div style={{ fontSize:28 }}>{item.emoji}</div>
                <div style={{ fontSize:11, fontWeight:800, color:'#f5dfc0', marginTop:2 }}>{item.name}</div>
                <div style={{ fontSize:10, color: count > 0 ? '#a0e060' : '#ff8060', fontWeight:700 }}>×{count}</div>
                <button onClick={() => count > 0 && onFeed(item)}
                  style={{ marginTop:6, width:'100%', padding:'7px 0', borderRadius:12, border:'none', cursor: count > 0 ? 'pointer' : 'default', fontSize:12, fontWeight:900, fontFamily:"'Nunito',sans-serif", background: count > 0 ? 'linear-gradient(135deg,#ffd060,#f0a020)' : 'rgba(255,255,255,0.15)', color: count > 0 ? 'white' : 'rgba(255,255,255,0.4)', boxShadow: count > 0 ? '0 3px 0 #c07808' : 'none' }}>
                  {count > 0 ? 'Дать' : '—'}
                </button>
              </div>
            );
          })}
        </div>
        {/* Mini-game button */}
        <button onClick={onMinigame} style={{ marginTop:8, width:'100%', padding:'10px', borderRadius:16, border:'1.5px solid rgba(255,255,255,0.15)', background:'rgba(0,0,0,0.45)', cursor:'pointer', fontSize:13, fontWeight:900, color:'#ffd060', fontFamily:"'Nunito',sans-serif", backdropFilter:'blur(4px)' }}>
          🎯 Мини-игра: Поймай еду  (+монеты)
        </button>
      </div>
      <BottomPanel fills={fills} isCrit={isCrit} onPawClick={onPawClick} activeNav={activeNav} setActiveNav={setActiveNav} canClaimDaily={false}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   YARD SCREEN — toy choices + minigame
   ══════════════════════════════════════════════════ */
function YardScreen({ inventory, fills, isCrit, activeNav, setActiveNav, onPawClick, hearts, removeHeart, thoughtEmoji, onUseToy, onMinigame, onBack }) {
  const PANEL_H = 192;
  const catX = 145, catFacing = -1;

  return (
    <div style={{ position:'absolute', inset:0, animation:'screenFade 0.3s ease', background:'#1a4010' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:PANEL_H }}>
        <YardRoom/>
      </div>
      {hearts.map(h => <FloatingHeart key={h.id} id={h.id} x={h.x} y={h.y} onDone={() => removeHeart(h.id)}/>)}
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:60, display:'flex', alignItems:'center', gap:12, padding:'14px 16px 0' }}>
        <button onClick={onBack} style={{ background:'rgba(20,8,0,0.6)', border:'1.5px solid rgba(255,255,255,0.15)', borderRadius:12, width:38, height:38, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>←</button>
        <span style={{ fontSize:18, fontWeight:900, color:'#f5dfc0', textShadow:'0 1px 6px rgba(0,0,0,0.6)' }}>🎮 Игровая</span>
      </div>
      <div style={{ position:'absolute', bottom:PANEL_H+22, left:catX, width:115, filter:'drop-shadow(0 6px 16px rgba(0,0,0,0.7))', transform:`scaleX(${catFacing})`, transformOrigin:'center', pointerEvents:'none' }}>
        <img src={CAT} alt="кот" style={{ width:'100%', display:'block' }} draggable="false"/>
      </div>
      {thoughtEmoji && (
        <div style={{ position:'absolute', bottom:PANEL_H+130, left: catX + (catFacing===1 ? 90 : -55), pointerEvents:'none', zIndex:62 }}>
          <ThoughtBubble emoji={thoughtEmoji}/>
        </div>
      )}
      <div style={{ position:'absolute', bottom:PANEL_H+10, left:0, right:0, padding:'0 12px', zIndex:55, animation:'slideUp 0.4s ease' }}>
        <div style={{ display:'flex', gap:8 }}>
          {TOY_ITEMS.map(item => {
            const count = inventory[item.id] || 0;
            return (
              <div key={item.id} style={{ flex:1, background:'rgba(0,0,0,0.55)', borderRadius:18, padding:'10px 6px', textAlign:'center', border:'1.5px solid rgba(255,255,255,0.12)', backdropFilter:'blur(4px)' }}>
                <div style={{ fontSize:28 }}>{item.emoji}</div>
                <div style={{ fontSize:11, fontWeight:800, color:'#f5dfc0', marginTop:2 }}>{item.name}</div>
                <div style={{ fontSize:10, color: count > 0 ? '#a0e060' : '#ff8060', fontWeight:700 }}>×{count}</div>
                <button onClick={() => count > 0 && onUseToy(item)}
                  style={{ marginTop:6, width:'100%', padding:'7px 0', borderRadius:12, border:'none', cursor: count > 0 ? 'pointer' : 'default', fontSize:12, fontWeight:900, fontFamily:"'Nunito',sans-serif", background: count > 0 ? 'linear-gradient(135deg,#80e890,#40c050)' : 'rgba(255,255,255,0.15)', color: count > 0 ? 'white' : 'rgba(255,255,255,0.4)', boxShadow: count > 0 ? '0 3px 0 #208030' : 'none' }}>
                  {count > 0 ? 'Играть' : '—'}
                </button>
              </div>
            );
          })}
        </div>
        <button onClick={onMinigame} style={{ marginTop:8, width:'100%', padding:'10px', borderRadius:16, border:'1.5px solid rgba(255,255,255,0.15)', background:'rgba(0,0,0,0.45)', cursor:'pointer', fontSize:13, fontWeight:900, color:'#a0e060', fontFamily:"'Nunito',sans-serif", backdropFilter:'blur(4px)' }}>
          🧩 Мини-игра: Карточки  (+монеты)
        </button>
      </div>
      <BottomPanel fills={fills} isCrit={isCrit} onPawClick={onPawClick} activeNav={activeNav} setActiveNav={setActiveNav} canClaimDaily={false}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   GENERIC LOCATION SCREEN (bathroom, rest, clinic)
   ══════════════════════════════════════════════════ */
function LocationScreen({ screen, onBack, onAction, actionDone, catX, catFacing, RoomComp, actionEmoji, actionLabel, actionColor, locationName, fills, isCrit, activeNav, setActiveNav, onPawClick, hearts, removeHeart, thoughtEmoji }) {
  const PANEL_H = 192;
  return (
    <div key={screen} style={{ position:'absolute', inset:0, animation:'screenFade 0.3s ease', zIndex:50, background:'#3a2010' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:PANEL_H }}>
        <RoomComp/>
      </div>
      {hearts.map(h => <FloatingHeart key={h.id} id={h.id} x={h.x} y={h.y} onDone={() => removeHeart(h.id)}/>)}
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:60, display:'flex', alignItems:'center', gap:12, padding:'14px 16px 0' }}>
        <button onClick={onBack} style={{ background:'rgba(20,8,0,0.6)', border:'1.5px solid rgba(255,255,255,0.15)', borderRadius:12, width:38, height:38, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>←</button>
        <span style={{ fontSize:18, fontWeight:900, color:'#f5dfc0', textShadow:'0 1px 6px rgba(0,0,0,0.6)' }}>{locationName}</span>
      </div>
      <div style={{ position:'absolute', bottom:PANEL_H+22, left:catX, width:115, filter:'drop-shadow(0 6px 16px rgba(0,0,0,0.7))', transform:`scaleX(${catFacing})`, transformOrigin:'center', pointerEvents:'none' }}>
        <img src={CAT} alt="кот" style={{ width:'100%', display:'block' }} draggable="false"/>
      </div>
      {thoughtEmoji && (
        <div style={{ position:'absolute', bottom:PANEL_H+130, left: catX + (catFacing===1 ? 90 : -55), pointerEvents:'none', zIndex:62 }}>
          <ThoughtBubble emoji={thoughtEmoji}/>
        </div>
      )}
      <div style={{ position:'absolute', bottom:PANEL_H+16, left:0, right:0, display:'flex', justifyContent:'center', zIndex:55, animation:'slideUp 0.4s ease' }}>
        {!actionDone
          ? <ActionBtn emoji={actionEmoji} label={actionLabel} color={actionColor} onClick={onAction}/>
          : <div style={{ fontSize:14, fontWeight:800, color:'white', textShadow:'0 2px 6px rgba(0,0,0,0.8)', animation:'slideUp 0.3s ease', background:'rgba(0,0,0,0.5)', borderRadius:16, padding:'12px 24px' }}>Всё готово! ✨</div>
        }
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
   ROOT APP
   ══════════════════════════════════════════════════ */
function App() {
  // ── Core state ──
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

  // ── Derived ──
  const level  = levelFromXP(xp);
  const xpProg = xpProgress(xp);

  // ── UI state ──
  const [complaint,      setComplaint]      = useState(_INIT.complaint);
  const [showDailyModal, setShowDailyModal] = useState(_INIT.canClaimDaily);
  const [pendingStreak,  setPendingStreak]  = useState(_INIT.pendingStreak);
  const [levelUpModal,   setLevelUpModal]   = useState(null);
  const [hearts,         setHearts]         = useState([]);
  const [activeNav,      setActiveNav]      = useState('home');
  const [catX,           setCatX]           = useState(111);
  const [catFacing,      setCatFacing]      = useState(1);
  const [showGif,        setShowGif]        = useState(false);
  const [actionDone,     setActionDone]     = useState(false);
  const [toast,          setToast]          = useState(null);
  const [toastKey,       setToastKey]       = useState(0);
  const [achToast,       setAchToast]       = useState(null);
  const [achQueue,       setAchQueue]       = useState([]);

  const createdAt = useRef(_INIT.createdAt);
  const walkRef   = useRef({ x: 111, dir: 1 });
  const gifTimer  = useRef(null);
  const heartId   = useRef(0);
  const toastTimer = useRef(null);

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
    });
  }, [stats, coins, xp, lastDaily, dailyStreak, inventory, equipped, actionCounts, dailyMissions]);

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
      setStats(p => applyDecay(p, 10 / 60, level));
    }, 10000);
    return () => clearInterval(t);
  }, [level]);

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
  const worstKey = sortedFills[0]?.[0] || 'mood';
  const thoughtEmoji = fills[worstKey] > 65 ? '😺' : (THOUGHT_EMOJIS[worstKey] || '😿');

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

  const spawnHearts = useCallback((n = 3, baseX = 100) => {
    const hs = Array.from({ length: n }, () => ({
      id: ++heartId.current,
      x:  baseX + Math.random() * 120,
      y:  '38%',
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

  const handleMinigameComplete = useCallback((earnedCoins, xpGain) => {
    setCoins(c => c + earnedCoins);
    applyXP(xpGain);
    afterAction('minigameWins');
    playSound('coin');
    showToast(`🎉 +${earnedCoins}🪙 +${xpGain}XP`);
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
    if (showGif) return;
    setShowGif(true);
    clearTimeout(gifTimer.current);
    gifTimer.current = setTimeout(() => setShowGif(false), 3000);
  }, [showGif]);

  const handlePawClick = useCallback((dest) => {
    if (dest === 'home')  { setScreen('home'); setActionDone(false); setActiveNav('home'); return; }
    if (dest === 'shop')  { setScreen('shop'); setActiveNav('shop'); return; }
    setScreen(dest); setActionDone(false); setShowGif(false);
  }, []);

  // ─────────────────────── RENDER ───────────────────────

  // Mini-games
  if (screen === 'minigame_catch') return (
    <CatchGameScreen level={level} onComplete={handleMinigameComplete} onBack={() => setScreen('kitchen')}/>
  );
  if (screen === 'minigame_memory') return (
    <MemoryGameScreen level={level} onComplete={handleMinigameComplete} onBack={() => setScreen('yard')}/>
  );

  // Shop
  if (screen === 'shop') return (
    <div style={{ width:'100%', height:'100%', position:'relative', overflow:'hidden' }}>
      <ShopScreen
        coins={coins} inventory={inventory} equipped={equipped} achievements={achievements}
        onBuy={handleShopBuy} onEquip={handleShopEquip}
        onBack={() => { setScreen('home'); setActiveNav('home'); }}/>
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

  // Kitchen screen
  if (screen === 'kitchen') return (
    <div style={{ width:'100%', height:'100%', position:'relative', overflow:'hidden' }}>
      <KitchenScreen
        inventory={inventory} coins={coins} level={level}
        fills={fills} isCrit={isCrit}
        activeNav={activeNav} setActiveNav={setActiveNav}
        onPawClick={handlePawClick}
        hearts={hearts} removeHeart={removeHeart}
        thoughtEmoji={thoughtEmoji}
        onFeed={handleFeed}
        onMinigame={() => setScreen('minigame_catch')}
        onBack={() => { setScreen('home'); setActiveNav('home'); }}/>
      {toast && <Toast key={toastKey} msg={toast}/>}
      {complaint && <ComplaintOverlay text={complaint} onClose={() => setComplaint(null)}/>}
    </div>
  );

  // Yard screen
  if (screen === 'yard') return (
    <div style={{ width:'100%', height:'100%', position:'relative', overflow:'hidden' }}>
      <YardScreen
        inventory={inventory}
        fills={fills} isCrit={isCrit}
        activeNav={activeNav} setActiveNav={setActiveNav}
        onPawClick={handlePawClick}
        hearts={hearts} removeHeart={removeHeart}
        thoughtEmoji={thoughtEmoji}
        onUseToy={handleUseToy}
        onMinigame={() => setScreen('minigame_memory')}
        onBack={() => { setScreen('home'); setActiveNav('home'); }}/>
      {toast && <Toast key={toastKey} msg={toast}/>}
      {complaint && <ComplaintOverlay text={complaint} onClose={() => setComplaint(null)}/>}
    </div>
  );

  // Generic room screens (bathroom, rest, clinic)
  const ROOM_CONFIGS = {
    bathroom: { RoomComp: BathroomRoom, catX: 60,  catFacing: 1, name: '🚿 Ванная',   emoji:'🚿', label:'Убраться',  color:'blue',   changes:{ toilet:-24, mood:3 },  xp:5,  base:5,  roomKey:'bathroomCount' },
    rest:     { RoomComp: RestRoom,     catX: 100, catFacing: 1, name: '🛏️ Спальня',  emoji:'😴', label:'Поспать',   color:'purple', changes:{ fatigue:-38, mood:5 }, xp:8,  base:8,  roomKey:'sleepCount'    },
    clinic:   { RoomComp: ClinicRoom,   catX: 115, catFacing: 1, name: '🏥 Клиника',  emoji:'💉', label:'Лечиться',  color:'teal',   changes:{ health:30 },           xp:15, base:5,  roomKey:'clinicCount'   },
  };
  const roomCfg = ROOM_CONFIGS[screen];
  if (roomCfg) return (
    <div style={{ width:'100%', height:'100%', position:'relative', overflow:'hidden', background:'#3a2010' }}>
      <LocationScreen
        screen={screen}
        onBack={() => { setScreen('home'); setActiveNav('home'); setActionDone(false); }}
        onAction={() => handleRoomAction(roomCfg.changes, roomCfg.xp, roomCfg.base, roomCfg.roomKey)}
        actionDone={actionDone}
        catX={roomCfg.catX} catFacing={roomCfg.catFacing}
        RoomComp={roomCfg.RoomComp}
        actionEmoji={roomCfg.emoji} actionLabel={roomCfg.label} actionColor={roomCfg.color}
        locationName={roomCfg.name}
        fills={fills} isCrit={isCrit}
        activeNav={activeNav} setActiveNav={setActiveNav}
        onPawClick={handlePawClick}
        hearts={hearts} removeHeart={removeHeart}
        thoughtEmoji={thoughtEmoji}/>
      {toast && <Toast key={toastKey} msg={toast}/>}
      {complaint && <ComplaintOverlay text={complaint} onClose={() => setComplaint(null)}/>}
    </div>
  );

  // ── HOME SCREEN ──
  const PANEL_H = 192;
  return (
    <div style={{ width:'100%', height:'100%', position:'relative', overflow:'hidden', background:'#3a2010', fontFamily:"'Nunito',sans-serif" }}>
      {/* Room background */}
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:PANEL_H-30, overflow:'hidden' }}>
        <HomeRoom/>
      </div>

      {/* Floating hearts */}
      {hearts.map(h => <FloatingHeart key={h.id} id={h.id} x={h.x} y={h.y} onDone={() => removeHeart(h.id)}/>)}

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
            <button onClick={() => { setScreen('shop'); setActiveNav('shop'); }} style={{ width:38, height:38, borderRadius:12, background:'rgba(20,8,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.45)', cursor:'pointer', fontSize:18, border:'1.5px solid rgba(255,255,255,0.12)' }}>🛒</button>
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

      {/* Walking / tapped cat */}
      <div onClick={handleCatClick}
           style={{ position:'absolute', zIndex:15, bottom: PANEL_H + 24, left: catX, width:130, cursor:'pointer', transition: showGif ? 'left 0.25s ease-out' : 'none' }}>
        <div style={{ transform:`scaleX(${catFacing})`, transformOrigin:'center', filter:'drop-shadow(0 8px 22px rgba(0,0,0,0.65))', animation: showGif ? 'none' : 'catWalkBob 0.48s ease-in-out infinite', position:'relative' }}>
          <img src={CAT} alt="кот" style={{ width:'100%', display:'block', userSelect:'none', pointerEvents:'none', opacity: showGif ? 0 : 1, transition:'opacity 0.2s' }} draggable="false"/>
          {showGif && (
            <img src={GIF} alt="анимация"
                 style={{ position:'absolute', inset:0, width:'100%', display:'block', userSelect:'none', pointerEvents:'none' }}
                 draggable="false"/>
          )}
        </div>
      </div>

      {/* Accessory overlays */}
      {equipped.hat && (
        <div style={{ position:'absolute', zIndex:16, bottom: PANEL_H + 24 + 115, left: catX + (catFacing === 1 ? 40 : 20), fontSize:28, pointerEvents:'none', transition:'left 0.1s linear' }}>
          {ACC_ITEMS.find(a => a.id === equipped.hat)?.emoji || ''}
        </div>
      )}

      {/* Bottom panel */}
      <BottomPanel fills={fills} isCrit={isCrit} onPawClick={handlePawClick} activeNav={activeNav} setActiveNav={setActiveNav}
        canClaimDaily={showDailyModal || (dailyMissions.missions || []).some(m => m.completed && !m.claimed)}/>

      {/* Toast */}
      {toast && <Toast key={toastKey} msg={toast}/>}

      {/* Achievement toast banner */}
      {achToast && <AchievementToastBanner achievement={achToast} onDone={() => setAchToast(null)}/>}

      {/* Modals */}
      {showDailyModal && <DailyRewardModal streak={pendingStreak} onClaim={handleClaimDaily}/>}
      {levelUpModal   && <LevelUpModal     level={levelUpModal}  onClose={() => setLevelUpModal(null)}/>}
      {complaint      && <ComplaintOverlay text={complaint}       onClose={() => setComplaint(null)}/>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
