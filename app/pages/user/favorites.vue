<template>
  <div>
    <PageHeader title="Ihre Favoriten" />
    <div class="flex flex-col items-center justify-center py-24 text-center">
      <div class="text-4xl mb-4">⭐</div>
      <h1 class="text-xl font-semibold mb-2">Ihre Favoriten kommen bald</h1>
      <p class="text-gray-500 max-w-md">
        Aktuell gibt es hier noch nichts zu sehen. Gespeicherte Inhalte werden
        künftig an dieser Stelle angezeigt.
      </p>
    </div>
  </div>
</template>
<script setup>
definePageMeta({
  name: "favorites",
  layout: "user",
  middleware: ["user-auth"],
});
</script>

<style scoped></style>
