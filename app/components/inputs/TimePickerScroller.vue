<template>
  <div class="ios-time-picker" role="group" aria-label="Uhrzeit">
    <div class="ios-time-picker__highlight" aria-hidden="true" />
    <div
      class="ios-time-picker__fade ios-time-picker__fade--top"
      aria-hidden="true"
    />
    <div
      class="ios-time-picker__fade ios-time-picker__fade--bottom"
      aria-hidden="true"
    />
    <div class="ios-time-picker__wheels">
      <!-- Stunden -->
      <div
        ref="hourWheelRef"
        class="ios-time-picker__wheel"
        @scroll="onHourScroll"
        @scrollend="snapHour"
      >
        <div class="ios-time-picker__spacer" />
        <button
          v-for="(value, index) in hourLoop"
          :key="`h-${index}`"
          type="button"
          class="ios-time-picker__item"
          :class="{
            'is-selected':
              value === _hours && isCenterIndex(hourWheelRef, index),
          }"
          :data-value="value"
          :data-index="index"
          @click="selectHourAt(index, value)"
        >
          {{ pad2(value) }}
        </button>
        <div class="ios-time-picker__spacer" />
      </div>
      <div class="ios-time-picker__colon" aria-hidden="true">:</div>
      <!-- Minuten -->
      <div
        ref="minuteWheelRef"
        class="ios-time-picker__wheel"
        @scroll="onMinuteScroll"
        @scrollend="snapMinute"
      >
        <div class="ios-time-picker__spacer" />
        <button
          v-for="(value, index) in minuteLoop"
          :key="`m-${index}`"
          type="button"
          class="ios-time-picker__item"
          :class="{
            'is-selected':
              value === _minutes && isCenterIndex(minuteWheelRef, index),
          }"
          :data-value="value"
          :data-index="index"
          @click="selectMinuteAt(index, value)"
        >
          {{ pad2(value) }}
        </button>
        <div class="ios-time-picker__spacer" />
      </div>
    </div>
  </div>
</template>
<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
const props = defineProps({
  hour: { type: Number, default: 0 },
  minute: { type: Number, default: 0 },
});
const emit = defineEmits(["updateHour", "updateMinute"]);
const ITEM_HEIGHT = 28;
const LOOP_COPIES = 7;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const hourWheelRef = ref(null);
const minuteWheelRef = ref(null);
const _hours = ref(clampHour(props.hour));
const _minutes = ref(snapMinuteValue(props.minute));
const hourLoop = computed(() =>
  Array.from({ length: LOOP_COPIES }, () => HOURS).flat(),
);
const minuteLoop = computed(() =>
  Array.from({ length: LOOP_COPIES }, () => MINUTES).flat(),
);
const midHourOffset = Math.floor(LOOP_COPIES / 2) * HOURS.length;
const midMinuteOffset = Math.floor(LOOP_COPIES / 2) * MINUTES.length;
let hourScrollRaf = 0;
let minuteScrollRaf = 0;
let hourSettling = false;
let minuteSettling = false;
function pad2(n) {
  return String(n).padStart(2, "0");
}
function clampHour(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return ((Math.round(n) % 24) + 24) % 24;
}
function snapMinuteValue(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const rounded = Math.round(n / 5) * 5;
  return ((rounded % 60) + 60) % 60;
}
function scrollTopForIndex(index) {
  return index * ITEM_HEIGHT;
}
function centerIndexFromScroll(el) {
  if (!el) return 0;
  return Math.round(el.scrollTop / ITEM_HEIGHT);
}
function isCenterIndex(el, index) {
  if (!el) return false;
  return centerIndexFromScroll(el) === index;
}
function normalizeLoop(el, listLength, onJump) {
  if (!el || !listLength) return;
  const index = centerIndexFromScroll(el);
  const midStart = Math.floor(LOOP_COPIES / 2) * listLength;
  const midEnd = midStart + listLength - 1;
  if (index < listLength || index > (LOOP_COPIES - 1) * listLength - 1) {
    const valueIndex = ((index % listLength) + listLength) % listLength;
    const target = midStart + valueIndex;
    el.scrollTop = scrollTopForIndex(target);
    onJump?.(target);
  } else if (index < midStart - listLength || index > midEnd + listLength) {
    const valueIndex = ((index % listLength) + listLength) % listLength;
    const target = midStart + valueIndex;
    el.scrollTop = scrollTopForIndex(target);
    onJump?.(target);
  }
}
function emitHourFromWheel() {
  const el = hourWheelRef.value;
  if (!el) return;
  const index = centerIndexFromScroll(el);
  const value = hourLoop.value[index];
  if (value == null) return;
  if (value !== _hours.value) {
    _hours.value = value;
    emit("updateHour", value);
  }
}
function emitMinuteFromWheel() {
  const el = minuteWheelRef.value;
  if (!el) return;
  const index = centerIndexFromScroll(el);
  const value = minuteLoop.value[index];
  if (value == null) return;
  if (value !== _minutes.value) {
    _minutes.value = value;
    emit("updateMinute", value);
  }
}
function onHourScroll() {
  if (hourSettling) return;
  cancelAnimationFrame(hourScrollRaf);
  hourScrollRaf = requestAnimationFrame(() => {
    normalizeLoop(hourWheelRef.value, HOURS.length);
    emitHourFromWheel();
  });
}
function onMinuteScroll() {
  if (minuteSettling) return;
  cancelAnimationFrame(minuteScrollRaf);
  minuteScrollRaf = requestAnimationFrame(() => {
    normalizeLoop(minuteWheelRef.value, MINUTES.length);
    emitMinuteFromWheel();
  });
}
function snapToIndex(el, index, behavior = "smooth") {
  if (!el) return;
  el.scrollTo({ top: scrollTopForIndex(index), behavior });
}
function snapHour() {
  const el = hourWheelRef.value;
  if (!el) return;
  normalizeLoop(el, HOURS.length);
  const index = centerIndexFromScroll(el);
  hourSettling = true;
  snapToIndex(el, index, "smooth");
  emitHourFromWheel();
  window.setTimeout(() => {
    hourSettling = false;
  }, 30);
}
function snapMinute() {
  const el = minuteWheelRef.value;
  if (!el) return;
  normalizeLoop(el, MINUTES.length);
  const index = centerIndexFromScroll(el);
  minuteSettling = true;
  snapToIndex(el, index, "smooth");
  emitMinuteFromWheel();
  window.setTimeout(() => {
    minuteSettling = false;
  }, 120);
}
function selectHourAt(index, value) {
  snapToIndex(hourWheelRef.value, index, "smooth");
  _hours.value = value;
  emit("updateHour", value);
}
function selectMinuteAt(index, value) {
  snapToIndex(minuteWheelRef.value, index, "smooth");
  _minutes.value = value;
  emit("updateMinute", value);
}
function jumpToHour(hour, behavior = "auto") {
  const value = clampHour(hour);
  _hours.value = value;
  const index = midHourOffset + value;
  snapToIndex(hourWheelRef.value, index, behavior);
}
function jumpToMinute(minute, behavior = "auto") {
  const value = snapMinuteValue(minute);
  _minutes.value = value;
  const valueIndex = MINUTES.indexOf(value);
  const index = midMinuteOffset + (valueIndex >= 0 ? valueIndex : 0);
  snapToIndex(minuteWheelRef.value, index, behavior);
}
watch(
  () => props.hour,
  (value) => {
    const next = clampHour(value);
    if (next !== _hours.value) jumpToHour(next, "auto");
  },
);
watch(
  () => props.minute,
  (value) => {
    const next = snapMinuteValue(value);
    if (next !== _minutes.value) jumpToMinute(next, "auto");
  },
);
onMounted(async () => {
  await nextTick();
  jumpToHour(_hours.value, "auto");
  jumpToMinute(_minutes.value, "auto");
});
onBeforeUnmount(() => {
  cancelAnimationFrame(hourScrollRaf);
  cancelAnimationFrame(minuteScrollRaf);
});
</script>
<style scoped>
.ios-time-picker {
  --wheel-item-height: 28px;
  --wheel-visible: 5;
  --wheel-height: calc(var(--wheel-item-height) * var(--wheel-visible));
  --wheel-width: 4.5rem;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: var(--wheel-height);
  user-select: none;
}
.ios-time-picker__wheels {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: stretch;
  gap: 0.15rem;
  height: 100%;
}
.ios-time-picker__wheel {
  width: var(--wheel-width);
  height: 100%;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.ios-time-picker__wheel::-webkit-scrollbar {
  display: none;
}
.ios-time-picker__spacer {
  height: calc(var(--wheel-item-height) * 2);
  flex-shrink: 0;
}
.ios-time-picker__item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: var(--wheel-item-height);
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgb(0 0 0 / 0.35);
  font-size: 0.95rem;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 1;
  cursor: pointer;
  scroll-snap-align: center;
  transition:
    color 0.12s ease,
    transform 0.12s ease,
    font-weight 0.12s ease;
}
.ios-time-picker__item.is-selected {
  color: rgb(0 0 0 / 0.92);
  font-weight: 600;
  transform: scale(1.06);
}
.dark .ios-time-picker__item {
  color: rgb(255 255 255 / 0.35);
}
.dark .ios-time-picker__item.is-selected {
  color: rgb(255 255 255 / 0.95);
}
.ios-time-picker__colon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: rgb(0 0 0 / 0.55);
  pointer-events: none;
}
.dark .ios-time-picker__colon {
  color: rgb(255 255 255 / 0.6);
}
.ios-time-picker__highlight {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 0;
  width: calc(var(--wheel-width) * 2 + 1.2rem);
  height: var(--wheel-item-height);
  transform: translate(-50%, -50%);
  border-radius: 0.5rem;
  background: rgb(120 120 128 / 0.16);
  pointer-events: none;
}
.dark .ios-time-picker__highlight {
  background: rgb(255 255 255 / 0.12);
}
.ios-time-picker__fade {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 2;
  height: calc(var(--wheel-item-height) * 2);
  pointer-events: none;
}
.ios-time-picker__fade--top {
  top: 0;
  background: linear-gradient(
    to bottom,
    rgb(255 255 255 / 0.92),
    rgb(255 255 255 / 0)
  );
}
.ios-time-picker__fade--bottom {
  bottom: 0;
  background: linear-gradient(
    to top,
    rgb(255 255 255 / 0.92),
    rgb(255 255 255 / 0)
  );
}
.dark .ios-time-picker__fade--top {
  background: linear-gradient(
    to bottom,
    rgb(31 41 55 / 0.95),
    rgb(31 41 55 / 0)
  );
}
.dark .ios-time-picker__fade--bottom {
  background: linear-gradient(to top, rgb(31 41 55 / 0.95), rgb(31 41 55 / 0));
}
</style>
