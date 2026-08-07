<template>
  <div class="w-full">
    <div class="md:flex justify-between items-center w-full mb-4">
      <PageHeader
        title="Zugangspunkt"
        description="Steuern Sie diesen Zugangspunkt im Zeitraum Ihrer Buchung."
        class="mb-3 md:mb-0"
      />
    </div>
    <p class="bg-red-100 text-red-600">Aktuelle ID:{{ accessPointId }}</p>
  </div>
</template>

<script setup>
definePageMeta({
  requiresAuth: true,
  layout: "panel",
  navigation: "user",
  hero: {
    height: "sm",
    showOnMobile: true,
    staticSubtitle: "Mobile Key",
  },
});

const route = useRoute();
const accessPointId = computed(() => route.params.accessPointId);
</script>
