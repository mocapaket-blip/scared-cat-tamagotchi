/* ===================================================
   Котик-Тамагочи — основная игровая логика
   =================================================== */

// ──────────────────────────────────────────────────
// Константы
// ──────────────────────────────────────────────────

const STORAGE_KEY = 'scared_cat_v1';

// Скорость изменения параметров в минуту (бодрствование)
const DECAY = {
  hunger:    0.14,   // +0.14%/мин → 100% за ~12 ч
  tiredness: 0.09,   // +0.09%/мин → 100% за ~18 ч
  toilet:    0.07,   // +0.07%/мин → 100% за ~24 ч
  mood:     -0.05,   // -0.05%/мин → 0%  за ~33 ч
};

// Скорость изменения во сне
const SLEEP_DECAY = {
  hunger:    0.04,
  tiredness: -0.28,  // отрицательное = восстановление
  toilet:    0.04,
  mood:      0,
};

// Эффекты действий
const ACTIONS = {
  feed_fish:    { hunger: -20, mood:  0 },
  feed_meal:    { hunger: -50, mood:  0 },
  feed_treat:   { hunger: -10, mood: 15 },
  toilet:       { toilet: -90, mood:  5 },
  play_ball:    { mood:   20,  tiredness: 8 },
  play_laser:   { mood:   28,  tiredness: 12 },
  play_cuddle:  { mood:   15,  tiredness: 3 },
};

// Порог «критично» (%)
const CRITICAL = 78;
const MOOD_CRITICAL = 22;

// Сколько часов без присмотра → кот заболеет
const SICK_THRESHOLD_HOURS = 3;

// ──────────────────────────────────────────────────
// Состояние игры
// ──────────────────────────────────────────────────

function defaultState() {
  return {
    hunger:    5,
    tiredness: 5,
    toilet:    5,
    mood:      95,
    isSleeping: false,
    sickSince:  null,
    isSick:     false,
    lastUpdate: Date.now(),
    createdAt:  Date.now(),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Game.state));
}

// ──────────────────────────────────────────────────
// Расчёт времени оффлайн
// ──────────────────────────────────────────────────

function applyTimeDelta(state, minutes) {
  if (minutes <= 0) return;
  const rates = state.isSleeping ? SLEEP_DECAY : DECAY;

  state.hunger    = clamp(state.hunger    + rates.hunger    * minutes, 0, 100);
  state.tiredness = clamp(state.tiredness + rates.tiredness * minutes, 0, 100);
  state.toilet    = clamp(state.toilet    + rates.toilet    * minutes, 0, 100);
  state.mood      = clamp(state.mood      + rates.mood      * minutes, 0, 100);

  // Больной: если критично по двум параметрам дольше SICK_THRESHOLD_HOURS
  const criticalCount =
    (state.hunger    >= CRITICAL ? 1 : 0) +
    (state.tiredness >= CRITICAL ? 1 : 0) +
    (state.toilet    >= CRITICAL ? 1 : 0) +
    (state.mood      <= MOOD_CRITICAL ? 1 : 0);

  if (criticalCount >= 2) {
    if (!state.sickSince) state.sickSince = Date.now() - minutes * 60 * 1000;
    const sickHours = (Date.now() - state.sickSince) / 3600000;
    if (sickHours >= SICK_THRESHOLD_HOURS) state.isSick = true;
  } else {
    state.sickSince = null;
    if (criticalCount === 0) state.isSick = false;
  }
}

// ──────────────────────────────────────────────────
// Определение состояния кота
// ──────────────────────────────────────────────────

function getCatState(state) {
  if (state.isSick)                      return 'sick';
  if (state.isSleeping)                  return 'sleeping';
  if (state.toilet    >= CRITICAL)       return 'toilet';
  if (state.hunger    >= CRITICAL)       return 'hungry';
  if (state.tiredness >= CRITICAL)       return 'sleepy';
  if (state.mood      <= MOOD_CRITICAL)  return 'sad';
  if (state.mood      >= 70)             return 'happy';
  return 'normal';
}

// ──────────────────────────────────────────────────
// Что говорит кот
// ──────────────────────────────────────────────────

const CAT_PHRASES = {
  sick:     ['Мне плохо... 🤒', 'Вызови ветеринара...', 'Всё болит... 😿'],
  sleeping: ['Zzzz...', 'Не буди меня... 😴', '...♪'],
  toilet:   ['Срочно! 🚽', 'Ну пожалуйста!!!', 'Не могу терпеть!'],
  hungry:   ['Хочу кушать!', 'Мяу! Дай рыбку 🐟', 'Голодный котик...'],
  sleepy:   ['Спать хочу... 😴', 'Ещё пять минут...', 'Клюю носом... zz'],
  sad:      ['Поиграй со мной 🥺', 'Скучно...', 'Обними меня!'],
  happy:    ['Муррр! 😸', 'Всё отлично!', 'Ты лучший хозяин!'],
  normal:   ['Мяу~', 'Всё норм.', '...'],
};

function getPhrase(catState) {
  const list = CAT_PHRASES[catState] || CAT_PHRASES.normal;
  return list[Math.floor(Math.random() * list.length)];
}

// ──────────────────────────────────────────────────
// Жалобы при возвращении
// ──────────────────────────────────────────────────

function buildComplaint(state, minutesAway) {
  if (minutesAway < 30) return null;

  const hours = Math.round(minutesAway / 60);
  const issues = [];

  if (state.hunger    >= 60) issues.push(`голодаю (${Math.round(state.hunger)}%)`);
  if (state.toilet    >= 60) issues.push(`хочу в туалет (${Math.round(state.toilet)}%)`);
  if (state.mood      <= 40) issues.push(`скучаю (настроение ${Math.round(state.mood)}%)`);
  if (state.tiredness >= 60) issues.push(`устал (${Math.round(state.tiredness)}%)`);

  let text = '';
  if (minutesAway < 120) {
    text = `Ты где пропал? Меня не было ${hours} ч!`;
  } else if (minutesAway < 360) {
    text = `Ты отсутствовал ${hours} ч! Мне было одиноко...`;
  } else if (minutesAway < 720) {
    text = `Ты бросил меня на ${hours} часов! 😿`;
  } else {
    text = `${Math.round(minutesAway / 60)} часов без тебя! Я чуть не умер от тоски! 😭`;
  }

  if (issues.length > 0) {
    text += '\n\nПока тебя не было:\n• ' + issues.join('\n• ');
  }

  return text;
}

// ──────────────────────────────────────────────────
// Утилиты
// ──────────────────────────────────────────────────

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function ageText(ms) {
  const days = Math.floor(ms / 86400000);
  if (days === 0) return 'Первый день';
  const forms = ['день', 'дня', 'дней'];
  const n = days % 100;
  if (n >= 11 && n <= 19) return `${days} ${forms[2]}`;
  switch (days % 10) {
    case 1: return `${days} ${forms[0]}`;
    case 2: case 3: case 4: return `${days} ${forms[1]}`;
    default: return `${days} ${forms[2]}`;
  }
}

// ──────────────────────────────────────────────────
// Основной объект игры
// ──────────────────────────────────────────────────

const Game = {
  state: null,
  loopTimer: null,
  speechTimer: null,
  currentCatState: null,

  // ── Инициализация ─────────────────────────────
  init() {
    // Telegram Web App
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.expand();
      tg.ready();
      if (tg.colorScheme === 'light') document.body.classList.add('theme-light');
    }

    const saved = loadState();
    const now = Date.now();

    if (saved) {
      this.state = saved;
      const minutesAway = (now - saved.lastUpdate) / 60000;

      // Обновляем параметры за прошедшее время
      applyTimeDelta(this.state, minutesAway);
      this.state.lastUpdate = now;
      saveState();

      // Показываем жалобу если долго не заходили
      const complaint = buildComplaint(this.state, minutesAway);
      if (complaint) this.showComplaint(complaint);
    } else {
      this.state = defaultState();
      saveState();
    }

    this.render();
    this.startLoop();
  },

  // ── Игровой цикл ──────────────────────────────
  startLoop() {
    if (this.loopTimer) clearInterval(this.loopTimer);
    this.loopTimer = setInterval(() => this.tick(), 10000); // каждые 10 сек
  },

  tick() {
    applyTimeDelta(this.state, 10 / 60); // 10 секунд в минутах
    this.state.lastUpdate = Date.now();
    saveState();
    this.render();
  },

  // ── Рендер ────────────────────────────────────
  render() {
    const s = this.state;
    const catState = getCatState(s);
    const stateChanged = catState !== this.currentCatState;
    this.currentCatState = catState;

    // Картинка кота
    const container = document.getElementById('cat-image-container');
    if (stateChanged) {
      container.innerHTML = CAT_SVGS[catState] || CAT_SVGS.normal;
      container.classList.remove('cat-bounce', 'cat-shake', 'cat-float');
      void container.offsetWidth; // reflow
      if (catState === 'happy') {
        container.classList.add('cat-float');
      } else if (catState === 'sick' || catState === 'sad') {
        container.classList.add('cat-shake');
      } else {
        container.classList.add('cat-bounce');
      }
    }

    // Статус-бейдж
    const badge = document.getElementById('cat-status-badge');
    const labels = {
      sick:     '🤒 Больной',
      sleeping: '😴 Спит',
      toilet:   '🚽 Терпит',
      hungry:   '😿 Голодный',
      sleepy:   '😪 Устал',
      sad:      '😞 Грустный',
      happy:    '😸 Счастливый',
      normal:   '😐 Обычный',
    };
    badge.textContent = labels[catState] || '😐 Обычный';
    badge.className = 'status-badge status-' + catState;

    // Возраст
    document.getElementById('cat-age-display').textContent =
      ageText(Date.now() - s.createdAt);

    // Полоски (голод/туалет/усталость: больше = хуже)
    this.setBar('hunger',    s.hunger);
    this.setBar('tiredness', s.tiredness);
    this.setBar('toilet',    s.toilet);
    // Настроение: больше = лучше, отображаем как есть
    this.setBar('mood', s.mood, true);

    // Кнопка сна
    const sleepLabel = document.getElementById('sleep-label');
    const sleepBtn   = document.getElementById('sleep-btn');
    if (s.isSleeping) {
      sleepLabel.textContent = 'Разбудить';
      sleepBtn.style.background = 'linear-gradient(135deg,#FFA500,#FF6B00)';
    } else {
      sleepLabel.textContent = 'Спать';
      sleepBtn.style.background = '';
    }

    // Речевой пузырь (периодически)
    this.maybeShowSpeech(catState);
  },

  setBar(id, value, inverse = false) {
    const bar = document.getElementById(id + '-bar');
    const num = document.getElementById(id + '-num');
    if (!bar || !num) return;

    const pct = Math.round(value);
    bar.style.width = pct + '%';
    num.textContent = pct + '%';

    // Критичная подсветка
    const row = bar.closest('.stat-row');
    if (!inverse && value >= CRITICAL) {
      row?.classList.add('critical');
    } else if (inverse && value <= MOOD_CRITICAL) {
      row?.classList.add('critical');
    } else {
      row?.classList.remove('critical');
    }
  },

  // ── Речевой пузырь ────────────────────────────
  maybeShowSpeech(catState) {
    if (this.speechTimer) return;
    this.speechTimer = setTimeout(() => {
      this.speechTimer = null;
      const bubble = document.getElementById('speech-bubble');
      const text   = document.getElementById('speech-text');
      text.textContent = getPhrase(catState);
      bubble.classList.remove('hidden');
      setTimeout(() => bubble.classList.add('hidden'), 3000);
    }, 1500 + Math.random() * 4000);
  },

  showSpeech(msg, duration = 3000) {
    if (this.speechTimer) { clearTimeout(this.speechTimer); this.speechTimer = null; }
    const bubble = document.getElementById('speech-bubble');
    const text   = document.getElementById('speech-text');
    text.textContent = msg;
    bubble.classList.remove('hidden');
    setTimeout(() => bubble.classList.add('hidden'), duration);
  },

  // ── Жалоба ────────────────────────────────────
  showComplaint(text) {
    const overlay = document.getElementById('complaint-overlay');
    const catImg  = document.getElementById('complaint-cat-img');
    const textEl  = document.getElementById('complaint-text');

    catImg.innerHTML = CAT_SVGS.sad;
    textEl.textContent = text;
    overlay.classList.remove('hidden');

    document.getElementById('complaint-close').onclick = () => {
      overlay.classList.add('hidden');
    };
  },

  // ── Панели ────────────────────────────────────
  showPanel(name) {
    ['main', 'feed', 'play'].forEach(p => {
      document.getElementById('panel-' + p)?.classList.add('hidden');
    });
    document.getElementById('panel-' + name)?.classList.remove('hidden');
  },

  // ── Действия ──────────────────────────────────
  applyEffect(effect, message) {
    const s = this.state;
    if (s.isSleeping && !effect._allowSleep) {
      this.showSpeech('Кот спит... 😴');
      return;
    }
    for (const [key, delta] of Object.entries(effect)) {
      if (key.startsWith('_')) continue;
      if (key in s) s[key] = clamp(s[key] + delta, 0, 100);
    }
    saveState();
    this.showPanel('main');
    this.render();
    if (message) this.showSpeech(message);

    // Анимация-встряска при действии
    const c = document.getElementById('cat-image-container');
    c.classList.remove('cat-bounce', 'cat-shake');
    void c.offsetWidth;
    c.classList.add('cat-bounce');
  },

  feed(type) {
    const map = {
      fish:  { effect: ACTIONS.feed_fish,  msg: 'Вкусная рыбка! 🐟' },
      meal:  { effect: ACTIONS.feed_meal,  msg: 'Ням-ням! 🍖' },
      treat: { effect: ACTIONS.feed_treat, msg: 'Лакомство! Мурр~ 🍬' },
    };
    const item = map[type];
    if (!item) return;
    if (this.state.hunger <= 5) {
      this.showPanel('main');
      this.showSpeech('Я не голоден! 😌');
      return;
    }
    this.applyEffect(item.effect, item.msg);
  },

  toggleSleep() {
    const s = this.state;
    if (s.isSleeping) {
      s.isSleeping = false;
      saveState();
      this.render();
      this.showSpeech('Доброе утро! 🌅');
    } else {
      if (s.tiredness < 15) {
        this.showSpeech('Я ещё не устал! 😺');
        return;
      }
      s.isSleeping = true;
      saveState();
      this.render();
      this.showSpeech('Спокойной ночи~ 🌙');
    }
  },

  cleanToilet() {
    if (this.state.toilet < 10) {
      this.showSpeech('Мне не надо! 😌');
      return;
    }
    this.applyEffect(ACTIONS.toilet, 'Уф, полегчало! 🚽✨');
  },

  play(type) {
    const s = this.state;
    if (s.isSleeping) { this.showSpeech('Кот спит... 😴'); return; }
    if (s.mood >= 95)  { this.showSpeech('Мне и так хорошо! 😸'); return; }

    const map = {
      ball:   { effect: ACTIONS.play_ball,   msg: 'Гоняю мячик! ⚽' },
      laser:  { effect: ACTIONS.play_laser,  msg: 'Поймаю эту точку! 🔴' },
      cuddle: { effect: ACTIONS.play_cuddle, msg: 'Мурр~ обнимашки! 🤗' },
    };
    const item = map[type];
    if (!item) return;
    this.applyEffect(item.effect, item.msg);
  },
};

// ──────────────────────────────────────────────────
// Запуск
// ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => Game.init());
