<script setup>
import { useLegalDocuments } from "~/composables/useLegalDocuments.js";

const documents = useLegalDocuments();

// Rendered on the server and reused on hydration. With ISR the cached year is at
// most 300s stale, which only ever shows on New Year's Eve.
const year = new Date().getFullYear();
</script>

<template>
  <!-- Surface stays full-bleed, content sits on the container edges -->
  <footer class="bg-white dark:bg-gray-900">
    <div
      class="container flex flex-col gap-4 py-5 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
        <span class="text-gray-600 dark:text-gray-400">
          © {{ year }}
        </span>

        <nav v-if="documents.length" class="flex flex-wrap gap-x-6 gap-y-2">
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
