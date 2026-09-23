<template>
  <UBadge
    class="z-10"
    :color="color"
    size="md"
    :label="iconOnly ? '' : category.label"
    :icon="category.icon"
    :class="iconOnly ? 'pl-2' : ''"
  />
</template>
<script setup>

const { t } = useI18n();

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
});

//toDo - read dynamically from instance
const category = computed(() => {
  if (props.isEvent) {
    return { label: t("bookableType.event"), icon: "i-lucide-calendar-check-2" };
  }
  switch (props.type) {
    case "room":
      return { label: t("bookableType.room"), icon: "i-lucide-door-open" };
    case "event-location":
      return { label: t("bookableType.eventLocation"), icon: "i-lucide-building-2" };
    case "resource":
      return { label: t("bookableType.resource"), icon: "i-lucide-wrench" };
    case "event":
      return { label: t("bookableType.event"), icon: "i-lucide-calendar-check-2" };
    case "ticket":
      return { label: t("bookableType.ticket"), icon: "i-lucide-ticket" };
    default:
      return { label: t("bookableType.unknown"), icon: "i-lucide-file-exclamation-point" };
  }
});
</script>

<style scoped></style>
