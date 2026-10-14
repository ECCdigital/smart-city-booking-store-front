/**
 * IBAN and BIC handling for the bank details a customer may add to a
 * cancellation. The backend stores the strings as sent; the checks here only
 * keep a typo from reaching the provider.
 */

const IBAN_SHAPE = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/;
const BIC_SHAPE = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

/** Upper case, no whitespace: the form the backend and the checksum read. */
export function normalizeIban(value) {
  return String(value ?? "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

/** The IBAN as it is printed: groups of four, separated by a space. */
export function formatIban(value) {
  return (normalizeIban(value).match(/.{1,4}/g) ?? []).join(" ");
}

export function normalizeBic(value) {
  return String(value ?? "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

/** The ISO 13616 check: shape, then the mod-97 remainder of 1. */
export function isValidIban(value) {
  const iban = normalizeIban(value);
  if (!IBAN_SHAPE.test(iban)) {
    return false;
  }

  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      return code >= 65 && code <= 90 ? String(code - 55) : char;
    })
    .join("");

  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    remainder = parseInt(String(remainder) + numeric.substr(i, 7), 10) % 97;
  }
  return remainder === 1;
}

export function isValidBic(value) {
  return BIC_SHAPE.test(normalizeBic(value));
}
