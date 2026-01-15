<template>
  <div style="height: 300px" class="mb-2">
    <LMap
      :zoom="props.zoom"
      :center="[coordinates.points[1], coordinates.points[0]]"
      :use-global-leaflet="false"
    >
      <LTileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        layer-type="base"
        name="OpenStreetMap"
      />
      <LMarker :lat-lng="[coordinates.points[1], coordinates.points[0]]" />
    </LMap>
  </div>
</template>
<script setup>
const props = defineProps({
  coordinates: {
    type: Array,
    default: [],
  },
  addressString:{
    type: String,
    default: '',
  },
  zoom: {
    type: Number,
    default: 15,
  },
});
</script>

<style scoped></style>
