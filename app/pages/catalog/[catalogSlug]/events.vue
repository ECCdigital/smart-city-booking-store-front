<template>
  <div>
    Events Seite
    {{ events }}
  </div>
</template>

<script setup>
import { useEventStore } from "~~/stores/event.js";

definePageMeta({
  name: "events",
});

const eventStore = useEventStore();

const { events } = storeToRefs(eventStore);
</script>

<style scoped></style>
