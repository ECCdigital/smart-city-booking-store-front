<script setup>
import {
  acceptOf,
  customerUploadErrorKey,
  defaultGroupAttempts,
  formatsLabel,
  groupFilesAt,
  groupUploadKey,
  missingGroupCheckoutUploads,
  precheckGroupCheckoutUpload,
} from "~/utils/customerUploads.js";

/**
 * The upload fields "in the checkout" of a series
 * (in the UI „Nachweise“), in the look of the single checkout's: the
 * customer hands a file in once and ticks the dates of the series it
 * counts for, each with the field the file was chosen for. A guest has no
 * choice: each file is for one date. Size, format and the number at each
 * date are checked before a file is taken; the files go with the series'
 * checkout request, not before.
 */
const props = defineProps({
  /** The fields of `checkoutUploadFieldsOf`, the same at every date. */
  fields: {
    type: Array,
    default: () => [],
  },
  /** The booking attempts of the series, each `{ start, end }`. */
  members: {
    type: Array,
    default: () => [],
  },
  /** Whether nobody is signed in: one date per file. */
  guest: {
    type: Boolean,
    default: false,
  },
  /** A refusal of the backend to show under its field: `{ fieldId, code, params }`. */
  refusal: {
    type: Object,
    default: null,
  },
});

/** The files of the series, each `{ key, fieldId, file, attempts }`. */
const uploads = defineModel("uploads", {
  type: Array,
  default: () => [],
});

const { t, locale } = useI18n();

const inputs = ref({});
const errors = ref({});
const dragOver = ref(null);

const uploadsOf = (field) =>
  uploads.value.filter((upload) => upload.fieldId === field.id);

function setInput(fieldId, element) {
  if (element) inputs.value[fieldId] = element;
}

function memberLabel(attempt) {
  const start = props.members[attempt]?.start;
  if (!start) return t("customerUploads.group.memberUndated", { n: attempt + 1 });
  const date = new Date(Number(start)).toLocaleString(locale.value, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return t("customerUploads.group.member", { n: attempt + 1, date });
}

/** Whether a date can take the file: it holds it, or the field has room. */
function canTake(field, upload, attempt) {
  if (upload.attempts.includes(attempt)) return true;
  const others = uploads.value.filter((other) => other.key !== upload.key);
  return groupFilesAt(others, attempt, field.id).length < field.maxFiles;
}

function missingOf(field) {
  return missingGroupCheckoutUploads(
    [field],
    uploads.value,
    props.members.length,
  ).map(({ attempt }) => memberLabel(attempt));
}

function hasRoom(field) {
  return (
    defaultGroupAttempts(field, uploads.value, props.members.length, false)
      .length > 0
  );
}

function sizeLabel(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function messageOf(field, code, params = {}) {
  const message = t(customerUploadErrorKey(code), {
    formats: formatsLabel(params.formats ?? field.formats),
    size: params.maxFileSizeMb ?? field.maxFileSizeMb,
    count: params.maxFiles ?? field.maxFiles,
    tenant: "",
  });
  return Number.isInteger(params.attempt)
    ? `${memberLabel(params.attempt)}: ${message}`
    : message;
}

function errorOf(field) {
  if (errors.value[field.id]) return errors.value[field.id];
  if (props.refusal?.fieldId === field.id) {
    return messageOf(field, props.refusal.code, props.refusal.params);
  }
  return "";
}

function setError(field, message) {
  errors.value = { ...errors.value, [field.id]: message };
}

function choose(field) {
  setError(field, "");
  inputs.value[field.id]?.click();
}

/** Takes the files one by one, each for the dates with room by then. */
function addFiles(field, list) {
  let next = [...uploads.value];
  let message = "";
  for (const file of list) {
    const attempts = defaultGroupAttempts(
      field,
      next,
      props.members.length,
      props.guest,
    );
    const refusal = precheckGroupCheckoutUpload(file, field, attempts, next);
    if (refusal) {
      message = messageOf(field, refusal.code, refusal.params);
      break;
    }
    next = [
      ...next,
      { key: groupUploadKey(next), fieldId: field.id, file, attempts },
    ];
  }
  setError(field, message);
  if (next.length !== uploads.value.length) uploads.value = next;
}

function onFileChosen(field, event) {
  const list = [...(event.target.files ?? [])];
  event.target.value = "";
  if (list.length > 0) addFiles(field, list);
}

function onDrop(field, event) {
  dragOver.value = null;
  const list = [...(event.dataTransfer?.files ?? [])];
  if (list.length > 0) addFiles(field, list);
}

function onDragLeave(field, event) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    if (dragOver.value === field.id) dragOver.value = null;
  }
}

/** The dates of a file as ticked; a file keeps one date at least. */
function setAttempts(upload, attempts) {
  const sorted = [...new Set(attempts)].sort((a, b) => a - b);
  if (sorted.length === 0) return;
  uploads.value = uploads.value.map((other) =>
    other.key === upload.key ? { ...other, attempts: sorted } : other,
  );
}

function toggleAttempt(upload, attempt, on) {
  setAttempts(
    upload,
    on
      ? [...upload.attempts, attempt]
      : upload.attempts.filter((a) => a !== attempt),
  );
}

function removeUpload(upload) {
  uploads.value = uploads.value.filter((other) => other.key !== upload.key);
}
</script>

<template>
  <UCard
    v-if="fields.length > 0"
    variant="soft"
    class="rounded-md"
    :ui="{
      header: 'px-3 py-2 sm:px-4 sm:py-2.5',
      body: 'px-3 py-2 sm:px-4 sm:py-3',
    }"
  >
    <template #header>
      <div class="space-y-0">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ $t("customerUploads.title") }}
        </h3>
        <p class="text-[11px] text-gray-600 dark:text-gray-300">
          {{
            guest
              ? $t("customerUploads.group.introGuest")
              : $t("customerUploads.group.intro")
          }}
        </p>
      </div>
    </template>

    <ul class="space-y-1">
      <li
        v-for="field in fields"
        :key="field.id"
        class="rounded-md border border-gray-200 dark:border-gray-700 p-2 bg-white/60 dark:bg-gray-900/40"
      >
        <p
          class="text-sm font-medium leading-tight text-gray-900 dark:text-white"
        >
          {{ field.label }}
        </p>
        <p
          v-if="field.hint"
          class="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5"
        >
          {{ field.hint }}
        </p>
        <span
          class="inline-flex mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded"
          :class="
            field.required
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          "
        >
          {{
            field.required
              ? $t("customerUploads.required")
              : $t("customerUploads.optional")
          }}
        </span>

        <div
          v-for="upload in uploadsOf(field)"
          :key="upload.key"
          class="rounded bg-gray-50 dark:bg-gray-800 px-2 py-1 mt-1.5"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="flex items-center gap-1 min-w-0 text-[11px]">
              <UIcon name="i-lucide-file-check" class="shrink-0" />
              <span class="truncate text-gray-900 dark:text-white">{{
                upload.file.name
              }}</span>
              <span class="text-gray-500 dark:text-gray-400 shrink-0"
                >· {{ sizeLabel(upload.file.size) }}</span
              >
            </span>
            <UButton
              size="xs"
              variant="ghost"
              color="error"
              icon="i-lucide-trash-2"
              :label="$t('customerUploads.remove')"
              @click="removeUpload(upload)"
            />
          </div>
          <fieldset class="mt-1">
            <legend class="text-[11px] text-gray-600 dark:text-gray-300">
              {{
                guest
                  ? $t("customerUploads.group.forOne")
                  : $t("customerUploads.group.for")
              }}
            </legend>
            <div class="flex flex-col gap-0.5 mt-0.5">
              <template v-if="guest">
                <label
                  v-for="(_, attempt) in members"
                  :key="attempt"
                  class="flex items-center gap-1.5 text-[11px] text-gray-900 dark:text-white"
                  :class="{ 'opacity-50': !canTake(field, upload, attempt) }"
                >
                  <input
                    type="radio"
                    :name="`group-upload-${upload.key}`"
                    :checked="upload.attempts.includes(attempt)"
                    :disabled="!canTake(field, upload, attempt)"
                    @change="setAttempts(upload, [attempt])"
                  >
                  {{ memberLabel(attempt) }}
                </label>
              </template>
              <template v-else>
                <UCheckbox
                  v-for="(_, attempt) in members"
                  :key="attempt"
                  size="xs"
                  :label="memberLabel(attempt)"
                  :model-value="upload.attempts.includes(attempt)"
                  :disabled="
                    !canTake(field, upload, attempt) ||
                      (upload.attempts.length === 1 &&
                        upload.attempts[0] === attempt)
                  "
                  @update:model-value="toggleAttempt(upload, attempt, $event)"
                />
              </template>
            </div>
          </fieldset>
        </div>

        <p
          v-if="missingOf(field).length > 0"
          class="mt-1.5 text-[11px] text-amber-700 dark:text-amber-400"
        >
          {{
            $t("customerUploads.group.missing", {
              members: missingOf(field).join(", "),
            })
          }}
        </p>

        <div
          v-if="hasRoom(field)"
          class="mt-1.5 rounded-md border border-dashed p-2 text-center transition-colors"
          :class="
            dragOver === field.id
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 dark:border-gray-600'
          "
          @dragenter.prevent="dragOver = field.id"
          @dragover.prevent="dragOver = field.id"
          @dragleave="onDragLeave(field, $event)"
          @drop.prevent="onDrop(field, $event)"
        >
          <p class="text-[11px] text-gray-600 dark:text-gray-300">
            {{ $t("customerUploads.dropHint") }}
          </p>
          <UButton
            size="xs"
            variant="soft"
            color="primary"
            icon="i-lucide-upload"
            class="mt-1"
            :label="$t('customerUploads.chooseFile')"
            @click="choose(field)"
          />
          <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            {{
              $t("customerUploads.limits", {
                formats: formatsLabel(field.formats),
                size: field.maxFileSizeMb,
              })
            }}
            <template v-if="field.maxFiles > 1">
              ·
              {{
                $t("customerUploads.group.maxFiles", {
                  count: field.maxFiles,
                })
              }}
            </template>
          </p>
        </div>

        <p
          v-if="field.consentText"
          class="text-[11px] text-gray-600 dark:text-gray-300 mt-1.5"
        >
          {{ field.consentText }}
        </p>

        <input
          :ref="(element) => setInput(field.id, element)"
          type="file"
          class="hidden"
          :accept="acceptOf(field.formats)"
          multiple
          @change="onFileChosen(field, $event)"
        >

        <p
          v-if="errorOf(field)"
          class="mt-1.5 text-[11px] text-red-600 dark:text-red-400"
        >
          {{ errorOf(field) }}
        </p>
      </li>
    </ul>
  </UCard>
</template>
