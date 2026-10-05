import { describe, expect, it } from "vitest";

import de from "~~/i18n/locales/de.json";
import en from "~~/i18n/locales/en.json";

describe("navigation labels", () => {
  it("English carries every navigation key the German block has", () => {
    expect(Object.keys(en.navigation).sort()).toEqual(
      Object.keys(de.navigation).sort(),
    );
  });

  it("names the admin area and settings in English", () => {
    expect(en.navigation.admin).toBe("Admin area");
    expect(en.navigation.settings).toBe("Settings");
  });
});
