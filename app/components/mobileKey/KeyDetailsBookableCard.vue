<template>
  <div class="bg-primary/20 p-3 rounded mb-1 md:flex justify-between">
    <div class="text-gray-700 dark:text-gray-300">
      <p class="font-bold flex items-center justify-between md:justify-start">
        <span :class="bookableTitle.length > 100 ? 'text-sm' : ''">{{
          bookableTitle
        }}</span>
        <UTooltip text="Zum Buchungsobjekt gehen" class="ml-2">
          <UButton
            icon="i-lucide-square-arrow-out-up-right"
            variant="soft"
            class="text-gray-700 dark:text-gray-300 cursor-pointer"
            @click="goToBookable(bookable.bookableId)"
          />
        </UTooltip>
        <UTooltip v-if="eventId" text="Zum Event gehen" class="ml-2">
          <UButton
            icon="i-lucide-calendar"
            variant="soft"
            class="text-gray-700 dark:text-gray-300 cursor-pointer"
            @click="goToEvent()"
          />
        </UTooltip>
      </p>

      <div class="flex mt-2">
        <div class="grid place-content-center">
          <UIcon name="i-lucide-bike" class="size-5" />
        </div>
        <div class="content-center px-3 py-1">
          <div class="">Fahrradbox #{{ lockerInfo.ifbsMetadata.nummer }}</div>
          <div class="text-sm">
            Box-ID: #{{ lockerInfo.ifbsMetadata.boxId }}
          </div>
        </div>
      </div>

      <BookablesBookableAdressInformation
        v-if="bookableUsed.location.display_address"
        :bookable="bookableUsed"
        class="text-sm"
      />
    </div>

    <div class="content-center space-y-1">
      <OpenIfbsKeyButton
        :tenant-id="bookableUsed.tenantId"
        :booking-id="bookingId"
        :locker-info="lockerInfoArray"
        :is-active="isActive"
        @key-opened="setOpenedKey"
      />
      <UTooltip
        v-if="currentlyOpenedKey"
        text="
        Versuchen Sie die Box zu öffnen, bevor Sie den Status prüfen.Wenn die Box bereits geöffnet ist, können Sie hier den aktuellen Status prüfen."
        :disabled="currentlyOpenedKey"
      >
        <UButton
          v-if="currentlyOpenedKey"
          label="Status prüfen"
          icon="i-lucide-rotate-cw"
          variant="outline"
          :color="
            !lockerInfo.isConfirmed || !isActive || !currentlyOpenedKey
              ? 'neutral'
              : 'primary'
          "
          :disabled="
            !lockerInfo.isConfirmed || !isActive || !currentlyOpenedKey
          "
          :loading="isLoading"
          class="justify-center px-5 w-full"
          :class="
            !lockerInfo.isConfirmed || !isActive || !currentlyOpenedKey
              ? 'cursor-not-allowed '
              : 'cursor-pointer'
          "
          @click="checkStatus()"
        />
      </UTooltip>
    </div>
  </div>
</template>
<script setup>
import OpenIfbsKeyButton from "~/components/mobileKey/OpenIfbsKeyButton.vue";
import { useMobileKey } from "~/composables/api/useMobileKey.js";

const props = defineProps({
  bookable: {
    type: Object,
    required: true,
  },
  lockerInfo: {
    type: Array,
    default: () => [],
  },
  bookingId: {
    type: String,
    default: "",
  },
  isActive: {
    type: Boolean,
    default: false,
  },
});

const { checkMobileKeyStatus } = useMobileKey();
const notification = useNotification();
const isLoading = ref(false);

const bookableUsed = computed(() => {
  if (props.bookable) {
    return props.bookable._bookableUsed;
  }
  return {
    title: "",
    eventId: null,
    location: {
      display_address: null,
    },
  };
});

const bookableTitle = computed(() => bookableUsed.value.title || "");
const eventId = computed(() => bookableUsed.value.eventId);
const lockerInfoArray = computed(() => [props.lockerInfo]);

const currentlyOpenedKey = ref(null);
function setOpenedKey(key) {
  currentlyOpenedKey.value = key;
}

function goToBookable(bookableId) {
  const router = useRouter();
  const routeData = router.resolve({
    path: `/bookables/${bookableId}`,
    query: {},
  });
  window.open(routeData.href, "_blank");
}
function goToEvent() {
  const router = useRouter();
  const routeData = router.resolve({
    path: `/events/${eventId.value}`,
    query: {},
  });
  window.open(routeData.href, "_blank");
}

async function checkStatus() {
  console.log("Want to check status for lockerInfo", lockerInfoArray.value);
  try {
    isLoading.value = true;
    if (currentlyOpenedKey.value) {
      await checkMobileKeyStatus(
        props.tenantId,
        props.lockerInfo.processId,
        props.bookingId,
        currentlyOpenedKey.value
      );
    } else {
      notification.error(
        "Versuchen Sie die Box zu öffnen, bevor Sie den Status prüfen.",
        "Fehler beim Prüfen des Schlüssels"
      );
    }
  } catch (e) {
    console.error("Error opening mobile key", e);
    notification.error("", "Fehler beim Prüfen des Schlüssels");
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped></style>
