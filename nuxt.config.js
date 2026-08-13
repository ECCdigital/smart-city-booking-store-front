import "dotenv/config";
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  ssr: true,
  nitro: {
    preset: "node-server",
  },

  pages: true,

  vite: {
    server: {
      // Dev-Tunnel (cloudflared/trycloudflare) fuer HTTPS-Tests am Handy:
      // Vite blockt sonst fremde Host-Header mit "Blocked request".
      allowedHosts: [".trycloudflare.com"],
    },
  },

  runtimeConfig: {
    adminBaseUrl: "",
    apiBaseUrl: "",
    userBaseUrl: "",
    cacheEnabled: false,
    // make values available on the client via `useRuntimeConfig().public`
    public: {
      adminBaseUrl: "",
      apiBaseUrl: "",
      userBaseUrl: "",
      silentSsoEnabled: false,
    },
  },
  routeRules: {
    "/catalog/**": { ssr: true, isr: 300 },
  },

  modules: [
    "~~/modules/tenant-routes",
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/ui",
    "@nuxtjs/i18n",
    "@pinia/nuxt",
    "nuxt-security",
    "@vueuse/nuxt",
    "@nuxtjs/color-mode",
    "@nuxtjs/leaflet",
  ],
  css: ["~/assets/css/main.css"],
  colorMode: {
    classSuffix: "",
    preference: "system",
    fallback: "light",
  },
  i18n: {
    locales: [
      {
        code: "de",
        name: "Deutsch",
        file: "de.json",
      },
      {
        code: "en",
        name: "English",
        file: "en.json",
      },
    ],
    customRoutes: "page",
    defaultLocale: "de",
    // The vue-i18n fallback lives in i18n/i18n.config.ts - see the comment there.
    strategy: "prefix_except_default",
    lazy: true,
    langDir: "locales/",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      redirectOn: "root",
    },
  },
  security: {
    rateLimiter: {
      tokensPerInterval: 500,
      interval: 300000,
      headers: false,
      driver: {
        name: "lruCache",
      },
    },
    headers: {
      contentSecurityPolicy: {
        "img-src": ["'self'", "data:", "https://*.tile.openstreetmap.org", "https://www.orka-mv.de"],
        // Mobile Key / QR-Scan: ohne 'wasm-unsafe-eval' verweigert der Browser die
        // WebAssembly-Kompilierung des zxing-Decoders. Der Scanner startet dann stumm
        // nicht — es gibt keine Fehlermeldung, nur ein leeres Bild. Die Decoder-Datei
        // selbst liegt unter public/wasm/ und ist versionsgekoppelt (siehe README.md).
        "script-src": ["'self'", "https:", "'unsafe-inline'", "'wasm-unsafe-eval'"],
      },
      // Mobile Key / QR-Scan: nuxt-security setzt per Default `camera=()` und sperrt
      // getUserMedia damit auch für die eigene Herkunft. Der Scanner braucht
      // ausdrücklich `camera=(self)`.
      permissionsPolicy: {
        camera: ["self"],
      },
    },
    nonce: true,
  },
});
