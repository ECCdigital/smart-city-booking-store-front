<script setup lang="ts">

defineProps({
  userInfo: {
    type: Object as () => { name: string; email: string } | null,
    default: null,
  },
  hasError: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
});

const { t } = useI18n();

</script>

<template>
  <UCard variant="soft" class="w-full max-w-md rounded-xl glass">
    <template #header>
      <h2 class="text-2xl font-semibold text-center">
        {{ t("login.sso.confirmTitle") }}
      </h2>
    </template>

    <div
        v-if="!userInfo && !hasError"
        class="flex flex-col items-center py-6"
    >
      <UIcon
          name="i-lucide-loader-2"
          class="text-primary-500 text-3xl animate-spin"
      />
    </div>

    <div
        v-if="userInfo && !hasError"
        class="flex flex-col items-center text-center gap-4 py-4"
    >
      <div
          class="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center"
      >
        <UIcon
            name="i-lucide-check-circle"
            class="text-green-500 text-2xl"
        />
      </div>

      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ t("login.sso.authenticatedAs") }}
        </p>
        <p class="text-lg font-semibold mt-1">
          {{ userInfo.name }}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ userInfo.email }}
        </p>
      </div>
    </div>

    <div
        v-if="hasError"
        class="flex flex-col items-center text-center gap-4 py-4"
    >
      <div
          class="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center"
      >
        <UIcon
            name="i-lucide-alert-circle"
            class="text-red-500 text-2xl"
        />
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ t("login.sso.confirmError") }}
      </p>
    </div>

    <template #footer>
      <div class="flex justify-between items-center">
        <UButton variant="outline" @click="$emit('back')">
          {{ t("common.back") }}
        </UButton>

        <div v-if="userInfo && !hasError" class="flex gap-2">
          <UButton
              variant="outline"
              color="neutral"
              @click="$emit('change-user')"
          >
            {{ t("login.sso.changeUser") }}
          </UButton>
          <UButton
              color="primary"
              :loading="loading"
              @click="$emit('confirm')"
          >
            {{ t("common.login") }}
          </UButton>
        </div>

        <UButton
            v-if="hasError"
            color="primary"
            @click="$emit('back')"
        >
          {{ t("login.sso.tryAgain") }}
        </UButton>
      </div>
    </template>
  </UCard>
</template>

<style scoped>

</style>