<template>
  <div ref="wrapperRef" class="relative">
    <button
      type="button"
      class="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-primary dark:hover:border-primary hover:text-gray-900 dark:hover:text-white transition-colors"
      :aria-label="$t('timePeriods.jumpToDate')"
      :title="$t('timePeriods.jumpToDate')"
      @click.stop="showPicker = !showPicker"
    >
      <UIcon name="i-lucide-calendar-search" class="text-sm" />
    </button>

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
        class="absolute left-0 top-full mt-2 z-50 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl"
        @click.stop
      >
        <VueDatePicker
          :min-date="minDate"
          :locale="locale"
          month-name-format="long"
          inline
          auto-apply
          :enable-time-picker="false"
          :dark="isDark"
          @update:model-value="onDateSelected"
        />
      </div>
    </Transition>
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

function onDateSelected(date) {
  if (!date) return;
  emit("select", new Date(date));
  showPicker.value = false;
}

/* ── close on outside click ────────────────────────────── */
function onClickOutside(event) {
  if (!wrapperRef.value) return;
  if (wrapperRef.value.contains(event.target)) return;
  if (event.target.closest(".dp__overlay, .dp__menu")) return;
  showPicker.value = false;
}

watch(showPicker, (open) => {
  if (open) {
    nextTick(() =>
      document.addEventListener("pointerdown", onClickOutside),
    );
  } else {
    document.removeEventListener("pointerdown", onClickOutside);
  }
});

onUnmounted(() => {
  document.removeEventListener("pointerdown", onClickOutside);
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
