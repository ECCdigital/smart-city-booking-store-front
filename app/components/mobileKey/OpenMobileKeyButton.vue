<template>
  <div>
    <UButton
        v-if="lockerInfo.length === 1"
        label="Schließsystem öffnen"
        icon="i-lucide-key-round"
        class="justify-center px-5 bg-primary text-black"
        :style="{ cursor: 'pointer' }"
        @click="onOpenMobileKey(lockerInfo[0].processId)"
    />
    <UModal title="Verfügbare Schließsysteme">
      <UButton
          v-if="lockerInfo.length > 1"
          label="Schließsysteme anzeigen"
          icon="i-lucide-key-round"
          class="justify-center px-5 bg-primary text-black"
          :style="{ cursor: 'pointer' }"
          @click="openKeySelection"
      />
      <template #body>
        <div>
          <p>Es sind mehrere Schließsysteme verfügbar.</p>
          <p class="mb-5">Bitte wählen Sie eines aus:</p>
          <div v-for="(locker, index) in lockerInfo" :key="index" class="flex justify-between bg-primary/20 p-3 rounded mb-1">
            <div>
              <p class="font-semibold">{{ getBookableTitle(locker.bookableId) }}</p>
              <p class="text-sm">Box-Id: {{locker.ifbsMetadata.boxId}}</p>
            </div>
            <UButton
                label="Öffnen"
                icon="i-lucide-key-round"
                class="justify-center px-5 bg-primary text-black"
                :style="{ cursor: 'pointer' }"
                @click="onOpenMobileKey(locker.processId)"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
<script setup>
import {useMobileKey} from "~/composables/api/useMobileKey.js";
import {useBookableStore} from "~~/stores/bookable.js";
import {useCatalogBundle} from "~/composables/useCatalogBundle.js";

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
});
const { openMobileKey } = useMobileKey();

const { loadBundle } = useCatalogBundle();
const bookableStore = useBookableStore();
await loadBundle({ include: ["bookables"] });

const bookableIds = computed(() => props.lockerInfo.map(locker => locker.bookableId));
const bookables = ref([]);


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
  const bookable = bookables.value.find(b => b.id === bookableId);
  return bookable ? bookable.title : "Unbekanntes Buchungsobjekt";
}

function onOpenMobileKey(processId) {
  console.log("try to open mobile key", props.lockerInfo);
    openMobileKey(props.tenantId, processId, props.bookingId);
}
</script>

<style scoped></style>
