<template>
  <div>
    <UBlogPost
      class="shadow-lg"
      :to="`/catalog/${catalogSlug}/locations/${bookable.id}`"
    >
      <template #header>
        <div>
          <img
            src="../../assets/example_office2.jpg"
            alt="Ein beispielhaftes Büro."
          />
        </div>
      </template>
      <template #body>
        <div>
          <p class="text-lg font-bold">
            {{ bookable.title }}
          </p>
          <p>{{ bookable.tenantId }}</p>
        </div>
        <!-- Adresse und Entfernung -->
        <div class="my-5">
          <p>
            <UIcon name="i-lucide-map-pin" class="size-5" />
            <span v-if="bookable.location" class="p-3">{{
              bookable.location
            }}</span>
            <span v-else class="italic p-3">Keine Adresse bekannt.</span>
          </p>
          <p v-if="bookable.location">
            <UIcon name="i-lucide-navigation" class="size-5" />
            <span class="p-3">Distance coming soon </span>
          </p>
        </div>
        <!-- Eigenschaften -->
        <USeparator
          color="neutral"
          class="w-full"
          :ui="{ border: 'border-gray-200' }"
        />
        <div class="my-5">
          <UBadge
            v-for="(flag, i) in bookable.flags"
            :key="i"
            icon="i-lucide-check"
            size="md"
            color="neutral"
            variant="ghost"
            style="padding-left: 0; padding-right: 15px"
            >{{ flag }}</UBadge
          >
        </div>
        <!-- Preis -->
        <div class="flex justify-end">
          <p
            v-if="
              !bookable.priceCategories || bookable.priceCategories.length === 0
            "
          >
            Kein Preis festgelegt.
          </p>
          <p
            v-else-if="!bookable.priceCategories[0].priceEur"
            class="text-md font-bold"
          >
            Kostenlos
          </p>
          <p v-else class="text-md font-bold">
            € {{ bookable.priceCategories[0].priceEur }}
          </p>
          <!-- toDo - Funktion ergänzen, um komplexe Preise (und Angebote) anzuzeigen -->
          <!-- toDo - Preis immer unter anzeigen -->
        </div>
      </template>
    </UBlogPost>
  </div>
</template>
<script setup>
const props = defineProps({
  bookable: {
    type: Object,
    required: true,
  },
});

const route = useRoute();
const catalogSlug = computed(() => route.params.catalogSlug);
</script>

<style scoped></style>
