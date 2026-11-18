<template>
  <!-- The contact person under the organiser, left-aligned below the label. -->
  <div v-if="contactPerson" class="flex flex-col items-start gap-2">
    <p class="font-semibold">{{ $t("events.contactPerson") }}</p>
    <DetailsAreaEventPerson :person="contactPerson" />
  </div>
</template>
<script setup>
import { contactPersonOf } from "~/utils/eventPeople.js";
import DetailsAreaEventPerson from "~/components/detailsArea/DetailsAreaEventPerson.vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const contactPerson = computed(() => contactPersonOf(props.item));
</script>
<style scoped></style>
