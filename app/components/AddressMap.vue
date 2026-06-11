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
          <UIcon :name="iconMapPin" class="size-10" />
        </LIcon>
      </LMarker>
    </LMap>
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

const addressCoordinates = computed(() => {
  if (
    props.coordinates &&
    props.coordinates.points &&
    props.coordinates.points.length === 2
  ) {
    return [props.coordinates.points[1], props.coordinates.points[0]];
  }
  return [];
});
</script>

<style scoped>
.leaflet-div-icon {
  background: transparent;
  border: transparent;
}
</style>
