// @nuxtjs/color-mode's server plugin copies a cookie into preference but leaves
// value as the config default ("system") and never puts a class on <html>.
// Components that read colorMode.value (AppearanceSection, HeroSection, …)
// would still SSR as light, and the first paint would have no class until the
// inline script ran. This plugin finishes the job the cookie storage started.
export default defineNuxtPlugin(() => {
  const colorMode = useColorMode();
  if (colorMode.preference === "dark" || colorMode.preference === "light") {
    colorMode.value = colorMode.preference;
    colorMode.unknown = false;
  }
  if (colorMode.value === "dark" || colorMode.value === "light") {
    useHead({
      htmlAttrs: {
        class: colorMode.value,
      },
    });
  }
});
