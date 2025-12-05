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
    apiBaseUrl: "",
    adminBaseUrl: "",
    userBaseUrl: "",
    // make values available on the client via `useRuntimeConfig().public`
    public: {
      adminBaseUrl: process.env.ADMIN_BASE_URL || "",
      apiBaseUrl: process.env.API_BASE_URL || "",
      userBaseUrl: process.env.USER_BASE_URL || "",
    },
  },
  routeRules: {
    "/catalog/**": { ssr: true, isr: 300 },
  },

  modules: [
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/ui",
    "@nuxtjs/i18n",
    "@pinia/nuxt",
    "nuxt-security",
    "@vueuse/nuxt",
  ],
  css: ["~/assets/css/main.css"],
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
});