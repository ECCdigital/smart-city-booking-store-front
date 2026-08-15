<script setup>
import HtmlContent from "~/components/HtmlContent.vue";

const props = defineProps({
  bookables: {
    type: Array,
    default: () => [],
  },
});

function htmlToPlainText(html) {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;|&#xA0;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeBookingNotes(raw) {
  if (raw == null || typeof raw !== "string") return "";
  const html = raw.trim();
  if (!html) return "";
  return htmlToPlainText(html) ? html : "";
}

const entries = computed(() => {
  const out = [];
  const seen = new Set();
  for (const bookable of props.bookables) {
    if (!bookable?.id || seen.has(bookable.id)) continue;
    const html = normalizeBookingNotes(bookable.bookingNotes);
    if (!html) continue;
    seen.add(bookable.id);
    out.push({
      id: bookable.id,
      title: bookable.title || "",
      html,
    });
  }
  return out;
});

const showBookableTitles = computed(() => entries.value.length > 1);
</script>

<template>
  <section v-if="entries.length" class="space-y-3">
    <div class="flex items-center gap-2">
      <UIcon
        name="i-lucide-info"
        class="text-primary-600 dark:text-primary-400 flex-shrink-0"
        size="18"
      />
      <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
        {{ $t("checkout.bookingNotes.sectionTitle") }}
      </h2>
    </div>

    <div
      v-for="entry in entries"
      :key="entry.id"
      class="rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/40 dark:bg-primary-950/20 p-4"
    >
      <p
        v-if="showBookableTitles && entry.title"
        class="text-sm font-semibold text-gray-900 dark:text-white mb-2"
      >
        {{ entry.title }}
      </p>
      <HtmlContent
        :html="entry.html"
        collapsible
        fade-class="bg-gradient-to-t from-primary-50/90 dark:from-primary-950/90 to-transparent"
      />
    </div>
  </section>
</template>
