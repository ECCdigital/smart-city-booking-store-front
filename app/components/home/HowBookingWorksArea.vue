<template>
  <section style="padding: 50px 0">
    <div class="flex items-center mb-5">
      <h2 class="text-2xl font-bold">{{ $t("home.howItWorks.title") }}</h2>
      <div class="flex-1" />
      <UButton
        variant="ghost"
        :label="$t('catalog.showAllOffers')"
        trailing-icon="i-lucide-chevron-right"
        :to="tenantTo('bookables')"
      />
    </div>

    <div
      class="grid gap-10 lg:grid-cols-12 lg:items-center rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 md:p-10 lg:p-12"
    >
      <ol class="lg:col-span-5 m-0 p-0 list-none space-y-7">
        <li
          v-for="(step, i) in steps"
          :key="step.key"
          class="flex items-start gap-4"
        >
          <span
            class="shrink-0 w-9 h-9 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-extrabold flex items-center justify-center tabular-nums"
          >
            {{ i + 1 }}
          </span>
          <div class="space-y-1.5">
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ step.title }}
            </p>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
              {{ step.text }}
            </p>
          </div>
        </li>
      </ol>

      <!-- The picture is the steps again, drawn; screen readers get the list. -->
      <BookingFlowIllustration class="min-w-0 lg:col-span-7" aria-hidden="true" />
    </div>
  </section>
</template>

<script setup>
import BookingFlowIllustration from "~/components/home/BookingFlowIllustration.vue";

const { t } = useI18n();
const { tenantTo } = useTenantRoute();

const steps = computed(() =>
  ["search", "book", "confirm"].map((key) => ({
    key,
    title: t(`home.howItWorks.steps.${key}.title`),
    text: t(`home.howItWorks.steps.${key}.text`),
  })),
);
</script>

<style scoped></style>
