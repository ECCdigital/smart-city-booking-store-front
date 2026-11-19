import { describe, expect, it } from "vitest";

import { offerPoint, placedOffers } from "~/utils/nearbyOffers.js";

const at = (id, lng, lat) => ({
  item: { id, location: { coordinates: { points: [lng, lat] } } },
});

// Kiel, Neumünster (~30 km away) and Hamburg (~90 km away).
const KIEL = { lat: 54.3233, lng: 10.1228 };
const offers = [
  at("kiel", 10.1228, 54.3233),
  at("bordesholm", 10.036, 54.1745),
  at("neumuenster", 9.9845, 54.0731),
  at("hamburg", 9.9937, 53.5511),
  { item: { id: "nowhere" } },
];
const ids = (list) => list.map(({ item }) => item.id);

describe("the point of an Offer", () => {
  it("reads the GeoJSON points", () => {
    expect(offerPoint(offers[0].item)).toEqual([10.1228, 54.3233]);
  });

  it("is null without coordinates or at 0/0", () => {
    expect(offerPoint({})).toBeNull();
    expect(offerPoint(at("zero", 0, 0).item)).toBeNull();
  });
});

describe("the placed Offers", () => {
  it("are all Offers with a location without a position", () => {
    expect(ids(placedOffers(offers))).toEqual([
      "kiel",
      "bordesholm",
      "neumuenster",
      "hamburg",
    ]);
  });

  it("are those within 20 km of the position", () => {
    expect(ids(placedOffers(offers, KIEL))).toEqual(["kiel", "bordesholm"]);
  });

  it("follow the radius", () => {
    expect(ids(placedOffers(offers, KIEL, 40))).toEqual([
      "kiel",
      "bordesholm",
      "neumuenster",
    ]);
  });
});
