<template>
  <div>
    <p>
      <UIcon v-if="useIcon" name="i-lucide-clock" class="size-5" />
      <span v-if="event.information?.startDate" class="p-3">
        {{ showDate() }}
      </span>
      <span v-else class="italic p-3">Keine Zeitangaben</span>
    </p>
  </div>
</template>
<script setup>
const props = defineProps({
  event: { type: Object, required: true },
  useIcon: { type: Boolean, default: true },
});

const LOCALE = "de-DE";
const TIME_ZONE = "Europe/Berlin";

function isoLocal(date, time) {
  // date: "2026-02-28", time: "12:00"
  if (!date) return null;
  const t = time ?? "00:00";
  return `${date}T${t}:00`;
}

function fmtDate(date) {
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "short",
    timeZone: TIME_ZONE,
  }).format(date);
}

function fmtTime(date) {
  return new Intl.DateTimeFormat(LOCALE, {
    timeStyle: "short",
    timeZone: TIME_ZONE,
  }).format(date);
}

function fmtDateTime(date) {
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: TIME_ZONE,
  }).format(date);
}

function showDate() {
  const info = props.event.information;
  const { startDate, startTime, endDate, endTime } = info ?? {};

  if (!startDate) return "";

  const startIso = isoLocal(startDate, startTime);
  const endIso = endDate ? isoLocal(endDate, endTime) : null;

  const start = startIso ? new Date(startIso) : null;
  const end = endIso ? new Date(endIso) : null;

  if (
    startDate &&
    endDate &&
    startDate === endDate &&
    startTime &&
    endTime &&
    start &&
    end
  ) {
    return `${fmtDate(start)}, ${fmtTime(start)} - ${fmtTime(end)}`;
  }

  return `${fmtDateTime(start)}${end ? ` - ${fmtDateTime(end)}` : ""}`;
}
</script>

<style scoped></style>
