<script setup>
import SearchBar from "~/components/search/SearchBar.vue";
import MainCategoryArea from "~/components/MainCategoryArea.vue";
import BookableSection from "~/components/bookables/BookableSection.vue";
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useHeroMode } from "~/composables/useHeroMode";
import { useHeroPreviewOverride } from "~/composables/useThemeBundle";
import { handleError } from "~/utils/handleError";
import { useBookableStore } from "~~/stores/bookable.js";
import { usePortalStore } from "~~/stores/portal.js";
import { adminOrigin } from "~~/shared/utils/adminOrigin";

/**
 * The Hero's Live Preview: the real catalog layout, framed by the admin's
 * Hero Editor, so an editor sees a Draft exactly as the site will show it —
 * including the search bar overlapping the Hero's lower edge.
 *
 * `?mode=home` shows the start page arrangement under the tall Hero,
 * `?mode=compact` a sub-page under the Compact Hero. Both use the real
 * components with data loaded anonymously; where there is none they show
 * their own empty state. Everything beneath the Hero is inert.
 *
 * The route is anonymous by design: permission to open it lives in the
 * admin, not in a secret in the URL. It exists for the instance catalog only
 * — there is no tenant copy and none of the catalog guards run — and it
 * answers 404 unless an admin origin is configured, because without one
 * nothing may frame it and nothing may send it a Draft.
 */
definePageMeta({
  layout: "catalog",
  hero: "preview",
});

const config = useRuntimeConfig();

if (!adminOrigin(config.public.adminBaseUrl)) {
  handleError({ statusCode: 404 }, "Page not found");
}

usePageTitle();
useHead({ meta: [{ name: "robots", content: "noindex" }] });

// The Draft lives in shared state so the Hero needs no preview code; it must
// not outlive the page, or a link out of the frame would show it on the site.
const override = useHeroPreviewOverride();
onBeforeUnmount(() => {
  override.value = null;
});

const mode = useHeroMode();
const { loadBundle } = useCatalogBundle();
const bookableStore = useBookableStore();
const portalStore = usePortalStore();

// Only the sub-page arrangement lists anything. In personal mode the bundle
// loader would answer with the redirect the catalog guard is excluded for,
// so the list simply stays empty there — the portal mode is known before
// this runs, `plugins/instance.server.js` loads it on every request. A
// failed load shows the empty state too, rather than an error page inside
// the editor.
if (mode.value === "compact" && !portalStore.isPersonalMode) {
  try {
    await loadBundle({ include: ["bookables"] });
  } catch (error) {
    console.warn("[preview/hero] catalog bundle unavailable:", error);
  }
}

const bookables = computed(() =>
  portalStore.isPersonalMode ? [] : bookableStore.getBookables,
);
</script>

<template>
  <!--
    `inert` takes the content out of the tab order and the accessibility tree
    and swallows its clicks; `pointer-events-none` keeps the cursor honest.
  -->
  <div inert class="pointer-events-none select-none">
    <!--
      Mirrors the start page (`pages/index.vue`): the search bar overlaps the
      Hero, then the categories. The wrappers are copied on purpose — the
      preview exists to show that overlap exactly as the start page does, so
      a change there is a change here.
    -->
    <div v-if="mode === 'home'" class="bg-neutral-50 dark:bg-gray-950">
      <div class="container">
        <div class="relative h-0 bg-transparent">
          <div class="flex justify-center mt-12 md:mt-0">
            <SearchBar entry-page-mode />
          </div>
        </div>

        <div class="pt-20 sm:pt-25 md:pt-10">
          <MainCategoryArea />
        </div>
      </div>
    </div>

    <!-- Mirrors the bookables page: search bar and results list -->
    <BookableSection v-else :bookables="bookables" />
  </div>
</template>
