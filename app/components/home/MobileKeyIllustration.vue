<template>
  <!--
    A still of the Mobile Key on a phone for the start page: the key list's
    card for today's booking and the round open button. Nothing here works —
    it only shows what opening a door looks like — so it is decorative and is
    hidden from assistive technology by its parent.
  -->
  <div
    class="w-66 h-130 shrink-0 box-border p-3 rounded-[40px] bg-gray-900 dark:bg-black shadow-2xl select-none"
  >
    <div
      class="flex flex-col h-full rounded-[30px] bg-neutral-50 dark:bg-gray-900 overflow-hidden"
    >
      <div class="flex justify-center pt-2.5">
        <div class="w-20 h-5.5 rounded-full bg-gray-900 dark:bg-black" />
      </div>

      <div class="flex flex-col gap-3.5 px-4.5 pt-4.5">
        <p class="text-lg font-bold text-gray-900 dark:text-white">
          {{ $t("mobileKey.yourKeys") }}
        </p>

        <div
          class="flex flex-col items-start gap-2.5 p-4 rounded-2xl bg-white dark:bg-gray-800 shadow-lg"
        >
          <UBadge
            color="success"
            variant="soft"
            :label="
              $t('home.mobileKey.sample.validToday', {
                start: formatTime(sampleStart),
                end: formatTime(sampleEnd),
              })
            "
          />
          <p
            class="text-[15px] font-bold leading-snug text-gray-900 dark:text-white"
          >
            {{ $t("home.mobileKey.sample.room") }}
          </p>
          <p class="text-xs text-gray-600 dark:text-gray-400">
            {{ $t("home.mobileKey.sample.place") }}
          </p>
        </div>

        <div
          class="flex flex-col items-center gap-2.5 px-4 py-5.5 rounded-2xl bg-white dark:bg-gray-800 shadow-lg"
        >
          <div
            class="w-21 h-21 rounded-full bg-primary flex items-center justify-center"
            style="color: var(--ui-primary-contrast)"
          >
            <UIcon name="i-lucide-lock-open" size="36" />
          </div>
          <p class="font-bold text-gray-900 dark:text-white">
            {{ $t("mobileKey.openDoor") }}
          </p>
          <p
            class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400"
          >
            <UIcon name="i-lucide-wifi" class="shrink-0 size-3.5" />
            {{ $t("home.mobileKey.sample.readerInRange") }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFormatting } from "~/composables/utils/useFormatting.js";

const { formatTime } = useFormatting();

// The sample key is valid today, 09:00–12:00.
const sampleStart = new Date(2000, 0, 1, 9, 0);
const sampleEnd = new Date(2000, 0, 1, 12, 0);
</script>

<style scoped></style>
