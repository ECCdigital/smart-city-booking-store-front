<script setup>
const props = defineProps({
  steps: {
    type: Array,
    required: true,
    validator: (value) =>
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((s) => s && typeof s.title === "string"),
  },
  modelValue: {
    type: Number,
    default: 1,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  canGoNext: {
    type: Boolean,
    default: true,
  },
  canGoBack: {
    type: Boolean,
    default: true,
  },
  nextLabel: {
    type: String,
    default: null,
  },
  backLabel: {
    type: String,
    default: null,
  },
  finishLabel: {
    type: String,
    default: null,
  },
  hideBackOnFirst: {
    type: Boolean,
    default: true,
  },
  hideStepHeading: {
    type: Boolean,
    default: false,
  },
  hideFooter: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "next", "back", "finish"]);

const { t } = useI18n();

const totalSteps = computed(() => props.steps.length);

const currentIndex = computed(() => {
  const idx = Number(props.modelValue) || 1;
  return Math.max(1, Math.min(idx, totalSteps.value));
});

const currentStep = computed(() => props.steps[currentIndex.value - 1] || null);
const isFirstStep = computed(() => currentIndex.value === 1);
const isLastStep = computed(() => currentIndex.value === totalSteps.value);

const slotName = computed(() => {
  const step = currentStep.value;
  return step?.key ? `step-${step.key}` : `step-${currentIndex.value}`;
});

const nextButtonLabel = computed(() => {
  if (isLastStep.value) {
    return props.finishLabel ?? t("stepper.finish");
  }
  return currentStep.value?.nextLabel ?? props.nextLabel ?? t("stepper.next");
});

const backButtonLabel = computed(() => props.backLabel ?? t("stepper.back"));

function goNext() {
  if (!props.canGoNext || props.loading) return;
  if (isLastStep.value) {
    emit("finish");
    return;
  }
  emit("next", currentIndex.value);
  emit("update:modelValue", currentIndex.value + 1);
}

function goBack() {
  if (!props.canGoBack || isFirstStep.value || props.loading) return;
  emit("back", currentIndex.value);
  emit("update:modelValue", currentIndex.value - 1);
}

function isSegmentActive(index) {
  return index < currentIndex.value;
}
</script>

<template>
  <div class="w-full flex flex-col min-h-[calc(100vh-5rem)]">
    <!-- Progress-Bar -->
    <div class="flex gap-2 mb-10">
      <div
        v-for="(_, idx) in steps"
        :key="idx"
        class="flex-1 h-1 rounded-full transition-colors duration-300"
        :class="
          isSegmentActive(idx)
            ? 'bg-secondary dark:bg-secondary'
            : 'bg-gray-200 dark:bg-gray-700'
        "
      />
    </div>

    <!-- Header -->
    <div
      v-if="!hideStepHeading"
      class="flex items-baseline justify-between gap-4 mb-8"
    >
      <h2
        class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate"
      >
        {{ currentStep?.title }}
      </h2>
      <span
        class="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap hidden sm:block"
      >
        {{
          t("stepper.stepOf", {
            current: currentIndex,
            total: totalSteps,
          })
        }}
      </span>
    </div>

    <!-- Inhalt (über Named-Slot) -->
    <div class="mb-10 flex-1">
      <slot
        :name="slotName"
        :step="currentStep"
        :index="currentIndex"
        :is-first="isFirstStep"
        :is-last="isLastStep"
      />
    </div>

    <!-- Footer / Navigation -->
    <div
      v-if="!hideFooter"
      class="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-6 flex items-center justify-between gap-4 z-10"
    >
      <UButton
        v-if="!hideBackOnFirst || !isFirstStep"
        variant="ghost"
        color="neutral"
        :disabled="!canGoBack || isFirstStep || loading"
        icon="i-lucide-arrow-left"
        @click="goBack"
      >
        {{ backButtonLabel }}
      </UButton>
      <span v-else />

      <UButton
        color="primary"
        :variant="canGoNext ? 'solid' : 'soft'"
        trailing-icon="i-lucide-arrow-right"
        :loading="loading"
        :disabled="!canGoNext"
        :class="!canGoNext ? 'text-gray-500' : ''"
        @click="goNext"
      >
        {{ nextButtonLabel }}
      </UButton>
    </div>
  </div>
</template>

<style scoped></style>
