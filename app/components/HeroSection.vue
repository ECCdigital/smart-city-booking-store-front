<script setup>
import {
  HERO_DESKTOP_HEIGHT_CLASSES,
  HERO_HEIGHT_LENGTHS,
  HERO_MOBILE_HEIGHT_CLASSES,
} from "~/components/hero/heroClasses";
import {
  fallbackHeroLayout,
  heroHeightSteps,
  visibleBlocks,
} from "~/utils/heroBlocks";
import { useHeroMode } from "~/composables/useHeroMode";

/**
 * The Hero: the Background under the Hero Layout's Blocks, at the height the
 * layout reserves for the current Hero mode.
 *
 * Both the desktop and the mobile tree are in the server-rendered HTML and
 * are switched by CSS alone — a breakpoint decided in JavaScript would
 * render the desktop tree on the server and hydrate wrong. The height, too,
 * is a class per viewport, so it is reserved before anything loads.
 *
 * When no Theme Bundle could be read or the layout it carried failed the
 * guards, the Fallback Hero Layout renders from translations; the Hero keeps
 * its full height either way.
 */
const route = useRoute();
const { t } = useI18n();
const { data: theme } = await useThemeBundle(route.params.catalogSlug);
const mode = useHeroMode();

const layout = computed(
  () =>
    theme.value?.heroLayout ??
    fallbackHeroLayout({
      title: t("meta.siteNameFallback"),
      subtitle: t("hero.fallbackSubtitle"),
      logo: theme.value?.logo ?? null,
    }),
);

const heights = computed(() => heroHeightSteps(layout.value, mode.value));
const heightClasses = computed(() => [
  HERO_MOBILE_HEIGHT_CLASSES[heights.value.mobile],
  HERO_DESKTOP_HEIGHT_CLASSES[heights.value.desktop],
]);
// Both heights, so an image Background's `sizes` is right on every viewport.
const boxHeights = computed(() => [
  {
    media: "(min-width: 768px)",
    height: HERO_HEIGHT_LENGTHS[heights.value.desktop],
  },
  { height: HERO_HEIGHT_LENGTHS[heights.value.mobile] },
]);

const blocks = computed(() => visibleBlocks(layout.value, mode.value));
</script>

<template>
  <!--
    The padding is the reserved inset: the search bar overlaps the lower edge
    on home and sub-pages, so the content area is the height step minus it.
    The Hero clips rather than grows.
  -->
  <div
    class="relative w-full overflow-hidden z-0 py-10 md:py-15 pb-30 lg:pb-15"
    :class="heightClasses"
  >
    <BackgroundLayers :background="theme?.background" :box-heights="boxHeights" />

    <!--
      Surface is full-bleed, content sits inside the page container. Its
      content box is the content area; the Live Preview measures against it
      and lays its Zone overlay into it, which is all the attribute is for.
    -->
    <div data-hero-content class="container relative z-10 h-full">
      <HeroMobileStack :blocks="blocks" :mode="mode" class="md:hidden" />
      <HeroZones :blocks="blocks" :mode="mode" class="hidden md:block" />
    </div>
  </div>
</template>
