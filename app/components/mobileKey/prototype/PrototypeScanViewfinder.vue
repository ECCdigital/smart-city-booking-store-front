<template>
  <!--
    PROTOTYP — die einzige geteilte Bauteil zwischen den Varianten: die Kamerafläche selbst.
    Sie füllt ihren Eltern-Container vollständig aus und bringt KEINEN eigenen Rahmen mit —
    jede Variante rahmt sie selbst, denn genau darum geht die Frage.
  -->
  <div class="relative w-full h-full overflow-hidden bg-neutral-900">
    <!-- echte Kamera -->
    <ClientOnly v-if="!simulated">
      <QrcodeStream
        v-if="active"
        :formats="['qr_code']"
        :paused="paused"
        class="!w-full !h-full [&>video]:!object-cover"
        @detect="onDetect"
        @error="onError"
        @camera-on="onCameraOn"
      />
      <template #fallback>
        <div class="w-full h-full flex items-center justify-center">
          <UIcon
            name="i-lucide-loader-circle"
            class="size-8 text-white/60 animate-spin"
          />
        </div>
      </template>
    </ClientOnly>

    <!-- simulierte Kamera: bewegtes Rauschen, damit die Fläche sich wie ein Livebild verhält -->
    <div
      v-else
      class="w-full h-full prototype-fake-feed flex items-center justify-center"
    >
      <div class="text-center text-white/40 text-xs px-4">
        <UIcon name="i-lucide-video" class="size-6 mb-1" />
        <p>simuliertes Kamerabild</p>
      </div>
    </div>

    <!-- Standbild-Schleier nach dem Treffer -->
    <div
      v-if="paused"
      class="absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity"
    />

    <slot />
  </div>
</template>

<script setup>
import { QrcodeStream, setZXingModuleOverrides } from "vue-qrcode-reader";

// Recherche 01, Abschnitt C: die WASM-Datei käme ab Werk von jsDelivr. Für eine
// Türöffnung nicht hinnehmbar — sie liegt unter /wasm/ und muss exakt zu
// zxing-wasm@1.1.3 passen (deshalb sind beide Pakete ohne Caret gepinnt).
setZXingModuleOverrides({
  locateFile: (path, prefix) =>
    path.endsWith(".wasm") ? `/wasm/${path}` : prefix + path,
});

defineProps({
  active: { type: Boolean, default: true },
  paused: { type: Boolean, default: false },
  simulated: { type: Boolean, default: false },
});

const emit = defineEmits(["detect", "error", "cameraOn"]);

function onDetect(codes) {
  const rawValue = codes?.[0]?.rawValue;
  if (rawValue) {
    emit("detect", rawValue);
  }
}

function onError(error) {
  // Recherche 01, Vorgabe an Ticket 06: die drei Ausfallsignale getrennt protokollieren.
  console.error("[prototype-scanner] Kamera-Ausfall:", error.name, error.message);
  emit("error", error.name);
}

function onCameraOn(capabilities) {
  emit("cameraOn", capabilities);
}
</script>

<style scoped>
.prototype-fake-feed {
  background:
    repeating-linear-gradient(
      115deg,
      rgba(255, 255, 255, 0.05) 0 2px,
      transparent 2px 6px
    ),
    radial-gradient(circle at 30% 40%, #3f3f46, #18181b 70%);
  background-size:
    200% 200%,
    100% 100%;
  animation: prototype-drift 6s linear infinite;
}

@keyframes prototype-drift {
  from {
    background-position:
      0% 0%,
      0 0;
  }
  to {
    background-position:
      200% 200%,
      0 0;
  }
}
</style>
