<template>
  <div class="flex justify-center">
    <div
        class="mt-5 md:-mt-10 bg-gray-300/30 dark:bg-gray-800/30 backdrop-blur-lg shadow-lg"
        style="max-height: 450px; height: 400px; width: 70vw;overflow: hidden;"
    >
      <img
          v-if="!props.isEvent && item?.imgUrl"
          :src="`/api/img?url=${encodeURIComponent(item.imgUrl)}`"
          alt=""
          class="w-full h-full object-contain rounded-l-xl"
      >
      <img
          v-else-if="props.isEvent && item?.information?.teaserImage"
          :src="`/api/img?url=${encodeURIComponent(item.information.teaserImage)}`"
          alt=""
          class="w-full h-full object-contain rounded-l-xl"
      >
      <img
          v-else
          src="../../assets/bookable-default.jpg"
          alt="Platzhalterbild: graue Dreiecke, keine spezifische Darstellung des Buchungsobjekts"
          class="h-full w-full object-contain rounded-l-xl"
      >
    </div>
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



<style scoped>

</style>