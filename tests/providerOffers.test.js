import { describe, expect, it } from "vitest";

import {
  providerAccent,
  providerInitials,
  providerTiles,
} from "~/utils/providerOffers.js";

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

describe("providerTiles", () => {
  it("leaves out a tenant without a bookable and without an event", () => {
    const tiles = providerTiles([tenant("Leer", 0, 0), tenant("Verein", 1, 0)]);

    expect(tiles.map((tile) => tile.id)).toEqual(["Verein"]);
  });

  it("puts the most bookables and events together first", () => {
    const tiles = providerTiles([
      tenant("A", 1, 1),
      tenant("B", 0, 5),
      tenant("C", 3, 0),
    ]);

    expect(tiles.map((tile) => tile.id)).toEqual(["B", "C", "A"]);
  });

  it("orders a tie by name", () => {
    const tiles = providerTiles([
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
    const [withText, without] = providerTiles([
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
    expect(providerTiles([{ id: "alt", name: "Alt" }])).toEqual([]);
  });

  it("answers an empty list for no tenants", () => {
    expect(providerTiles(undefined)).toEqual([]);
    expect(providerTiles([])).toEqual([]);
  });
});

describe("providerInitials", () => {
  it("takes the first letters of the first two words", () => {
    expect(providerInitials("Sport & Bäder")).toBe("SB");
    expect(providerInitials("Jugendzentrum Ost")).toBe("JO");
    expect(providerInitials("Stadt Wildeshausen e.V.")).toBe("SW");
  });

  it("takes the first two letters of a single word", () => {
    expect(providerInitials("Kulturamt")).toBe("KU");
  });

  it("answers a question mark for a name without letters", () => {
    expect(providerInitials("")).toBe("?");
    expect(providerInitials(undefined)).toBe("?");
  });
});

describe("providerAccent", () => {
  it("gives a tenant the same accent on every load", () => {
    expect(providerAccent("diz", 6)).toBe(providerAccent("diz", 6));
  });

  it("stays within the palette", () => {
    for (const id of ["a", "diz", "0f44248a-bf4e-4292", "Stadt Testingen"]) {
      const accent = providerAccent(id, 6);
      expect(accent).toBeGreaterThanOrEqual(0);
      expect(accent).toBeLessThan(6);
    }
  });
});
