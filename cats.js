/* ===================================================
   SVG кошки для каждого состояния
   Оранжевый полосатый кот, 200×230 viewBox
   =================================================== */

const CAT_SVGS = {

  // ─── СЧАСТЛИВЫЙ ──────────────────────────────────
  happy: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg">
  <!-- Хвост (загнут вверх) -->
  <path d="M148 175 C182 158 192 122 174 102 C160 86 145 98 150 114" stroke="#E8956D" stroke-width="13" fill="none" stroke-linecap="round"/>
  <!-- Тело -->
  <ellipse cx="100" cy="178" rx="56" ry="43" fill="#F4A460"/>
  <!-- Голова -->
  <circle cx="100" cy="98" r="52" fill="#F4A460"/>
  <!-- Левое ухо -->
  <polygon points="54,60 36,14 79,51" fill="#F4A460"/>
  <polygon points="56,57 44,22 76,51" fill="#FFB3C1"/>
  <!-- Правое ухо -->
  <polygon points="146,60 164,14 121,51" fill="#F4A460"/>
  <polygon points="144,57 156,22 124,51" fill="#FFB3C1"/>
  <!-- Полоски на голове (табби) -->
  <path d="M82 58 Q100 52 118 58" stroke="#E8956D" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.6"/>
  <path d="M88 50 Q100 45 112 50" stroke="#E8956D" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.5"/>
  <!-- Румянец -->
  <ellipse cx="66" cy="108" rx="14" ry="8" fill="#FFB3C1" opacity="0.35"/>
  <ellipse cx="134" cy="108" rx="14" ry="8" fill="#FFB3C1" opacity="0.35"/>
  <!-- Глаза (открытые, счастливые) -->
  <ellipse cx="72" cy="86" rx="13" ry="14" fill="white"/>
  <ellipse cx="128" cy="86" rx="13" ry="14" fill="white"/>
  <ellipse cx="73" cy="87" rx="8" ry="9" fill="#3A3A3A"/>
  <ellipse cx="129" cy="87" rx="8" ry="9" fill="#3A3A3A"/>
  <circle cx="77" cy="83" r="3" fill="white"/>
  <circle cx="133" cy="83" r="3" fill="white"/>
  <!-- Нос -->
  <polygon points="100,106 95,112 105,112" fill="#FF8FAB"/>
  <!-- Рот (улыбка) -->
  <path d="M87 116 Q100 128 113 116" stroke="#8B5E3C" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <!-- Усы слева -->
  <line x1="30" y1="104" x2="88" y2="108" stroke="#8B5E3C" stroke-width="1.3" opacity="0.6"/>
  <line x1="28" y1="111" x2="88" y2="111" stroke="#8B5E3C" stroke-width="1.3" opacity="0.6"/>
  <line x1="30" y1="118" x2="88" y2="114" stroke="#8B5E3C" stroke-width="1.3" opacity="0.6"/>
  <!-- Усы справа -->
  <line x1="170" y1="104" x2="112" y2="108" stroke="#8B5E3C" stroke-width="1.3" opacity="0.6"/>
  <line x1="172" y1="111" x2="112" y2="111" stroke="#8B5E3C" stroke-width="1.3" opacity="0.6"/>
  <line x1="170" y1="118" x2="112" y2="114" stroke="#8B5E3C" stroke-width="1.3" opacity="0.6"/>
  <!-- Лапки -->
  <ellipse cx="68" cy="213" rx="21" ry="13" fill="#F4A460"/>
  <ellipse cx="132" cy="213" rx="21" ry="13" fill="#F4A460"/>
  <ellipse cx="60" cy="213" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="68" cy="217" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="76" cy="213" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="124" cy="213" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="132" cy="217" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="140" cy="213" rx="6" ry="4" fill="#E8956D"/>
</svg>`,

  // ─── НОРМАЛЬНЫЙ / СПОКОЙНЫЙ ──────────────────────
  normal: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg">
  <!-- Хвост (спокойный) -->
  <path d="M148 178 C172 195 180 215 164 218" stroke="#E8956D" stroke-width="13" fill="none" stroke-linecap="round"/>
  <!-- Тело -->
  <ellipse cx="100" cy="178" rx="56" ry="43" fill="#F4A460"/>
  <!-- Голова -->
  <circle cx="100" cy="98" r="52" fill="#F4A460"/>
  <!-- Левое ухо -->
  <polygon points="54,60 36,14 79,51" fill="#F4A460"/>
  <polygon points="56,57 44,22 76,51" fill="#FFB3C1"/>
  <!-- Правое ухо -->
  <polygon points="146,60 164,14 121,51" fill="#F4A460"/>
  <polygon points="144,57 156,22 124,51" fill="#FFB3C1"/>
  <!-- Полоски -->
  <path d="M82 58 Q100 52 118 58" stroke="#E8956D" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.6"/>
  <!-- Глаза (нейтральные) -->
  <ellipse cx="72" cy="86" rx="12" ry="12" fill="white"/>
  <ellipse cx="128" cy="86" rx="12" ry="12" fill="white"/>
  <ellipse cx="73" cy="87" rx="7" ry="8" fill="#3A3A3A"/>
  <ellipse cx="129" cy="87" rx="7" ry="8" fill="#3A3A3A"/>
  <circle cx="77" cy="83" r="2.5" fill="white"/>
  <circle cx="133" cy="83" r="2.5" fill="white"/>
  <!-- Нос -->
  <polygon points="100,106 95,112 105,112" fill="#FF8FAB"/>
  <!-- Рот (нейтральный) -->
  <path d="M90 116 Q100 120 110 116" stroke="#8B5E3C" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Усы -->
  <line x1="30" y1="104" x2="88" y2="108" stroke="#8B5E3C" stroke-width="1.3" opacity="0.6"/>
  <line x1="28" y1="111" x2="88" y2="111" stroke="#8B5E3C" stroke-width="1.3" opacity="0.6"/>
  <line x1="170" y1="104" x2="112" y2="108" stroke="#8B5E3C" stroke-width="1.3" opacity="0.6"/>
  <line x1="172" y1="111" x2="112" y2="111" stroke="#8B5E3C" stroke-width="1.3" opacity="0.6"/>
  <!-- Лапки -->
  <ellipse cx="68" cy="213" rx="21" ry="13" fill="#F4A460"/>
  <ellipse cx="132" cy="213" rx="21" ry="13" fill="#F4A460"/>
  <ellipse cx="60" cy="213" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="68" cy="217" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="76" cy="213" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="124" cy="213" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="132" cy="217" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="140" cy="213" rx="6" ry="4" fill="#E8956D"/>
</svg>`,

  // ─── ГОЛОДНЫЙ ────────────────────────────────────
  hungry: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg">
  <!-- Хвост (опущен) -->
  <path d="M148 178 C172 195 178 215 162 218" stroke="#E8956D" stroke-width="13" fill="none" stroke-linecap="round"/>
  <!-- Тело -->
  <ellipse cx="100" cy="178" rx="56" ry="43" fill="#F4A460"/>
  <!-- Лапка тянется к миске -->
  <ellipse cx="76" cy="205" rx="16" ry="10" fill="#F4A460" transform="rotate(-20,76,205)"/>
  <!-- Голова -->
  <circle cx="100" cy="98" r="52" fill="#F4A460"/>
  <!-- Левое ухо -->
  <polygon points="54,60 36,14 79,51" fill="#F4A460"/>
  <polygon points="56,57 44,22 76,51" fill="#FFB3C1"/>
  <!-- Правое ухо -->
  <polygon points="146,60 164,14 121,51" fill="#F4A460"/>
  <polygon points="144,57 156,22 124,51" fill="#FFB3C1"/>
  <!-- Глаза (грустные, полузакрытые) -->
  <ellipse cx="72" cy="88" rx="12" ry="11" fill="white"/>
  <ellipse cx="128" cy="88" rx="12" ry="11" fill="white"/>
  <!-- Нависшие веки -->
  <path d="M60 83 Q72 78 84 83" fill="#F4A460"/>
  <path d="M116 83 Q128 78 140 83" fill="#F4A460"/>
  <ellipse cx="73" cy="90" rx="7" ry="7" fill="#3A3A3A"/>
  <ellipse cx="129" cy="90" rx="7" ry="7" fill="#3A3A3A"/>
  <circle cx="77" cy="87" r="2" fill="white"/>
  <circle cx="133" cy="87" r="2" fill="white"/>
  <!-- Слезинка -->
  <path d="M66 102 Q63 108 66 112 Q69 108 66 102" fill="#6BB5FF" opacity="0.8"/>
  <!-- Нос -->
  <polygon points="100,106 95,112 105,112" fill="#FF8FAB"/>
  <!-- Рот (расстроен, открыт) -->
  <path d="M88 118 Q100 112 112 118" stroke="#8B5E3C" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <ellipse cx="100" cy="124" rx="6" ry="4" fill="#C97A5A" opacity="0.5"/>
  <!-- Усы -->
  <line x1="30" y1="106" x2="88" y2="108" stroke="#8B5E3C" stroke-width="1.3" opacity="0.6"/>
  <line x1="28" y1="113" x2="88" y2="113" stroke="#8B5E3C" stroke-width="1.3" opacity="0.6"/>
  <line x1="170" y1="106" x2="112" y2="108" stroke="#8B5E3C" stroke-width="1.3" opacity="0.6"/>
  <line x1="172" y1="113" x2="112" y2="113" stroke="#8B5E3C" stroke-width="1.3" opacity="0.6"/>
  <!-- Пустая миска -->
  <ellipse cx="148" cy="218" rx="20" ry="8" fill="#9CA3AF" opacity="0.6"/>
  <path d="M128 218 Q148 212 168 218" stroke="#6B7280" stroke-width="1.5" fill="none"/>
  <!-- Лапки -->
  <ellipse cx="132" cy="213" rx="21" ry="13" fill="#F4A460"/>
  <ellipse cx="124" cy="213" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="132" cy="217" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="140" cy="213" rx="6" ry="4" fill="#E8956D"/>
</svg>`,

  // ─── СОННЫЙ ──────────────────────────────────────
  sleepy: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg">
  <!-- ZZZ -->
  <text x="142" y="48" font-size="13" fill="#B794F4" font-weight="bold" opacity="0.9">Z</text>
  <text x="154" y="36" font-size="10" fill="#B794F4" font-weight="bold" opacity="0.7">Z</text>
  <text x="163" y="26" font-size="8"  fill="#B794F4" font-weight="bold" opacity="0.5">Z</text>
  <!-- Хвост -->
  <path d="M148 178 C172 195 178 215 162 218" stroke="#E8956D" stroke-width="13" fill="none" stroke-linecap="round"/>
  <!-- Тело (немного осело) -->
  <ellipse cx="100" cy="182" rx="56" ry="40" fill="#F4A460"/>
  <!-- Голова (чуть наклонена) -->
  <circle cx="98" cy="100" r="52" fill="#F4A460"/>
  <!-- Уши (чуть опущены) -->
  <polygon points="52,62 34,18 77,53" fill="#F4A460"/>
  <polygon points="54,59 42,24 74,53" fill="#FFB3C1"/>
  <polygon points="144,62 162,18 119,53" fill="#F4A460"/>
  <polygon points="142,59 154,24 122,53" fill="#FFB3C1"/>
  <!-- Полоски -->
  <path d="M80 58 Q98 52 116 58" stroke="#E8956D" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.6"/>
  <!-- Глаза ЗАКРЫТЫЕ (дуги вниз) -->
  <path d="M59 88 Q71 98 83 88" stroke="#3A3A3A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M115 88 Q127 98 139 88" stroke="#3A3A3A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Нос -->
  <polygon points="98,106 93,112 103,112" fill="#FF8FAB"/>
  <!-- Рот (зевает) -->
  <path d="M87 116 Q98 122 109 116" stroke="#8B5E3C" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Усы -->
  <line x1="30" y1="104" x2="86" y2="108" stroke="#8B5E3C" stroke-width="1.3" opacity="0.5"/>
  <line x1="28" y1="111" x2="86" y2="111" stroke="#8B5E3C" stroke-width="1.3" opacity="0.5"/>
  <line x1="168" y1="104" x2="110" y2="108" stroke="#8B5E3C" stroke-width="1.3" opacity="0.5"/>
  <line x1="170" y1="111" x2="110" y2="111" stroke="#8B5E3C" stroke-width="1.3" opacity="0.5"/>
  <!-- Лапки (расслаблены) -->
  <ellipse cx="68" cy="215" rx="21" ry="11" fill="#F4A460"/>
  <ellipse cx="132" cy="215" rx="21" ry="11" fill="#F4A460"/>
  <ellipse cx="60" cy="215" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="68" cy="219" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="76" cy="215" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="124" cy="215" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="132" cy="219" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="140" cy="215" rx="6" ry="4" fill="#E8956D"/>
</svg>`,

  // ─── СПЯЩИЙ ──────────────────────────────────────
  sleeping: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg">
  <!-- ZZZ крупнее -->
  <text x="130" y="45" font-size="18" fill="#B794F4" font-weight="bold" opacity="0.9">Z</text>
  <text x="150" y="28" font-size="13" fill="#B794F4" font-weight="bold" opacity="0.7">Z</text>
  <text x="166" y="15" font-size="9"  fill="#B794F4" font-weight="bold" opacity="0.5">Z</text>
  <!-- Тело лежит -->
  <ellipse cx="100" cy="190" rx="72" ry="30" fill="#F4A460"/>
  <!-- Хвост оборачивается вокруг -->
  <path d="M164 188 C185 178 190 162 175 158 C162 154 155 164 162 172" stroke="#E8956D" stroke-width="12" fill="none" stroke-linecap="round"/>
  <!-- Голова (лежит) -->
  <circle cx="66" cy="165" r="44" fill="#F4A460"/>
  <!-- Ухо -->
  <polygon points="36,138 20,102 60,132" fill="#F4A460"/>
  <polygon points="38,136 26,108 57,132" fill="#FFB3C1"/>
  <polygon points="88,138 98,102 72,132" fill="#F4A460"/>
  <polygon points="86,136 94,108 74,132" fill="#FFB3C1"/>
  <!-- Глаза ЗАКРЫТЫЕ лёжа -->
  <path d="M46 162 Q56 170 66 162" stroke="#3A3A3A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M68 162 Q78 170 88 162" stroke="#3A3A3A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Нос -->
  <polygon points="66,172 61,177 71,177" fill="#FF8FAB"/>
  <!-- Рот (спокойный) -->
  <path d="M57 180 Q66 185 75 180" stroke="#8B5E3C" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <!-- Лапки (подо лбом) -->
  <ellipse cx="90" cy="200" rx="22" ry="14" fill="#F4A460"/>
  <ellipse cx="82" cy="200" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="90" cy="205" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="98" cy="200" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="118" cy="200" rx="22" ry="14" fill="#F4A460"/>
  <ellipse cx="110" cy="200" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="118" cy="205" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="126" cy="200" rx="6" ry="4" fill="#E8956D"/>
</svg>`,

  // ─── ХОЧЕТ В ТУАЛЕТ ──────────────────────────────
  toilet: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg">
  <!-- Капли пота -->
  <path d="M155 40 Q153 48 157 52 Q161 48 155 40" fill="#6BB5FF" opacity="0.8"/>
  <path d="M166 55 Q164 61 167 64 Q170 61 166 55" fill="#6BB5FF" opacity="0.6"/>
  <!-- Хвост (поджат) -->
  <path d="M148 178 C162 190 158 208 145 210" stroke="#E8956D" stroke-width="12" fill="none" stroke-linecap="round"/>
  <!-- Тело (сжатое) -->
  <ellipse cx="100" cy="180" rx="50" ry="38" fill="#F4A460"/>
  <!-- Голова -->
  <circle cx="100" cy="98" r="52" fill="#F4A460"/>
  <!-- Уши -->
  <polygon points="54,60 36,14 79,51" fill="#F4A460"/>
  <polygon points="56,57 44,22 76,51" fill="#FFB3C1"/>
  <polygon points="146,60 164,14 121,51" fill="#F4A460"/>
  <polygon points="144,57 156,22 124,51" fill="#FFB3C1"/>
  <!-- Глаза (стресс, волнистые) -->
  <ellipse cx="72" cy="87" rx="12" ry="12" fill="white"/>
  <ellipse cx="128" cy="87" rx="12" ry="12" fill="white"/>
  <ellipse cx="73" cy="88" rx="7" ry="7" fill="#3A3A3A"/>
  <ellipse cx="129" cy="88" rx="7" ry="7" fill="#3A3A3A"/>
  <circle cx="77" cy="85" r="2" fill="white"/>
  <circle cx="133" cy="85" r="2" fill="white"/>
  <!-- Нависшие брови (нервно) -->
  <path d="M60 76 Q72 72 84 76" stroke="#8B5E3C" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M116 76 Q128 72 140 76" stroke="#8B5E3C" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Нос -->
  <polygon points="100,106 95,112 105,112" fill="#FF8FAB"/>
  <!-- Рот (дрожащий) -->
  <path d="M87 118 Q91 115 95 118 Q99 121 103 118 Q107 115 111 118 Q107 122 100 124 Q93 122 87 118" stroke="#8B5E3C" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Усы -->
  <line x1="30" y1="104" x2="88" y2="108" stroke="#8B5E3C" stroke-width="1.3" opacity="0.6"/>
  <line x1="28" y1="111" x2="88" y2="111" stroke="#8B5E3C" stroke-width="1.3" opacity="0.6"/>
  <line x1="170" y1="104" x2="112" y2="108" stroke="#8B5E3C" stroke-width="1.3" opacity="0.6"/>
  <line x1="172" y1="111" x2="112" y2="111" stroke="#8B5E3C" stroke-width="1.3" opacity="0.6"/>
  <!-- Лапки скрещены -->
  <ellipse cx="78" cy="212" rx="22" ry="12" fill="#F4A460" transform="rotate(15,78,212)"/>
  <ellipse cx="122" cy="212" rx="22" ry="12" fill="#F4A460" transform="rotate(-15,122,212)"/>
  <ellipse cx="70" cy="212" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="78" cy="217" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="114" cy="212" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="130" cy="212" rx="6" ry="4" fill="#E8956D"/>
</svg>`,

  // ─── ГРУСТНЫЙ ────────────────────────────────────
  sad: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg">
  <!-- Хвост (опущен совсем) -->
  <path d="M148 180 C165 200 160 220 148 222" stroke="#E8956D" stroke-width="12" fill="none" stroke-linecap="round"/>
  <!-- Тело (осело) -->
  <ellipse cx="100" cy="182" rx="54" ry="40" fill="#F4A460"/>
  <!-- Голова -->
  <circle cx="100" cy="100" r="52" fill="#F4A460"/>
  <!-- Уши (опущены) -->
  <polygon points="52,64 38,22 76,56" fill="#F4A460"/>
  <polygon points="54,61 44,27 73,56" fill="#FFB3C1"/>
  <polygon points="148,64 162,22 124,56" fill="#F4A460"/>
  <polygon points="146,61 156,27 127,56" fill="#FFB3C1"/>
  <!-- Глаза (грустные, большие) -->
  <ellipse cx="72" cy="88" rx="14" ry="15" fill="white"/>
  <ellipse cx="128" cy="88" rx="14" ry="15" fill="white"/>
  <ellipse cx="73" cy="90" rx="8" ry="9" fill="#3A3A3A"/>
  <ellipse cx="129" cy="90" rx="8" ry="9" fill="#3A3A3A"/>
  <circle cx="77" cy="86" r="2.5" fill="white"/>
  <circle cx="133" cy="86" r="2.5" fill="white"/>
  <!-- Слёзы -->
  <path d="M65 104 Q61 112 65 118 Q69 112 65 104" fill="#6BB5FF" opacity="0.85"/>
  <path d="M135 106 Q131 113 135 119 Q139 113 135 106" fill="#6BB5FF" opacity="0.85"/>
  <!-- Грустные брови -->
  <path d="M60 76 Q72 80 84 76" stroke="#8B5E3C" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M116 76 Q128 80 140 76" stroke="#8B5E3C" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Нос -->
  <polygon points="100,108 95,114 105,114" fill="#FF8FAB"/>
  <!-- Рот (грустная дуга) -->
  <path d="M86 122 Q100 114 114 122" stroke="#8B5E3C" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <!-- Усы -->
  <line x1="28" y1="106" x2="84" y2="109" stroke="#8B5E3C" stroke-width="1.3" opacity="0.55"/>
  <line x1="26" y1="113" x2="84" y2="113" stroke="#8B5E3C" stroke-width="1.3" opacity="0.55"/>
  <line x1="172" y1="106" x2="116" y2="109" stroke="#8B5E3C" stroke-width="1.3" opacity="0.55"/>
  <line x1="174" y1="113" x2="116" y2="113" stroke="#8B5E3C" stroke-width="1.3" opacity="0.55"/>
  <!-- Лапки (сидит, поникший) -->
  <ellipse cx="68" cy="215" rx="20" ry="12" fill="#F4A460"/>
  <ellipse cx="132" cy="215" rx="20" ry="12" fill="#F4A460"/>
  <ellipse cx="60" cy="215" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="68" cy="219" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="76" cy="215" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="124" cy="215" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="132" cy="219" rx="6" ry="4" fill="#E8956D"/>
  <ellipse cx="140" cy="215" rx="6" ry="4" fill="#E8956D"/>
</svg>`,

  // ─── БОЛЬНОЙ ─────────────────────────────────────
  sick: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg">
  <!-- Пот -->
  <path d="M148 38 Q146 46 150 50 Q154 46 148 38" fill="#6BB5FF" opacity="0.7"/>
  <path d="M158 50 Q156 56 159 60 Q162 56 158 50" fill="#6BB5FF" opacity="0.5"/>
  <!-- Хвост (опущен) -->
  <path d="M148 178 C165 198 160 218 147 220" stroke="#C8855A" stroke-width="12" fill="none" stroke-linecap="round"/>
  <!-- Тело (бледное) -->
  <ellipse cx="100" cy="180" rx="54" ry="40" fill="#DDAA88"/>
  <!-- Голова (бледная) -->
  <circle cx="100" cy="100" r="52" fill="#DDAA88"/>
  <!-- Зелёный оттенок щёк (болен) -->
  <ellipse cx="68" cy="108" rx="16" ry="10" fill="#90EE90" opacity="0.25"/>
  <ellipse cx="132" cy="108" rx="16" ry="10" fill="#90EE90" opacity="0.25"/>
  <!-- Уши -->
  <polygon points="54,62 36,16 79,53" fill="#DDAA88"/>
  <polygon points="56,59 44,24 76,53" fill="#FFB3C1"/>
  <polygon points="146,62 164,16 121,53" fill="#DDAA88"/>
  <polygon points="144,59 156,24 124,53" fill="#FFB3C1"/>
  <!-- Глаза X -->
  <line x1="61" y1="78" x2="83" y2="98" stroke="#3A3A3A" stroke-width="3" stroke-linecap="round"/>
  <line x1="83" y1="78" x2="61" y2="98" stroke="#3A3A3A" stroke-width="3" stroke-linecap="round"/>
  <line x1="117" y1="78" x2="139" y2="98" stroke="#3A3A3A" stroke-width="3" stroke-linecap="round"/>
  <line x1="139" y1="78" x2="117" y2="98" stroke="#3A3A3A" stroke-width="3" stroke-linecap="round"/>
  <!-- Термометр -->
  <rect x="95" y="118" width="6" height="18" rx="3" fill="#EEE" stroke="#CCC" stroke-width="1"/>
  <circle cx="98" cy="136" r="4" fill="#FF4757"/>
  <rect x="97" y="122" width="2" height="12" rx="1" fill="#FF4757"/>
  <!-- Нос -->
  <polygon points="100,108 95,114 105,114" fill="#FFB3C1"/>
  <!-- Рот (слабый) -->
  <path d="M88 122 Q100 115 112 122" stroke="#8B5E3C" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Усы (поникли) -->
  <line x1="30" y1="108" x2="87" y2="109" stroke="#8B5E3C" stroke-width="1.3" opacity="0.4"/>
  <line x1="28" y1="113" x2="87" y2="113" stroke="#8B5E3C" stroke-width="1.3" opacity="0.4"/>
  <line x1="170" y1="108" x2="113" y2="109" stroke="#8B5E3C" stroke-width="1.3" opacity="0.4"/>
  <line x1="172" y1="113" x2="113" y2="113" stroke="#8B5E3C" stroke-width="1.3" opacity="0.4"/>
  <!-- Лапки (вялые) -->
  <ellipse cx="68" cy="215" rx="20" ry="12" fill="#DDAA88"/>
  <ellipse cx="132" cy="215" rx="20" ry="12" fill="#DDAA88"/>
  <ellipse cx="60" cy="215" rx="6" ry="4" fill="#C8855A"/>
  <ellipse cx="68" cy="219" rx="6" ry="4" fill="#C8855A"/>
  <ellipse cx="76" cy="215" rx="6" ry="4" fill="#C8855A"/>
  <ellipse cx="124" cy="215" rx="6" ry="4" fill="#C8855A"/>
  <ellipse cx="132" cy="219" rx="6" ry="4" fill="#C8855A"/>
  <ellipse cx="140" cy="215" rx="6" ry="4" fill="#C8855A"/>
</svg>`,
};
