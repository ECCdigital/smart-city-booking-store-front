import { useInstanceStore } from "~~/stores/instance.js";

const isPresent = (doc) =>
  !!(doc && typeof doc.url === "string" && doc.url.trim() !== "");

export function useLegalAcceptance() {
  const instanceStore = useInstanceStore();

  const documents = computed(() => {
    const instance = instanceStore.instance ?? {};
    const result = [];

    if (isPresent(instance.dataProtection)) {
      result.push({ key: "dataProtection", ...instance.dataProtection });
    }
    if (isPresent(instance.termsAndConditions)) {
      result.push({ key: "termsAndConditions", ...instance.termsAndConditions });
    }

    return result;
  });

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
