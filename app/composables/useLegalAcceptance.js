import { useLegalDocuments } from "~/composables/useLegalDocuments.js";

// Only these two need consent at registration -- the legal notice is informational.
const ACCEPTANCE_KEYS = ["dataProtection", "termsAndConditions"];

export function useLegalAcceptance() {
  const documents = useLegalDocuments(ACCEPTANCE_KEYS);

  const accepted = reactive({});

  watch(
    documents,
    (docs) => {
      for (const doc of docs) {
        if (!(doc.key in accepted)) accepted[doc.key] = false;
      }
    },
    { immediate: true }
  );

  const required = computed(() => documents.value.length > 0);

  const allAccepted = computed(() =>
    documents.value.every((doc) => accepted[doc.key])
  );

  const buildPayload = () => {
    if (documents.value.length === 0) return undefined;

    const acceptedAt = new Date().toISOString();
    const payload = {};

    for (const doc of documents.value) {
      payload[doc.key] = {
        accepted: !!accepted[doc.key],
        url: doc.url ?? "",
        fileName: doc.fileName ?? "",
        source: doc.source ?? "url",
        acceptedAt,
      };
    }

    return payload;
  };

  return { documents, accepted, required, allAccepted, buildPayload };
}
