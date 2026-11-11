<template>
  <!-- each field a card like the documents of the booking: required as the
       small type line, the label, the state; the way to the page
       „Nachweise einreichen“ as the button on the right, as the download -->
  <div v-if="fields.length > 0" class="mb-5">
    <p class="font-medium">{{ $t("customerUploads.title") }}</p>
    <div
      v-for="field in fields"
      :key="field.fieldId"
      class="bg-primary/20 p-3 rounded mb-1 flex justify-between gap-3"
    >
      <div class="text-gray-700 dark:text-gray-300 min-w-0">
        <p class="text-sm">
          {{
            field.required
              ? $t("customerUploads.required")
              : $t("customerUploads.optional")
          }}
        </p>
        {{ field.label }}
        <div class="mt-1 text-sm flex flex-wrap items-center gap-1">
          {{ $t("booking.statusLabel") }}:
          <CustomerUploadStateChip :field="field" :framed="false" />
        </div>
        <!-- rejected or requested again: the reason -->
        <p
          v-if="reasonOf(field)"
          class="text-sm text-error mt-1"
        >
          {{ $t(reasonOf(field).key, { reason: reasonOf(field).reason }) }}
        </p>
      </div>
      <div v-if="isOpen(field)" class="grid content-center">
        <UTooltip :text="$t('customerUploads.submitNow')">
          <UButton
            icon="i-lucide-upload"
            :aria-label="$t('customerUploads.submitNow')"
            variant="soft"
            size="lg"
            class="text-gray-700 dark:text-gray-300"
            :to="proofPageLink(booking.id, field.fieldId)"
          />
        </UTooltip>
      </div>
    </div>
  </div>
</template>
<script setup>
import CustomerUploadStateChip from "~/components/user/proofs/CustomerUploadStateChip.vue";
import {
  CUSTOMER_UPLOAD_FIELD_STATE,
  customerUploadFieldView,
  customerUploadFieldsOf,
  proofPageLink,
} from "~/utils/customerUploads.js";

/**
 * The section „Nachweise“ of the booking details:
 * each upload field with its state, a checked one with its date and, for a
 * deleted file, the note that it is deleted, a rejected one with its reason,
 * and the way to the page „Nachweise
 * einreichen“ at each field that is not checked, opened at that field.
 */
const props = defineProps({
  booking: {
    type: Object,
    required: true,
  },
});

const fields = computed(() => customerUploadFieldsOf(props.booking));

/** Whether the page „Nachweise einreichen“ has something for the field. */
const isOpen = (field) => field.state !== CUSTOMER_UPLOAD_FIELD_STATE.FULFILLED;

/** The reason a field asks for a new file, with its message key. */
function reasonOf(field) {
  const view = customerUploadFieldView(field);
  return view.reason ? { key: view.reasonKey, reason: view.reason } : null;
}
</script>
