import { useInstanceStore } from "~~/stores/instance.js";

// Order follows the design draft (PDF page 7): legal notice, data protection, terms.
const LEGAL_KEYS = ["legalNotice", "dataProtection", "termsAndConditions"];

// The URL is instance configuration rather than visitor input, but it still ends up
// in an href -- a javascript: or data: value would run in the storefront's origin.
const SAFE_PROTOCOLS = ["http:", "https:"];

// Parsing instead of matching on the string also covers the control characters that
// browsers strip out of an href before following it. The base is only there so that
// a relative path stays valid; it resolves against the storefront either way, so the
// origin it names is never used.
const hasSafeUrl = (doc) => {
  if (!doc || typeof doc.url !== "string") return false;

  const url = doc.url.trim();
  if (url === "") return false;

  try {
    return SAFE_PROTOCOLS.includes(new URL(url, "https://storefront.invalid").protocol);
  } catch {
    return false;
  }
};

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
      .filter((key) => hasSafeUrl(instance[key]))
      .map((key) => ({ key, ...instance[key] }));
  });
}
