<template>
  <UCard class="text-center space-y-6">
    <div class="flex justify-end items-center">
      <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          class="rounded-xl"
          @click="() => (emit('close'))"
      />
    </div>
    <div v-if="loading">
      <div class="flex justify-center">
        <div class="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"/>
      </div>
      <p class="text-lg font-medium">
        Fahrradbox wird geöffnet...
      </p>
      <p class="text-sm text-gray-500">
        Bitte warten
      </p>
    </div>
    <div v-else-if="status === 'opened'" class="space-y-4">
      <UIcon
          name="i-lucide-check"
          :size="50"
          class="text-green-500"
      />
      <p class="text-lg font-medium">
        Die Fahrradbox wurde geöffnet.
      </p>

      <UButton
          color="primary"
          @click="emit('close')"
      >
        Schließen
      </UButton>
    </div>

    <div v-else-if="status === 'pending'" >
      <UIcon
          name="i-lucide-hourglass"
          :size="50"
          class="text-gray-500 mb-2"
      />
      <p class="text-lg font-medium">
        Warten auf Rückmeldung der Box
      </p>
      <p class="text-sm text-gray-500">
        Bitte versuchen Sie es erneut.
      </p>

      <div class="flex justify-center gap-3 mt-5">
        <UButton
            color="primary"
            variant="soft"
            @click="emit('close')"
        >
          Abbrechen
        </UButton>

        <UButton
            color="primary"
            @click="emit('retry')"
        >
          Status erneut prüfen
        </UButton>
      </div>
    </div>

    <div v-else-if="status === 'error'" >
      <UIcon
          name="i-lucide-x"
          :size="50"
          class="text-red-500 mb-2"
      />
      <p class="text-lg font-medium">
      Öffnen fehlgeschlagen
      </p>
      <p class="text-sm text-gray-500">
        Bitte versuchen Sie es erneut.
      </p>

      <div class="flex justify-center gap-3 mt-5">
        <UButton
            color="primary"
            variant="soft"
            @click="emit('close')"
        >
          Schließen
        </UButton>
      </div>
    </div>
  </UCard>
</template>
<script setup>
const props = defineProps({
  loading: {
    type: Boolean,
    required: true
  },
  status: {
    type: String,
    required: true
  },
});
const emit = defineEmits(["close", "retry"]);
</script>


<style scoped>

</style>