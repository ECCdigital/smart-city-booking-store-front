<template>
  <div class="bg-primary/20 p-3 rounded mb-1">
    <div class="md:flex justify-between text-gray-700 dark:text-gray-300">
      <p class="font-bold flex items-center justify-between md:justify-start">
        <span
          :class="bookable._bookableUsed.title.length > 100 ? 'text-sm' : ''"
          >{{ bookable._bookableUsed.title }}</span
        >
        <UButton
          icon="i-lucide-square-arrow-out-up-right"
          variant="soft"
          class="text-gray-700 dark:text-gray-300 cursor-pointer"
          @click="goToBookable(bookable.bookableId)"
        />
      </p>
      <div class="hidden md:block">
        <span class="text-sm mr-1">{{ bookable.amount }}x</span>
        <span class="font-bold">{{ bookingPrice }}</span>
      </div>
      <div class="md:hidden text-sm">
        <p>Einzelpreis: {{ bookingPrice }}</p>
        <p>Anzahl: {{ bookable.amount }}x</p>
      </div>
    </div>
    <BookablesBookableAdressInformation
      v-if="bookable._bookableUsed.location.display_address"
      :bookable="bookable._bookableUsed"
      class="text-sm"
    />
  </div>
</template>
<script setup>
const props = defineProps({
  bookable: {
    type: Object,
    required: true,
  },
});

const bookingPrice = computed(() => {
  if (props.bookable.userGrossPriceEur > 0) {
    return formatPrice(props.bookable.userGrossPriceEur);
  }
  return "0,00 €";
});

const formatPrice = (price) => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(price);
};

function goToBookable(bookableId) {
  const router = useRouter();
  const routeData = router.resolve({
    path: `bookables/${bookableId}`,
    query: {},
  });
  window.open(routeData.href, "_blank");
}
</script>

<style scoped></style>
