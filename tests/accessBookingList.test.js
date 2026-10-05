import { describe, expect, it } from "vitest";

import {
  filterAccessBookingsByTenant,
  searchAccessBookings,
  tenantsOfAccessBookings,
} from "~/utils/accessBookingList.js";

const booking = (overrides = {}) => ({
  id: "ABCD-1234",
  tenantId: "diz",
  leadBookable: {
    title: "Großer Saal",
    location: { display_address: "Marktstraße 1, 27793 Wildeshausen" },
  },
  ...overrides,
});

const bookings = [
  booking(),
  booking({
    id: "WXYZ-9876",
    tenantId: "sports",
    leadBookable: { title: "Sporthalle", location: { display_address: "Am Stadion 5" } },
  }),
  booking({ id: "NOLOC-1", leadBookable: { title: "Werkstatt" } }),
];

describe("the search of the key list", () => {
  const ids = (list) => list.map((b) => b.id);

  it("finds a key by the title of its bookable", () => {
    expect(ids(searchAccessBookings(bookings, "saal"))).toEqual(["ABCD-1234"]);
  });

  it("finds a key by its booking id", () => {
    expect(ids(searchAccessBookings(bookings, "wxyz"))).toEqual(["WXYZ-9876"]);
  });

  it("finds a key by its address", () => {
    expect(ids(searchAccessBookings(bookings, "marktstrasse"))).toEqual([]);
    expect(ids(searchAccessBookings(bookings, "marktstraße"))).toEqual(["ABCD-1234"]);
    expect(ids(searchAccessBookings(bookings, "stadion"))).toEqual(["WXYZ-9876"]);
  });

  it("keeps everything for an empty query, a key without an address included", () => {
    expect(searchAccessBookings(bookings, "")).toHaveLength(3);
    expect(searchAccessBookings(bookings, undefined)).toHaveLength(3);
  });
});

describe("the provider filter of the key list", () => {
  it("lists each provider once, named by the caller", () => {
    expect(
      tenantsOfAccessBookings(bookings, (id) => (id === "diz" ? "Testmandant" : "")),
    ).toEqual([
      { id: "diz", name: "Testmandant" },
      { id: "sports", name: "sports" },
    ]);
  });

  it("narrows to the chosen providers and to none", () => {
    expect(filterAccessBookingsByTenant(bookings, ["sports"]).map((b) => b.id)).toEqual([
      "WXYZ-9876",
    ]);
    expect(filterAccessBookingsByTenant(bookings, [])).toHaveLength(3);
    expect(filterAccessBookingsByTenant(bookings)).toHaveLength(3);
  });
});
