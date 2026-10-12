<template>
  <section style="padding: 50px 0">
    <div class="mb-5 space-y-1.5">
      <h2 class="text-2xl font-bold">{{ $t("home.mobileKey.title") }}</h2>
      <p class="text-gray-600 dark:text-gray-400">
        {{ $t("home.mobileKey.subtitle") }}
      </p>
    </div>

    <div
      class="grid gap-10 lg:grid-cols-12 lg:items-center rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 md:p-10 lg:p-12"
    >
      <div class="lg:col-span-8 space-y-6">
        <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
          {{ $t("home.mobileKey.intro") }}
        </p>

        <div class="grid gap-6 sm:grid-cols-2">
          <div class="space-y-2.5">
            <h3 class="text-sm font-bold text-gray-900 dark:text-white">
              {{ $t("home.mobileKey.benefitsTitle") }}
            </h3>
            <ul class="m-0 p-0 list-none space-y-2">
              <li
                v-for="benefit in benefits"
                :key="benefit.key"
                class="flex items-start gap-2.5 text-sm leading-normal text-gray-700 dark:text-gray-300"
              >
                <UIcon
                  name="i-lucide-check"
                  class="shrink-0 mt-0.5 size-4 text-emerald-700 dark:text-emerald-400"
                />
                <span>{{ benefit.text }}</span>
              </li>
            </ul>
          </div>

          <div class="space-y-2.5">
            <h3 class="text-sm font-bold text-gray-900 dark:text-white">
              {{ $t("home.mobileKey.stepsTitle") }}
            </h3>
            <ol class="m-0 p-0 list-none space-y-2.5">
              <li
                v-for="(step, i) in steps"
                :key="step.key"
                class="flex items-start gap-3 text-sm leading-normal text-gray-700 dark:text-gray-300"
              >
                <span
                  class="shrink-0 w-6 h-6 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-extrabold flex items-center justify-center tabular-nums"
                >
                  {{ i + 1 }}
                </span>
                <span>{{ step.text }}</span>
              </li>
            </ol>
          </div>
        </div>

        <UButton
          color="neutral"
          variant="outline"
          size="lg"
          icon="i-lucide-key-round"
          :label="$t('home.mobileKey.toKeys')"
          to="/mobile-key"
        />
      </div>

      <!-- The phone is the open flow, drawn; screen readers get the text. -->
      <MobileKeyIllustration
        class="lg:col-span-4 justify-self-center"
        aria-hidden="true"
      />
    </div>
  </section>
</template>

<script setup>
import MobileKeyIllustration from "~/components/home/MobileKeyIllustration.vue";

const { t } = useI18n();

const benefits = computed(() =>
  ["noHandover", "expires", "secure"].map((key) => ({
    key,
    text: t(`home.mobileKey.benefits.${key}`),
  })),
);

const steps = computed(() =>
  ["book", "appear", "open"].map((key) => ({
    key,
    text: t(`home.mobileKey.steps.${key}`, {
      keys: t("navigation.digitalKeys"),
    }),
  })),
);
</script>

<style scoped></style>
