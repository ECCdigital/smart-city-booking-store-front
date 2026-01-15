<template>
  <div class="bg-gray-200 dark:bg-gray-700 rounded-md p-3">
    <div v-if="item.location && item.location.coordinates" class="mb-2">
      <AddressMap :coordinates="item.location.coordinates" />
    </div>
    <div
      v-else-if="item.location && item.location.display_address"
      class="mb-2"
    >
      <AddressMap :address-string="item.location.display_address" />
    </div>

    <EventsEventAdressInformation v-if="props.isEvent" :event="item" />
    <BookablesBookableAdressInformation v-else :bookable="item" />
  </div>
  <div class="bg-pink-200">
    {{ item.location }}
    <hr >
    <hr >
    {{ mapCenter }} - {{ mapZoom }} --> {{ mapReady }}
    <hr >
  </div>
</template>
<script setup>
import AddressMap from "~/components/AddressMap.vue";

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

const searchQuery = ref(props.item.location?.display_address);
const mapCenter = ref([]);
const mapZoom = ref(15);
const mapReady = ref(false);
const mapRef = ref();
onMounted(() => {
  searchLocation();
});
const searchLocation = async () => {
  if (!searchQuery.value) return;

  try {
    const response = await $fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.value)}&limit=1&accept-language=de`,
    );

    console.log("Nominatim-Antwort:", response);

    if (response[0]) {
      const { lat, lon } = response[0];
      mapCenter.value = [parseFloat(lat), parseFloat(lon)];
      mapZoom.value = 14;

      // Optional: Map auf neuen Mittelpunkt zentrieren
      /*
      if (mapRef.value) {
        mapRef.value.leafletObject.setView(mapCenter.value, mapZoom.value)
      }

       */
    }

    mapReady.value = true;
  } catch (error) {
    console.error("Suche fehlgeschlagen:", error);
  }
};
</script>
<style scoped></style>
