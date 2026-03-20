<template>
  <div class="">
    <UModal v-model:open="showOpenDialog" :dismissible="false">
      <UTooltip :text="getTooltipText(lockerInfo[0])">
        <UButton
          v-if="lockerInfo.length === 1"
          label="Fahrradbox öffnen"
          icon="i-lucide-key-round"
          :disabled="!lockerInfo[0].isConfirmed || !isActive"
          class="justify-center px-5 bg-primary text-black w-full"
          :class="
            lockerInfo[0].isConfirmed ? 'cursor-pointer' : 'cursor-not-allowed'
          "
          :loading="isLoading"
          @click="onOpenMobileKey(lockerInfo[0].processId)"
        />
      </UTooltip>
      <template #content>
        <OpenIfbsKeyStatusDialog
          :loading="isLoading"
          :status="openingStatus"
          @close="() => (showOpenDialog = false)"
          @retry="onCheckBoxStatus()"
        />
      </template>
    </UModal>
    <UModal title="Verfügbare Fahrradboxen">
      <UTooltip :text="getTooltipText()">
        <UButton
          v-if="lockerInfo.length > 1"
          label="Fahrradboxen anzeigen"
          icon="i-lucide-key-round"
          :disabled="!isActive"
          class="justify-center px-5 bg-primary text-black w-full"
          :class="isActive ? 'cursor-pointer' : 'cursor-not-allowed'"
          @click="openKeyOptions"
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
            <UModal v-model:open="showOpenDialog" :dismissible="false">
              <UTooltip :text="getTooltipText(locker)">
                <UButton
                  label="Öffnen"
                  icon="i-lucide-key-round"
                  :disabled="!locker.isConfirmed || !isActive"
                  class="justify-center px-5 bg-primary text-black"
                  :class="
                    locker.isConfirmed
                      ? 'cursor-pointer '
                      : 'cursor-not-allowed'
                  "
                  :loading="isLoading"
                  @click="onOpenMobileKey(locker.processId)"
                />
              </UTooltip>
              <template #content>
                <OpenIfbsKeyStatusDialog
                  :loading="isLoading"
                  :status="openingStatus"
                  @close="() => (showOpenDialog = false)"
                  @retry="onCheckBoxStatus()"
                />
              </template>
            </UModal>
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
import OpenIfbsKeyStatusDialog from "~/components/mobileKey/OpenIfbsKeyStatusDialog.vue";

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
const emit = defineEmits(["keyOpened"]);
const showOpenDialog = ref(false);
const isLoading = ref(false);
const openingStatus = ref(null);
const currentProcessId = ref(null);
const currentBoxId = ref(null);

const { openMobileKey, checkMobileKeyStatus } = useMobileKey();

//Bookables
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
function getBookableTitle(bookableId) {
  const bookable = bookables.value.find((b) => b.id === bookableId);
  return bookable ? bookable.title : "Unbekanntes Buchungsobjekt";
}

async function openKeyOptions() {
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

async function onOpenMobileKey(processId) {
  try {
    isLoading.value = true;
    currentProcessId.value = processId;

    const result = await openMobileKey(
      props.tenantId,
      processId,
      props.bookingId,
    );

    currentBoxId.value = result.providerResponse.OpenBox_ID;

    await onCheckBoxStatus();

    emit("keyOpened", result.providerResponse.OpenBox_ID);
  } catch (e) {
    console.error("Error opening mobile key", e);
    isLoading.value = false;
    openingStatus.value = "error";
  }
}
async function onCheckBoxStatus() {
  isLoading.value = true;

  const status = await checkMobileKeyStatus(
    props.tenantId,
    currentProcessId.value,
    props.bookingId,
    currentBoxId.value,
  );

  isLoading.value = false;
  if (status.confirmed) {
    openingStatus.value = "opened";
  } else {
    openingStatus.value = "pending";
  }
}
</script>
<style scoped></style>
