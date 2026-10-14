import { describe, expect, it } from "vitest";

import {
  EVENT_FORMAT,
  bookingParticipationLinkOf,
  eventFormatLabelKey,
  eventFormatOf,
  publicParticipationLinkOf,
} from "~/utils/eventFormat.js";

const LINK = "https://meet.example/abc";

function event({ format, url = LINK, needsRegistration = false } = {}) {
  return {
    format,
    attendees: { needsRegistration },
    eventLocation: { url },
  };
}

describe("eventFormatOf", () => {
  it("reads the format number", () => {
    expect(eventFormatOf(event({ format: 0 }))).toBe(EVENT_FORMAT.PRESENCE);
    expect(eventFormatOf(event({ format: 1 }))).toBe(EVENT_FORMAT.HYBRID);
    expect(eventFormatOf(event({ format: 2 }))).toBe(EVENT_FORMAT.ONLINE);
  });

  it("counts a missing or unknown format as presence", () => {
    expect(eventFormatOf({})).toBe(EVENT_FORMAT.PRESENCE);
    expect(eventFormatOf(undefined)).toBe(EVENT_FORMAT.PRESENCE);
    expect(eventFormatOf(event({ format: 7 }))).toBe(EVENT_FORMAT.PRESENCE);
    expect(eventFormatOf(event({ format: "2" }))).toBe(EVENT_FORMAT.PRESENCE);
  });
});

describe("eventFormatLabelKey", () => {
  it("names the i18n key of each format", () => {
    expect(eventFormatLabelKey(event({ format: 0 }))).toBe(
      "events.format.presence",
    );
    expect(eventFormatLabelKey(event({ format: 1 }))).toBe(
      "events.format.hybrid",
    );
    expect(eventFormatLabelKey(event({ format: 2 }))).toBe(
      "events.format.online",
    );
  });
});

describe("publicParticipationLinkOf", () => {
  it("shows the link of a hybrid or online event without registration", () => {
    expect(publicParticipationLinkOf(event({ format: 1 }))).toBe(LINK);
    expect(publicParticipationLinkOf(event({ format: 2 }))).toBe(LINK);
  });

  it("shows no link with registration", () => {
    expect(
      publicParticipationLinkOf(event({ format: 2, needsRegistration: true })),
    ).toBeNull();
  });

  it("shows no link left over in an event in presence", () => {
    expect(publicParticipationLinkOf(event({ format: 0 }))).toBeNull();
  });

  it("shows no empty link and none without http(s)", () => {
    expect(publicParticipationLinkOf(event({ format: 2, url: "" }))).toBeNull();
    expect(publicParticipationLinkOf(event({ format: 2, url: "  " }))).toBeNull();
    expect(
      publicParticipationLinkOf(event({ format: 2, url: "meet.example/abc" })),
    ).toBeNull();
    expect(
      publicParticipationLinkOf(event({ format: 2, url: "javascript:alert(1)" })),
    ).toBeNull();
    expect(
      publicParticipationLinkOf({ format: 2, attendees: {} }),
    ).toBeNull();
  });
});

describe("bookingParticipationLinkOf", () => {
  it("takes the link from the booking's event", () => {
    expect(
      bookingParticipationLinkOf({ event: { participationLink: LINK } }),
    ).toBe(LINK);
  });

  it("shows none while the backend names none", () => {
    expect(
      bookingParticipationLinkOf({ event: { participationLink: null } }),
    ).toBeNull();
    expect(bookingParticipationLinkOf({ event: {} })).toBeNull();
    expect(bookingParticipationLinkOf({ event: null })).toBeNull();
    expect(bookingParticipationLinkOf({})).toBeNull();
  });

  it("shows no address without http(s)", () => {
    expect(
      bookingParticipationLinkOf({
        event: { participationLink: "javascript:alert(1)" },
      }),
    ).toBeNull();
  });
});
