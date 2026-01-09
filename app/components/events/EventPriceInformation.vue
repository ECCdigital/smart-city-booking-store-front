<template>
  <div v-for="(ticket, index) in props.event.tickets" :key="index">
    <span v-if="event.tickets.length > 1" class="font-medium mt-5">{{ticket.title}}</span>
    <BookablePriceInformation :item="ticket" />
  </div>
</template>
<script setup>
import BookablePriceInformation from "~/components/bookables/BookablePriceInformation.vue";

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
})
</script>s
<style scoped></style>