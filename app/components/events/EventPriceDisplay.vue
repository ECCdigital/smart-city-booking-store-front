<template>
  <div class="text-right ">
    <p v-if="props.eventTickets.length === 0">Kostenlos</p>
    <p v-else>
      {{ displayMinDefaultPrice() }}
    </p>
    <!--
    <p class="bg-green-100">
      {{ props.eventTickets }}
    </p>
    -->

    <!-- tDo - sonderpreise für eingeloggte User berücksichtigen!  -->
  </div>
</template>
<script setup>
const props = defineProps({
  eventTickets: {
    type: Array,
    required: true,
  },
});

function getMinPrice(ticket) {
  return Math.min(...ticket.priceCategories.map((cat) => cat.priceEur));
}
function displayMinDefaultPrice() {
  if (props.eventTickets.length === 0) {
    return null;
  }

  const allTicketMin = props.eventTickets.map((ticket) => {
    return getMinPrice(ticket)
  })

  const min = Math.min(...allTicketMin);
  if (min === 0) {
    return "Kostenlos";
  }
  return "ab " + min.toFixed(2).toString().replace(/\./g, ",") + " €";
}
</script>
<style scoped>

</style>