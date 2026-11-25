import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// nuxt-security sends `Permissions-Policy` with every feature switched off,
// `camera=()` and `geolocation=()` included, which blocks them for the app's
// own origin too. The browser then refuses at once and never asks the person
// (ECCdigital/tickets#1366). The features the app uses have to be allowed
// explicitly -- deleting a line silently brings the bug back.
const config = readFileSync(
  fileURLToPath(new URL("../nuxt.config.js", import.meta.url)),
  "utf8",
);

function permissionsPolicy() {
  const match = config.match(/permissionsPolicy:\s*\{([^}]*)\}/);
  expect(
    match,
    "security.headers.permissionsPolicy is not set in nuxt.config.js",
  ).not.toBeNull();
  // A feature commented out is not allowed.
  return match![1].replace(/\/\/.*$/gm, "");
}

describe("the permissions policy", () => {
  it("allows the location on the app's own origin for „Mein Standort“", () => {
    expect(permissionsPolicy()).toMatch(/geolocation:\s*\[\s*"self"\s*\]/);
  });

  it("allows the camera on the app's own origin for the Mobile Key's scanner", () => {
    expect(permissionsPolicy()).toMatch(/camera:\s*\[\s*"self"\s*\]/);
  });
});
