import { describe, expect, it } from "vitest";

import { previewHeroMode } from "~/utils/heroPreview";

describe("previewHeroMode", () => {
  it("maps the mode parameter onto the Hero mode", () => {
    expect(previewHeroMode("home")).toBe("home");
    expect(previewHeroMode("compact")).toBe("compact");
  });

  it("shows the start page when the parameter is absent or unknown", () => {
    expect(previewHeroMode(undefined)).toBe("home");
    expect(previewHeroMode(null)).toBe("home");
    expect(previewHeroMode("")).toBe("home");
    expect(previewHeroMode("account")).toBe("home");
    expect(previewHeroMode(["compact"])).toBe("home");
  });
});
