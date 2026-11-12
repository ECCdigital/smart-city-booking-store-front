<template>
  <!-- One booking of the page „Nachweise einreichen“: its number, title and
       period, its fields not checked yet and the button „Nachweise
       einreichen“. The field the page is opened at is marked and scrolled
       into view once it is there. -->
  <section
    :id="proofAnchorId(booking.id)"
    class="border-2 border-gray-200 dark:border-gray-700 rounded-xl mb-5 overflow-hidden scroll-mt-24"
  >
    <div
      class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-wrap justify-between gap-2 items-start"
    >
      <div>
        <UBadge
          color="neutral"
          variant="subtle"
          class="mb-1"
          :label="$t('customerUploads.bookingNumber', { id: booking.id })"
        />
        <h2 class="font-bold text-lg leading-tight">{{ title }}</h2>
        <p v-if="booking.timeBegin" class="text-sm text-primary font-semibold">
          {{ formatDateRange(booking.timeBegin, booking.timeEnd) }}
        </p>
      </div>
      <slot name="actions" />
    </div>
    <div class="p-4 space-y-3">
      <p v-if="fields.length === 0" class="text-gray-600 dark:text-gray-400">
        {{ $t("customerUploads.nothingMissing") }}
      </p>
      <CustomerUploadFieldCard
        v-for="field in fields"
        :id="proofAnchorId(booking.id, field.fieldId)"
        :key="field.fieldId"
        class="scroll-mt-24"
        :class="{ 'ring-2 ring-primary': field.fieldId === targetFieldId }"
        :booking="booking"
        :field="field"
        :tenant-name="tenantName"
        :link="link"
        @state="emit('state', $event)"
      />
    </div>
    <ProofSubmitBar
      v-if="fields.length > 0"
      :booking="booking"
      :tenant-name="tenantName"
      :link="link"
      @state="emit('state', $event)"
    />
  </section>
</template>
<script setup>
import CustomerUploadFieldCard from "~/components/user/proofs/CustomerUploadFieldCard.vue";
import ProofSubmitBar from "~/components/user/proofs/ProofSubmitBar.vue";
import {
  pendingProofFieldsOf,
  proofAnchorId,
  proofBookingTitleOf,
} from "~/utils/customerUploads.js";
import { useFormatting } from "~/composables/utils/useFormatting.js";

const props = defineProps({
  booking: {
    type: Object,
    required: true,
  },
  tenantName: {
    type: String,
    default: "",
  },
  /** The guest's signed link; empty under the account. */
  link: {
    type: String,
    default: "",
  },
  /** The field to mark and scroll to, as the mail or the details name it. */
  targetFieldId: {
    type: String,
    default: null,
  },
});

/** The booking's new `customerUploadState`, as an upload route answered it. */
const emit = defineEmits(["state"]);

const { t } = useI18n();
const { formatDateRange } = useFormatting();
const nuxtApp = useNuxtApp();

const fields = computed(() => pendingProofFieldsOf(props.booking));

const title = computed(
  () => proofBookingTitleOf(props.booking) || t("booking.unknownBookable"),
);

// Once the field is there; then once more after the page change, since the
// router scrolls a new page to the top after it has rendered.
let scrolled = false;

function scrollToTarget() {
  if (!import.meta.client || scrolled || !props.targetFieldId) return;
  const element = document.getElementById(
    proofAnchorId(props.booking.id, props.targetFieldId),
  );
  if (element) {
    scrolled = true;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

onMounted(() => {
  nextTick(scrollToTarget);
  nuxtApp.hooks.hookOnce("page:finish", () => {
    setTimeout(() => {
      scrolled = false;
      scrollToTarget();
    }, 0);
  });
});
</script>
