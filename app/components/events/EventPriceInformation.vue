<template>
  <div v-if="props.event.tickets.length < 1 && event.attendees.publicEvent">
    <p class="text-gray-500 text-sm italic py-2">
      Für dieses Event sind derzeit keine Ticketoptionen hinterlegt.
    </p>
  </div>
  <div v-for="(ticket, index) in props.event.tickets" :key="index">
    <p v-if="event.tickets.length > 1" class="font-medium mt-3">{{ticket.title}}</p>
    <BookablePriceInformation
        :item="ticket"
        :is-event-with-multiple-categories="hasMultiplePriceCategories"
    />
  </div>
</template>
<script setup>
import BookablePriceInformation from "~/components/bookables/BookablePriceInformation.vue";

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
});

const hasMultiplePriceCategories = computed(() => {
  return props.event.tickets.length > 1 && props.event.tickets.some(
      (ticket) => ticket.priceCategories.length > 1
  );
});
</script>
<style scoped></style>