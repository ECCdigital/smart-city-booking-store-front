<template>
  <UPopover
    v-model:open="isOpen"
    arrow
    :content="{ side: 'bottom', align: 'start', sideOffset: 8 }"
    :ui="{ content: 'p-0 overflow-visible' }"
  >
    <template #anchor>
      <slot />
    </template>

    <template #content>
      <UCard variant="soft" class="w-72" style="height: 370px">
        <div class="flex justify-between items-center">
          <p class="text-lg font-bold">Uhrzeit auswählen</p>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            class="rounded-xl"
            @click="closeDialog"
          />
        </div>
        <div class="glass p-3 w-full">
          <TimePickerScroller
            :hour="selectedHour"
            :minute="selectedMinute"
            @update-hour="setHour"
            @update-minute="setMinute"
          />

          <div class="mt-2 flex justify-end">
            <UButton
              label="OK"
              variant="ghost"
              class="dark:text-light text-dark"
              @click="selectTime"
            />
          </div>
        </div>
      </UCard>
    </template>
  </UPopover>
</template>

<script setup>
import TimePickerScroller from "./TimePickerScroller.vue";

const props = defineProps({
  time: {
    type: Object,
    default: () => ({ hours: 0, minutes: 0 }),
  },
});

const emit = defineEmits(["updateTime"]);

const isOpen = defineModel("open", { type: Boolean, default: false });

const selectedHour = ref(props.time?.hours ?? 0);
const selectedMinute = ref(props.time?.minutes ?? 0);

watch(
  () => props.time,
  (newVal) => {
    selectedHour.value = newVal?.hours ?? 0;
    selectedMinute.value = newVal?.minutes ?? 0;
  },
  { immediate: true, deep: true },
);

watch(isOpen, (open) => {
  if (open) {
    selectedHour.value = props.time?.hours ?? 0;
    selectedMinute.value = props.time?.minutes ?? 0;
  }
});

function setHour(hour) {
  selectedHour.value = hour;
}

function setMinute(minute) {
  selectedMinute.value = minute;
}

function selectTime() {
  emit("updateTime", {
    hours: selectedHour.value,
    minutes: selectedMinute.value,
  });
  closeDialog();
}

function closeDialog() {
  isOpen.value = false;
}
</script>
