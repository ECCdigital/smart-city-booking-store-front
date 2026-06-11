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
      <LMarker :lat-lng="addressCoordinates">
        <LIcon :icon-anchor="[20, 40]">
          <UIcon :name="iconMapPin" class="size-10"/>
        </LIcon>
      </LMarker>
    </LMap>
  </div>
  <div v-else-if="!fetchedCoordinates">
    <USkeleton class="h-[300px] w-full" />
  </div>
  <div
    v-else
    class="h-[300px] w-full grid place-content-center text-sm italic text-gray-600 dark:text-gray-400 my-5"
  >
    <p>(Adresse konnte nicht gefunden werden.)</p>
  </div>
</template>
<script setup>
const props = defineProps({
  coordinates: {
    type: Object,
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

const { iconMapPin } = useBookableMap();

const addressCoordinates = ref([]);
const fetchedCoordinates = ref(false);
onMounted(() => {
  getCoordinates();
});

const getCoordinates = async () => {
  if (props.coordinates?.points) {
    addressCoordinates.value = [
      props.coordinates.points[1],
      props.coordinates.points[0],
    ];
  } else if (props.addressString) {
    try {
      const response = await $fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          props.addressString,
        )}&limit=1&accept-language=de`,
      );

      let coordinates = [];
      if (response[0] && response[0].lat && response[0].lon) {
        const { lat, lon } = response[0];
        coordinates = [parseFloat(lat), parseFloat(lon)];
      }
      addressCoordinates.value = coordinates;
      fetchedCoordinates.value = true;
    } catch (error) {
      console.error("Suche fehlgeschlagen:", error);
    }
  }
};
</script>

<style scoped>
.leaflet-div-icon {
  background: transparent;
  border: transparent;
}
</style>
