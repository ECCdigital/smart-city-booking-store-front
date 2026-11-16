<template>
  <div class="w-full" style="max-width: 800px">
    <PageHeader :title="$t('meta.pages.accountProofs')" class="mb-1" />

    <!-- Only the first time: read afresh, the page stays as it is. -->
    <BookingsSkeleton v-if="pending && !result" :skeleton-count="1" />

    <UAlert
      v-else-if="refusal"
      color="error"
      variant="subtle"
      icon="i-lucide-link-2-off"
      :title="$t(`customerUploads.link.${refusal}.title`)"
      :description="$t(`customerUploads.link.${refusal}.text`)"
    />

    <template v-else-if="bookings.length > 0">
      <i18n-t
        :keypath="
          bookings.length > 1
            ? 'customerUploads.link.introSeries'
            : 'customerUploads.link.intro'
        "
        tag="p"
        scope="global"
        class="text-sm text-gray-600 dark:text-gray-400 mb-4"
      >
        <template #name>
          <strong>{{ tenant.name }}</strong>
        </template>
      </i18n-t>

      <!-- A series' link: every proof of the series once. -->
      <ProofSeriesPanel
        v-if="bookings.length > 1"
        :bookings="bookings"
        :tenant-name="tenant.name"
        :link="link"
        :target-field-id="targetField"
        @reload="refresh"
      />
      <ProofBookingPanel
        v-else
        :booking="bookings[0]"
        :tenant-name="tenant.name"
        :link="link"
        :target-field-id="targetField"
        @state="onState"
      />
    </template>
  </div>
</template>
<script setup>
import BookingsSkeleton from "~/components/user/bookings/BookingsSkeleton.vue";
import ProofBookingPanel from "~/components/user/proofs/ProofBookingPanel.vue";
import ProofSeriesPanel from "~/components/user/proofs/ProofSeriesPanel.vue";
import {
  PROOF_DRAFTS_KEY,
  createProofDrafts,
  useUnsavedProofsGuard,
} from "~/composables/useProofDrafts.js";
import { useCustomerUploads } from "~/composables/api/useCustomerUploads.js";
import {
  customerUploadErrorOf,
  linkRefusalOf,
} from "~/utils/customerUploads.js";

/**
 * The page „Nachweise einreichen“ of a guest: the
 * signed link of the mail (`?link=…&field=…`) opens it with the one booking
 * of the link - or, with the link of a series, every proof of the series
 * once - without an account and without a menu. The guest hands in,
 * replaces and deletes proofs until they are checked, and hands in anew
 * after a rejection. The link holds until the booking ends. Chosen files
 * wait for the button „Nachweise einreichen“; leaving the page with some
 * asks first.
 */
definePageMeta({ layout: "link" });

const { t } = useI18n();
usePageTitle(() => t("meta.pages.accountProofs"));
// The link is the key to the booking: it leaves the page in no referrer and
// no search engine keeps it.
useHead({
  meta: [
    { name: "referrer", content: "no-referrer" },
    { name: "robots", content: "noindex, nofollow" },
  ],
});

const route = useRoute();
const one = (value) => (Array.isArray(value) ? value[0] : value);
const link = computed(() => one(route.query.link) ?? "");
const targetField = computed(() => one(route.query.field) ?? null);

const { read } = useCustomerUploads({ link: link.value });

const drafts = createProofDrafts();
provide(PROOF_DRAFTS_KEY, drafts);
useUnsavedProofsGuard(drafts);

// Answered as data, so it survives the server rendering.
const {
  data: result,
  pending,
  refresh,
} = useAsyncData("proof-link", async () => {
  if (!link.value) return { refusal: "invalid", answer: null };
  const { data, error } = await read();
  if (error) {
    return {
      refusal: linkRefusalOf(customerUploadErrorOf(error).code),
      answer: null,
    };
  }
  return { refusal: null, answer: data };
});

const refusal = computed(() => result.value?.refusal ?? null);
const answer = computed(() => result.value?.answer ?? null);

const tenant = computed(() => answer.value?.tenant ?? { id: "", name: "" });
const bookings = computed(() => answer.value?.bookings ?? []);

// The data of `useAsyncData` is shallow: the new state takes the place of
// the whole answer, or the page would not show it.
function onState(customerUploadState) {
  const current = answer.value;
  if (!current?.bookings?.length || !customerUploadState) return;
  result.value = {
    ...result.value,
    answer: {
      ...current,
      bookings: [{ ...current.bookings[0], customerUploadState }],
    },
  };
}
</script>
