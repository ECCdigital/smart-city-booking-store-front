<template>
  <div>
    <p>
      <UIcon name="i-lucide-clock" class="size-5" />
      <span v-if="props.event.information?.startDate" class="p-3">
        {{ showDate() }}
      </span>
      <span v-else class="italic p-3">Keine Zeitangaben bekannt.</span>
    </p>
  </div>
</template>
<script setup>
const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
});

function showDate() {
  const info = props.event.information;
  const startDate = info?.startDate;
  const startTime = info?.startTime;
  const endDate = info?.endDate;
  const endTime = info?.endTime;
  if (startDate && endDate && startDate === endDate && startTime && endTime) {
    // Gleiches Datum, beide Uhrzeiten anzeigen
    return (
      new Date(startDate).toLocaleDateString([], { dateStyle: "short" }) +
      ", " +
      new Date(startDate + " " + startTime).toLocaleTimeString([], {
        timeStyle: "short",
      }) +
      " - " +
      new Date(endDate + " " + endTime).toLocaleTimeString([], {
        timeStyle: "short",
      })
    );
  } else {
    // Unterschiedliche Daten
    return (
      new Date(startDate + " " + startTime).toLocaleString([], {
        dateStyle: "short",
        timeStyle: "short",
      }) +
      (endDate && endTime
        ? " - " +
          new Date(endDate + " " + endTime).toLocaleString([], {
            dateStyle: "short",
            timeStyle: "short",
          })
        : "")
    );
  }
}
</script>

<style scoped></style>
