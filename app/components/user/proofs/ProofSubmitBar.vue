<template>
  <div
    class="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
  >
    <p
      class="text-sm"
      :class="
        pendingCount > 0
          ? 'text-amber-600 dark:text-amber-400 font-medium'
          : 'text-gray-500'
      "
    >
      {{
        pendingCount > 0
          ? $t("customerUploads.draftsPending", pendingCount, {
              count: pendingCount,
            })
          : $t("customerUploads.draftsNone")
      }}
    </p>
    <UButton
      data-test="proof-submit"
      icon="i-lucide-send"
      :label="$t('customerUploads.submitAll')"
      :disabled="pendingCount === 0"
      :loading="busy"
      @click="submit"
    />
    <UAlert
      v-if="errorMessage"
      data-test="proof-submit-error"
      color="error"
      variant="subtle"
      :description="errorMessage"
      class="w-full"
    />
  </div>
</template>
<script setup>
import { useCustomerUploads } from "~/composables/api/useCustomerUploads.js";
import { PROOF_DRAFTS_KEY } from "~/composables/useProofDrafts.js";
import { useNotification } from "~/composables/useNotification.js";
import { useBookingStore } from "~~/stores/bookings.js";
import {
  customerUploadErrorKey,
  customerUploadErrorOf,
  formatsLabel,
  submissionOrderOf,
  submissionOutcomeOf,
} from "~/utils/customerUploads.js";

/**
 * The button „Nachweise einreichen“ of a booking on the page „Nachweise
 * einreichen“: hands every chosen proof of the
 * booking in at once and the staff gets one mail for the ones stored. Each
 * file is accepted or refused on its own: a refused one stays at its field
 * with the reason, the bar says that not every file went in. A refusal of
 * the whole request names its reason and keeps every chosen file.
 */
const props = defineProps({
  booking: {
    type: Object,
    required: true,
  },
  tenantName: {
    type: String,
    default: "",
  },
  // The signed link of a guest's booking: the new
  // state is emitted instead of stored.
  link: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["state"]);

const { t } = useI18n();
const drafts = inject(PROOF_DRAFTS_KEY);
const bookingStore = useBookingStore();
const notification = useNotification();
const { submitAll } = useCustomerUploads({ link: props.link });

const busy = ref(false);
const errorMessage = ref("");

const pendingCount = computed(() => drafts.waiting(props.booking.id).length);

function fieldOf(fieldId) {
  return (props.booking.customerUploadState?.fields ?? []).find(
    (field) => field.fieldId === fieldId,
  );
}

function refusalText(error) {
  const { code, params = {} } = customerUploadErrorOf(error);
  const field = fieldOf(params.fieldId);
  const message = t(customerUploadErrorKey(code), {
    formats: formatsLabel(params.formats ?? field?.formats ?? []),
    size: params.maxFileSizeMb ?? field?.maxFileSizeMb,
    count: params.maxFiles ?? field?.maxFiles,
    tenant: props.tenantName,
  });
  return field ? `${field.label}: ${message}` : message;
}

async function submit() {
  errorMessage.value = "";
  busy.value = true;
  const { tenantId, id } = props.booking;
  const sent = submissionOrderOf(drafts.waiting(id));
  const { data, error } = await submitAll(tenantId, id, sent);
  busy.value = false;

  if (error) {
    errorMessage.value = refusalText(error);
    return;
  }
  const outcome = submissionOutcomeOf(sent, data?.refused ?? []);
  drafts.settle(id, outcome);
  if (props.link) {
    emit("state", data?.customerUploadState);
  } else {
    bookingStore.setCustomerUploadState(id, data?.customerUploadState);
    // A file for other dates of the series too: their state moved as well.
    const stored = new Set(outcome.storedIds);
    if (sent.some((draft) => stored.has(draft.id) && draft.alsoFor?.length)) {
      await bookingStore.fetchBookings({ force: true });
    }
  }

  if (outcome.refusals.length === 0) {
    notification.success(t("customerUploads.submitted"));
  } else if (outcome.storedIds.length > 0) {
    notification.warning(t("customerUploads.submittedPartly"));
    errorMessage.value = t("customerUploads.submittedPartly");
  } else {
    errorMessage.value = t("customerUploads.submittedNone");
  }
}
</script>
