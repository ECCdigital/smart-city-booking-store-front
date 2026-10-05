import { describe, expect, it } from "vitest";

import { useFormatting } from "~/composables/utils/useFormatting.js";

const { localeTag } = useFormatting();

describe("the locale tag behind an i18n code", () => {
  it("gives German its own tag", () => {
    expect(localeTag("de")).toBe("de-DE");
  });

  it("gives English the British tag, not the American one: „en“ alone puts the month first and the clock on twelve hours, which reads wrong beside the German original", () => {
    expect(localeTag("en")).toBe("en-GB");
  });

  it("falls back to German for a code the app has no locale for", () => {
    expect(localeTag("fr")).toBe("de-DE");
    expect(localeTag("")).toBe("de-DE");
  });
});
