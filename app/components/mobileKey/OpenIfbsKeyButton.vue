<template>
  <div>
    <UTooltip :text="getTooltipText(lockerInfo[0])">
      <UButton
        v-if="lockerInfo.length === 1"
        label="Fahrradbox öffnen"
        icon="i-lucide-key-round"
        :disabled="!lockerInfo[0].isConfirmed || !isActive"
        class="justify-center px-5 bg-primary text-black"
        :class="
          lockerInfo[0].isConfirmed ? 'cursor-pointer' : 'cursor-not-allowed'
        "
        @click="onOpenMobileKey(lockerInfo[0].processId)"
      />
    </UTooltip>

    <UModal title="Verfügbare Fahrradboxen">
      <UTooltip :text="getTooltipText()">
        <UButton
          v-if="lockerInfo.length > 1"
          label="Fahrradboxen anzeigen"
          icon="i-lucide-key-round"
          :disabled="!isActive"
          class="justify-center px-5 bg-primary text-black"
          :class="isActive ? 'cursor-pointer' : 'cursor-not-allowed'"
          @click="openKeySelection"
        />
      </UTooltip>
      <template #body>
        <div>
          <p>Es sind mehrere Fahrradboxen mit Schließsystemen verfügbar.</p>
          <p class="mb-5">Bitte wählen Sie eines aus:</p>
          <div
            v-for="(locker, index) in lockerInfo"
            :key="index"
            class="flex justify-between bg-primary/20 p-3 rounded mb-1"
          >
            <div>
              <p class="font-semibold">
                {{ getBookableTitle(locker.bookableId) }}
              </p>
              <p class="text-sm">Box-Id: {{ locker.ifbsMetadata.boxId }}</p>
            </div>
            <UTooltip :text="getTooltipText(locker)">
              <UButton
                label="Öffnen"
                icon="i-lucide-key-round"
                :disabled="!locker.isConfirmed || !isActive"
                class="justify-center px-5 bg-primary text-black"
                :class="
                  locker.isConfirmed ? 'cursor-pointer ' : 'cursor-not-allowed'
                "
                @click="onOpenMobileKey(locker.processId)"
              />
            </UTooltip>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
<script setup>
import { useMobileKey } from "~/composables/api/useMobileKey.js";
import { useBookableStore } from "~~/stores/bookable.js";
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";

const props = defineProps({
  lockerInfo: {
    type: Array,
    required: true,
  },
  bookingId: {
    type: String,
    required: true,
  },
  tenantId: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
});
const { openMobileKey } = useMobileKey();

const { loadBundle } = useCatalogBundle();
const bookableStore = useBookableStore();
await loadBundle({ include: ["bookables"] });

const bookableIds = computed(() =>
  props.lockerInfo.map((locker) => locker.bookableId),
);
const bookables = ref([]);

function getTooltipText(logic = null) {
  if (!props.isActive) {
    return "Der Schlüssel ist derzeit nicht aktiv.";
  }
  if (logic && !logic.isConfirmed) {
    return `Die Fahrradbox wurde vom Anbieter noch nicht bestätigt.`;
  }
  return "Fahrradbox jetzt öffnen";
}

async function openKeySelection() {
  if (bookableIds.value.length === 0) {
    bookables.value = [];
    return;
  }
  const fetchedBookables = [];
  for (const bookableId of bookableIds.value) {
    const bookable = bookableStore.getBookableById(bookableId);
    if (bookable) {
      fetchedBookables.push(bookable);
    }
  }
  bookables.value = fetchedBookables;
}

function getBookableTitle(bookableId) {
  const bookable = bookables.value.find((b) => b.id === bookableId);
  return bookable ? bookable.title : "Unbekanntes Buchungsobjekt";
}

function onOpenMobileKey(processId) {
  console.log("try to open mobile key", props.lockerInfo);
  openMobileKey(props.tenantId, processId, props.bookingId);
}
</script>

<style scoped></style>
