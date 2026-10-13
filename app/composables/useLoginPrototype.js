/**
 * PROTOTYPE #513 (Karte #510): Wie werden Logo und Portalname auf dem Login
 * lesbar, und in welchen Größen ist das Logo wählbar? Vier Varianten auf
 * /login, dazu der heutige Stand als 0, umschaltbar per ?variant=0|A|B|C|D. Hintergrund, Logo, Größe und
 * Name stehen ebenfalls in der URL. Nur im Dev-Modus, nie in main.
 *
 * Hintergründe und Logos sind synthetische SVGs: Das Repo ist öffentlich,
 * echte Instanz-Logos gehören nicht hinein. „Instanz“ zeigt jeweils das echte
 * Branding der lokalen Instanz.
 */

export const LOGIN_PROTO_VARIANTS = ["0", "A", "B", "C", "D"];
export const LOGIN_PROTO_NAMES = {
  0: "Heute",
  A: "Panel",
  B: "In der Karte",
  C: "Frei mit Kontrast",
  D: "Band",
};
export const LOGIN_PROTO_DESCRIPTIONS = {
  0: "Der Stand von 1.2.x zum Vergleich: Logo in S und Portalname in Primär frei auf dem Hintergrund, mit Vignette, ohne Kontrastlogik. Die Größe gilt hier nicht.",
  A: "Logo und Portalname stehen wie heute links bzw. über der Karte, aber in einem eigenen Glas-Panel (.glass wie die Login-Karte). Der Hintergrund bleibt sichtbar, das Panel trägt die Lesbarkeit.",
  B: "Logo und Portalname wandern in die Login-Karte, über „Anmelden“. Die Karte steht mittig. Das Logo steht ohne eigenen Grund auf der Karte. Zum Vergleich: heller Kopf oder helle Platte, dann ohne Invertierung.",
  C: "Wie heute frei auf dem Hintergrund. Die Schriftfarbe ergibt sich aus der Helligkeit des Hintergrunds (hell → dunkel, dunkel → weiß), dazu ein Schein in der Gegenfarbe um Schrift und Logo. Bei einem Bild kennt der Server die Helligkeit nur über die Overlay-Einstellung.",
  D: "Ein schmales neutrales Band oben über die ganze Breite, wie ein Header: Logo links, Portalname daneben. Darunter die Karte mittig auf dem Hintergrund.",
};

export const LOGIN_PROTO_BACKGROUNDS = {
  instanz: "Instanz (echt)",
  hell: "Bild hell",
  dunkel: "Bild dunkel",
  unruhig: "Bild unruhig",
  generiert: "Generiert (Mesh)",
};

export const LOGIN_PROTO_LOGOS = {
  instanz: "Instanz (echt)",
  dunkel: "Wortmarke dunkel, breit",
  farbig: "Wortmarke farbig, breit",
  wappen: "Wappen, hochkant",
  weiss: "Wortmarke weiß",
  keins: "Kein Logo",
};

export const LOGIN_PROTO_SIZES = {
  sm: "S · 56 px (heute)",
  md: "M · 96 px",
  lg: "L · 160 px",
  xl: "XL · 256 px",
};

export const LOGIN_PROTO_KEYS = ["variant", "bg", "logo", "size", "name", "invert", "titleColor", "overlay", "panel", "plate"];

const LONG_NAME =
  "Buchungsportal der Hansestadt Musterstadt – Räume, Sportstätten und Veranstaltungen";

/** Wie hell ein Hintergrund wirkt, so wie der Server es wissen könnte. */
const BG_BRIGHTNESS = {
  hell: "hell",
  dunkel: "dunkel",
  // Ein unruhiges Bild hat keine eindeutige Helligkeit: Der Server rät „hell“.
  unruhig: "hell",
  generiert: "hell",
  instanz: "hell",
};

export function useLoginPrototype() {
  const isDev = import.meta.dev;
  const route = useRoute();
  const router = useRouter();

  const pick = (key, table, fallback) =>
    computed(() => (isDev && table[route.query[key]] !== undefined ? route.query[key] : fallback));

  // Außerhalb des Dev-Modus immer der heutige Stand.
  const variant = computed(() =>
    isDev && LOGIN_PROTO_VARIANTS.includes(route.query.variant) ? route.query.variant : "0",
  );
  const bg = pick("bg", LOGIN_PROTO_BACKGROUNDS, "instanz");
  const logo = pick("logo", LOGIN_PROTO_LOGOS, "instanz");
  const size = pick("size", LOGIN_PROTO_SIZES, "sm");
  const longName = computed(() => route.query.name === "lang");
  // Variante A: Panel auch im Dunkelmodus hell, dann ohne Invertierung.
  const panelLight = computed(() => isDev && route.query.panel === "hell");
  // Variante B: ohne eigenen Grund (Standard), oder heller Grund als Kopf
  // über die ganze Breite bzw. als Platte um das Logo, dann ohne Invertierung.
  const plate = computed(() =>
    isDev && ["logo", "kopf"].includes(route.query.plate) ? route.query.plate : "keins",
  );
  const invert = computed(() =>
    (panelLight.value && variant.value === "A") ||
    (variant.value === "B" && plate.value !== "keins")
      ? false
      : route.query.invert !== "0",
  );
  const titlePrimary = computed(() => route.query.titleColor === "primary");
  // Overlay im Dunkelmodus über einem Bild, in Prozent, wie in der Einstellung.
  const overlay = computed(() => {
    const n = Number(route.query.overlay);
    return Number.isFinite(n) && n >= 0 && n <= 90 ? n : 30;
  });
  const brightness = computed(() => BG_BRIGHTNESS[bg.value]);

  function set(patch) {
    const query = { ...route.query, ...patch };
    for (const k of Object.keys(query)) if (query[k] === undefined) delete query[k];
    router.replace({ query });
  }

  return {
    isDev,
    variant,
    bg,
    logo,
    size,
    longName,
    longNameText: LONG_NAME,
    invert,
    panelLight,
    plate,
    titlePrimary,
    overlay,
    brightness,
    set,
  };
}

// ---------------------------------------------------------------------------
// Synthetische Logos
// ---------------------------------------------------------------------------

function svgUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const LOGO_SVGS = {
  dunkel: {
    width: 640,
    height: 140,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 140">
      <rect x="6" y="14" width="112" height="112" rx="20" fill="#0f172a"/>
      <path d="M30 104 L62 36 L94 104 Z" fill="#fff"/>
      <text x="140" y="92" font-family="Helvetica, Arial, sans-serif" font-size="76" font-weight="700" fill="#0f172a">Musterstadt</text>
    </svg>`,
  },
  farbig: {
    width: 640,
    height: 160,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 160">
      <circle cx="78" cy="80" r="64" fill="#c8102e"/>
      <circle cx="78" cy="80" r="40" fill="#fff"/>
      <circle cx="78" cy="80" r="22" fill="#005ca9"/>
      <text x="164" y="78" font-family="Georgia, serif" font-size="60" font-weight="700" fill="#005ca9">Hansestadt</text>
      <text x="166" y="132" font-family="Georgia, serif" font-size="44" fill="#c8102e">Musterstadt</text>
    </svg>`,
  },
  wappen: {
    width: 300,
    height: 360,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 360">
      <path d="M20 20 H280 V190 C280 280 200 330 150 345 C100 330 20 280 20 190 Z" fill="#facc15" stroke="#1f2937" stroke-width="10"/>
      <path d="M150 20 V345" stroke="#1f2937" stroke-width="8"/>
      <path d="M20 150 H280" stroke="#1f2937" stroke-width="8"/>
      <rect x="40" y="40" width="90" height="90" fill="#16a34a"/>
      <circle cx="215" cy="85" r="42" fill="#dc2626"/>
      <path d="M60 180 L110 300 L130 180 Z" fill="#1d4ed8"/>
      <rect x="175" y="175" width="80" height="100" fill="#1f2937"/>
    </svg>`,
  },
  weiss: {
    width: 640,
    height: 140,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 140">
      <rect x="6" y="14" width="112" height="112" rx="56" fill="none" stroke="#fff" stroke-width="12"/>
      <path d="M38 70 H86 M62 46 V94" stroke="#fff" stroke-width="12"/>
      <text x="140" y="92" font-family="Helvetica, Arial, sans-serif" font-size="76" font-weight="300" fill="#fff">Musterstadt</text>
    </svg>`,
  },
};

/** Ein synthetisches Logo als Medien-Referenz mit Maßen, wie ThemeLogo sie kennt. */
export function protoLogo(key) {
  const entry = LOGO_SVGS[key];
  if (!entry) return null;
  return { url: svgUrl(entry.svg), width: entry.width, height: entry.height };
}

// ---------------------------------------------------------------------------
// Synthetische Hintergrundbilder
// ---------------------------------------------------------------------------

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function busySvg() {
  const r = seeded(42);
  const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff", "#111827", "#fde047", "#0ea5e9"];
  let shapes = "";
  for (let i = 0; i < 160; i++) {
    const c = colors[Math.floor(r() * colors.length)];
    const x = Math.round(r() * 1600);
    const y = Math.round(r() * 1000);
    if (r() < 0.5) {
      const w = Math.round(20 + r() * 220);
      const h = Math.round(20 + r() * 260);
      shapes += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" opacity="${(0.6 + r() * 0.4).toFixed(2)}" transform="rotate(${Math.round(r() * 40 - 20)} ${x} ${y})"/>`;
    } else {
      shapes += `<circle cx="${x}" cy="${y}" r="${Math.round(10 + r() * 90)}" fill="${c}" opacity="${(0.6 + r() * 0.4).toFixed(2)}"/>`;
    }
  }
  for (let i = 0; i < 30; i++) {
    const y = Math.round(r() * 1000);
    shapes += `<path d="M0 ${y} L1600 ${Math.round(r() * 1000)}" stroke="${colors[Math.floor(r() * colors.length)]}" stroke-width="${Math.round(2 + r() * 10)}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice"><rect width="1600" height="1000" fill="#94a3b8"/>${shapes}</svg>`;
}

const BG_SVGS = {
  hell: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dbeafe"/><stop offset="0.6" stop-color="#fefce8"/><stop offset="1" stop-color="#fde68a"/></linearGradient>
      <radialGradient id="sun" cx="0.25" cy="0.3" r="0.4"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="30"/></filter>
    </defs>
    <rect width="1600" height="1000" fill="url(#sky)"/>
    <rect width="1600" height="1000" fill="url(#sun)"/>
    <g filter="url(#blur)" fill="#ffffff">
      <ellipse cx="300" cy="260" rx="260" ry="70"/><ellipse cx="900" cy="180" rx="320" ry="80"/>
      <ellipse cx="1300" cy="380" rx="260" ry="60"/><ellipse cx="600" cy="520" rx="300" ry="70"/>
    </g>
    <path d="M0 820 Q400 760 800 830 T1600 800 V1000 H0 Z" fill="#fef3c7"/>
  </svg>`,
  dunkel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020617"/><stop offset="0.7" stop-color="#1e1b4b"/><stop offset="1" stop-color="#312e81"/></linearGradient>
    </defs>
    <rect width="1600" height="1000" fill="url(#night)"/>
    <g fill="#0b1120">
      <rect x="0" y="700" width="140" height="300"/><rect x="150" y="620" width="110" height="380"/><rect x="270" y="760" width="160" height="240"/>
      <rect x="440" y="580" width="90" height="420"/><rect x="540" y="680" width="200" height="320"/><rect x="760" y="640" width="120" height="360"/>
      <rect x="900" y="720" width="180" height="280"/><rect x="1100" y="600" width="100" height="400"/><rect x="1210" y="690" width="170" height="310"/><rect x="1390" y="650" width="210" height="350"/>
    </g>
    <g fill="#fde68a" opacity="0.8">
      <rect x="170" y="660" width="8" height="10"/><rect x="200" y="700" width="8" height="10"/><rect x="460" y="620" width="8" height="10"/>
      <rect x="590" y="720" width="8" height="10"/><rect x="800" y="690" width="8" height="10"/><rect x="1130" y="650" width="8" height="10"/>
      <rect x="1250" y="740" width="8" height="10"/><rect x="1450" y="700" width="8" height="10"/><rect x="960" y="760" width="8" height="10"/>
    </g>
    <circle cx="1250" cy="200" r="50" fill="#e2e8f0" opacity="0.9"/>
  </svg>`,
};

let busyCache;
/** Ein synthetisches Hintergrundbild als URL, oder null für „Instanz“ und „Generiert“. */
export function protoBackground(key) {
  if (key === "unruhig") return svgUrl((busyCache ??= busySvg()));
  return BG_SVGS[key] ? svgUrl(BG_SVGS[key]) : null;
}

// ---------------------------------------------------------------------------
// Kontrast (WCAG)
// ---------------------------------------------------------------------------

function rgb(h) {
  const n = parseInt(h.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function luminance(h) {
  const [r, g, b] = rgb(h).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
