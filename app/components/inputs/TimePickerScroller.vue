<template>
  <div class="flex justify-center">
    <div class="time-picker__list">
      <div
        v-for="hourValue in hourList"
        :key="hourValue"
        :ref="el => setHourRef(el, hourValue)"
        class="time-picker__item text-black dark:text-white hover:text-primary"
        :class="{ 'bg-primary/40 text-white': hourValue === _hours }"
        @click="selectHour(hourValue)"
      >
        {{ hourValue }}
      </div>
    </div>
    <div class="time-picker__list">
      <div
        v-for="minuteValue in minutesList"
        :key="minuteValue"
        :ref="el => setMinuteRef(el, minuteValue)"
        class="time-picker__item text-black dark:text-white hover:text-primary"
        :class="{ 'bg-primary/40 text-white': minuteValue === _minutes }"
        @click="selectMinute(minuteValue)"
      >
        {{ minuteValue }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from "vue";

const props = defineProps({
  hour: {
    type: Number,
    default: 0,
  },
  minute: {
    type: Number,
    default: 0,
  },
});
const emit = defineEmits(["updateHour", "updateMinute"]);

const _hours = ref(Number(props.hour) || 0);
const _minutes = ref(Math.ceil(Number(props.minute) / 5) * 5 || 0);

const hourList = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23,
];
const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const hourRefs = ref({});
const minuteRefs = ref({});


function selectHour(hour) {
  _hours.value = hour;
  emit("updateHour", hour);
}
function selectMinute(minute) {
  _minutes.value = minute;
  emit("updateMinute", minute);
}

function setHourRef(el, value) {
  if (el) hourRefs.value[value] = el;
}
function setMinuteRef(el, value) {
  if (el) minuteRefs.value[value] = el;
}

function scrollToHour(hour) {
  nextTick(() => {
    const el = hourRefs.value[hour];
    if (el) {
      el.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  });
}
function scrollToMinute(minute) {
  nextTick(() => {
    const el = minuteRefs.value[minute];
    if (el) {
      el.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  });
}

watch(_hours, (newVal) => {
  scrollToHour(newVal);
});
watch(_minutes, (newVal) => {
  scrollToMinute(newVal);
});

onMounted(() => {
  scrollToHour(_hours.value);
  scrollToMinute(_minutes.value)
});

</script>
<style>
.time-picker__list {
  float: left;
  width: 50%;
  height: 240px;
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    width: 3px;
  }

  &::-webkit-scrollbar-track {
    background: #efefef;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
  }
}
.time-picker__item {
  padding: 5px 0;
  font-size: 1.5em;
  text-align: center;
  cursor: pointer;
  transition: font-size 0.3s;
}

</style>
