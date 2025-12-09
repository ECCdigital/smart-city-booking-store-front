<script setup>
import NavigationBar from "~/components/NavigationBar.vue";

useHead({
  link: [
    {
      rel: "stylesheet",
      href: `/api/theme/css`,
    },
  ],
});
</script>

<template>
  <div>
    <NavigationBar />

    <!-- toDo - adjust header for details -->
    <div
        class="bg-gray-200  px-10 py-15 justify-between shadow-sm hidden md:block"
    >
      <div class="flex">
        <div class="grid content-center max-w-220px">
          <p class="text-primary font-bold">Marktplatz</p>
          <p class="text-black text-3xl font-bold">
            Unsere Angebote und Veranstaltungen
          </p>
        </div>
        <div style="flex: 1; min-width: 15vw"/>
        <div>
          <img
              src="../assets/logo-kielregion.png"
              alt="Logo Kiel Region"
              class="text-center"
              style="height: 7vw"
          >
        </div>
      </div>

    </div>

    <NuxtPage />
  </div>
</template>

<style scoped></style>
