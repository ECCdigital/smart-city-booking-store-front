import { describe, expect, it } from "vitest";
import { parseSortMode, parseViewMode } from "~/utils/catalogQueryModes";

describe("catalog query modes", () => {
  it("keeps supported sort and view modes", () => {
    expect(parseSortMode("priceDescending")).toBe("priceDescending");
    expect(parseViewMode("map")).toBe("map");
  });

  it("uses defaults for invalid query values", () => {
    expect(parseSortMode("unknown")).toBe("alphabeticAscending");
    expect(parseViewMode(["map"])).toBe("list");
    expect(parseViewMode(undefined)).toBe("list");
  });
});
