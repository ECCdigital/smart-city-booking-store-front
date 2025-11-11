<template>
  <div>
    <div
      class="bg-gray-200 dark:bg-gray-700 flex flex-row rounded-xl"
      :class="isNotBookable ? 'opacity-70' : ''"
      style="max-height: 400px; min-height: 150px"
    >
      <div class="basis-1/4">
        <img
            v-if="bookable.imgUrl"
            :src="`/api/img?url=${encodeURIComponent(bookable.imgUrl)}`"
            alt="Bild des Buchungsobjekts"
            class="rounded-xl h-full object-cover"
        >
        <img
          v-else
          src="../../assets/bookable-default.jpg"
          alt="Platzhalterbild: graue Dreiecke, keine spezifische Darstellung des Buchungsobjekts"
          class="rounded-xl h-full object-cover"
        >
      </div>
      <div class="basis-3/4 p-4">
        <!-- Title -->
        <p class="text-lg font-bold">
          {{ bookable.title }}
        </p>
        <p>{{ bookable.tenantId }}</p>

        <!-- Adresse und Entfernung -->
        <div class="w-full my-5">
          <BookableAdressInformation :bookable="bookable" />
        </div>
        <USeparator
          color="neutral"
          class="w-full"
          :ui="{ border: 'border-gray-200' }"
        />

        <div class="flex flex-row">
          <!-- Eigenschaften -->
          <div class="basis-3/4 w-full my-5">
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
          <div
            class="basis-1/4 w-full flex justify-end content-center text-md font-bold"
          >
            <BookablePriceDisplay v-if="!isNotBookable" :price="price" />
          </div>
        </div>

        <!--Aktionen-->
        <div class="w-full mt-5 flex justify-end">
          <!-- toDo - für MVP ausgeblendet! Danach wieder aktivieren!  -->
          <!--<UButton
            v-if="!isNotBookable"
            label="Details ansehen"
            variant="ghost"
            class="justify-center px-10"
            :to="`/catalog/${catalogSlug}/locations/${bookable.id}`"
          />
          -->
          <UButton
            v-if="!isNotBookable"
            label="Buchen"
            class="justify-center  px-10"
            :style="
        { color: contrastToPrimary }
      "
            @click="goToCheckout"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import BookablePriceDisplay from "~/components/bookables/BookablePriceDisplay.vue";
import BookableAdressInformation from "~/components/bookables/BookableAdressInformation.vue";
import {useContrastColor} from "~/composables/utils/useContrastColor.js";

const props = defineProps({
  bookable: {
    type: Object,
    required: true,
  },
  price: {
    type: Number,
    default: null,
  },
  isNotBookable: {
    type: Boolean,
    default: false,
  },
});

const contrastToPrimary = computed(() =>
    useContrastColor().contrastToPrimary(),
);

function goToCheckout() {
  const config = useRuntimeConfig();
  const baseFromConfig =
    (config && config.public && config.public.adminBaseUrl) ||
    config.adminBaseUrl ||
    "";

  if (!baseFromConfig) {
    console.warn(
      "adminBaseUrl not set in runtime config; falling back to relative /checkout path",
    );
  }

  const base = baseFromConfig.replace(/\/$/, "") || ""; // remove trailing slash if present

  const params = new URLSearchParams({
    id: props.bookable.id,
    tenant: props.bookable.tenantId,
    amount: "1",
  });

  const url = base
    ? `${base}/checkout?${params.toString()}`
    : `/checkout?${params.toString()}`;

  if (typeof window !== "undefined") {
    const newWindow = window.open(url, "_blank");
    if (newWindow) {
      try {
        newWindow.opener = null; // enforce noopener
      } catch (e) {
        console.error(e);
        // ignore in case browser forbids
      }
    } else {
      window.location.href = url;
    }
  } else {
    console.warn("Attempted to open checkout URL on server-side: ", url);
  }
}
</script>

<style scoped></style>
