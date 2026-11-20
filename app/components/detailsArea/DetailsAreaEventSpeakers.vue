<template>
  <!-- The speakers of an event, under the ticket options. -->
  <section v-if="speakers.length" aria-labelledby="event-speakers-heading">
    <h3 id="event-speakers-heading" class="text-xl font-bold mb-5">
      {{ $t("events.speakers") }}
    </h3>
    <ul class="grid gap-3 xl:grid-cols-2">
      <li v-for="(speaker, i) in speakers" :key="i">
        <DetailsAreaEventPerson :person="speaker" framed class="h-full" />
      </li>
    </ul>
  </section>
</template>
<script setup>
import { speakersOf } from "~/utils/eventPeople.js";
import DetailsAreaEventPerson from "~/components/detailsArea/DetailsAreaEventPerson.vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const speakers = computed(() => speakersOf(props.item));
</script>
<style scoped></style>
