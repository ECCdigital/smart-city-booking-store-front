<template>
  <div class="bg-gray-200 dark:bg-gray-700 rounded-md p-3">
    <EventsEventAdressInformation v-if="props.isEvent" :event="item" />
    <BookablesBookableAdressInformation v-else :bookable="item"/>
  </div>
</template>
<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  isEvent: {
    type: Boolean,
    default: false,
  },
});
</script>
<style scoped></style>