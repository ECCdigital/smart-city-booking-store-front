<template>
  <div style="max-width: 90vw; margin: auto; padding: 50px 0">
    <div class="flex items-end mb-5">
      <h2 class="text-2xl font-bold mt-7">
        Anstehende Veranstaltungen
      </h2>
      <div class="flex-1" />
      <p
        v-if="latestEvents.length > 3"
        class="text-primary text-bold cursor-pointer"
        @click="goToEventsPage()"
      >
        Alle Events ansehen
      </p>
    </div>
    <div class="md:flex md:space-x-2">
      <div
        v-for="(b, i) in latestEvents.slice(0, numberOfVisibleEvents)"
        :key="i"
        class="flex basis-1/3 mb-2"
      >
        <ResultCard
          :item="b.item"
          :calculated-price="b.calculatedPrice"
          entry-page-mode
          class="flex flex-col h-full w-full"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import ResultCard from "~/components/search/ResultCard.vue";
import {useBreakpointCheck} from "~/composables/utils/useBreakpointCheck.js";

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
});

const isGreaterThanLg = computed(() => useBreakpointCheck().isGreaterThanLg());

const latestEvents = computed(() => {
  return props.items
    .filter((i) => i.item.category === "event")
    .sort(
      (a, b) =>
        new Date(a.item.information.startDate).getTime() -
        new Date(b.item.information.startDate).getTime(),
    );
});

const numberOfVisibleEvents = computed(() => {
  if(isGreaterThanLg.value){
    return 4
  } else {
    return 3
  }
})

function goToEventsPage() {
  const router = useRouter();
  router.push("/events");
}
</script>
<style scoped></style>
