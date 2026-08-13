<template>
  <!--
    PROTOTYP — Ticket 05 „Scanner-Oberfläche im Panel und ihre Rückfallwege".
    Drei Varianten der `evidence`-Bühne, umschaltbar über `?variant=A|B|C` und die
    Leiste am oberen Rand. Die Hülle ist Zeile für Zeile aus `AccessPointPanel.vue`
    übernommen (Slideover bottom / 60 vh, Modal 50 vw × 60 vh) — der enge Rahmen ist
    das, worum es geht. Der Access Point ist erfunden, es gibt kein Backend.

    WEGWERFCODE. Wird nicht die Umsetzung.
  -->
  <div class="container mx-auto px-4 pt-24 pb-8">
    <h1 class="text-2xl font-bold text-fuchsia-700">
      Prototyp 05 — Scanner-Oberfläche
    </h1>
    <p class="mt-1 text-sm text-neutral-500 max-w-2xl">
      Öffnen Sie das Panel und spielen Sie die Fälle über die Leiste oben durch.
      Für die echte Kamera braucht es einen sicheren Kontext:
      <code class="text-xs">npm run dev:tunnel</code>.
    </p>

    <div class="mt-4 flex flex-wrap items-center gap-3">
      <UButton
        icon="i-lucide-door-open"
        :label="`Panel öffnen — ${accessPoint.label}`"
        @click="openPanel"
      />
      <span class="text-xs text-neutral-500">
        Aktuelle Tür: <code>{{ accessPoint.id }}</code>
      </span>
    </div>

    <!-- ── mobile Hülle: Slideover, Bühnenfläche 60 vh ─────────────────────── -->
    <USlideover
      v-if="!desktop"
      v-model:open="isOpen"
      side="bottom"
      inset
      :modal="false"
      :dismissible="false"
      :title="accessPoint.label"
      description="Informationen und Status des Schließsystems"
      :ui="{
        wrapper: 'bg-black/60',
        content: 'w-[90vw] mx-auto rounded-t-2xl shadow-lg',
      }"
    >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div>
            <p class="font-semibold">{{ accessPoint.label }}</p>
            <p class="text-xs text-neutral-500">Zugang · gesperrt</p>
          </div>
          <UButton
            icon="i-lucide-x"
            variant="ghost"
            color="neutral"
            @click="isOpen = false"
          />
        </div>
      </template>
      <template #body>
        <div class="pb-5 h-[60vh]">
          <component
            :is="variantComponent"
            :key="`${current}-${resetNonce}`"
            :access-point="accessPoint"
            :desktop="false"
            :simulated="simulated"
            :injected-sticker="injectedSticker"
            :injected-camera-error="injectedCameraError"
            @switch-door="onSwitchDoor"
          />
        </div>
      </template>
    </USlideover>

    <!-- ── Desktop-Hülle: Modal 50 vw × 60 vh ──────────────────────────────── -->
    <UModal
      v-else
      v-model:open="isOpen"
      :modal="false"
      :dismissible="false"
      :ui="{
        overlay: 'bg-black/60',
        content: 'w-[50vw] max-w-[80vw] h-[60vh] shadow-lg',
      }"
      :title="accessPoint.label"
      description="Informationen und Status des Schließsystems"
    >
      <template #content>
        <div class="h-full flex flex-col p-5">
          <div class="flex items-center justify-between shrink-0">
            <div>
              <p class="font-semibold">{{ accessPoint.label }}</p>
              <p class="text-xs text-neutral-500">Zugang · gesperrt</p>
            </div>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              @click="isOpen = false"
            />
          </div>
          <USeparator class="my-4 shrink-0" />
          <div class="flex-1 min-h-0">
            <component
              :is="variantComponent"
              :key="`${current}-${resetNonce}`"
              :access-point="accessPoint"
              :desktop="true"
              :simulated="simulated"
              :injected-sticker="injectedSticker"
              :injected-camera-error="injectedCameraError"
              @switch-door="onSwitchDoor"
            />
          </div>
        </div>
      </template>
    </UModal>

    <PrototypeScanBar
      v-model:current="current"
      v-model:desktop="desktop"
      v-model:simulated="simulated"
      @scan="onScan"
      @camera-error="onCameraError"
      @reset="reset"
    />
  </div>
</template>

<script setup>
import { useMediaQuery } from "@vueuse/core";
import PrototypeScanBar from "~/components/mobileKey/prototype/PrototypeScanBar.vue";
import PrototypeScanVariantA from "~/components/mobileKey/prototype/PrototypeScanVariantA.vue";
import PrototypeScanVariantB from "~/components/mobileKey/prototype/PrototypeScanVariantB.vue";
import PrototypeScanVariantC from "~/components/mobileKey/prototype/PrototypeScanVariantC.vue";
import {
  CURRENT_ACCESS_POINT,
} from "~/components/mobileKey/prototype/prototypeScanStubs.js";

definePageMeta({ layout: "default" });

const VARIANT_COMPONENTS = {
  A: PrototypeScanVariantA,
  B: PrototypeScanVariantB,
  C: PrototypeScanVariantC,
};

const route = useRoute();
const router = useRouter();

const current = computed({
  get: () => (VARIANT_COMPONENTS[route.query.variant] ? route.query.variant : "A"),
  set: (value) =>
    router.replace({ query: { ...route.query, variant: value } }),
});
const variantComponent = computed(() => VARIANT_COMPONENTS[current.value]);

const isLargeScreen = useMediaQuery("(min-width: 1024px)");
const desktop = ref(false);
onMounted(() => (desktop.value = isLargeScreen.value));

const simulated = ref(false);
const isOpen = ref(false);
const accessPoint = ref(CURRENT_ACCESS_POINT);

// Nonce, damit derselbe Aufkleber zweimal hintereinander „gescannt" werden kann.
const scanNonce = ref(0);
const injectedSticker = ref("");
const injectedCameraError = ref("");
const resetNonce = ref(0);

function openPanel() {
  reset();
  isOpen.value = true;
}

function onScan(rawValue) {
  scanNonce.value += 1;
  injectedSticker.value = `${rawValue}#${scanNonce.value}`;
}

function onCameraError(name) {
  injectedCameraError.value = "";
  nextTick(() => (injectedCameraError.value = name));
}

function onSwitchDoor(other) {
  accessPoint.value = other;
  reset();
}

function reset() {
  injectedSticker.value = "";
  injectedCameraError.value = "";
  resetNonce.value += 1;
}
</script>
