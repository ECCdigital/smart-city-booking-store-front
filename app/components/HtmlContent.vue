<template>
  <div v-if="sanitizedHtml" class="html-content-wrapper">
    <div class="relative">
      <div
        :class="[
          'html-content',
          textClass,
          'transition-[max-height] duration-300 ease-in-out',
          shouldTruncate ? `${maxHeightClass} overflow-hidden` : '',
        ]"
        v-html="sanitizedHtml"
      />
      <div
        v-if="shouldTruncate && fade"
        class="pointer-events-none absolute bottom-0 left-0 right-0"
        :class="[fadeHeightClass, fadeClass]"
      />
    </div>

    <UButton
      v-if="collapsible && isTruncatable"
      :label="expanded ? collapseLabel : expandLabel"
      :icon="
        expanded
          ? 'i-lucide-chevron-up'
          : 'i-lucide-chevron-down'
      "
      variant="link"
      color="primary"
      size="xs"
      :padded="false"
      class="mt-1 -ml-1"
      @click="expanded = !expanded"
    />
  </div>
</template>

<script setup>
import { useSanitizeHtml } from "~/composables/utils/useSanitizeHtml.js";

const props = defineProps({
  /** Roher HTML-String, der angezeigt werden soll. Wird vor dem Rendern sanitized. */
  html: {
    type: String,
    default: "",
  },
  /** Aktiviert die "Mehr anzeigen / Weniger anzeigen"-Funktionalität. */
  collapsible: {
    type: Boolean,
    default: false,
  },
  /** Max-Height-Tailwind-Klasse, wenn der Text kollabiert ist (z. B. `max-h-32`, `max-h-48`). */
  maxHeightClass: {
    type: String,
    default: "max-h-32",
  },
  /** Tailwind-Klassen für die Default-Texttypografie (Größe, Farbe, Line-Height). */
  textClass: {
    type: String,
    default: "text-sm text-gray-600 dark:text-gray-300 leading-relaxed",
  },
  /** Aktiviert/deaktiviert den Fade-Gradient am unteren Rand bei kollabierter Ansicht. */
  fade: {
    type: Boolean,
    default: true,
  },
  /** Tailwind-Klassen für den Fade-Gradient. Sollte zur Hintergrundfarbe der Umgebung passen. */
  fadeClass: {
    type: String,
    default:
      "bg-gradient-to-t from-neutral-50 dark:from-gray-950 to-transparent",
  },
  /** Höhe des Fade-Gradients als Tailwind-Klasse. */
  fadeHeightClass: {
    type: String,
    default: "h-12",
  },
  /** Schwellwert für "automatisch als 'lang' erkennen" anhand der Klartext-Zeichen. */
  charThreshold: {
    type: Number,
    default: 240,
  },
  /** Schwellwert anhand der Anzahl Block-Elemente (p / div / li / h*). */
  paragraphThreshold: {
    type: Number,
    default: 2,
  },
  /** Label für den Aufklapp-Button. */
  expandLabel: {
    type: String,
    default: "Mehr anzeigen",
  },
  /** Label für den Zuklapp-Button. */
  collapseLabel: {
    type: String,
    default: "Weniger anzeigen",
  },
  /** Erzwingt den expandierten Zustand (z. B. bei externer Steuerung). */
  forceExpanded: {
    type: Boolean,
    default: false,
  },
});

const { sanitizeHtml } = useSanitizeHtml();

const sanitizedHtml = computed(() => sanitizeHtml(props.html || ""));

const isTruncatable = computed(() => {
  const raw = props.html || "";
  if (!raw) return false;
  const plain = raw
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const paragraphs = (raw.match(/<\/(p|div|li|h\d)>/gi) || []).length;
  return (
    plain.length > props.charThreshold ||
    paragraphs > props.paragraphThreshold
  );
});

const expanded = ref(false);

const shouldTruncate = computed(() => {
  if (props.forceExpanded || expanded.value) return false;
  return props.collapsible && isTruncatable.value;
});
</script>

<style scoped>
/* Typografie für gerenderten HTML-Content */
.html-content :deep(p) {
  margin: 0 0 0.75rem 0;
}
.html-content :deep(p:last-child) {
  margin-bottom: 0;
}
.html-content :deep(h1),
.html-content :deep(h2),
.html-content :deep(h3),
.html-content :deep(h4),
.html-content :deep(h5),
.html-content :deep(h6) {
  font-weight: 600;
  margin: 0.75rem 0 0.5rem 0;
  line-height: 1.3;
  color: inherit;
}
.html-content :deep(h1) {
  font-size: 1.125rem;
}
.html-content :deep(h2) {
  font-size: 1.0625rem;
}
.html-content :deep(h3),
.html-content :deep(h4),
.html-content :deep(h5),
.html-content :deep(h6) {
  font-size: 1rem;
}
.html-content :deep(ul),
.html-content :deep(ol) {
  margin: 0 0 0.75rem 0;
  padding-left: 1.25rem;
}
.html-content :deep(ul) {
  list-style: disc;
}
.html-content :deep(ol) {
  list-style: decimal;
}
.html-content :deep(li) {
  margin-bottom: 0.25rem;
}
.html-content :deep(a) {
  color: rgb(var(--color-primary) / 1);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.html-content :deep(a:hover) {
  text-decoration: none;
}
.html-content :deep(strong),
.html-content :deep(b) {
  font-weight: 600;
  color: inherit;
}
.html-content :deep(em),
.html-content :deep(i) {
  font-style: italic;
}
.html-content :deep(blockquote) {
  border-left: 3px solid rgb(229 231 235);
  padding-left: 0.75rem;
  margin: 0.5rem 0;
  color: rgb(107 114 128);
}
.dark .html-content :deep(blockquote) {
  border-left-color: rgb(55 65 81);
  color: rgb(156 163 175);
}
.html-content :deep(code) {
  background: rgb(243 244 246);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.85em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
.dark .html-content :deep(code) {
  background: rgb(31 41 55);
}
.html-content :deep(pre) {
  background: rgb(243 244 246);
  padding: 0.75rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}
.dark .html-content :deep(pre) {
  background: rgb(31 41 55);
}
.html-content :deep(pre code) {
  background: transparent;
  padding: 0;
}
.html-content :deep(hr) {
  border: 0;
  border-top: 1px solid rgb(229 231 235);
  margin: 0.75rem 0;
}
.dark .html-content :deep(hr) {
  border-top-color: rgb(55 65 81);
}
.html-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.375rem;
  margin: 0.5rem 0;
}
.html-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.5rem 0;
  font-size: 0.95em;
}
.html-content :deep(th),
.html-content :deep(td) {
  border: 1px solid rgb(229 231 235);
  padding: 0.375rem 0.5rem;
  text-align: left;
}
.dark .html-content :deep(th),
.dark .html-content :deep(td) {
  border-color: rgb(55 65 81);
}
.html-content :deep(th) {
  font-weight: 600;
  background: rgb(249 250 251);
}
.dark .html-content :deep(th) {
  background: rgb(31 41 55);
}
</style>
