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
    storage: "localStorage",
    storageKey: "scb-color-mode",
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
      // HSTS + upgrade-insecure-requests break local HTTP dev in Safari (forces https://localhost).
      strictTransportSecurity:
        process.env.NODE_ENV === "development" ? false : undefined,
      contentSecurityPolicy: {
        "img-src": ["'self'", "data:", "https://*.tile.openstreetmap.org", "https://www.orka-mv.de"],
        "script-src": ["'self'", "https:", "'unsafe-inline'"],
        "upgrade-insecure-requests":
          process.env.NODE_ENV === "development" ? false : true,
      },
    },
    nonce: true,
  },
});
