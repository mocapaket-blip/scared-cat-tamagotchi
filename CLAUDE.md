# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Проект: Scared Cat Tamagotchi v1.1.0

Telegram Mini App (TMA) — игра-симулятор кота с системой доверия и TON-интеграцией.  
**Стек**: React 18 (CDN, без bundler) + Babel Standalone + Web Audio API + TonConnect.  
**Нет build-процесса** — правишь файлы, обновляешь `?v=` в `index.html`, пушишь.

### Файлы и размеры (актуально)
| Файл | Строк | Роль |
|---|---|---|
| `js/app.js` | ~5541 | Все React компоненты + вся игровая логика |
| `js/config.js` | ~708 | Константы, данные магазина, звуковая система |
| `js/engine.js` | ~200 | Расчёт деградации статов (applyDecay) |
| `css/main.css` | ~420 | Стили + keyframe анимации |
| `index.html` | 32 | Точка входа, cache-bust версии |

### Cache-busting (ВСЕГДА обновлять при изменениях)
```html
<!-- index.html — все 4 тега -->
css/main.css?v=20260501a
js/config.js?v=20260501a
js/engine.js?v=20260501a
js/app.js?v=20260501a
```
Формат: `YYYYMMDD` + буква (`a`, `b`, …). Текущая: `v=20260501a`.

### Deploy
```bash
git add css/main.css index.html js/app.js js/config.js
git commit -m "vX.X.X — описание"
git push origin main
# GitHub Pages деплоит автоматически
```

---

## Карта app.js (строки)

### Утилиты и системные функции (1–300)
| Строка | Что |
|---|---|
| 7 | `APP_VERSION = '1.1.0'` |
| 10 | `TRUST_STAGES` — массив 10 этапов доверия (lv 1–50) |
| 33 | `getTrustStage(lv)` |
| 38 | `trustPointsNeeded(lv)` = 30 + lv*4 |
| 40 | `trustLevelFromPoints(pts)` |
| 51 | `trustProgress(pts)` → `{lv, pct, curPts, needed}` |
| 63 | `ORDER_TYPES` — типы фриланс-заказов |
| 148 | `scaredIcon(lvl)` → `{emoji, label, color, pulse}` |
| 157 | `fearMult(lvl)` = 1 − (lvl/100)*0.70 |
| 160 | `scaredBlock(lvl, action)` → `null` или строка блокировки |
| 250 | `BACKEND_URL` |
| 254 | `syncBackend(stats, level)` |

### Мини-игры
| Строка | Что |
|---|---|
| 300 | `CatchGameScreen` — лови еду |
| 601 | `MemoryGameScreen` — карточки |

### ShopScreen (744)
```
744  ShopScreen({ coins, inventory, equipped, achievements, onBuy, onEquip,
               onBack, ownedDecor, ownedBgs, roomLayout, onBuyDecor,
               onBuyBg, onSetBg, initialTab })
  785  tab: room — фоны + декор
  843  tab: acc — аксессуары
  871  tab: med — секции "Лекарства" (MED_ITEMS) + "Успокоительные" (CALM_TREATS)
  937  tab: food/toys — общий рендер
```

### UI-компоненты (978–2055)
| Строка | Компонент |
|---|---|
| 978 | `DailyRewardModal` |
| 1032 | `LevelUpModal` |
| 1055 | `Toast` |
| 1066 | `ThoughtBubble` |
| 1090 | `PawIndicator` — иконка + заполнение + `.paw-icon-inner` |
| 1139 | `FloatingHeart` |
| 1152 | `NavItem` |
| 1172 | `TimezoneModal` |
| 1224 | `FreelanceScreen` |
| 1505 | `ScaredModal` — пошаговое руководство по успокоению |
| 1654 | `SettingsModal` — слайдеры музыки/SFX + синхронизация |
| 1820 | `TrustModal` — прогресс доверия |
| 2019 | `BottomPanel` — нижняя навигация |

### Комнаты-SVG (2057–2843)
| Строка | Компонент |
|---|---|
| 2057 | `HomeRoom` |
| 2182 | `KitchenRoom({ onFoodBowlClick, onWaterBowlClick, foodCooldown, waterCooldown })` |
| 2358 | `BathroomRoom` |
| 2472 | `RestRoom` |
| 2583 | `YardRoom` |
| 2695 | `ClinicRoom` |

### Меню для кухни и клиники (2847–3210)
| Строка | Компонент |
|---|---|
| 2847 | `Hotspot` — интерактивный объект в комнате |
| 2883 | `ClinicMedMenu({ inventory, onUseMed, onGoShop, onClose })` |
| 2984 | `ROOM_DEFS` — конфиг всех 5 комнат |
| 3047 | `FoodBowlMenu({ inventory, onFeedItem, onGoShop, onClose })` |
| 3144 | `WaterBowlMenu({ onDrink, onClose })` |

### RoomScreen (3214)
```
RoomScreen({ roomId, fills, isCrit, activeNav, setActiveNav, onPawClick,
             hearts, removeHeart, inventory, stats, level, cooldowns,
             onObjectAction, onMinigame, onBack, activeNFT,
             onKitchenFeed, onKitchenDrink, onUseMed, onGoShop })

  State: foodMenuOpen, waterMenuOpen, clinicMenuOpen
         catLeft, catFacing, catWalking, catThought, particles

  3200  handleTap(obj) — cabinet → clinicMenuOpen=true
  3242  handleKitchenFeedItem(item) — walk + onKitchenFeed
  3251  handleKitchenDrinkAction() — walk + onKitchenDrink
  3260  handleClinicMedUse(medItem) — walk + onUseMed
```

### Вспомогательные экраны (3432+)
| Строка | Что |
|---|---|
| 3435 | `ComplaintOverlay` |
| 3453 | `ReturnModal` |
| 3532 | `DraggableRoomItem` |
| 3593 | `RoomEditPanel` |
| 3638 | `AchievementToastBanner` |
| 3656 | `MissionCard` |
| 3684 | `AchievementCard` |
| 3702 | `StatsView` |
| 3731 | `AchievementsScreen` |
| 3819 | `NFTSkinScreen` |
| 4002 | `ScaredCatSVG({ emotion, jumping })` — SVG-кот |

### App() — главный компонент (4129)
**State (localStorage key `scared_cat_v3`)**:
```
stats: { hunger, fatigue, toilet, mood, health }  // 0–100
scaredLvl: 0–100
coins, level, xp (→ totalXP)
trustPoints
inventory: { food_basic, food_tasty, food_premium,
             med_basic, med_drops, med_premium, med_spray,
             treat_mint, treat_valerian, treat_fish,
             toy_ball, toy_feather, toy_laser }
equipped: { hat, neck, eyes }
cooldowns: { [roomId_objId]: timestamp, minigame: timestamp }
dailyStreak, lastDaily
actionCounts: { feedCount, bathroomCount, sleepCount, playCount,
                clinicCount, toyCount, premiumFed, minigameWins,
                buyCount, equipCount, maxStreak }
achievements: { [ach_id]: true }
dailyMissions: { date, missions[] }
roomLayout: { bg, items[] }
ownedDecor: { [ri_id]: true }
ownedBgs: [bg_id, ...]
freelance: { active, completedOrder, urgentOffer }
```

**Ключевые refs**:
```
nftBonusRef.current = { decayMult, earnMult }  // NFT бонус
lastBadCheckRef.current = timestamp             // таймер 30-мин страха
allCritSinceRef.current = bool                  // все статы плохие
walkRef.current = { x, dir }                    // позиция кота на home
gifTimer.current                                // таймер анимации
```

### Handlers в App() (строки)
| Строка | Handler | Что делает |
|---|---|---|
| 4579 | `handleTakeOrder` | Принять фриланс-заказ |
| 4592 | `handleBoost` | Ускорить заказ (−30 мин) |
| 4610 | `handleClaimOrder` | Получить награду заказа |
| 4623 | `handleFeed(item)` | Кормление с home screen (из инвентаря) |
| 4651 | `handleUseToy(item)` | Использовать игрушку |
| 4675 | `handleRoomAction(statChanges, xp, coins, roomKey)` | Действие в комнате + scaredBlock |
| 4764 | `handleConnectWallet` | TON Connect |
| 4856 | `handleSelectNFT(nft)` | Активировать NFT скин |
| 4870 | `handleTapObject({...})` | Результат тапа в комнате (колбэк из RoomScreen) |
| 4897 | `handleUseMed(medItem)` | Использовать лекарство (из ClinicMedMenu) |
| 4919 | `handleMinigameComplete` | Завершить мини-игру (кап 50 монет / 10 XP) |
| 4938 | `handleMinigameStart` | Запустить мини-игру (проверяет кулдаун 2.5ч) |
| 4951 | `handleShopBuy(item)` | Купить предмет в магазине |
| 4966 | `handleKitchenFeed(item, cdKey, ms)` | Покормить из FoodBowlMenu (звук crunch/pour) |
| 4997 | `handleKitchenDrink()` | Попоить из WaterBowlMenu (звук drink) |
| 5013 | `handleGiveTreat(treat)` | Дать успокоительное лакомство (звук treat) |
| 5028 | `handleShopEquip(item)` | Надеть/снять аксессуар |
| 5039 | `handleClaimMission(mission)` | Получить награду миссии |
| 5049 | `handleClaimDaily()` | Ежедневная награда |
| 5066 | `handleCatClick()` | Клик по коту (−8 страх, +2 trust, анимация) |
| 5083 | `handlePawClick(dest)` | Навигация по лапкам |
| 5090 | `handleClaimReturn()` | Закрыть ReturnModal |
| 5098 | `handleBuyDecor` / `handleBuyBg` / `handleSetBg` | Декор комнаты |

---

## Карта config.js (строки)

| Строка | Что |
|---|---|
| 1 | `SAVE_KEY = 'scared_cat_v3'` |
| 18 | `RATES: { hunger:0.163, fatigue:0.092, toilet:0.107, mood:-0.143 }` |
| 24 | `HEALTH_RATE_NORMAL = -0.047` / `HEALTH_RATE_CRISIS = -0.12` |
| 32 | `LEVEL_XP[]` — XP для 20 уровней |
| 91 | `FOOD_ITEMS[]` — 3 еды (food_basic, food_tasty, food_premium) |
| 110 | `TOY_ITEMS[]` — 3 игрушки (toy_ball, toy_feather, toy_laser) |
| 129 | `MED_ITEMS[]` — 4 лекарства (med_basic, med_drops, med_premium, med_spray) |
| 145 | `CALM_TREATS[]` — 3 угощения (treat_mint, treat_valerian, treat_fish) |
| 160 | `ACC_ITEMS[]` — 5 аксессуаров |
| 173 | `ACTION_XP` |
| 182 | `PAW_CONFIG[]` — 5 комнат |
| 374 | **Звуковая система** — Web Audio API |
| 402 | `getAudioCtx()` |
| 412 | `_note(ctx, freq, start, dur, vol, type)` |
| 423 | `_musicNote(...)` |
| 437 | `_scheduleMusicLoop(...)` |
| 454 | `startMusic()` / `stopMusic()` |
| 487 | `playSound(type)` — все звуки |
| 604 | `calcReturnBonus()` → всегда `{coins:0, xp:0}` |
| 609 | `CAT_STATES` — 11 состояний кота |
| 623 | `getCatState(stats, level)` |
| 651 | `ROOM_ITEMS[]` — 12 декор-предметов |
| 666 | `BG_OVERLAYS[]` — 5 фонов |

### Все типы звуков `playSound(type)`
| Тип | Когда использовать |
|---|---|
| `'crunch'` | Кот ест сухой корм (кибблы) |
| `'drink'` | Кот пьёт воду |
| `'pour'` | Кот ест мягкую/влажную еду |
| `'feed'` | Общее кормление с home screen |
| `'treat'` | Дают успокоительное лакомство |
| `'pet'` | Поглаживание кота |
| `'wash'` | Купание |
| `'toilet'` | Лоток |
| `'med'` | Лечение |
| `'toy'` | Игрушка |
| `'action'` | Обычное действие в комнате |
| `'tap'` | Лёгкий тап/нажатие |
| `'buy'` | Покупка в магазине |
| `'coin'` | Получение монет |
| `'levelup'` | Повышение уровня |
| `'achievement'` | Достижение |
| `'daily'` | Ежедневная награда |
| `'mission'` | Выполнение миссии |

### scaredBlock — таблица блокировок
| Action | Порог |
|---|---|
| `'eat'` | ≥85 |
| `'drink'` | ≥85 |
| `'sleep'` | ≥85 |
| `'play'` | ≥85 |
| `'toilet'` | ≥70 |
| `'bath'` | ≥70 |
| `'medicine'` | ≥65 |

---

## Правила (без исключений)

**Нельзя:**
- Добавлять NPM-зависимости — React через CDN, bundler отсутствует
- Использовать `import/export` в фронтенд-коде
- Переписывать app.js целиком — только инкрементальные правки
- Трогать Telegram expand/disableVerticalSwipes в index.html
- Добавлять `var`, jQuery, устаревшие API

**Обязательно:**
- Обновлять `?v=` версию в `index.html` при каждом изменении JS/CSS
- React-хуки через деструктуризацию: `const { useState } = React;`  
  (или `React.useState` напрямую — в этом проекте используется второй вариант)
- Проверять `window.Telegram?.WebApp` перед использованием TMA API
- Центровка кота: `catDefaultX = 'calc(50% - 65px)'` (ширина кота = 130px)

**При изменении данных:**
- `MED_ITEMS` / `CALM_TREATS` / `FOOD_ITEMS` — только в `config.js`
- Новый предмет → автоматически доступен в `handleShopBuy` (добавляет в `inventory`)
- Новый звук → добавить `case` в `playSound()` в `config.js`

---

## ROOM_DEFS — быстрая справка

```js
// Все catDefaultX = 'calc(50% - 65px)'  ← кот по центру
kitchen:  { RoomComp: KitchenRoom,  bgColor:'#3a2008', roomName:'🍔 Голод',
            minigameScreen:'minigame_catch', minigameLabel:'🎯 Поймай еду',
            objects: [ cat_k (isCatTap) ] }

bathroom: { RoomComp: BathroomRoom, bgColor:'#0a1f3a', roomName:'🚿 Гигиена',
            objects: [ bathtub (cooldown 8min), litter (4min), cat_b ] }

rest:     { RoomComp: RestRoom,     bgColor:'#0e0820', roomName:'🛏️ Сон',
            objects: [ bed (10min), curtain (20min), cat_r ] }

yard:     { RoomComp: YardRoom,     bgColor:'#082010', roomName:'🎮 Настроение',
            minigameScreen:'minigame_memory', minigameLabel:'🧩 Карточки',
            objects: [ ball (3min), yarn (3min), cat_y ] }

clinic:   { RoomComp: ClinicRoom,   bgColor:'#081828', roomName:'🏥 Здоровье',
            objects: [ cabinet (→ClinicMedMenu), cat_cl ] }
```

---

## Паттерны для частых задач

### Добавить новый предмет в магазин
1. `config.js` — добавить объект в нужный массив (`FOOD_ITEMS` / `MED_ITEMS` / `CALM_TREATS` / `TOY_ITEMS`)
2. Поля: `{ id, emoji, name, desc, cost, ...stat effects, xp }`
3. Готово — `handleShopBuy` и `ShopScreen` подхватят автоматически

### Добавить новый звук
1. `config.js` → `playSound()` → добавить `case 'name':` с `_note(...)` вызовами
2. Вызывать: `playSound('name')`

### Добавить новое действие в комнате
1. Добавить объект в `ROOM_DEFS[roomId].objects`
2. Поля: `{ id, emoji, label, posX, posY, catTargetX, thought, cooldownMin, isCatTap, getEffect }`
3. `getEffect(inventory, stats)` → `{ ok, delta, xp, particles, msg, actionKey, useItem }`

### Добавить новый обработчик
1. Добавить `const handleXxx = useCallback(...)` в `App()` (~строка 4579+)
2. Передать как проп в нужный компонент в JSX (строка ~5200+)

---

## Механика страха (scaredLvl)

| Уровень | Состояние | Блокировки |
|---|---|---|
| 0–29 | 😺 Спокойный | Нет |
| 30–49 | 😿 Немного грустный | Нет |
| 50–69 | 🙀 Испуганный | Нет (эффекты хуже через fearMult) |
| 70–84 | 😱 Очень напуган | toilet, bath |
| 85–100 | 💀 Паника! | eat, drink, sleep, play, toilet, bath, medicine |

**Как снизить страх:**
- `handleCatClick` → −8 (поглаживание)
- `handleGiveTreat(treat)` → −15/−18/−25 (лакомство)
- `handleMinigameComplete` → −3
- `handleClaimDaily` → −4
- `handleKitchenFeed` → −0.5
- `handleUseToy` / `handleKitchenDrink` → −1/−0.3

На home screen при `scaredLvl ≥ 70` появляются кнопки быстрого успокоения.

---

## Полезные скиллы

- `/frontend-design:frontend-design` — UI/UX компоненты
- `/simplify` — оптимизация кода (полезен для app.js)
- `/anthropic-skills:telegram-mini-app` — TMA функционал
