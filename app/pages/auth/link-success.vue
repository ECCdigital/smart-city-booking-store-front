<script setup lang="ts">
definePageMeta({ layout: "default" });

const { t } = useI18n();
usePageTitle(() => t("meta.pages.cardLinkSuccess"));
</script>

<template>
  <PageBackground variant="poly" :vignette="true" intensity="normal">
    <div class="flex w-full items-center justify-center p-6">
      <UCard variant="soft" class="w-full max-w-md rounded-xl glass shadow-2xl/50">
        <div class="flex flex-col items-center text-center py-6">
          <UIcon
              name="i-lucide-check-circle-2"
              class="text-6xl text-green-500 mb-4"
          />
          <h2 class="text-2xl font-semibold mb-2">
            {{ $t("cardLink.success.title") }}
          </h2>
          <p class="text-gray-600 dark:text-gray-300 mb-2">
            {{ $t("cardLink.success.description") }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {{ $t("cardLink.success.hint") }}
          </p>

          <UButton
              to="/login"
              color="primary"
              size="lg"
              icon="i-lucide-log-in"
          >
            {{ $t("common.backToLogin") }}
          </UButton>
        </div>
      </UCard>
    </div>
  </PageBackground>
</template>