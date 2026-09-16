/**
 * The footer's copyright line: `© <year> <rights holder>`, or `© <year>` alone.
 *
 * The rights holder is the instance's `copyright` (`GET /api/instances/public`,
 * backend 4.3), a plain string that is `""` when none is set. The year and the
 * © sign stay with the storefront. The value is returned as text; the footer
 * interpolates it, so markup in it shows literally and never renders.
 *
 * @param {number} year The storefront's current year
 * @param {unknown} copyright The instance's `copyright`, or nothing when the
 *   instance is missing or older than the field
 * @returns {string}
 */
export function copyrightLine(year, copyright) {
  const holder = typeof copyright === "string" ? copyright.trim() : "";
  return holder === "" ? `© ${year}` : `© ${year} ${holder}`;
}
