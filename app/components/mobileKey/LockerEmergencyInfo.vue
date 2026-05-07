<template>
  <div
    v-if="serviceInfo && ifbsLockerInfo.isConfirmed"
    class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
  >
    <button
      class="flex items-center justify-between w-full px-4 py-3 cursor-pointer"
      @click="isOpen = !isOpen"
    >
      <div class="flex items-center gap-3">

          <UIcon
            name="i-lucide-life-buoy"
            class="size-10 text-red-500 dark:text-red-400"
          />

        <div class="text-left">
          <p class="font-semibold text-gray-900 dark:text-white text-sm">
            Hilfe bei Problemen mit der Fahrradbox
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Notfallkontakt & Vorgehen bei Störungen
          </p>
        </div>
      </div>
      <UIcon
        :name="isOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        class="size-5 text-gray-400 dark:text-gray-500 transition-transform"
      />
    </button>

    <div v-if="isOpen" class="border-t border-gray-200 dark:border-gray-700">
      <div class="px-4 py-4 space-y-4">
        <div class="flex items-start gap-3">
          <UIcon
            name="i-lucide-user"
            class="size-5 text-gray-400 dark:text-gray-500 mt-0.5"
          />
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Ansprechpartner
            </p>
            <p class="font-medium text-gray-900 dark:text-white text-sm">
              {{ serviceInfo.name }}
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <UIcon
            name="i-lucide-phone"
            class="size-5 text-gray-400 dark:text-gray-500 mt-0.5"
          />
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Telefon (24/7)
            </p>
            <a
              :href="`tel:${serviceInfo.phone}`"
              class="font-medium text-gray-900 dark:text-white text-sm hover:text-primary transition-colors"
            >
              {{ serviceInfo.phone }}
            </a>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <UIcon
            name="i-lucide-mail"
            class="size-5 text-gray-400 dark:text-gray-500 mt-0.5"
          />
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">E-Mail</p>
            <a
              :href="`mailto:${serviceInfo.email}`"
              class="font-medium text-gray-900 dark:text-white text-sm hover:text-primary transition-colors"
            >
              {{ serviceInfo.email }}
            </a>
          </div>
        </div>
      </div>

      <div
        class="mx-4 mb-4 flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-4 py-3"
      >
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-lightbulb"
            class="size-4 text-amber-500 dark:text-amber-400"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">
            Halten Sie bitte Ihre Buchungs-ID bereit:
          </span>
        </div>
        <span
          class="font-mono font-semibold text-sm text-primary ml-3 whitespace-nowrap"
        >
          {{ ifbsLockerInfo.processId }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMobileKey } from "~/composables/api/useMobileKey.js";

const props = defineProps({
  tenantId: {
    type: String,
    required: true,
  },
  lockerInfo: {
    type: Array,
    required: true,
  },
});

const isOpen = ref(false);
const serviceInfo = ref(null);

const { customerService } = useMobileKey();

const ifbsLockerInfo = computed(() =>
  props.lockerInfo.find((info) => info.lockerSystem === "ifbs"),
);

async function fetchCustomerServiceInfo() {
  if (!ifbsLockerInfo.value) return;

  try {
    const data = await customerService(
      props.tenantId,
      props.bookingId,
      ifbsLockerInfo.value.lockerSystem,
    );
    serviceInfo.value = data;
  } catch (e) {
    console.error("Error fetching customer service info:", e);
  }
}

await fetchCustomerServiceInfo();
</script>

<style scoped></style>
