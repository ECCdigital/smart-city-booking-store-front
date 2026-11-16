<template>
  <!-- The proofs of a guest's series on one page, as in the checkout of a
       series: each upload field once, its state at each date, and the
       files chosen for it, each naming the dates it counts for. One button
       hands every chosen file in. -->
  <section
    class="border-2 border-gray-200 dark:border-gray-700 rounded-xl mb-5 overflow-hidden"
    data-test="proof-series"
  >
    <div
      class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3"
    >
      <UBadge
        color="neutral"
        variant="subtle"
        class="mb-1"
        :label="$t('customerUploads.series.dates', ordered.length)"
      />
      <h2 class="font-bold text-lg leading-tight">{{ title }}</h2>
      <p v-if="period" class="text-sm text-primary font-semibold">
        {{ period }}
      </p>
    </div>

    <div class="p-4 space-y-3">
      <p v-if="entries.length === 0" class="text-gray-600 dark:text-gray-400">
        {{ $t("customerUploads.nothingMissing") }}
      </p>

      <div
        v-for="entry in entries"
        :id="proofAnchorId('series', entry.fieldId)"
        :key="entry.fieldId"
        class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900 scroll-mt-24"
        :class="{ 'ring-2 ring-primary': entry.fieldId === targetFieldId }"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-semibold">{{ entry.field.label }}</span>
          <UBadge
            color="neutral"
            :variant="entry.field.required ? 'solid' : 'subtle'"
            :label="
              entry.field.required
                ? $t('customerUploads.required')
                : $t('customerUploads.optional')
            "
          />
          <UTooltip
            v-if="entry.field.category === 'sensitive'"
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
        </div>
        <p
          v-if="entry.field.hint"
          class="text-sm text-gray-600 dark:text-gray-400 mt-1"
        >
          {{ entry.field.hint }}
        </p>

        <!-- the state at each date, the files handed in there not checked yet -->
        <ul
          class="mt-2 divide-y divide-gray-100 dark:divide-gray-800 text-sm"
          :aria-label="$t('customerUploads.series.stateAtDates')"
        >
          <li v-for="date in entry.dates" :key="date.booking.id" class="py-1.5">
            <div
              class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
            >
              <span class="text-gray-700 dark:text-gray-300">
                {{ dateLabel(date) }}
              </span>
              <CustomerUploadStateChip :field="date.field" :framed="false" />
            </div>
            <p v-if="reasonOf(date.field)" class="text-xs text-error mt-0.5">
              {{
                $t(reasonOf(date.field).key, {
                  reason: reasonOf(date.field).reason,
                })
              }}
            </p>
            <div
              v-for="upload in handedIn(date.field)"
              :key="upload.mediaId"
              class="flex items-center justify-between gap-2 mt-1 text-xs"
            >
              <span class="flex items-center gap-1 min-w-0">
                <UIcon name="i-lucide-file-check" class="shrink-0" />
                <span class="break-all sm:truncate">
                  {{ upload.originalFileName }}
                </span>
                <span class="text-gray-500 shrink-0">
                  · {{ sizeLabel(upload.size) }}
                </span>
              </span>
              <UButton
                size="xs"
                variant="ghost"
                color="error"
                icon="i-lucide-trash-2"
                class="shrink-0"
                :label="$t('customerUploads.delete')"
                :disabled="busy"
                @click="removeUpload(date, upload)"
              />
            </div>
          </li>
        </ul>

        <!-- chosen, not handed in yet: each with the dates it counts for -->
        <div
          v-for="draft in draftsOf(entry)"
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
                :name="
                  draft.refusal ? 'i-lucide-file-x' : 'i-lucide-file-clock'
                "
                class="shrink-0"
              />
              <span class="break-all sm:truncate min-w-0">
                {{ draft.file.name }}
              </span>
              <span class="text-gray-500 shrink-0">
                · {{ sizeLabel(draft.file.size) }}
              </span>
              <UBadge
                :color="draft.refusal ? 'error' : 'warning'"
                variant="subtle"
                size="sm"
                class="shrink-0"
                :label="
                  draft.refusal
                    ? $t('customerUploads.draftRefused')
                    : $t('customerUploads.draft')
                "
              />
              <span
                v-if="draft.refusal"
                data-test="proof-draft-refusal"
                class="basis-full text-error"
              >
                {{ messageOf(entry.field, draft.refusal) }}
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
              @click="drafts.remove(SERIES, draft.id)"
            />
          </div>
          <fieldset v-if="!draft.refusal" class="mt-2">
            <legend class="text-xs text-gray-600 dark:text-gray-300">
              {{ $t("customerUploads.group.for") }}
            </legend>
            <div class="flex flex-col gap-0.5 mt-0.5">
              <UCheckbox
                v-for="date in entry.dates"
                :key="date.booking.id"
                size="xs"
                :label="dateLabel(date)"
                :model-value="countsFor(draft, date)"
                :disabled="busy || !canTick(entry, draft, date)"
                @update:model-value="toggleDate(entry, draft, date, $event)"
              />
            </div>
          </fieldset>
        </div>

        <!-- room for a file at some date: chosen or dropped on the area -->
        <div
          v-if="hasRoom(entry)"
          class="mt-2 border-2 border-dashed rounded-lg p-3 text-center text-sm transition-colors"
          :class="
            dragOver === entry.fieldId
              ? 'border-primary bg-primary/10'
              : 'border-gray-300 dark:border-gray-600'
          "
          @dragenter.prevent="dragOver = entry.fieldId"
          @dragover.prevent="dragOver = entry.fieldId"
          @dragleave="onDragLeave(entry, $event)"
          @drop.prevent="onDrop(entry, $event)"
        >
          <p class="text-gray-600 dark:text-gray-400 mb-2">
            {{ $t("customerUploads.dropHint") }}
          </p>
          <UButton
            icon="i-lucide-upload"
            :label="$t('customerUploads.chooseFile')"
            :disabled="busy"
            @click="choose(entry)"
          />
          <p class="text-xs text-gray-500 mt-2">
            {{
              $t("customerUploads.limits", {
                formats: formatsLabel(entry.field.formats),
                size: entry.field.maxFileSizeMb,
              })
            }}
          </p>
        </div>
        <input
          :ref="(element) => setInput(entry.fieldId, element)"
          type="file"
          class="hidden"
          :accept="acceptOf(entry.field.formats)"
          multiple
          @change="onFileChosen(entry, $event)"
        >

        <p
          v-if="entry.field.consentText"
          class="text-xs text-gray-600 dark:text-gray-400 mt-2"
        >
          {{ entry.field.consentText }}
        </p>
        <p v-if="errors[entry.fieldId]" class="text-sm text-error mt-2">
          {{ errors[entry.fieldId] }}
        </p>
      </div>
    </div>

    <div
      v-if="entries.length > 0"
      class="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
    >
      <p
        class="text-sm"
        :class="
          waiting.length > 0
            ? 'text-amber-600 dark:text-amber-400 font-medium'
            : 'text-gray-500'
        "
      >
        {{
          waiting.length > 0
            ? $t("customerUploads.draftsPending", waiting.length, {
                count: waiting.length,
              })
            : $t("customerUploads.draftsNone")
        }}
      </p>
      <UButton
        data-test="proof-submit"
        icon="i-lucide-send"
        :label="$t('customerUploads.submitAll')"
        :disabled="waiting.length === 0"
        :loading="busy"
        @click="submit"
      />
      <UAlert
        v-if="submitError"
        data-test="proof-submit-error"
        color="error"
        variant="subtle"
        :description="submitError"
        class="w-full"
      />
    </div>
  </section>
</template>
<script setup>
import CustomerUploadStateChip from "~/components/user/proofs/CustomerUploadStateChip.vue";
import { useCustomerUploads } from "~/composables/api/useCustomerUploads.js";
import { PROOF_DRAFTS_KEY } from "~/composables/useProofDrafts.js";
import { useNotification } from "~/composables/useNotification.js";
import { useFormatting } from "~/composables/utils/useFormatting.js";
import {
  CUSTOMER_UPLOAD_FIELD_STATE,
  acceptOf,
  customerUploadErrorKey,
  customerUploadErrorOf,
  customerUploadFieldView,
  formatsLabel,
  precheckCustomerUpload,
  proofAnchorId,
  proofBookingTitleOf,
  seriesDraftDatesOf,
  seriesProofFieldsOf,
  seriesSubmissionsOf,
  submissionOrderOf,
  submissionOutcomeOf,
} from "~/utils/customerUploads.js";

/**
 * The page „Nachweise einreichen“ of a guest's series, opened by the
 * series' link of the mail: every upload field of the series once, its
 * state at each date, and the chosen files, each counting for the dates
 * ticked - at first every date still waiting for a file. „Nachweise
 * einreichen“ hands them in, one request per first date of a file with the
 * other dates as `alsoFor`, one medium for all of them; then the page reads
 * the series afresh (`reload`).
 */
const props = defineProps({
  /** The bookings of the series' link, each with its `customerUploadState`. */
  bookings: {
    type: Array,
    required: true,
  },
  tenantName: {
    type: String,
    default: "",
  },
  /** The series' signed link. */
  link: {
    type: String,
    required: true,
  },
  /** The field to mark and scroll to, as the mail names it. */
  targetFieldId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["reload"]);

/** The key of the page's drafts: they belong to the series, not a booking. */
const SERIES = "series";

const { t } = useI18n();
const { formatDate, formatDay } = useFormatting();
const notification = useNotification();
const drafts = inject(PROOF_DRAFTS_KEY);
const { remove, submitAll } = useCustomerUploads({ link: props.link });

const busy = ref(false);
const submitError = ref("");
const errors = ref({});
const dragOver = ref(null);
const inputs = {};

const ordered = computed(() =>
  [...props.bookings].sort((a, b) => (a.timeBegin ?? 0) - (b.timeBegin ?? 0)),
);
const entries = computed(() => seriesProofFieldsOf(props.bookings));

const title = computed(
  () => proofBookingTitleOf(ordered.value[0]) || t("booking.unknownBookable"),
);

/** From the first day of the series to its last. */
const period = computed(() => {
  const first = ordered.value[0]?.timeBegin;
  const last = ordered.value.at(-1)?.timeBegin;
  if (!first) return "";
  return first === last
    ? formatDay(first)
    : `${formatDay(first)} – ${formatDay(last)}`;
});

const dateLabel = ({ booking, number }) =>
  booking.timeBegin
    ? t("customerUploads.group.member", {
        n: number,
        date: formatDate(booking.timeBegin),
      })
    : t("customerUploads.group.memberUndated", { n: number });

const all = computed(() => drafts.of(SERIES));
const waiting = computed(() => drafts.waiting(SERIES));

const draftsOf = (entry) =>
  all.value.filter((draft) => draft.fieldId === entry.fieldId);

/** The other drafts of the page, which take their places at their dates. */
const othersThan = (draft) =>
  all.value.filter((other) => other.id !== draft?.id && !other.refusal);

/** The dates a file of the field can count for, with the drafts so far. */
function datesFor(entry, file, draft = null) {
  return seriesDraftDatesOf(entry, file, othersThan(draft));
}

function hasRoom(entry) {
  return entry.dates.some(
    ({ booking, field }) =>
      field.state !== CUSTOMER_UPLOAD_FIELD_STATE.FULFILLED &&
      (field.remainingFiles ?? 0) >
        othersThan(null).filter(
          (draft) =>
            draft.fieldId === field.fieldId &&
            draft.alsoFor.some((target) => target.bookingId === booking.id),
        ).length,
  );
}

const countsFor = (draft, date) =>
  draft.alsoFor.some((target) => target.bookingId === date.booking.id);

/** A ticked date can be taken off unless it is the last; others where they take the file. */
function canTick(entry, draft, date) {
  if (countsFor(draft, date)) return draft.alsoFor.length > 1;
  return datesFor(entry, draft.file, draft).some(
    (option) => option.bookingId === date.booking.id,
  );
}

/** The dates of a draft as ticked, in the order of the series. */
function toggleDate(entry, draft, date, on) {
  const ids = new Set(draft.alsoFor.map((target) => target.bookingId));
  if (on) ids.add(date.booking.id);
  else ids.delete(date.booking.id);
  if (ids.size === 0) return;
  drafts.setAlsoFor(
    SERIES,
    draft.id,
    entry.dates
      .filter(({ booking }) => ids.has(booking.id))
      .map(({ booking, field }) => ({
        bookingId: booking.id,
        fieldId: field.fieldId,
      })),
  );
}

function setInput(fieldId, element) {
  if (element) inputs[fieldId] = element;
}

function choose(entry) {
  errors.value = { ...errors.value, [entry.fieldId]: "" };
  inputs[entry.fieldId]?.click();
}

function onFileChosen(entry, event) {
  const files = [...(event.target.files ?? [])];
  event.target.value = "";
  files.forEach((file) => addFile(entry, file));
}

function onDrop(entry, event) {
  dragOver.value = null;
  if (busy.value) return;
  [...(event.dataTransfer?.files ?? [])].forEach((file) =>
    addFile(entry, file),
  );
}

function onDragLeave(entry, event) {
  if (
    !event.currentTarget.contains(event.relatedTarget) &&
    dragOver.value === entry.fieldId
  ) {
    dragOver.value = null;
  }
}

function messageOf(field, { code, params = {} }) {
  return t(customerUploadErrorKey(code), {
    formats: formatsLabel(params.formats ?? field.formats),
    size: params.maxFileSizeMb ?? field.maxFileSizeMb,
    count: params.maxFiles ?? field.maxFiles,
    tenant: props.tenantName,
  });
}

/** Notes a chosen file for the dates preset; refused where no date takes it. */
function addFile(entry, file) {
  const preset = datesFor(entry, file).filter((date) => date.preset);
  if (preset.length === 0) {
    errors.value = {
      ...errors.value,
      [entry.fieldId]: messageOf(entry.field, refusalOf(entry, file)),
    };
    return;
  }
  errors.value = { ...errors.value, [entry.fieldId]: "" };
  drafts.add(SERIES, {
    fieldId: entry.fieldId,
    file,
    alsoFor: preset.map(({ bookingId, fieldId }) => ({ bookingId, fieldId })),
  });
}

/**
 * Why no date takes a file: its format or size, as the field checks them;
 * otherwise every date is full.
 */
function refusalOf(entry, file) {
  return (
    precheckCustomerUpload(file, entry.field, { replacing: true }) ?? {
      code: "customer_upload_field_full",
      params: {},
    }
  );
}

const reasonOf = (field) => {
  const view = customerUploadFieldView(field);
  return view.reason ? { key: view.reasonKey, reason: view.reason } : null;
};

/** The files handed in at a date and not checked yet. */
const handedIn = (field) =>
  field.state === CUSTOMER_UPLOAD_FIELD_STATE.SUBMITTED
    ? (field.uploads ?? []).filter((u) => u.review?.status === "submitted")
    : [];

function sizeLabel(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

async function removeUpload({ booking, field }, upload) {
  errors.value = { ...errors.value, [field.fieldId]: "" };
  busy.value = true;
  const { error } = await remove(
    booking.tenantId,
    booking.id,
    field.fieldId,
    upload.mediaId,
  );
  busy.value = false;
  if (error) {
    const { code, params } = customerUploadErrorOf(error);
    errors.value = {
      ...errors.value,
      [field.fieldId]: messageOf(field, { code, params }),
    };
    return;
  }
  emit("reload");
}

/** Every chosen file at once, one request per first date of a file. */
async function submit() {
  submitError.value = "";
  busy.value = true;
  const storedIds = [];
  const refusals = [];
  let failure = null;
  for (const { bookingId, drafts: list } of seriesSubmissionsOf(
    waiting.value,
  )) {
    const booking = props.bookings.find((b) => b.id === bookingId);
    const sent = submissionOrderOf(list);
    const { data, error } = await submitAll(booking.tenantId, bookingId, sent);
    if (error) {
      failure = error;
      continue;
    }
    const outcome = submissionOutcomeOf(sent, data?.refused ?? []);
    storedIds.push(...outcome.storedIds);
    refusals.push(...outcome.refusals);
  }
  drafts.settle(SERIES, { storedIds, refusals });
  busy.value = false;
  if (storedIds.length > 0) emit("reload");

  if (failure) {
    const { code, params } = customerUploadErrorOf(failure);
    submitError.value = messageOf(entries.value[0]?.field ?? {}, {
      code,
      params,
    });
  } else if (refusals.length === 0) {
    notification.success(t("customerUploads.submitted"));
  } else if (storedIds.length > 0) {
    notification.warning(t("customerUploads.submittedPartly"));
    submitError.value = t("customerUploads.submittedPartly");
  } else {
    submitError.value = t("customerUploads.submittedNone");
  }
}

// The field the mail names, scrolled into view once it is there.
onMounted(() => {
  if (!props.targetFieldId) return;
  nextTick(() =>
    document
      .getElementById(proofAnchorId("series", props.targetFieldId))
      ?.scrollIntoView({ behavior: "smooth", block: "center" }),
  );
});
</script>
