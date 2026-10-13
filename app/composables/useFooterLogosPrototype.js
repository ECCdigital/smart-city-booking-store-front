/**
 * PROTOTYPE #514 (Karte #510): Wie stehen mehrere Logos im Footer, ohne das
 * Layout zu sprengen? Vier Varianten im echten AppFooter, dazu der heutige
 * Stand als 0, umschaltbar per ?variant=0|A|B|C|D. Logos, Größenregel, Größe,
 * Dunkelmodus und Links stehen ebenfalls in der URL. Nur im Dev-Modus, nie in
 * main.
 *
 * Die Logos sind synthetische SVGs: Das Repo ist öffentlich, echte Logos
 * gehören nicht hinein. Das Förderlogo ahmt nur das Format des BMWSB-Logos
 * nach (etwa 4:3, weißer Grund, Adler mit Flagge, Text im Bild).
 */

export const FOOTER_PROTO_VARIANTS = ["0", "A", "B", "C", "D"];
export const FOOTER_PROTO_NAMES = {
  0: "Heute",
  A: "Eigene Zeile",
  B: "Raster rechts",
  C: "In der Copyright-Zeile",
  D: "Helles Band",
};
export const FOOTER_PROTO_DESCRIPTIONS = {
  0: "Der Stand von 1.2.x: kein Logo, der Slot #logos ist ungenutzt.",
  A: "Die Logos stehen in einer eigenen Zeile über Copyright und Links, links an der Kante des Containers, durch eine Linie getrennt. Auf dem Telefon brechen sie um.",
  B: "Der Footer wird zweispaltig: links Copyright und Links untereinander, rechts ein Raster gleich großer Boxen. Auf dem Telefon zwei Spalten unter den Links.",
  C: "Die Logos stehen klein in der bestehenden Zeile, rechts vor der Mandantenwahl. Der Footer bleibt eine Zeile, solange es passt.",
  D: "Ein eigenes Band über dem Footer, auch im Dunkelmodus weiß. Logos mittig. Weißer Bildgrund ist so nie ein Problem.",
};

/** Standard-Größenregel je Variante; ?rule= überschreibt sie. */
export const FOOTER_PROTO_DEFAULT_RULE = { A: "hoehe", B: "box", C: "hoehe", D: "flaeche" };
export const FOOTER_PROTO_RULES = {
  hoehe: "Einheitliche Höhe, Breite folgt (max. 3,5 × Höhe)",
  box: "Box mit Höchstbreite und -höhe, object-contain",
  flaeche: "Gleiche Fläche (optischer Ausgleich)",
};

/** Grundhöhe in px je Größenstufe und Variante. Auf dem Telefon × 0,8. */
export const FOOTER_PROTO_SIZES = { s: "S", m: "M", l: "L", xl: "XL" };
const BASE_HEIGHT = {
  A: { s: 40, m: 56, l: 80, xl: 120 },
  B: { s: 56, m: 80, l: 112, xl: 150 },
  C: { s: 24, m: 32, l: 40, xl: 56 },
  D: { s: 40, m: 56, l: 80, xl: 120 },
};

export const FOOTER_PROTO_DARK = {
  keine: "Unverändert",
  platte: "Weiße Platte je Logo",
  invert: "Invertieren",
};

const svg = (w, h, body) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="Arial, Helvetica, sans-serif">${body}</svg>`,
  )}`;

/** Adler mit Flagge, stark vereinfacht. `ink` ist die Farbe des Adlers. */
const eagle = (ink) => `
  <rect x="34" y="92" width="10" height="38" fill="#000"/>
  <rect x="34" y="130" width="10" height="38" fill="#dd0000"/>
  <rect x="34" y="168" width="10" height="38" fill="#ffce00"/>
  <path fill="${ink}" d="M88 100c10 0 16 8 16 16 8-10 22-14 34-10-6 6-8 12-8 18 8-4 16-4 22 0-8 4-12 10-12 16 6-2 12 0 14 4-8 2-12 8-12 14 0 10-8 18-18 22l4 14-10-6-8 10-8-10-10 6 4-14c-10-4-18-12-18-22 0-6-4-12-12-14 2-4 8-6 14-4 0-6-4-12-12-16 6-4 14-4 22 0 0-6-2-12-8-18 12-4 26 0 34 10 0-8 6-16 16-16z" transform="translate(-24 0)"/>`;

const foerder = (bg, ink) =>
  svg(
    400,
    300,
    `<rect width="400" height="300" fill="${bg}"/>
     <text x="24" y="52" font-size="19" fill="${ink}">Gefördert durch:</text>
     ${eagle(ink)}
     <g font-size="21" fill="${ink}">
       <text x="178" y="122">Bundesministerium</text>
       <text x="178" y="148">für Muster, Stadt-</text>
       <text x="178" y="174">entwicklung</text>
       <text x="178" y="200">und Bauwesen</text>
     </g>
     <g font-size="17" fill="${ink}">
       <text x="24" y="250">aufgrund eines Beschlusses</text>
       <text x="24" y="272">des Deutschen Bundestages</text>
     </g>
     <text x="392" y="292" font-size="10" text-anchor="end" fill="#9ca3af">MUSTER</text>`,
  );

/**
 * Die Logos. `textRatio` ist die kleinste Schrift im Bild relativ zur
 * Bildhöhe, damit das Panel zeigen kann, wie groß der Text gerendert wird.
 */
export const FOOTER_PROTO_LOGOS = {
  foerder: {
    label: "Förderlogo (4:3, weißer Grund, Text im Bild)",
    src: foerder("#ffffff", "#000000"),
    dark: foerder("#111827", "#ffffff"),
    width: 400,
    height: 300,
    textRatio: 17 / 300,
    opaque: true,
  },
  breit: {
    label: "Wortmarke breit, transparent",
    src: svg(
      720,
      110,
      `<circle cx="55" cy="55" r="40" fill="#0e7490"/><path d="M35 70l20-36 20 36z" fill="#fff"/>
       <text x="115" y="72" font-size="50" font-weight="700" fill="#0e7490">Stadtwerke Musterstadt</text>`,
    ),
    width: 720,
    height: 110,
  },
  quadrat: {
    label: "Quadratisch, transparent",
    src: svg(
      200,
      200,
      `<circle cx="100" cy="100" r="92" fill="#7c3aed"/><circle cx="100" cy="100" r="62" fill="none" stroke="#fff" stroke-width="10"/>
       <text x="100" y="114" font-size="40" font-weight="700" text-anchor="middle" fill="#fff">MV</text>`,
    ),
    width: 200,
    height: 200,
  },
  eu: {
    label: "Querformat, weißer Grund (wie JPEG)",
    src: svg(
      480,
      140,
      `<rect width="480" height="140" fill="#fff"/><rect x="16" y="20" width="150" height="100" fill="#1e3a8a"/>
       ${Array.from({ length: 12 }, (_, i) => {
         const a = (i / 12) * 2 * Math.PI;
         return `<circle cx="${91 + 34 * Math.cos(a)}" cy="${70 + 34 * Math.sin(a)}" r="5" fill="#facc15"/>`;
       }).join("")}
       <text x="186" y="62" font-size="26" fill="#1e3a8a">Kofinanziert vom</text>
       <text x="186" y="96" font-size="26" font-weight="700" fill="#1e3a8a">Musterfonds der Union</text>`,
    ),
    width: 480,
    height: 140,
    opaque: true,
    textRatio: 26 / 140,
  },
  wappen: {
    label: "Wappen, hochkant",
    src: svg(
      160,
      200,
      `<path d="M10 10h140v90c0 50-35 80-70 92C45 180 10 150 10 100z" fill="#b91c1c"/>
       <path d="M80 40l12 30h30l-24 18 9 30-27-18-27 18 9-30-24-18h30z" fill="#facc15"/>`,
    ),
    width: 160,
    height: 200,
  },
  schwarz: {
    label: "Wortmarke schwarz, transparent",
    src: svg(
      420,
      120,
      `<text x="10" y="58" font-size="44" font-weight="700" fill="#111">Landkreis</text>
       <text x="10" y="104" font-size="36" fill="#111">Musterland</text>`,
    ),
    width: 420,
    height: 120,
  },
  breit2: {
    label: "Sehr breit, transparent",
    src: svg(
      1000,
      100,
      `<rect x="0" y="20" width="60" height="60" rx="12" fill="#16a34a"/>
       <text x="80" y="68" font-size="46" fill="#166534">Digitalagentur des Landes Musterland</text>`,
    ),
    width: 1000,
    height: 100,
  },
};

export const FOOTER_PROTO_SETS = {
  foerder: { label: "Nur Förderlogo", logos: ["foerder"] },
  breit: { label: "Nur breites Logo", logos: ["breit"] },
  quadrat: { label: "Nur quadratisch", logos: ["quadrat"] },
  vier: { label: "Vier gemischt", logos: ["foerder", "breit", "quadrat", "eu"] },
  sieben: {
    label: "Sieben gemischt",
    logos: ["foerder", "eu", "breit", "quadrat", "wappen", "schwarz", "breit2"],
  },
};

export const FOOTER_PROTO_KEYS = ["variant", "set", "rule", "size", "dark", "dv", "links"];

export function useFooterLogosPrototype() {
  const isDev = import.meta.dev;
  const route = useRoute();
  const router = useRouter();

  const pick = (key, table, fallback) =>
    computed(() => (isDev && table[route.query[key]] !== undefined ? route.query[key] : fallback));

  // Außerhalb des Dev-Modus immer der heutige Stand.
  const variant = computed(() =>
    isDev && FOOTER_PROTO_VARIANTS.includes(route.query.variant) ? route.query.variant : "0",
  );
  const set = pick("set", FOOTER_PROTO_SETS, "vier");
  const rule = computed(() =>
    FOOTER_PROTO_RULES[route.query.rule] ? route.query.rule : FOOTER_PROTO_DEFAULT_RULE[variant.value],
  );
  const size = pick("size", FOOTER_PROTO_SIZES, "m");
  const dark = pick("dark", FOOTER_PROTO_DARK, "platte");
  // Eine Variante des Förderlogos für den Dunkelmodus ist nur zum Vergleich
  // da: Der Logo-Leitfaden des BMWSB sieht keine vor ("immer auf weißem
  // Grund", keine Negativdarstellung).
  const darkVariant = computed(() => route.query.dv === "1");
  const links = computed(() => route.query.links === "1");

  const logos = computed(() =>
    variant.value === "0" ? [] : FOOTER_PROTO_SETS[set.value].logos.map((key) => ({ key, ...FOOTER_PROTO_LOGOS[key] })),
  );

  const baseHeight = computed(() => BASE_HEIGHT[variant.value]?.[size.value] ?? 0);

  /**
   * Die Maße eines Logos als Inline-Stil. `--s` ist 0,8 auf dem Telefon und 1
   * ab `sm`, gesetzt am Container der Logos.
   */
  function logoStyle(logo) {
    const h = baseHeight.value;
    const aspect = logo.width / logo.height;
    if (rule.value === "box") {
      const w = Math.round(h * 2);
      return { width: `calc(var(--s) * ${w}px)`, height: `calc(var(--s) * ${h}px)`, objectFit: "contain" };
    }
    if (rule.value === "flaeche") {
      // Gleiche Fläche wie ein 2:1-Logo der Grundhöhe, Höhe höchstens 1,5 × Grundhöhe.
      const area = h * h * 2;
      const height = Math.min(Math.sqrt(area / aspect), h * 1.5);
      return { height: `calc(var(--s) * ${Math.round(height)}px)`, width: "auto", maxWidth: `calc(var(--s) * ${h * 5}px)` };
    }
    return { height: `calc(var(--s) * ${h}px)`, width: "auto", maxWidth: `calc(var(--s) * ${Math.round(h * 3.5)}px)`, objectFit: "contain" };
  }

  /** Bildquelle im Dunkelmodus: Variante, falls hinterlegt und eingeschaltet. */
  function darkSource(logo) {
    return logo.dark && darkVariant.value ? logo.dark : null;
  }

  function set_(patch) {
    const query = { ...route.query, ...patch };
    for (const k of Object.keys(query)) if (query[k] === undefined) delete query[k];
    router.replace({ query });
  }

  return {
    isDev,
    variant,
    rule,
    size,
    dark,
    darkVariant,
    links,
    logos,
    baseHeight,
    logoStyle,
    darkSource,
    set: set_,
    logoSet: set,
  };
}
