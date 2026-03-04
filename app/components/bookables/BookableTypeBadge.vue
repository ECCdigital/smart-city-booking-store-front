<template>
<UBadge
    class="z-10"
    :color="color"
    size="md"
    :label="categoryName"
  />
</template>
<script setup>
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
});

//toDo - read dynamically from instance
const categoryName = computed(() => {
  if (props.isEvent) {
    return "Veranstaltung";
  }
  switch (props.type) {
    case "room":
      return "Raum";
    case "event-location":
      return "Veranstaltungsort";
    case "resource":
      return "Gerät";
    case "event":
      return "Veranstaltung";
    case "ticket":
      return "Ticket";
    default:
      return "";
  }
});
</script>

<style scoped></style>
