<template>
  <div>
    <UModal
      v-model:open="isOpen"
      title="Time Picker"
      :overlay="false"
      close-icon="i-lucide-x"
      :ui="{
        content: 'w-100 flex items-center justify-center',
      }"
    >
      <template #content>
        <UCard variant="soft" class="w-full self-center" style="height: 370px">
          <div class="flex justify-between items-center">
            <p class="text-lg font-bold mb-5">Uhrzeit auswählen</p>
            <div>
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-x"
                  class="rounded-xl"
                  @click="closeDialog"
                />
              
            </div>
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
    </UModal>
  </div>
</template>

<script setup>
import TimePickerScroller from "./TimePickerScroller.vue";

const props = defineProps({
  openDialog: {
    type: Boolean,
    default: false,
  },
  time: {
    type: Object,
    default: () => ({ hours: 0, minutes: 0 }),
  },
});
const emit = defineEmits(["updateTime", "closeDialog"]);

const isOpen = ref(props.openDialog);
watch(
  () => props.openDialog,
  (newVal) => {
    isOpen.value = newVal;
  },
  { immediate: true },
);

const selectedHour = ref(props.time?.hours || 0);
const selectedMinute = ref(props.time?.minutes || 0);
watch(
    () => props.time,
    (newVal) => {
      selectedHour.value = newVal?.hours ?? 0;
      selectedMinute.value = newVal?.minutes ?? 0;
    },
    { immediate: true, deep: true }
);

function setHour(hour) {
  selectedHour.value = hour;
}
function setMinute(minute) {
  selectedMinute.value = minute;
}

function selectTime() {
  if(!selectedHour.value && !selectedMinute.value) {
    closeDialog()
    return;
  }
  emit("updateTime", {
    hours: selectedHour.value,
    minutes: selectedMinute.value,
  });
  closeDialog();
}

function closeDialog() {
  emit("closeDialog")
}
</script>
