// vue-i18n falls back to nothing by default, and en.json carries a single key.
// Without this, a browser that gets redirected to /en would show the raw key
// path on the screen in front of the door - a half translation is worse than
// an honestly missing one, but a key path is worse than both.
//
// This has to live here rather than in `nuxt.config.js`: `fallbackLocale` is
// not a module option of @nuxtjs/i18n (there it belongs to
// `detectBrowserLanguage`), it is a vue-i18n option, and the module scans for
// `i18n/i18n.config.{js,mjs,ts}` to find them.
export default defineI18nConfig(() => ({
  fallbackLocale: "de",
}));
