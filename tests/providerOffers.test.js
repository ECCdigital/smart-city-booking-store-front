import { describe, expect, it } from "vitest";

import { providerTiles } from "~/utils/providerOffers.js";

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

    expect(withText).toEqual({
      id: "Verein",
      name: "Verein",
      description: "Sport im Quartier.",
      bookableCount: 2,
      eventCount: 1,
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
