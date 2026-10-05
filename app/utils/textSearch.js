/**
 * The plain text search the account pages share: a typed word finds what
 * reads the same on screen, case and accents aside, as a substring. No
 * fuzziness, so „saal" never surprises with „Saar".
 */

export function normalizeText(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Whether `text` holds `query`; an empty or blank query matches everything. */
export function includesText(text, query) {
  const needle = normalizeText(query);
  if (!needle) return true;
  return normalizeText(text).includes(needle);
}
