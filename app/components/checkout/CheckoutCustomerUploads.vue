<script setup>
import {
  acceptOf,
  customerUploadErrorKey,
  formatsLabel,
  precheckCheckoutUpload,
} from "~/utils/customerUploads.js";

/**
 * The upload fields "in the checkout" (in the UI
 * „Nachweise“), directly below „Hinweise und Dokumente“ and in its look:
 * what each field asks for - label, hint, consent text, required or
 * optional, formats, size and number - and the files chosen for it, picked
 * or dropped. Size, format and number are checked before a file is taken;
 * the files go with the checkout request, not before.
 */
const props = defineProps({
  /** The fields of `checkoutUploadFieldsOf`. */
  fields: {
    type: Array,
    default: () => [],
  },
  /** A refusal of the backend to show under its field: `{ fieldId, code, params }`. */
  refusal: {
    type: Object,
    default: null,
  },
});

/** The chosen files by field id. */
const files = defineModel("files", {
  type: Object,
  default: () => ({}),
});

const { t } = useI18n();

const inputs = ref({});
const errors = ref({});
// The field a file is dragged over, for the highlight of its drop zone.
const dragOver = ref(null);

const chosenOf = (field) => files.value?.[field.id] ?? [];

function setInput(fieldId, element) {
  if (element) inputs.value[fieldId] = element;
}

function sizeLabel(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function messageOf(field, code, params = {}) {
  return t(customerUploadErrorKey(code), {
    formats: formatsLabel(params.formats ?? field.formats),
    size: params.maxFileSizeMb ?? field.maxFileSizeMb,
    count: params.maxFiles ?? field.maxFiles,
    tenant: "",
  });
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

/**
 * Takes the files one by one, each checked against what the field holds
 * by then; the first refusal stops and is shown.
 */
function addFiles(field, list) {
  const chosen = [...chosenOf(field)];
  let message = "";
  for (const file of list) {
    const refusal = precheckCheckoutUpload(file, field, chosen.length);
    if (refusal) {
      message = messageOf(field, refusal.code, refusal.params);
      break;
    }
    chosen.push(file);
  }
  setError(field, message);
  if (chosen.length !== chosenOf(field).length) {
    files.value = { ...files.value, [field.id]: chosen };
  }
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
  // Only when the pointer leaves the zone, not when it moves onto a child.
  if (!event.currentTarget.contains(event.relatedTarget)) {
    if (dragOver.value === field.id) dragOver.value = null;
  }
}

function removeFile(field, index) {
  const next = chosenOf(field).filter((_, i) => i !== index);
  setError(field, "");
  files.value = { ...files.value, [field.id]: next };
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
          {{ $t("customerUploads.checkoutIntro") }}
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
          v-for="(file, index) in chosenOf(field)"
          :key="`${field.id}-${index}-${file.name}`"
          class="flex items-center justify-between gap-2 rounded bg-gray-50 dark:bg-gray-800 px-2 py-1 mt-1.5"
        >
          <span class="flex items-center gap-1 min-w-0 text-[11px]">
            <UIcon name="i-lucide-file-check" class="shrink-0" />
            <span class="truncate text-gray-900 dark:text-white">{{
              file.name
            }}</span>
            <span class="text-gray-500 dark:text-gray-400 shrink-0"
              >· {{ sizeLabel(file.size) }}</span
            >
          </span>
          <UButton
            size="xs"
            variant="ghost"
            color="error"
            icon="i-lucide-trash-2"
            :label="$t('customerUploads.remove')"
            @click="removeFile(field, index)"
          />
        </div>

        <div
          v-if="chosenOf(field).length < field.maxFiles"
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
              · {{ $t("customerUploads.maxFiles", { count: field.maxFiles }) }}
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
          :multiple="field.maxFiles > 1"
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
