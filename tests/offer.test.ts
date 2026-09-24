import { describe, expect, it } from "vitest";

import {
  eventOverlapsPeriod,
  fromPriceOf,
  isBookableOffer,
  mergeOffers,
  offerKey,
  titleOf,
} from "~/composables/search/offer";

const room = {
  id: "b1",
  tenantId: "t1",
  type: "room",
  title: "Seminarraum",
  isBookable: true,
  priceCategories: [{ priceEur: 15 }, { priceEur: 40, holidays: ["x"] }],
  priceValueAddedTax: 19,
};

const ticket = {
  id: "tk1",
  tenantId: "t1",
  type: "ticket",
  title: "Ticket",
  eventId: "e1",
  priceCategories: [{ priceEur: 12 }],
};

const orphanTicket = { ...ticket, id: "tk2", eventId: "" };

const event = {
  id: "e1",
  tenantId: "t1",
  type: "event",
  information: {
    name: "Hafenkonzert",
    startDate: "2026-10-10",
    startTime: "19:00",
    endDate: "2026-10-10",
    endTime: "22:30",
  },
  attendees: { publicEvent: true, needsRegistration: true, free: false },
  tickets: [
    { id: "tk1", priceCategories: [{ priceEur: 25 }] },
    { id: "tk3", priceCategories: [{ priceEur: 40 }], priceValueAddedTax: 0 },
  ],
};

describe("mergeOffers", () => {
  it("lists bookables and events together and reaches tickets through their event", () => {
    const merged = mergeOffers([room, ticket, orphanTicket], [event]);
    expect(merged.map((o) => o.id)).toEqual(["b1", "tk2", "e1"]);
  });

  it("keys the merged list by kind, tenant and id", () => {
    expect(offerKey(room)).toBe("room:t1:b1");
    expect(offerKey(event)).toBe("event:t1:e1");
  });
});

describe("accessors", () => {
  it("reads the title where each kind keeps it", () => {
    expect(titleOf(room)).toBe("Seminarraum");
    expect(titleOf(event)).toBe("Hafenkonzert");
  });

  it("treats a public event as bookable from the list", () => {
    expect(isBookableOffer(event)).toBe(true);
    expect(
      isBookableOffer({ ...event, attendees: { publicEvent: false } }),
    ).toBe(false);
    expect(isBookableOffer({ ...room, isBookable: false })).toBe(false);
  });
});

describe("fromPriceOf", () => {
  it("takes the cheapest regular bookable category, gross", () => {
    expect(fromPriceOf(room)).toBeCloseTo(17.85);
  });

  it("is 0 for a free bookable and null without categories", () => {
    expect(fromPriceOf({ ...room, priceCategories: [{ priceEur: 0 }] })).toBe(0);
    expect(fromPriceOf({ ...room, priceCategories: [] })).toBeNull();
  });

  it("takes the cheapest ticket of an event and 0 for a free one", () => {
    expect(fromPriceOf(event)).toBe(25);
    expect(fromPriceOf({ ...event, attendees: { free: true } })).toBe(0);
    expect(fromPriceOf({ ...event, tickets: [] })).toBe(0);
  });
});

describe("eventOverlapsPeriod", () => {
  const festival = {
    ...event,
    information: {
      name: "Festival",
      startDate: "2026-10-09",
      startTime: "16:00",
      endDate: "2026-10-11",
      endTime: "22:00",
    },
  };
  const at = (iso: string) => new Date(iso).getTime();

  it("matches a search inside a multi-day event", () => {
    expect(
      eventOverlapsPeriod(festival, {
        start: at("2026-10-10T10:00:00"),
        end: at("2026-10-10T12:00:00"),
      }),
    ).toBe(true);
  });

  it("does not match an event that starts after the searched period", () => {
    expect(
      eventOverlapsPeriod(event, {
        start: at("2026-10-10T10:00:00"),
        end: at("2026-10-10T12:00:00"),
      }),
    ).toBe(false);
  });

  it("matches a period that covers the whole event", () => {
    expect(
      eventOverlapsPeriod(event, {
        start: at("2026-10-10T00:00:00"),
        end: at("2026-10-11T00:00:00"),
      }),
    ).toBe(true);
  });

  it("is false without a period or without a date", () => {
    expect(eventOverlapsPeriod(event, { start: null, end: null })).toBe(false);
    expect(
      eventOverlapsPeriod(
        { ...event, information: {} },
        { start: 1, end: 2 },
      ),
    ).toBe(false);
  });
});
