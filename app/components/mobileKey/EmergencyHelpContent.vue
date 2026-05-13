<template>
  <div class="space-y-4">
    <div v-if="serviceInfo.name" class="flex items-start gap-3">
      <UIcon
          name="i-lucide-user"
          class="size-5 text-gray-400 dark:text-gray-500 mt-0.5"
      />
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400">Ansprechpartner</p>
        <p class="font-medium text-gray-900 dark:text-white text-sm">
          {{ serviceInfo.name }}
        </p>
      </div>
    </div>

    <div v-if="serviceInfo.phone" class="flex items-start gap-3">
      <UIcon
          name="i-lucide-phone"
          class="size-5 text-gray-400 dark:text-gray-500 mt-0.5"
      />
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400">Telefon (24/7)</p>
        <a
            :href="`tel:${serviceInfo.phone}`"
            class="font-medium text-gray-900 dark:text-white text-sm hover:text-primary transition-colors"
        >
          {{ serviceInfo.phone }}
        </a>
      </div>
    </div>

    <div v-if="serviceInfo.email" class="flex items-start gap-3">
      <UIcon
          name="i-lucide-mail"
          class="size-5 text-gray-400 dark:text-gray-500 mt-0.5"
      />
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400">E-Mail</p>
        <a
            :href="`mailto:${serviceInfo.email}`"
            class="font-medium text-gray-900 dark:text-white text-sm hover:text-primary transition-colors"
        >
          {{ serviceInfo.email }}
        </a>
      </div>
    </div>

    <div
        class="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-4 py-3"
    >
      <div class="flex items-center gap-2">
        <UIcon
            name="i-lucide-lightbulb"
            class="size-4 text-amber-500 dark:text-amber-400"
        />
        <span class="text-sm text-gray-700 dark:text-gray-300">
          Halten Sie bitte Ihre Buchungs-ID bereit:
        </span>
      </div>
      <span
          class="font-mono font-semibold text-sm text-primary ml-3 whitespace-nowrap"
      >
        {{ processId }}
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  serviceInfo: { type: Object, required: true },
  processId: { type: String, required: true },
});
</script>