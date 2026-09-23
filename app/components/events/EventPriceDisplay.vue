<template>
  <div class="text-right">
    <p v-if="isFree || props.eventTickets.length === 0">{{ $t("price.free") }}</p>
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

const { t } = useI18n();

const props = defineProps({
  eventTickets: {
    type: Array,
    default: () => [],
  },
  isFree: {
    type: Boolean,
    default: false,
  },
});

function getMinPrice(ticket) {
  return Math.min(
    ...ticket.priceCategories.map((cat) => {
      return ticket.priceValueAddedTax
        ? cat.priceEur + (cat.priceEur * ticket.priceValueAddedTax) / 100
        : cat.priceEur;
    }),
  );
}
function displayMinDefaultPrice() {
  if (props.eventTickets.length === 0) {
    return null;
  }

  const allTicketMin = props.eventTickets.map((ticket) => {
    return getMinPrice(ticket);
  });

  const min = Math.min(...allTicketMin);
  if (min === 0) {
    return t("price.free");
  }
  return "ab " + min.toFixed(2).toString().replace(/\./g, ",") + " €";
}
</script>
<style scoped></style>
