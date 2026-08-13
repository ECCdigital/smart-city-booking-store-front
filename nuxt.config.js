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
        // PROTOTYP 05: 'wasm-unsafe-eval' ist Pflicht, sonst verweigert der Browser die
        // WebAssembly-Kompilierung des zxing-Decoders (Recherche 01, Abschnitt A).
        "script-src": ["'self'", "https:", "'unsafe-inline'", "'wasm-unsafe-eval'"],
      },
      // PROTOTYP 05: nuxt-security setzt per Default `camera=()` und sperrt getUserMedia
      // damit auch für die eigene Herkunft (Recherche 01, Abschnitt A).
      permissionsPolicy: {
        camera: ["self"],
      },
    },
    nonce: true,
  },
});
