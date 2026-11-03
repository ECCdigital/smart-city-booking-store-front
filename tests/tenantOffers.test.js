import { describe, expect, it } from "vitest";

import {
  tenantAccent,
  tenantInitials,
  tenantTiles,
} from "~/utils/tenantOffers.js";

/**
 * „Angebot nach Anbietern“ on the instance home (ECCdigital/tickets#478):
 * the tenants of the catalog bundle with their counts, the ones with an
 * offer, the most offers first.
 */
const tenant = (id, bookableCount, eventCount, extra = {}) => ({
  id,
  name: id,
  bookableCount,
  eventCount,
  ...extra,
});

describe("tenantTiles", () => {
  it("leaves out a tenant without a bookable and without an event", () => {
    const tiles = tenantTiles([tenant("Leer", 0, 0), tenant("Verein", 1, 0)]);

    expect(tiles.map((tile) => tile.id)).toEqual(["Verein"]);
  });

  it("puts the most bookables and events together first", () => {
    const tiles = tenantTiles([
      tenant("A", 1, 1),
      tenant("B", 0, 5),
      tenant("C", 3, 0),
    ]);

    expect(tiles.map((tile) => tile.id)).toEqual(["B", "C", "A"]);
  });

  it("orders a tie by name", () => {
    const tiles = tenantTiles([
      tenant("Zweirad", 2, 0),
      tenant("Ärztehaus", 1, 1),
      tenant("Bürgerhaus", 0, 2),
    ]);

    expect(tiles.map((tile) => tile.id)).toEqual([
      "Ärztehaus",
      "Bürgerhaus",
      "Zweirad",
    ]);
  });

  it("carries name, short description and counts, the description trimmed or null", () => {
    const [withText, without] = tenantTiles([
      tenant("Verein", 2, 1, { description: "  Sport im Quartier. " }),
      tenant("Halle", 1, 0, { description: "   " }),
    ]);

    expect(withText).toMatchObject({
      id: "Verein",
      name: "Verein",
      description: "Sport im Quartier.",
      bookableCount: 2,
      eventCount: 1,
      initials: "VE",
    });
    expect(without.description).toBeNull();
  });

  it("counts missing numbers as none, so a bundle of an older backend shows no area", () => {
    expect(tenantTiles([{ id: "alt", name: "Alt" }])).toEqual([]);
  });

  it("answers an empty list for no tenants", () => {
    expect(tenantTiles(undefined)).toEqual([]);
    expect(tenantTiles([])).toEqual([]);
  });
});

describe("tenantInitials", () => {
  it("takes the first letters of the first two words", () => {
    expect(tenantInitials("Sport & Bäder")).toBe("SB");
    expect(tenantInitials("Jugendzentrum Ost")).toBe("JO");
    expect(tenantInitials("Stadt Wildeshausen e.V.")).toBe("SW");
  });

  it("takes the first two letters of a single word", () => {
    expect(tenantInitials("Kulturamt")).toBe("KU");
  });

  it("answers a question mark for a name without letters", () => {
    expect(tenantInitials("")).toBe("?");
    expect(tenantInitials(undefined)).toBe("?");
  });
});

describe("tenantAccent", () => {
  it("gives a tenant the same accent on every load", () => {
    expect(tenantAccent("diz", 6)).toBe(tenantAccent("diz", 6));
  });

  it("stays within the palette", () => {
    for (const id of ["a", "diz", "0f44248a-bf4e-4292", "Stadt Testingen"]) {
      const accent = tenantAccent(id, 6);
      expect(accent).toBeGreaterThanOrEqual(0);
      expect(accent).toBeLessThan(6);
    }
  });
});
