<template>
  <div
    class="flex items-center gap-1 bg-default border rounded-md px-1.5 border-accented focus-within:ring-1 focus-within:border-primary focus-within:ring-primary min-h-10"
    @focusout="onFocusOut"
  >
    <UPopover
      v-model:open="isOpen"
      :content="{ side: 'bottom', align: 'start', sideOffset: 6 }"
      :ui="{ content: 'p-0 overflow-visible z-[80]' }"
    >
      <template #anchor>
        <!--date version -->
        <UTooltip v-if="version === 'date'" text="Kalender öffnen">
          <button
            type="button"
            tabindex="-1"
            class="shrink-0 p-1 rounded text-gray-400 flex items-center hover:text-primary transition-colors"
            aria-label="Kalender öffnen"
            @click.stop="onOpenCalender"
          >
            <UIcon name="i-lucide-calendar" class="size-4" />
          </button>
        </UTooltip>
        <!-- time version -->
        <UTooltip v-if="version === 'time'" text="Uhrzeit wählen">
          <button
            type="button"
            tabindex="-1"
            class="shrink-0 p-1 rounded text-gray-400 hover:text-primary transition-colors"
            aria-label="Uhrzeit wählen"
            @click.stop="onOpenTimeScroller"
          >
            <UIcon name="i-lucide-clock" class="size-4" />
          </button>
        </UTooltip>
      </template>
      <template #content>
        <!-- date version -->
        <div v-if="version === 'date'" class="p-2 w-[18rem]">
          <DatePicker
            v-model="model"
            :range="false"
            @update:model-value="isOpen = false"
          />
        </div>
        <!-- time version -->
        <div v-if="version === 'time'" class="p-3 w-56">
          <TimePickerScroller
            :key="`start-${model?.hours}-${model?.minutes}`"
            :hour="model?.hours ?? nowHour"
            :minute="model?.minutes ?? 0"
            @update-hour="(h) => onBarScrollerHour(h)"
            @update-minute="(m) => onBarScrollerMinute(m)"
          />
        </div>
      </template>
    </UPopover>
    <div class="flex-1 min-w-0">
      <slot />
    </div>
  </div>
</template>
<script setup>
import DatePicker from "~/components/inputs/DatePicker.vue";
import TimePickerScroller from "~/components/inputs/TimePickerScroller.vue";

const model = defineModel(Object);
const props = defineProps({
  version: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:popoverOpen", "iconClick", "focusOut"]);

const isOpen = ref(false);

const nowHour = computed(() => new Date().getHours());
const nowMinute = computed(() => {
  const min = new Date().getMinutes();
  return Math.ceil(min / 5) * 5;
});

function onOpenCalender() {
  isOpen.value = true;
}
function onOpenTimeScroller() {
  if (!model.value) {
    model.value = { hours: nowHour.value, minutes: nowMinute.value };
  }
  isOpen.value = true;
}

function onBarScrollerHour(hour) {
  console.log("new hour", hour);
  const current = model.value;
  applyTime(hour, current?.minutes ?? nowMinute);
}

function onBarScrollerMinute(minute) {
  console.log("new minute", minute);
  const current = model.value;
  applyTime(current?.hours ?? nowHour.value, minute);
}
function applyTime(hours, minutes) {
  model.value = { hours, minutes };
}
</script>
