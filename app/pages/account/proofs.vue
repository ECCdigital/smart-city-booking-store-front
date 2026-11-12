<template>
  <div class="w-full" style="max-width: 800px">
    <div class="mt-5 md:mt-0">
      <UButton
        variant="link"
        color="neutral"
        icon="i-lucide-arrow-left"
        :label="$t('meta.pages.accountBookings')"
        to="/account/bookings"
        class="px-0"
      />
    </div>
    <PageHeader :title="$t('meta.pages.accountProofs')" class="mt-2 mb-4" />

    <BookingsSkeleton v-if="pending && !booking" :skeleton-count="1" />
    <p v-else-if="!booking" class="text-gray-600 dark:text-gray-400">
      {{ $t("customerUploads.bookingNotFound") }}
    </p>
    <template v-else>
      <div class="flex flex-wrap items-baseline gap-2 mb-2">
        <span class="text-xs text-gray-500">
          {{ $t("customerUploads.provider") }}
        </span>
        <span class="font-semibold">{{ tenant.name }}</span>
        <span class="text-xs text-gray-500">
          · {{ $t("customerUploads.providerReviews") }}
        </span>
      </div>
      <ProofBookingPanel
        :booking="booking"
        :tenant-name="tenant.name"
        :target-field-id="target?.fieldId ?? null"
      >
        <template #actions>
          <UButton
            variant="outline"
            color="neutral"
            size="sm"
            :label="$t('customerUploads.toBooking')"
            :to="`/account/bookings/${booking.id}`"
          />
        </template>
      </ProofBookingPanel>
    </template>
  </div>
</template>
<script setup>
import { useBookingStore } from "~~/stores/bookings.js";
import BookingsSkeleton from "~/components/user/bookings/BookingsSkeleton.vue";
import ProofBookingPanel from "~/components/user/proofs/ProofBookingPanel.vue";
import {
  PROOF_DRAFTS_KEY,
  createProofDrafts,
  useUnsavedProofsGuard,
} from "~/composables/useProofDrafts.js";
import { proofTargetOf } from "~/utils/customerUploads.js";

/**
 * The page „Nachweise einreichen“ under the account, for one booking
 * (`?booking=…`): reached from the banner's choice above „Meine Buchungen“,
 * from „Nachweise verwalten“ on its card, from the booking details and from
 * the mail on a rejection or „Erneut anfordern“. With `&field=…` it scrolls
 * to that field and marks it. Chosen files wait for the button „Nachweise
 * einreichen“; leaving the page with some asks first. Without a booking it
 * leads back to „Meine Buchungen“.
 */
definePageMeta({
  layout: "panel",
  navigation: "user",
  requiresAuth: true,
});

const { t } = useI18n();
usePageTitle(() => t("meta.pages.accountProofs"));

const route = useRoute();
const target = computed(() => proofTargetOf(route.query));

if (!target.value) {
  await navigateTo("/account/bookings", { replace: true });
}

const bookingStore = useBookingStore();
const { getBookingTenant } = useTenant();

const drafts = createProofDrafts();
provide(PROOF_DRAFTS_KEY, drafts);
useUnsavedProofsGuard(drafts);

// Afresh: the state of the uploads may have moved since the list was
// loaded. All bookings, since a file of a series may count for other dates
// of it too.
const { pending } = useAsyncData(
  "proofs-bookings",
  async () => (await bookingStore.fetchBookings({ force: true })) ?? [],
);

const booking = computed(
  () =>
    bookingStore.getBookings.find((b) => b.id === target.value?.bookingId) ??
    null,
);

const tenant = computed(() => {
  const found = booking.value ? getBookingTenant(booking.value) : null;
  const id = booking.value?.tenant?.id ?? booking.value?.tenantId ?? "";
  return { id, name: found?.name ?? booking.value?.tenant?.name ?? id };
});
</script>
