<template>
  <div style="padding: 50px 0">
    <div class="md:flex items-center justify-between md:mb-5">
      <h2 class="text-2xl font-bold mt-7">{{ $t("events.upcoming") }}</h2>
      <UButton
        v-if="latestEvents.length > 3"
        variant="ghost"
        :label="$t('events.showAllEvents')"
        trailing-icon="i-lucide-chevron-right"
        class="my-2 md:my-0"
        @click="goToEventsPage()"
      />
    </div>
    <div class="md:flex md:space-x-2">
      <div
        v-for="(b, i) in latestEvents.slice(0, numberOfVisibleEvents)"
        :key="i"
        class="flex basis-1/3 mb-2"
      >
        <ResultCard
          :item="b"
          :calculated-price="b.calculatedPrice"
          :eager="i === 0"
          entry-page-mode
          class="flex flex-col h-full w-full"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import ResultCard from "~/components/search/ResultCard.vue";
import { useBreakpointCheck } from "~/composables/utils/useBreakpointCheck.js";

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
});

const { tenantTo } = useTenantRoute();

const { isGreaterThanLg } = useBreakpointCheck();

const latestEvents = computed(() => {
  const events = props.items;
  return events.sort(
    (a, b) =>
      new Date(a.information.startDate).getTime() -
      new Date(b.information.startDate).getTime(),
  );
});

const numberOfVisibleEvents = computed(() => {
  if (isGreaterThanLg.value) {
    return 4;
  } else {
    return 3;
  }
});

function goToEventsPage() {
  const router = useRouter();
  router.push(tenantTo({ path: "/search", query: { cat: "event" } }));
}
</script>
<style scoped></style>
