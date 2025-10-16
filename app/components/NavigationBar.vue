<template>
  <div :class="barClass">
    <div v-for="(tab, k) in tabs" :key="k">
      <NavigationLink :tab="tab" />
    </div>
    <div style="flex: 1"></div>
    <UButton
      label="Anmelden"
      variant="ghost"
      class="px-4 text-white"
      to="/login"
      @click="console.log('want login')"
    />
    <UButton
      v-if="isGreaterThanSm"
      label="Registrieren"
      class="px-4 text-black bg-white"
      to="/register"
      @click="console.log('want register')"
    />
    <!-- toDo - https://ui.nuxt.com/docs/components/field-group (with dropdown) -->
  </div>
</template>
<script setup>
import NavigationLink from "./NavigationLink.vue";
import { useWindowSize } from "@vueuse/core";

const route = useRoute();
const router = useRouter();

const catalogSlug = computed(() => {
  return route?.params?.catalogSlug;
});
const tabs = computed(() => [
  {
    label: "Orte",
    icon: "i-heroicons-map-pin",
    value: `/catalog/${catalogSlug.value}/locations`,
  },
  {
    label: "Events",
    icon: "i-heroicons-calendar",
    value: `/catalog/${catalogSlug.value}/events`,
  },
  {
    label: "Geräte",
    icon: "i-heroicons-wrench-screwdriver",
    value: `/catalog/${catalogSlug.value}/bookables`,
  },
  {
    label: "Test",
    icon: "i-heroicons-beaker",
    value: `/catalog/${catalogSlug.value}/test`,
  },
]);

const { width } = useWindowSize();
const isGreaterThanSm = computed(() => width.value >= 640);

const barClass = computed(() => [
  "flex items-center bg-[var(--color-secondary)]",
]);
</script>
<style scoped></style>
