<template>
  <!-- PROTOTYPE: floating variant switcher, dev only. Never ships. -->
  <div
    v-if="isDev"
    class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 rounded-full bg-neutral-900 text-white px-2 py-1 shadow-xl border border-yellow-400 font-mono text-xs select-none"
  >
    <button class="px-2 py-1 rounded-full hover:bg-white/10" @click="cycle(-1)">←</button>
    <span class="px-1">
      <span class="text-yellow-300">PROTOTYPE</span>
      · {{ current }}<span v-if="name"> ({{ name }})</span>
    </span>
    <button class="px-2 py-1 rounded-full hover:bg-white/10" @click="cycle(1)">→</button>
  </div>
</template>
<script setup>
const props = defineProps({
  variants: { type: Array, required: true },
  names: { type: Object, default: () => ({}) },
});
const isDev = import.meta.dev;
const route = useRoute();
const router = useRouter();

const current = computed(() =>
  props.variants.includes(route.query.variant) ? route.query.variant : props.variants[0],
);
const name = computed(() => props.names[current.value] ?? "");

function cycle(step) {
  const i = props.variants.indexOf(current.value);
  const next = props.variants[(i + step + props.variants.length) % props.variants.length];
  router.replace({ query: { ...route.query, variant: next } });
}

function onKey(event) {
  const tag = event.target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || event.target?.isContentEditable) return;
  if (event.key === "ArrowLeft") cycle(-1);
  if (event.key === "ArrowRight") cycle(1);
}
onMounted(() => window.addEventListener("keydown", onKey));
onUnmounted(() => window.removeEventListener("keydown", onKey));
</script>
