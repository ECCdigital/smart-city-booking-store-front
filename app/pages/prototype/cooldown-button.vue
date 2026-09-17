<template>
  <!--
    PROTOTYPE, throwaway. Three variants of the Control Button during the 8 s
    Cooldown with long-press status refresh, switchable via ?variant=A|B|C on
    /prototype/cooldown-button. Simulated Nuki, no backend. Ticket:
    .scratch/nuki-lock-feedback/issues/03-prototype-cooldown-control-button.md
  -->
  <div class="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row md:items-start gap-8">
    <!-- the sheet, roughly as the panel frames it on a phone -->
    <div class="w-full max-w-sm shrink-0 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      <div class="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <div class="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          <UIcon name="i-lucide-door-open" class="!text-[18px]" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-semibold leading-tight">Werkstatt-Tür</p>
          <p class="text-xs text-neutral-500">Nuki Smart Lock · Buchung #4711</p>
        </div>
        <span
          class="text-[11px] px-2 py-0.5 rounded-full"
          :class="flow.status?.open ? 'bg-success/15 text-success' : 'bg-neutral-200 dark:bg-neutral-700'"
        >
          {{ flow.status === undefined ? "…" : flow.status === null ? "unbekannt" : flow.status.open ? "geöffnet" : "abgeschlossen" }}
        </span>
      </div>
      <div class="px-4 min-h-[22rem] flex flex-col justify-center">
        <component :is="current" :flow="flow" />
      </div>
      <div class="px-4 pb-4">
        <UButton variant="ghost" block class="cursor-pointer">Schließen</UButton>
      </div>
    </div>

    <!-- simulator + state readout -->
    <div class="flex-1 min-w-0 space-y-6 text-sm">
      <div class="rounded-xl border border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 p-4">
        <p class="font-mono text-xs text-yellow-700 dark:text-yellow-300 mb-2">PROTOTYPE · Nuki-Simulator</p>
        <div class="grid sm:grid-cols-2 gap-x-6 gap-y-2">
          <label class="flex items-center gap-2"><input v-model="flow.sim.busyReplies" type="checkbox"> Nuki antwortet 423, solange beschäftigt</label>
          <label class="flex items-center gap-2"><input v-model="flow.sim.statusFails" type="checkbox"> Statusabfrage schlägt fehl</label>
          <label class="flex items-center gap-2">Beschäftigt (ms) <input v-model.number="flow.sim.busyMs" type="number" step="500" class="w-24 border rounded px-1"></label>
          <label class="flex items-center gap-2">Drehdauer (ms) <input v-model.number="flow.sim.turnMs" type="number" step="500" class="w-24 border rounded px-1"></label>
          <label class="flex items-center gap-2">Befehl-Latenz (ms) <input v-model.number="flow.sim.commandMs" type="number" step="100" class="w-24 border rounded px-1"></label>
          <label class="flex items-center gap-2">Status-Latenz (ms) <input v-model.number="flow.sim.statusMs" type="number" step="100" class="w-24 border rounded px-1"></label>
        </div>
        <div class="mt-3 flex gap-2">
          <UButton size="xs" variant="soft" @click="flow.reset()">Zurücksetzen</UButton>
          <UButton size="xs" variant="soft" @click="flow.lock.open = !flow.lock.open">Schloss von Hand umlegen</UButton>
        </div>
      </div>

      <div class="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 font-mono text-xs grid grid-cols-2 gap-x-4 gap-y-1">
        <span class="text-neutral-500">stage</span><span>{{ flow.stage }}</span>
        <span class="text-neutral-500">cooldown</span><span>{{ flow.cooling ? `${(flow.cooldownRemainingMs / 1000).toFixed(1)} s` : "–" }}</span>
        <span class="text-neutral-500">status</span><span>{{ flow.status === undefined ? "undefined" : flow.status === null ? "null" : `${flow.status.open ? "open" : "locked"} (${flow.status.statusSource})` }}</span>
        <span class="text-neutral-500">lock (sim)</span><span>{{ flow.lock.open ? "open" : "locked" }}{{ flow.lockTurning ? ", turning" : "" }}{{ flow.lock.busyUntil > Date.now() ? ", busy" : "" }}</span>
        <span class="text-neutral-500">reading</span><span>{{ flow.reading }}</span>
        <span class="text-neutral-500">lastEvent</span><span>{{ flow.lastEvent ?? "–" }}</span>
      </div>

      <div class="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
        <p class="font-semibold mb-2">Was die Varianten unterscheidet</p>
        <ul class="list-disc pl-5 space-y-1">
          <li><b>A</b> Ring am Button, Ziffer statt Icon, grau. Tipp in der Wartezeit: Button wackelt. Halten (600 ms) nur in der Wartezeit liest den Status, innerer Ring füllt sich.</li>
          <li><b>B</b> Kein verstecktes Halten: in der Wartezeit ersetzt eine Statuskarte den Button, mit Balken und sichtbarem "Status jetzt prüfen".</li>
          <li><b>C</b> Button bleibt farbig, Stoppuhr + Sekunden. Tipp: Hinweis-Toast. Halten (800 ms) geht immer, Ripple wächst aus der Mitte.</li>
        </ul>
        <p class="mt-2 text-neutral-500">Desktop: Halten mit der Maus oder Leertaste/Enter gedrückt halten. ← → wechselt die Variante.</p>
      </div>

      <div class="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 font-mono text-xs max-h-64 overflow-auto">
        <p v-for="(line, i) in flow.log" :key="i">{{ line }}</p>
        <p v-if="!flow.log.length" class="text-neutral-400">Noch nichts passiert.</p>
      </div>
    </div>

    <PrototypeVariantSwitcher :variants="['A', 'B', 'C']" :names="NAMES" />
  </div>
</template>
<script setup>
import CooldownVariantA from "~/components/prototype/CooldownVariantA.vue";
import CooldownVariantB from "~/components/prototype/CooldownVariantB.vue";
import CooldownVariantC from "~/components/prototype/CooldownVariantC.vue";
import PrototypeVariantSwitcher from "~/components/prototype/PrototypeVariantSwitcher.vue";
import { useCooldownPrototype } from "~/components/prototype/cooldownPrototypeFlow.js";

definePageMeta({ layout: "default" });

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: "Page not found" });
}

useHead({ title: "Prototype: Cooldown-Button", meta: [{ name: "robots", content: "noindex" }] });

const NAMES = { A: "Ring am Button", B: "Statuskarte + Prüfen-Button", C: "Stoppuhr, Toast, Ripple" };
const VARIANTS = { A: CooldownVariantA, B: CooldownVariantB, C: CooldownVariantC };

const route = useRoute();
const current = computed(() => VARIANTS[route.query.variant] ?? CooldownVariantA);

const flow = reactive(useCooldownPrototype());
</script>
