<template>
  <catalog-layout>
    <div
        class="sm:container-md md:container bg-neutral-50 dark:bg-gray-950 md:flex h-min-[60vh] w-full md:mx-auto pt-2 md:pt-7"
    >
      <SettingsNavigation class="basis-1/6"/>

      <div class="px-2 lg:px-5 md:basis-5/6">
        <slot />
      </div>
    </div>
  </catalog-layout>
</template>

<script>
import CatalogLayout from '~/layouts/catalog.vue'
import SettingsNavigation from "~/components/user/settings/SettingsNavigation.vue";

export default {
  components: {
    SettingsNavigation,
    CatalogLayout
  }
}



</script>
