<template>
  <div
    class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900"
  >
    <div class="flex flex-wrap items-center gap-2">
      <span class="font-semibold">{{ field.label }}</span>
      <UBadge
        color="neutral"
        :variant="field.required ? 'solid' : 'subtle'"
        :label="
          field.required
            ? $t('customerUploads.required')
            : $t('customerUploads.optional')
        "
      />

      <UTooltip
        v-if="field.category === 'sensitive'"
        :text="$t('customerUploads.sensitiveHint')"
        :content="{ side: 'top' }"
        :ui="{
          content: 'max-w-[min(20rem,calc(100vw-2rem))] h-auto',
          text: 'whitespace-normal',
        }"
      >
        <UBadge
          color="neutral"
          variant="subtle"
          icon="i-lucide-info"
          class="bg-amber-500/10 text-amber-500 ring-amber-500/25 cursor-help"
          :label="$t('customerUploads.sensitive')"
          tabindex="0"
        />
      </UTooltip>
      <CustomerUploadStateChip :field="field" />
    </div>

    <p v-if="field.hint" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
      {{ field.hint }}
    </p>
    <p v-if="view.reason" class="text-sm text-error mt-1">
      {{ $t(view.reasonKey, { reason: view.reason }) }}
    </p>
    <p v-if="view.lateHint" class="text-sm text-error mt-1">
      {{ $t("customerUploads.lateHint", { tenant: tenantName }) }}
    </p>

    <!-- handed in, not checked yet: replace or delete -->
    <template v-if="pendingUploads.length > 0">
      <div
        v-for="pendingUpload in pendingUploads"
        :key="pendingUpload.mediaId"
        class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2 bg-gray-50 dark:bg-gray-800 rounded px-3 py-2 mt-2 text-sm"
      >
        <span class="flex items-center gap-1 min-w-0 sm:flex-1">
          <UIcon name="i-lucide-file-check" class="shrink-0 self-start mt-0.5 sm:self-auto sm:mt-0" />
          <span
            class="break-all sm:truncate"
            :title="pendingUpload.originalFileName"
            :class="{
              'line-through text-gray-500': replacementOf(pendingUpload),
            }"
            >{{ pendingUpload.originalFileName }}</span
          >
          <span class="text-gray-500 shrink-0"
            >· {{ sizeLabel(pendingUpload.size) }}</span
          >
        </span>
        <span class="flex gap-1 shrink-0 self-end sm:self-auto">
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            icon="i-lucide-replace"
            :label="$t('customerUploads.replace')"
            :disabled="busy"
            @click="choose(pendingUpload.mediaId)"
          />
          <UButton
            size="xs"
            variant="ghost"
            color="error"
            icon="i-lucide-trash-2"
            :label="$t('customerUploads.delete')"
            :disabled="busy"
            @click="removeUpload(pendingUpload.mediaId)"
          />
        </span>
      </div>
      <p class="text-xs text-gray-500 mt-1">
        {{ $t("customerUploads.changeUntilReview", { tenant: tenantName }) }}
      </p>
    </template>

    <!-- chosen, not handed in yet: they go with the button „Nachweise
         einreichen“ of the booking -->
    <div
      v-for="draft in fieldDrafts"
      :key="draft.id"
      data-test="proof-draft"
      class="border border-dashed rounded px-3 py-2 mt-2 text-sm"
      :class="
        draft.refusal
          ? 'border-error/25 bg-error/10'
          : 'border-amber-500/60 bg-amber-500/10'
      "
    >
      <div
        class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2"
      >
        <span class="flex flex-wrap items-center gap-1 min-w-0 sm:flex-1">
          <UIcon
            :name="draft.refusal ? 'i-lucide-file-x' : 'i-lucide-file-clock'"
            class="shrink-0"
          />
          <span
            class="break-all sm:truncate min-w-0 max-w-[calc(100%-1.5rem)]"
            :title="draft.file.name"
            >{{ draft.file.name }}</span
          >
          <span class="text-gray-500 shrink-0"
            >· {{ sizeLabel(draft.file.size) }}</span
          >
          <UBadge
            :color="draft.refusal ? 'error' : 'warning'"
            variant="subtle"
            size="sm"
            class="shrink-0 max-w-full"
          >
            <template v-if="draft.refusal">
              {{ $t("customerUploads.draftRefused") }}
            </template>
            <!-- the old name only where there is room; it stays crossed out
                 at its file above -->
            <template v-else-if="draft.replacing">
              <span class="sm:hidden">
                {{ $t("customerUploads.draftReplacementShort") }}
              </span>
              <span class="hidden sm:inline">
                {{
                  $t("customerUploads.draftReplacement", {
                    name: replacedName(draft.replacing),
                  })
                }}
              </span>
            </template>
            <template v-else>
              {{ $t("customerUploads.draft") }}
            </template>
          </UBadge>
          <span
            v-if="draft.refusal"
            data-test="proof-draft-refusal"
            class="basis-full text-error"
          >
            {{ refusalText(draft.refusal) }}
          </span>
        </span>
        <UButton
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-lucide-x"
          class="shrink-0 self-end sm:self-auto"
          :label="$t('customerUploads.draftRemove')"
          :disabled="busy"
          @click="drafts.remove(booking.id, draft.id)"
        />
      </div>
      <!-- a new file of a series: the other dates it counts for too
 -->
      <fieldset
        v-if="!draft.replacing && !draft.refusal && optionsOf(draft).length"
        data-test="proof-draft-also-for"
        class="mt-2"
      >
        <legend class="text-xs text-gray-600 dark:text-gray-300">
          {{ $t("customerUploads.alsoFor") }}
        </legend>
        <div class="flex flex-col gap-0.5 mt-0.5">
          <UCheckbox
            v-for="option in optionsOf(draft)"
            :key="`${option.bookingId}:${option.fieldId}`"
            size="xs"
            :label="optionLabel(option)"
            :model-value="isAlsoFor(draft, option)"
            :disabled="busy || takenElsewhere(draft, option)"
            @update:model-value="setAlsoFor(draft, option, $event)"
          />
        </div>
      </fieldset>
    </div>

    <!-- room for a file: chosen with the button or dropped on the area -->
    <div
      v-if="view.canUpload"
      class="mt-2 border-2 border-dashed rounded-lg p-3 text-center text-sm transition-colors"
      :class="
        dragging
          ? 'border-primary bg-primary/10'
          : 'border-gray-300 dark:border-gray-600'
      "
      @dragenter.prevent="onDragEnter"
      @dragover.prevent
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <p class="text-gray-600 dark:text-gray-400 mb-2">
        {{ $t("customerUploads.dropHint") }}
      </p>
      <UButton
        icon="i-lucide-upload"
        :label="$t('customerUploads.chooseFile')"
        :loading="busy"
        @click="choose(null)"
      />
      <p class="text-xs text-gray-500 mt-2">
        {{
          $t("customerUploads.limits", {
            formats: formatsLabel(field.formats),
            size: field.maxFileSizeMb,
          })
        }}
        <template v-if="field.maxFiles > 1">
          · {{ $t("customerUploads.maxFiles", { count: field.maxFiles }) }}
        </template>
      </p>
    </div>

    <input
      ref="fileInput"
      type="file"
      class="hidden"
      :accept="acceptOf(field.formats)"
      @change="onFileChosen"
    >

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="subtle"
      :description="errorMessage"
      class="mt-2"
    />
  </div>
</template>
<script setup>
import CustomerUploadStateChip from "~/components/user/proofs/CustomerUploadStateChip.vue";
import { useCustomerUploads } from "~/composables/api/useCustomerUploads.js";
import { PROOF_DRAFTS_KEY } from "~/composables/useProofDrafts.js";
import { useBookingStore } from "~~/stores/bookings.js";
import { useFormatting } from "~/composables/utils/useFormatting.js";
import {
  CUSTOMER_UPLOAD_FIELD_STATE,
  acceptOf,
  customerUploadErrorKey,
  customerUploadErrorOf,
  customerUploadFieldView,
  fieldWithDrafts,
  formatsLabel,
  precheckCustomerUpload,
  seriesTargetOptionsOf,
} from "~/utils/customerUploads.js";

/**
 * One upload field of a booking on the page „Nachweise einreichen“:
 * what is asked for, its state, the files handed
 * in with replace and delete until the check, and the choice of a new file.
 * Size, format and number are checked when a file is chosen. A chosen file,
 * a replacement too, is only noted at the page's drafts: the button
 * „Nachweise einreichen“ of the booking hands them in at once.
 * Deleting a file handed in goes at once.
 */
const props = defineProps({
  booking: {
    type: Object,
    required: true,
  },
  field: {
    type: Object,
    required: true,
  },
  tenantName: {
    type: String,
    default: "",
  },
  // The signed link of a guest's booking: the
  // calls go with it, and the new state is emitted instead of stored.
  link: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["state"]);

const { t } = useI18n();
const bookingStore = useBookingStore();
const { remove } = useCustomerUploads({ link: props.link });
const drafts = inject(PROOF_DRAFTS_KEY);

const fileInput = ref(null);
const replacing = ref(null);
const busy = ref(false);
const errorMessage = ref("");

const fieldDrafts = computed(() =>
  drafts.ofField(props.booking.id, props.field.fieldId),
);

// A booking of a series: the fields of its other dates a new file can count
// for too. A guest's link covers one booking.
const { formatDate } = useFormatting();
function seriesOptionsFor(file) {
  return props.link
    ? []
    : seriesTargetOptionsOf(
        props.booking,
        bookingStore.getBookings ?? [],
        props.field.fieldId,
        file,
      );
}

/** The fields a chosen file can count for too: those that take it. */
function optionsOf(draft) {
  return seriesOptionsFor(draft.file);
}

const sameTarget = (a, b) =>
  a.bookingId === b.bookingId && a.fieldId === b.fieldId;

function isAlsoFor(draft, option) {
  return (draft.alsoFor ?? []).some((target) => sameTarget(target, option));
}

/** A booking takes a file once: another field of it is chosen already. */
function takenElsewhere(draft, option) {
  return (draft.alsoFor ?? []).some(
    (target) =>
      target.bookingId === option.bookingId &&
      target.fieldId !== option.fieldId,
  );
}

function setAlsoFor(draft, option, on) {
  const rest = (draft.alsoFor ?? []).filter(
    (target) => !sameTarget(target, option),
  );
  drafts.setAlsoFor(
    props.booking.id,
    draft.id,
    on
      ? [...rest, { bookingId: option.bookingId, fieldId: option.fieldId }]
      : rest,
  );
}

function optionLabel(option) {
  return t("customerUploads.alsoForOption", {
    id: option.bookingId,
    date: option.timeBegin ? formatDate(option.timeBegin) : "",
    field: option.fieldLabel,
  });
}

/** The field with the places the chosen files take; a refused one none. */
const shownField = computed(() =>
  fieldWithDrafts(
    props.field,
    fieldDrafts.value.filter((draft) => !draft.refusal),
  ),
);

/** Why the backend refused a chosen file. */
function refusalText({ code, params = {} }) {
  return t(customerUploadErrorKey(code), {
    formats: formatsLabel(params.formats ?? props.field.formats),
    size: params.maxFileSizeMb ?? props.field.maxFileSizeMb,
    count: params.maxFiles ?? props.field.maxFiles,
    tenant: props.tenantName,
  });
}

const view = computed(() => customerUploadFieldView(shownField.value));

const replacementOf = (pendingUpload) =>
  drafts.replacementOf(props.booking.id, pendingUpload.mediaId);

const replacedName = (mediaId) =>
  props.field.uploads.find((u) => u.mediaId === mediaId)?.originalFileName ??
  "";

const pendingUploads = computed(() =>
  props.field.state === CUSTOMER_UPLOAD_FIELD_STATE.SUBMITTED
    ? props.field.uploads.filter((u) => u.review?.status === "submitted")
    : [],
);

function sizeLabel(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function showError(code, params = {}) {
  errorMessage.value = t(customerUploadErrorKey(code), {
    formats: formatsLabel(params.formats ?? props.field.formats),
    size: params.maxFileSizeMb ?? props.field.maxFileSizeMb,
    count: params.maxFiles ?? props.field.maxFiles,
    tenant: props.tenantName,
  });
}

function choose(mediaId) {
  replacing.value = mediaId;
  errorMessage.value = "";
  fileInput.value?.click();
}

function onFileChosen(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (file) send(file);
}

// Drag and drop: the area lights up while a file is over it. Entering and
// leaving its children fire too, so a counter tells when it is really left.
const dragging = ref(false);
let dragDepth = 0;

function onDragEnter() {
  dragDepth += 1;
  dragging.value = true;
}

function onDragLeave() {
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) dragging.value = false;
}

function onDrop(event) {
  dragDepth = 0;
  dragging.value = false;
  if (busy.value) return;
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  // A drop adds a file, it never replaces one.
  replacing.value = null;
  send(file);
}

function send(file) {
  errorMessage.value = "";

  const refusal = precheckCustomerUpload(file, shownField.value, {
    replacing: Boolean(replacing.value),
  });
  if (refusal) {
    showError(refusal.code, refusal.params);
    return;
  }

  drafts.add(props.booking.id, {
    fieldId: props.field.fieldId,
    replacing: replacing.value,
    file,
    // Preset: the same field at the other dates of the series.
    alsoFor: seriesOptionsFor(file)
      .filter((option) => option.preset)
      .map(({ bookingId, fieldId }) => ({ bookingId, fieldId })),
  });
}

async function removeUpload(mediaId) {
  errorMessage.value = "";
  busy.value = true;
  const { data, error } = await remove(
    props.booking.tenantId,
    props.booking.id,
    props.field.fieldId,
    mediaId,
  );
  busy.value = false;
  if (!error) drafts.dropReplacementOf(props.booking.id, mediaId);
  answer(data, error);
}

function answer(data, error) {
  if (error) {
    const { code, params } = customerUploadErrorOf(error);
    showError(code, params);
    return;
  }
  if (props.link) {
    emit("state", data?.customerUploadState);
    return;
  }
  bookingStore.setCustomerUploadState(
    props.booking.id,
    data?.customerUploadState,
  );
}
</script>
