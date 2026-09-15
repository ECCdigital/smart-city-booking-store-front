<script setup>
/**
 * The full-page surface behind the auth pages and the error page: the Theme
 * View's Background fixed to the viewport, the vignette on top, the page
 * content in front. The colour mode comes from the `.dark` class alone, so
 * the server paints the right one — a wrapper that carries `dark` itself
 * forces it.
 */
defineProps({
  /** The darkened edges the auth pages add on top of the Background. */
  vignette: { type: Boolean, default: true },
});

const { data: theme } = await useThemeBundle();
</script>

<template>
  <div class="page-wrapper relative min-h-screen">
    <div class="fixed inset-0 -z-10">
      <BackgroundLayers :background="theme?.background" />
      <div v-if="vignette" class="absolute inset-0 pointer-events-none vignette" />
    </div>

    <div class="flex min-h-screen z-0">
      <slot />
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
