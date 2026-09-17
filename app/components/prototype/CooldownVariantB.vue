<template>
  <!-- PROTOTYPE B: during the Cooldown the button gives way to a status card with an explicit "Status prüfen" button; no hidden gesture -->
  <div class="py-6">
    <div v-if="!flow.cooling" class="relative flex items-center justify-center mb-10">
      <div
        v-if="!flow.action"
        class="absolute w-28 h-28 rounded-full border-[12px] animate-ping [animation-duration:2.5s]"
        :class="flow.variant === 'open' ? 'border-primary/30' : 'border-error/30'"
      />
      <button
        type="button"
        class="controlButton rounded-full flex flex-col items-center justify-center shadow-lg text-white"
        :class="flow.variant === 'open' ? 'openColor' : 'closeColor'"
        @click="flow.tap()"
      >
        <template v-if="flow.action">
          <div class="w-8 h-8 rounded-full border-4 border-white/30 border-t-white animate-spin" />
          <span class="text-xs mt-2">{{ flow.action === "open" ? "Öffnet …" : "Schließt …" }}</span>
        </template>
        <template v-else>
          <UIcon :name="flow.variant === 'open' ? 'i-lucide-unlock' : 'i-lucide-lock'" class="!text-[22px]" />
          <span class="text-sm font-medium mt-2">{{ flow.variant === "open" ? "Öffnen" : "Abschließen" }}</span>
        </template>
      </button>
    </div>

    <div v-else class="mx-auto max-w-xs rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4 shadow-sm mb-6 bg-white dark:bg-neutral-900">
      <div class="flex items-center gap-3">
        <div
          class="w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0"
          :class="flow.status?.open ? 'bg-success' : 'bg-neutral-600'"
        >
          <UIcon :name="flow.status?.open ? 'i-lucide-unlock' : 'i-lucide-lock'" class="!text-[22px]" />
        </div>
        <div class="min-w-0">
          <p class="font-semibold leading-tight">
            {{ flow.status?.open ? "Geöffnet" : "Abgeschlossen" }}
          </p>
          <p class="text-xs text-neutral-500">
            {{ flow.status?.statusSource === "provider" ? "vom Schloss bestätigt" : "Befehl angenommen, noch unbestätigt" }}
          </p>
        </div>
      </div>

      <div class="mt-4 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
        <div class="h-full bg-primary transition-[width] duration-100 ease-linear" :style="{ width: `${(1 - flow.cooldownProgress) * 100}%` }" />
      </div>
      <p class="mt-2 text-sm text-center">
        {{ flow.variant === "open" ? "Öffnen" : "Abschließen" }} in <b class="tabular-nums">{{ flow.cooldownSeconds }} s</b> möglich
      </p>

      <UButton
        block
        variant="soft"
        icon="i-lucide-refresh-cw"
        class="mt-3 cursor-pointer"
        :loading="flow.reading"
        @click="flow.refreshStatus('Button')"
      >
        Status jetzt prüfen
      </UButton>
    </div>

    <div class="text-center text-sm min-h-[3rem]">
      <p v-if="flow.stage === 'error' && !flow.cooling" class="text-error font-medium">
        Status unbekannt
        <UButton size="xs" variant="soft" class="ml-2" @click="flow.refreshStatus('Retry')">Erneut prüfen</UButton>
      </p>
      <p v-else-if="!flow.cooling">
        Tippen Sie zum {{ flow.variant === "open" ? "Öffnen" : "Abschließen" }} von <b>Werkstatt-Tür</b>
      </p>
      <p v-if="flow.lastEvent === 'lock_busy'" class="text-amber-600 text-xs mt-2">
        Das Schloss ist noch beschäftigt. Die Wartezeit beginnt von vorn.
      </p>
    </div>
  </div>
</template>
<script setup>
defineProps({ flow: { type: Object, required: true } });
</script>
<style scoped>
.controlButton { width: 120px; height: 120px; position: relative; z-index: 10; cursor: pointer; }
.openColor { background: linear-gradient(180deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 85%, black)); }
.closeColor { background: linear-gradient(180deg, #f15d5d, color-mix(in srgb, #f15d5d 85%, black)); }
</style>
