<template>
  <UBadge
    class="z-10"
    :color="neutral ? 'neutral' : color"
    size="md"
    :label="iconOnly ? '' : category.label"
    :icon="category.icon"
    :class="iconOnly ? 'pl-2' : ''"
    :ui="neutral ? NEUTRAL_UI : undefined"
    :style="neutral ? undefined : { color: contrastToPrimary }"
  />
</template>
<script setup>
import { useContrastColor } from "~/composables/utils/useContrastColor.js";

const { t } = useI18n();

const { contrastToPrimary } = useContrastColor();

const props = defineProps({
  type: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: "primary",
  },
  isEvent: {
    type: Boolean,
    default: false,
  },
  iconOnly: {
    type: Boolean,
    default: false,
  },
  // A badge away from the tenant's colours — on a card of its own rather than
  // on an image. It takes a grey surface, and its text follows the colour mode
  // instead of the contrast to the primary colour, which says nothing about a
  // surface that is not the primary colour.
  neutral: {
    type: Boolean,
    default: false,
  },
});

const NEUTRAL_UI = {
  base: "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
};

//toDo - read dynamically from instance
const category = computed(() => {
  if (props.isEvent) {
    return {
      label: t("bookableType.event"),
      icon: "i-lucide-calendar-check-2",
    };
  }
  switch (props.type) {
    case "room":
      return { label: t("bookableType.room"), icon: "i-lucide-door-open" };
    case "event-location":
      return {
        label: t("bookableType.eventLocation"),
        icon: "i-lucide-building-2",
      };
    case "resource":
      return { label: t("bookableType.resource"), icon: "i-lucide-wrench" };
    case "event":
      return {
        label: t("bookableType.event"),
        icon: "i-lucide-calendar-check-2",
      };
    case "ticket":
      return { label: t("bookableType.ticket"), icon: "i-lucide-ticket" };
    default:
      return {
        label: t("bookableType.unknown"),
        icon: "i-lucide-file-exclamation-point",
      };
  }
});
</script>

<style scoped></style>
