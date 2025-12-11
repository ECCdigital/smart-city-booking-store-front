<template>
  <div class="basis-3/4 p-4 flex flex-col justify-between">
    <div>
      <!-- Title -->
      <p class="text-lg font-bold">
        {{ bookable?.title }}
      </p>
      <p>{{ tenantName }}</p>

      <!-- Adresse und Entfernung -->
      <BookableAdressInformation :bookable="bookable" class="w-full my-5" />
      <USeparator
        color="neutral"
        class="w-full"
        :ui="{ border: 'border-gray-300' }"
      />
    </div>

    <div class="flex justify-between h-full overflow-hidden">
      <!-- Eigenschaften -->
      <div class="basis-3/5 w-full my-2">
        <BookableFlagDisplay :flags="bookable?.flags" class="line-clamp-3" />
      </div>
      <div class="basis-2/5 w-full grid content-end">
        <!-- Preis -->
        <BookablePriceDisplay
          v-if="!isNotBookable"
          :bookable="bookable"
          :calculated-price="calculatedPrice"
          class="grid place-content-end text-md font-bold"
        />

        <!--Aktionen-->
        <div class="w-full mt-2 flex justify-end content-end">
          <UButton
          v-if="!isNotBookable"
          label="Details ansehen"
          variant="ghost"
          class="justify-center px-10"
          :to="tenantTo(`bookables/${bookable.id}`)"
        /><!--@click="goToDetails" -->

          <UButton
            v-if="!isNotBookable"
            label="Buchen"
            class="justify-center px-10"
            :style="{ color: contrastToPrimary }"
            @click="goToCheckout"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useTenantStore } from "~~/stores/tenant.js";
import BookableAdressInformation from "~/components/bookables/BookableAdressInformation.vue";
import BookableFlagDisplay from "~/components/bookables/BookableFlagDisplay.vue";
import BookablePriceDisplay from "~/components/bookables/BookablePriceDisplay.vue";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";
import { useCheckoutRedirect } from "~/composables/utils/useCheckoutRedirect.js";

const props = defineProps({
  bookable: {
    type: Object,
    required: true,
  },
  searchParams: {
    type: Object,
    default: null,
  },
  calculatedPrice: {
    type: Object,
    default: null,
  },
  isNotBookable: {
    type: Boolean,
    default: false,
  },
});
const { tenantTo } = useTenantRoute();


const tenantName = computed(() => {
  return useTenantStore().getTenantById(props.bookable.tenantId).name;
});

const contrastToPrimary = computed(() =>
  useContrastColor().contrastToPrimary()
);

/*
function goToDetails() {
  console.log("***")
  const route = useRoute();
  const router = useRouter();
  let basePath = route.path;

  if (basePath.includes("bookables")) {
    basePath = "bookables"
  } else if (basePath.includes("locations")) {
    basePath = "locations";
  }

  router.push(`${basePath}/${props.bookable.id}`);
}
 */

function goToCheckout() {
  const route = useRoute();
  useCheckoutRedirect().redirectToCheckout({
    id: props.bookable.id,
    tenantId: props.bookable.tenantId,
    start: route.query.start,
    end: route.query.end,
  });
}
</script>
<style scoped></style>
