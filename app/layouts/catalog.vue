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
    <div
        class="bg-gray-200 dark:bg-gray-950 px-10 py-15 justify-between shadow-sm hidden md:flex"
    >
      <div class="grid content-center max-w-220px">
        <p class="text-primary font-bold">Marktplatz</p>
        <p class="text-black dark:text-white text-3xl font-bold">
          Unsere Angebote und Veranstaltungen
        </p>
      </div>
      <div style="flex: 1; min-width: 15vw"/>
      <img
          alt="Logo Kiel Region"
          class="dark:grayscale dark:brightness-500 "
          src="../assets/logo-kielregion.png"
          style="height: 7vw"
      >

    </div>
    <UPageHero
        :ui="{
        container:
          'bg-[url(/assets/kiel_bootshafen.jpg)] contrast-70 p-10 pb-25 shadow-lg',
        title: 'text-2xl text-black',
      }"
        class="md:hidden z-0"
        title="Unsere Angebote und Veranstaltungen"
    >
      <template #headline>
        <div class="flex justify-center">
          <img
              alt="Logo Kiel Region"
              class="text-center"
              src="../assets/logo-kielregion.png"
              style="height: 15vw"
          >
        </div>
      </template>
    </UPageHero>
    <NuxtPage/>
  </div>
</template>

<style scoped></style>
