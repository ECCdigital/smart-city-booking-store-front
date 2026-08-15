<template>
  <div ref="wrapperRef" class="relative">
    <button
      ref="triggerRef"
      type="button"
      class="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-primary dark:hover:border-primary hover:text-gray-900 dark:hover:text-white transition-colors"
      :aria-label="$t('timePeriods.jumpToDate')"
      :title="$t('timePeriods.jumpToDate')"
      @click.stop="togglePicker"
    >
      <UIcon name="i-lucide-calendar-search" class="text-sm" />
    </button>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="showPicker"
          ref="pickerRef"
          class="fixed z-[100] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl"
          :style="pickerStyle"
          @click.stop
        >
          <VueDatePicker
            :min-date="props.minDate"
            :locale="props.locale"
            month-name-format="long"
            inline
            auto-apply
            :enable-time-picker="false"
            :dark="isDark"
            @update:model-value="onDateSelected"
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

const props = defineProps({
  minDate: {
    type: Date,
    default: () => new Date(),
  },
  locale: {
    type: String,
    default: "de",
  },
});

const emit = defineEmits(["select"]);

const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");

const showPicker = ref(false);
const wrapperRef = ref(null);
const triggerRef = ref(null);
const pickerRef = ref(null);
const pickerStyle = ref({ top: "0px", left: "0px" });

function updatePickerPosition() {
  const trigger = triggerRef.value;
  const picker = pickerRef.value;
  if (!trigger) return;

  const rect = trigger.getBoundingClientRect();
  const gap = 8;
  const pickerWidth = picker?.offsetWidth ?? 280;
  const pickerHeight = picker?.offsetHeight ?? 320;

  let top = rect.bottom + gap;
  let left = rect.left;

  if (window.innerWidth < 640) {
    left = rect.left + rect.width / 2 - pickerWidth / 2;
  }

  left = Math.max(8, Math.min(left, window.innerWidth - pickerWidth - 8));

  if (top + pickerHeight > window.innerHeight - 8) {
    top = Math.max(8, rect.top - pickerHeight - gap);
  }

  pickerStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
  };
}

function togglePicker() {
  showPicker.value = !showPicker.value;
}

function onDateSelected(date) {
  if (!date) return;
  emit("select", new Date(date));
  showPicker.value = false;
}

function onClickOutside(event) {
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (wrapperRef.value?.contains(target)) return;
  if (pickerRef.value?.contains(target)) return;
  if (target instanceof Element && target.closest(".dp__overlay, .dp__menu")) return;
  showPicker.value = false;
}

watch(showPicker, (open) => {
  if (open) {
    nextTick(() => {
      updatePickerPosition();
      requestAnimationFrame(updatePickerPosition);
    });
    document.addEventListener("pointerdown", onClickOutside);
    window.addEventListener("resize", updatePickerPosition);
    window.addEventListener("scroll", updatePickerPosition, true);
  } else {
    document.removeEventListener("pointerdown", onClickOutside);
    window.removeEventListener("resize", updatePickerPosition);
    window.removeEventListener("scroll", updatePickerPosition, true);
  }
});

onUnmounted(() => {
  document.removeEventListener("pointerdown", onClickOutside);
  window.removeEventListener("resize", updatePickerPosition);
  window.removeEventListener("scroll", updatePickerPosition, true);
});
</script>

<style scoped>
:deep(.dp__theme_light) {
  --dp-primary-color: var(--color-primary);
  --dp-primary-text-color: #fff;
  --dp-background-color: #fff;
}

:deep(.dp__theme_dark) {
  --dp-primary-color: var(--color-primary);
  --dp-primary-text-color: #fff;
  --dp-background-color: #111827;
}

/* Ensure month/year overlay covers the calendar completely */
:deep(.dp__overlay) {
  background: var(--dp-background-color) !important;
}
</style>
