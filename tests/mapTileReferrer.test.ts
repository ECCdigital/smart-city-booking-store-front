import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// OpenStreetMap answers tile requests that carry no Referer with a 403
// "Access blocked" placeholder tile, which turns every map in the app grey.
// nuxt-security defaults to `no-referrer`, so the policy has to be stated
// explicitly -- deleting the line silently brings the bug back.
const config = readFileSync(
  fileURLToPath(new URL("../nuxt.config.js", import.meta.url)),
  "utf8",
);

// Policies that still send at least the bare origin on a cross-origin request.
const SENDS_ORIGIN_CROSS_ORIGIN = [
  "origin",
  "origin-when-cross-origin",
  "strict-origin",
  "strict-origin-when-cross-origin",
  "unsafe-url",
  "no-referrer-when-downgrade",
];

describe("map tiles keep a Referer for OpenStreetMap", () => {
  it("sets a referrer policy that still identifies the origin", () => {
    const match = config.match(/referrerPolicy:\s*"([^"]+)"/);

    expect(match, "security.headers.referrerPolicy is not set in nuxt.config.js")
      .not.toBeNull();
    expect(SENDS_ORIGIN_CROSS_ORIGIN).toContain(match![1]);
  });

  it("keeps the OSM tile host in the img-src allowlist", () => {
    expect(config).toContain("https://*.tile.openstreetmap.org");
  });
});
