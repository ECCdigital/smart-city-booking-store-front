<template>
  <div
      v-if="bookingPayment"
      class="flex px-3 py-1 rounded-full text-xs font-medium"
      :class="bookingPayment.classes"
  >
    <UIcon :name="bookingPayment.icon" class="w-4 h-4 mr-1 mt-0.5" />
    {{ bookingPayment.label }}
  </div>
</template>
<script setup>
const props = defineProps({
  bookingIsPayed: {
    type: Boolean,
    required: true
  },
});

const bookingPayment = computed(() => {
  if (props.bookingIsPayed) {
    return {
      label: "Bezahlt",
      classes:
          "w-[90px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      icon: "i-lucide-check",
    };
  } else {
    return {
      label: "Nicht bezahlt",
      classes:
          "w-[120px] bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      icon: "i-lucide-hourglass",
    };
  }
});
</script>


<style scoped>

</style>