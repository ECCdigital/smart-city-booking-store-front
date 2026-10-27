<script setup>
import { useLegalDocuments } from "~/composables/useLegalDocuments.js";
import { copyrightLine } from "~/utils/copyrightLine.js";
import { offerSpacesEntryUrl } from "~/utils/authEntryFlow";
import { useInstanceStore } from "~~/stores/instance.js";

defineProps({
  /** The auth pages' footer: copyright and links only, no logos and no tenant choice. */
  minimal: { type: Boolean, default: false },
});

const documents = useLegalDocuments();
const instanceStore = useInstanceStore();

// Rendered on the server and reused on hydration. With ISR the cached year is at
// most 300s stale, which only ever shows on New Year's Eve.
const year = new Date().getFullYear();

// The rights holder travels with the legal documents on the public instance;
// it is instance data, not UI copy, so there is no i18n key for it.
const copyright = computed(() =>
  copyrightLine(year, instanceStore.instance?.copyright),
);

// Public entry "Offer spaces": leads to the admin UI's onboarding, which
// handles login itself. Shown only when an admin UI is configured and the
// public instance says that every user may create a tenant.
const adminBaseUrl = useRuntimeConfig().public.adminBaseUrl;
const offerSpacesUrl = computed(() =>
  offerSpacesEntryUrl(adminBaseUrl, instanceStore.instance),
);

// The instance's footer logos (Theme View). The Live Preview's Draft carries
// none, so its footer shows no row.
const { data: theme } = await useThemeBundle();
const footerLogos = computed(() => theme.value?.footerLogos ?? []);
</script>

<template>
  <!-- Surface stays full-bleed, content sits on the container edges -->
  <footer class="bg-white dark:bg-gray-900">
    <!-- Footer logos, funding logos among them: a row of their own above
         copyright and links, only when the instance has any. -->
    <div
      v-if="!minimal && footerLogos.length"
      data-footer-logos
      class="container border-b border-gray-200 pt-6 pb-5 dark:border-gray-800"
    >
      <FooterLogos :logos="footerLogos" />
    </div>

    <div
      class="container flex flex-col gap-4 py-5 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
        <span class="text-gray-600 dark:text-gray-400">
          {{ copyright }}
        </span>

        <nav
          v-if="documents.length || offerSpacesUrl"
          class="flex flex-wrap gap-x-6 gap-y-2"
        >
          <a
            v-for="doc in documents"
            :key="doc.key"
            :href="doc.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-gray-700 hover:underline dark:text-gray-300"
          >
            {{ $t(`footer.${doc.key}`) }}
          </a>
          <a
            v-if="offerSpacesUrl"
            :href="offerSpacesUrl"
            class="text-gray-700 hover:underline dark:text-gray-300"
          >
            {{ $t("footer.offerSpaces") }}
          </a>
        </nav>
      </div>

      <div v-if="!minimal" class="flex items-center gap-4 sm:gap-6">
        <!-- The one place the tenant is always chosen; the bar only names the
             one already in use. It closes the row on the right. -->
        <ClientOnly>
          <TenantSwitcher variant="footer" />
        </ClientOnly>
      </div>
    </div>
  </footer>
</template>
