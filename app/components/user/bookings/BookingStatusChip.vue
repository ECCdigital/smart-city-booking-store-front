<template>
  <div
      class="flex px-3 py-1 rounded-full text-xs font-medium"
      :class="bookingStatus.color"
  >
    <UIcon :name="bookingStatus.icon" class="w-4 h-4 mr-1 mt-0.5" />
    {{ bookingStatus.label }}
  </div>
</template>
<script setup>
const props = defineProps({
  booking: {
    type: Object,
    required: true
  },
});

const bookingStatus = computed(() => {
  if (props.booking.isRejected) {
    return {
      label: "Storniert",
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      icon: "i-lucide-x",
    };
  } else if (props.booking.isCommitted) {
    return {
      label: "Bestätigt",
      color:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      icon: "i-lucide-check",
    };
  }
  //toDo - abgeschlossen??

  return {
    label: "Ausstehend",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    icon: "i-lucide-hourglass",
  };
});
</script>


<style scoped>

</style>