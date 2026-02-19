<template>
  <div>
    <h2 class="text-2xl font-bold">Ihre Rechnungen</h2>

    <div class="flex flex-col items-center justify-center py-24 text-center">
      <div class="text-4xl mb-4">🧾</div>
      <h1 class="text-xl font-semibold mb-2">Keine Rechnungen vorhanden</h1>
      <p class="text-gray-500 max-w-md">
        Aktuell sind für Ihr Konto keine Rechnungen verfügbar. Sobald Rechnungen
        erstellt wurden, werden diese hier angezeigt.
      </p>
    </div>
  </div>
</template>
<script setup>
definePageMeta({
  name: "tenant-invoices",
  layout: "user",
  middleware: ["user-auth"],
});
</script>

<style scoped></style>

