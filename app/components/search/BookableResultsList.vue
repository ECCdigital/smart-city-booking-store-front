<template>
  <div>
    <div class="m-5">
      <div class="flex items-center">
        <div style="flex: 1"></div>
      </div>

      <div class="flex flex-row my-5">
        <!-- Filterbereich -->
        <div class="basis-1/4">
          <p class="text-black font-bold">
            {{ bookables.length }} passende Ergebnisse
          </p>
          <UButton
            label="Sortieren"
            icon="i-lucide-arrow-up-down"
            color="neutral"
            variant="soft"
            class="rounded-full py-2 px-3 my-2"
            @click="onSort"
          />
          <div class="border border-gray-200 rounded p-2 my-2">
            <!-- toDo - add filterarea -->
            <p class="my-4 font-bold">Ergebnisse filtern</p>
            <USeparator class="border-gray-200" />
            <div class="my-4">
              <p>Kategorie</p>
              ...
              <br />
              <br />

              <p>Preis</p>
              ...
              <br />
            </div>
            <div class="flex justify-end">
              <UButton
                label="Filtern"
                icon="i-lucide-funnel"
                color="neutral"
                variant="soft"
                class="rounded-full py-2 px-3"
                @click="onFilter"
              />
            </div>
          </div>
        </div>
        <!-- Liste -->
        <UPageList class="basis-3/4">
          <BookableResultStrip
            v-for="b in bookables"
            :bookable="b"
            class="m-2"
          />
        </UPageList>
      </div>
    </div>
  </div>
</template>
<script setup>
import BookableResultStrip from "./BookableResultStrip.vue";

const props = defineProps({
  bookables: {
    type: Array,
    required: true,
  },
});
const emit = defineEmits(["filter", "sort"]);

const route = useRoute();
const catalogSlug = computed(() => route.params.catalogSlug);

function onFilter() {
  emit("filter");
}
function onSort() {
  emit("sort");
}
</script>

<style scoped></style>
