<template>
  <!-- Without its label the badge says what it is on hover instead. The
       wrapper takes the attributes so the tooltip anchors to the badge where
       the parent placed it. -->
  <UTooltip v-if="iconOnly" :text="category.label">
    <UBadge
      v-bind="$attrs"
      class="z-10 px-2"
      :color="neutral ? 'neutral' : color"
      size="md"
      :icon="category.icon"
      :aria-label="category.label"
      :ui="neutral ? NEUTRAL_UI : undefined"
      :style="neutral ? undefined : { color: contrastToPrimary }"
    />
  </UTooltip>
  <UBadge
    v-else
    v-bind="$attrs"
    class="z-10"
    :color="neutral ? 'neutral' : color"
    size="md"
    :label="category.label"
    :icon="category.icon"
    :ui="neutral ? NEUTRAL_UI : undefined"
    :style="neutral ? undefined : { color: contrastToPrimary }"
  />
</template>
<script setup>
import { useContrastColor } from "~/composables/utils/useContrastColor.js";

defineOptions({ inheritAttrs: false });

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
