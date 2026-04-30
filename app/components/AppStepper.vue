<script setup>
/**
 * AppStepper
 * ----------
 * Generischer, mit beliebigem Inhalt füllbarer Stepper.
 *
 * Beispiel:
 *   const step = ref(1);
 *   const steps = [
 *     { key: "objects", title: "Objekte wählen", nextLabel: "Weiter zu Zeitraum" },
 *     { key: "period",  title: "Zeitraum & Extras", nextLabel: "Weiter zu Daten" },
 *     { key: "data",    title: "Daten eingeben",   nextLabel: "Weiter zur Bestätigung" },
 *     { key: "confirm", title: "Bestätigung",      nextLabel: "Buchung abschließen" },
 *   ];
 *
 *   <AppStepper v-model="step" :steps="steps" @finish="submit">
 *     <template #step-objects>...</template>
 *     <template #step-period>...</template>
 *     <template #step-data>...</template>
 *     <template #step-confirm>...</template>
 *   </AppStepper>
 *
 * Slots:
 *   - Pro Step ein Named-Slot: `step-<key>` (falls `step.key` gesetzt)
 *     oder `step-<index>` (1-basiert) als Fallback.
 *   - Slot-Props: `{ step, index, isFirst, isLast }`.
 */

const props = defineProps({
  /**
   * Liste der Steps. Jeder Eintrag:
   * { key?: string, title: string, nextLabel?: string }
   */
  steps: {
    type: Array,
    required: true,
    validator: (value) =>
        Array.isArray(value) &&
        value.length > 0 &&
        value.every((s) => s && typeof s.title === "string"),
  },
  /** Aktueller Step (1-basiert) – v-model. */
  modelValue: {
    type: Number,
    default: 1,
  },
  /** Loading-State für den Weiter/Abschließen-Button. */
  loading: {
    type: Boolean,
    default: false,
  },
  /** Wenn false, ist der Weiter-Button deaktiviert (z.B. für Validierung). */
  canGoNext: {
    type: Boolean,
    default: true,
  },
  /** Wenn false, ist der Zurück-Button deaktiviert. */
  canGoBack: {
    type: Boolean,
    default: true,
  },
  /** Optionaler Override für das Label des Weiter-Buttons (Fallback je Step / i18n). */
  nextLabel: {
    type: String,
    default: null,
  },
  /** Optionaler Override für das Label des Zurück-Buttons. */
  backLabel: {
    type: String,
    default: null,
  },
  /** Optionaler Override für das Label des letzten Steps (Abschließen). */
  finishLabel: {
    type: String,
    default: null,
  },
  /** Zurück-Button im ersten Step ausblenden. */
  hideBackOnFirst: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:modelValue", "next", "back", "finish"]);

const { t } = useI18n();

// --- Berechnete Werte ------------------------------------------------------

const totalSteps = computed(() => props.steps.length);

const currentIndex = computed(() => {
  // Auf gültigen Bereich begrenzen.
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
  return (
      currentStep.value?.nextLabel ??
      props.nextLabel ??
      t("stepper.next")
  );
});

const backButtonLabel = computed(
    () => props.backLabel ?? t("stepper.back"),
);

// --- Handler ---------------------------------------------------------------

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

function isSegmentActive(index /* 0-basiert */) {
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
    <div class="flex items-baseline justify-between gap-4 mb-8">
      <h2
          class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate"
      >
        {{ currentStep?.title }}
      </h2>
      <span
          class="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap"
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
          trailing-icon="i-lucide-arrow-right"
          :loading="loading"
          :disabled="!canGoNext"
          @click="goNext"
      >
        {{ nextButtonLabel }}
      </UButton>
    </div>
  </div>
</template>

<style scoped></style>
