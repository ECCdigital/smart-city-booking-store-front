import { describe, expect, it } from "vitest";

import { includesText, normalizeText } from "~/utils/textSearch.js";

describe("the plain text search", () => {
  it("reads over case and accents", () => {
    expect(normalizeText("  Nähmaschine ")).toBe("nahmaschine");
    expect(includesText("Großer Saal", "SAAL")).toBe(true);
    expect(includesText("Nähmaschine", "nahm")).toBe(true);
  });

  it("matches a substring only, nothing fuzzy", () => {
    expect(includesText("Großer Saal", "saar")).toBe(false);
    expect(includesText('Konferenzraum "Ole"', 'raum "ole')).toBe(true);
  });

  it("lets everything through for an empty query and nothing through for empty text", () => {
    expect(includesText("Saal", "")).toBe(true);
    expect(includesText("Saal", "   ")).toBe(true);
    expect(includesText("Saal", undefined)).toBe(true);
    expect(includesText(null, "saal")).toBe(false);
  });
});
