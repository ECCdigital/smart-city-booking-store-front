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
  <div class="">
    <NavigationBar/>
    <!-- Hero -->
    <!-- toDo - Hero-Design für lg anpassen!  -->
    <!-- toDo - Hero anpassen für Dark-Mode  -->
    <div
        class="bg-gray-200 dark:bg-gray-950 flex px-10 py-40 justify-between shadow-sm"
    >
      <div class="grid content-center max-w-220px">
        <p class="text-primary text-2xl font-bold">Marktplatz</p>
        <p class="text-black dark:text-white text-5xl font-bold">
          Entdecken Sie die KielRegion
        </p>
      </div>
      <div style="flex: 1; min-width: 15vw"/>
      <img
          alt="Logo Kiel Region"
          src="../assets/logo-kielregion.png"
            class="dark:grayscale dark:brightness-500 "
          style="height: 7vw"
      >
      <!-- toDo - alternatives Logo für den Darkmode -->
    </div>
    <NuxtPage/>
  </div>
</template>

<style scoped></style>
