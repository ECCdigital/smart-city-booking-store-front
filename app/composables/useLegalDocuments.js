import { useInstanceStore } from "~~/stores/instance.js";

// Order follows the design draft (PDF page 7): legal notice, data protection, terms.
const LEGAL_KEYS = ["legalNotice", "dataProtection", "termsAndConditions"];

const isPresent = (doc) =>
  !!(doc && typeof doc.url === "string" && doc.url.trim() !== "");

/**
 * The legal documents configured on the instance, in a fixed order, with the
 * unconfigured ones dropped.
 *
 * Each document is stored as { source: "url" | "file", url, fileName }. Both
 * sources carry a resolvable absolute URL -- for "file" the admin UI writes the
 * backend download URL into `url` and only derives `fileName` for its own
 * display -- so a link never has to care which source it came from.
 */
export function useLegalDocuments(keys = LEGAL_KEYS) {
  const instanceStore = useInstanceStore();

  return computed(() => {
    const instance = instanceStore.instance ?? {};

    return keys
      .filter((key) => isPresent(instance[key]))
      .map((key) => ({ key, ...instance[key] }));
  });
}
