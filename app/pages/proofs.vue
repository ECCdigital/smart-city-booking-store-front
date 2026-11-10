<template>
  <div class="w-full" style="max-width: 800px">
    <PageHeader :title="$t('meta.pages.accountProofs')" class="mb-1" />

    <BookingsSkeleton v-if="pending" :skeleton-count="1" />

    <UAlert
      v-else-if="refusal"
      color="error"
      variant="subtle"
      icon="i-lucide-link-2-off"
      :title="$t(`customerUploads.link.${refusal}.title`)"
      :description="$t(`customerUploads.link.${refusal}.text`)"
    />

    <template v-else-if="booking">
      <i18n-t
        keypath="customerUploads.link.intro"
        tag="p"
        scope="global"
        class="text-sm text-gray-600 dark:text-gray-400 mb-4"
      >
        <template #name>
          <strong>{{ tenant.name }}</strong>
        </template>
      </i18n-t>

      <section
        :id="proofAnchorId(booking.id)"
        class="border-2 border-gray-200 dark:border-gray-700 rounded-xl mb-5 overflow-hidden scroll-mt-24"
      >
        <div
          class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3"
        >
          <UBadge
            color="neutral"
            variant="subtle"
            class="mb-1"
            :label="$t('customerUploads.bookingNumber', { id: booking.id })"
          />
          <h2 class="font-bold text-lg leading-tight">{{ title }}</h2>
          <p
            v-if="booking.timeBegin"
            class="text-sm text-primary font-semibold"
          >
            {{ formatDateRange(booking.timeBegin, booking.timeEnd) }}
          </p>
        </div>
        <div class="p-4 space-y-3">
          <p
            v-if="fields.length === 0"
            class="text-gray-600 dark:text-gray-400"
          >
            {{ $t("customerUploads.nothingMissing") }}
          </p>
          <CustomerUploadFieldCard
            v-for="field in fields"
            :id="proofAnchorId(booking.id, field.fieldId)"
            :key="field.fieldId"
            class="scroll-mt-24"
            :booking="booking"
            :field="field"
            :tenant-name="tenant.name"
            :link="link"
            @state="onState"
          />
        </div>
        <ProofSubmitBar
          v-if="fields.length > 0"
          :booking="booking"
          :tenant-name="tenant.name"
          :link="link"
          @state="onState"
        />
      </section>
    </template>
  </div>
</template>
<script setup>
import BookingsSkeleton from "~/components/user/bookings/BookingsSkeleton.vue";
import CustomerUploadFieldCard from "~/components/user/proofs/CustomerUploadFieldCard.vue";
import ProofSubmitBar from "~/components/user/proofs/ProofSubmitBar.vue";
import {
  PROOF_DRAFTS_KEY,
  createProofDrafts,
  useUnsavedProofsGuard,
} from "~/composables/useProofDrafts.js";
import { useCustomerUploads } from "~/composables/api/useCustomerUploads.js";
import {
  customerUploadErrorOf,
  linkRefusalOf,
  pendingProofGroups,
  proofAnchorId,
} from "~/utils/customerUploads.js";
import { useFormatting } from "~/composables/utils/useFormatting.js";

/**
 * The page „Nachweise einreichen“ of a guest: the
 * signed link of the mail (`?link=…&field=…`) opens it with the one booking
 * of the link, without an account and without a menu. The guest hands in,
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

const { formatDateRange } = useFormatting();
const { read } = useCustomerUploads({ link: link.value });

const drafts = createProofDrafts();
provide(PROOF_DRAFTS_KEY, drafts);
useUnsavedProofsGuard(drafts);

// Answered as data, so it survives the server rendering.
const { data: result, pending } = useAsyncData("proof-link", async () => {
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
const booking = computed(() => answer.value?.booking ?? null);

/** The fields not checked yet, as on the page under the account. */
const fields = computed(() => {
  if (!booking.value) return [];
  const [group] = pendingProofGroups([booking.value]);
  return group?.bookings[0]?.fields ?? [];
});

const title = computed(
  () =>
    booking.value?.bookableItems?.[0]?._bookableUsed?.title ||
    t("booking.unknownBookable"),
);

// The data of `useAsyncData` is shallow: the new state takes the place of
// the whole answer, or the page would not show it.
function onState(customerUploadState) {
  const current = answer.value;
  if (!current?.booking || !customerUploadState) return;
  result.value = {
    ...result.value,
    answer: {
      ...current,
      booking: { ...current.booking, customerUploadState },
    },
  };
}

// The field the mail names, scrolled into view once it is there.
const scrolled = ref(false);
watch(
  fields,
  async () => {
    if (!import.meta.client || scrolled.value || !targetField.value) return;
    await nextTick();
    const element = document.getElementById(
      proofAnchorId(booking.value?.id ?? "", targetField.value),
    );
    if (element) {
      scrolled.value = true;
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  },
  { immediate: true },
);
</script>
