<template>
  <div :class="barClass">
    <div v-for="(tab, k) in tabs" :key="k">
      <NavigationLink :tab="tab" />
    </div>
    <div style="flex: 1"></div>
    <UButton
      label="Login"
      variant="ghost"
      class="px-4 text-white"
      to="/login"
      @click="console.log('want login')"
    />
    <!-- toDo - https://ui.nuxt.com/docs/components/field-group (with dropdown) -->
  </div>
</template>
<script setup>
import NavigationLink from "./NavigationLink.vue";

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

const barClass = computed(() => [
  "flex items-center bg-[var(--color-secondary)]",
]);
</script>
<style scoped></style>
