<script setup>
import { useLegalDocuments } from "~/composables/useLegalDocuments.js";
import { copyrightLine } from "~/utils/copyrightLine.js";
import { offerSpacesEntryUrl } from "~/utils/authEntryFlow";
import { useInstanceStore } from "~~/stores/instance.js";

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
</script>

<template>
  <!-- Surface stays full-bleed, content sits on the container edges -->
  <footer class="bg-white dark:bg-gray-900">
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

      <!-- Partner logos are out of scope for now (no instance field, no admin
           form). The slot keeps them a matter of data rather than a rebuild. -->
      <div v-if="$slots.logos" class="flex items-center gap-4">
        <slot name="logos" />
      </div>
    </div>
  </footer>
</template>
