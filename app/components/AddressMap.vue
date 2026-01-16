<template>
  <div v-if="addressCoordinates.length > 0" style="height: 300px">
    <LMap
      :zoom="props.zoom"
      :center="addressCoordinates"
      :use-global-leaflet="false"
    >
      <LTileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        layer-type="base"
        name="Light  OpenStreetMap"
      />
      <LMarker :lat-lng="addressCoordinates" />
    </LMap>
  </div>
  <div v-else class="text-center text-sm italic text-gray-600 my-5">
    (Adresse konnte nicht gefunden werden.)
  </div>
</template>
<script setup>
const props = defineProps({
  coordinates: {
    type: Array,
    default: null,
  },
  addressString: {
    type: String,
    default: "",
  },
  zoom: {
    type: Number,
    default: 15,
  },
});

const addressCoordinates = ref([]);
onMounted(() => {
  getCoordinates();
});

const getCoordinates = async () => {
  if (props.coordinates) {
    addressCoordinates.value = [
      props.coordinates.points[1],
      props.coordinates.points[0],
    ];
  } else if (props.addressString) {
    try {
      const response = await $fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(props.addressString)}&limit=1&accept-language=de`,
      );

      console.log("Nominatim-Antwort:", response);
      console.log("***")

      let coordinates = [];
      console.log("***", coordinates)
      if (response[0] && response[0].lat && response[0].lon) {
        console.log("Gefundene Koordinaten:", response[0].lat, response[0].lon);
        const { lat, lon } = response[0];
        coordinates = [parseFloat(lat), parseFloat(lon)];
      }
      addressCoordinates.value = coordinates;
    } catch (error) {
      console.error("Suche fehlgeschlagen:", error);
    }
  }
};
</script>

<style scoped></style>
