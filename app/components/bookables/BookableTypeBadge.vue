<template>
  <UBadge
    class="absolute top-2 left-2 z-10"
    color="primary"
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
