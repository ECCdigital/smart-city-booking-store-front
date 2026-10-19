<script setup>
/**
 * The full-page surface behind the auth pages and the error page: the Theme
 * View's Background fixed to the viewport, the vignette on top, the page
 * content in front. The colour mode comes from the `.dark` class alone, so
 * the server paints the right one — a wrapper that carries `dark` itself
 * forces it.
 *
 * The auth pages also get a slim navigation bar and the app's footer, so a
 * visitor who is not signed in can still reach the start page and the legal
 * documents. The error page goes without them.
 */
defineProps({
  /** The darkened edges the auth pages add on top of the Background. */
  vignette: { type: Boolean, default: true },
  /** The slim navigation bar above and the footer below the content. */
  navigation: { type: Boolean, default: true },
});

const { data: theme } = await useThemeBundle();
</script>

<template>
  <div class="page-wrapper relative min-h-screen">
    <div class="fixed inset-0 -z-10">
      <BackgroundLayers :background="theme?.background" />
      <div v-if="vignette" class="absolute inset-0 pointer-events-none vignette" />
    </div>

    <div class="flex min-h-screen flex-col z-0">
      <NavigationBar v-if="navigation" variant="auth" />
      <div class="flex flex-1">
        <slot />
      </div>
      <AppFooter v-if="navigation" :tenant-switcher="false" />
    </div>
  </div>
</template>

<style scoped>
.vignette {
  background: radial-gradient(
    ellipse at center,
    transparent 0%,
    rgb(0 0 0 / var(--bg-vignette-opacity)) 100%
  );
}
</style>
