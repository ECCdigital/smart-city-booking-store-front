<template>
  <div class="">
    <!-- Title -->
    <DetailsAreaTitleBlock :tenant-name="tenantName" :title="title">
      <template #actions>
        <DetailsAreaButtonBooking :item="item" :is-event="isEvent" />
        <DetailsAreaButtonMoreActions :item="item" :is-event="isEvent" />
      </template>
    </DetailsAreaTitleBlock>

    <div class="mt-5 grid gap-6 md:grid-cols-[1.45fr_0.9fr] md:items-start">
      <!-- Left: image, tags, description, availability -->
      <div class="min-w-0 space-y-5">
        <DetailsAreaImage :item="item" :is-event="isEvent" />

        <BookableFlagDisplay
          :flags="item?.flags"
          :badges="badgeFieldLabels"
          is-detail-mode
        />
        <DetailsAreaDescriptionBlock :item="item" :is-event="isEvent" />

        <!-- Meta information on small screens -->
        <div class="space-y-3 md:hidden">
          <AddressInformationArea :item="item" :is-event="isEvent" />
          <PriceInformationArea :item="item" :is-event="isEvent" />
          <DetailsAreaCancellationConditions :item="item" :is-event="isEvent" />
          <BookableCustomFieldsMoreInformation :item="item" />
        </div>

        <USeparator class="w-full" :ui="{ border: 'border-gray-300' }" />

        <DetailsAreaAvailabilitySection
          v-if="!isEvent"
          :bookable="item"
          :time-period="timePeriod"
          @period-selected="setSearchTimePeriod"
          @period-cleared="removeSearchTimePeriod"
        />
        <DetailsAreaAvailabilityResults v-if="!isEvent" :item="item" />

        <DetailsAreaTicketOptions v-if="isEvent" :item="item" />

        <DetailsAreaRelatedBookables :item="item" class="my-10" />
      </div>

      <!-- Right: Meta information -> address, price, cancellation under price, more info -->
      <div class="hidden md:block space-y-3 md:sticky md:top-4">
        <AddressInformationArea :item="item" :is-event="isEvent" />
        <PriceInformationArea :item="item" :is-event="isEvent" />
        <DetailsAreaCancellationConditions :item="item" :is-event="isEvent" />
        <BookableCustomFieldsMoreInformation :item="item" />
      </div>
    </div>
  </div>
</template>
<script setup>
import DetailsAreaTitleBlock from "~/components/detailsArea/DetailsAreaTitleBlock.vue";
import { useBookableDetailContent } from "~/composables/bookables/useBookableDetailContent.js";
import DetailsAreaImage from "~/components/detailsArea/DetailsAreaImage.vue";
import BookableFlagDisplay from "~/components/bookables/BookableFlagDisplay.vue";
import AddressInformationArea from "~/components/AddressInformationArea.vue";
import PriceInformationArea from "~/components/PriceInformationArea.vue";
import DetailsAreaCancellationConditions from "~/components/detailsArea/DetailsAreaCancellationConditions.vue";
import BookableCustomFieldsMoreInformation from "~/components/bookables/BookableCustomFieldsMoreInformation.vue";
import DetailsAreaAvailabilitySection from "~/components/detailsArea/DetailsAreaAvailabilitySection.vue";
import DetailsAreaAvailabilityResults from "~/components/detailsArea/DetailsAreaAvailabilityResults.vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  isEvent: {
    type: Boolean,
    default: false,
  },
});

const {
  title,
  tenantName,
  badgeFieldLabels,
  timePeriod,
  setSearchTimePeriod,
  removeSearchTimePeriod,
} = useBookableDetailContent(() => props.item, props.isEvent);
</script>
<style scoped></style>
