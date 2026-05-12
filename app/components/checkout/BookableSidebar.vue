<script setup>
import DetailsAreaImages from "~/components/search/DetailsAreaImages.vue";
import HtmlContent from "~/components/HtmlContent.vue";

const props = defineProps({
  leadBookable: {
    type: Object,
    required: true,
  },
  tenant: {
    type: Object,
    default: null,
  },
});


const subtitle = computed(() => props.tenant?.name || "");

</script>

<template>
  <aside class="w-full lg:w-[440px] xl:w-[480px] lg:flex-shrink-0">
    <div class="lg:sticky lg:top-8 space-y-6">
      <!-- Header: Subtitle / Title -->
      <div>
        <p
          v-if="subtitle"
          class="text-sm md:text-base text-gray-500 dark:text-gray-400 mb-1"
        >
          {{ subtitle }}
        </p>

        <h1
          class="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight"
        >
          {{ leadBookable.title }}
        </h1>
      </div>

      <!-- Image -->
      <div class="rounded-lg overflow-hidden">
        <DetailsAreaImages :item="leadBookable" :is-event="false" />
      </div>

      <!-- Description -->
      <HtmlContent
        v-if="leadBookable.description"
        :html="leadBookable.description"
        collapsible
      />

      <!-- Flags -->
      <div
        v-if="leadBookable.flags && leadBookable.flags.length > 0"
        class="flex flex-wrap gap-2"
      >
        <span
          v-for="flag in leadBookable.flags"
          :key="flag"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200"
        >
          <UIcon
            name="i-lucide-check"
            class="text-primary dark:text-primary"
            size="16"
          />
          {{ flag }}
        </span>
      </div>

    </div>
  </aside>
</template>

<style scoped></style>
