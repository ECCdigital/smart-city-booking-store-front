import { describe, expect, it } from "vitest";
import { requiresAcceptance } from "../app/utils/bookingAttachmentAccepted.js";

const offered = (overrides = {}) => ({
  id: "att-1",
  type: "agreement",
  title: "Hausordnung",
  show: true,
  required: true,
  ...overrides,
});

const bookingWith = (attachments) => ({
  bookableItems: [{ _bookableUsed: { id: "room", attachments } }],
});

const attachment = (overrides = {}) => ({
  type: "agreement",
  title: "Hausordnung",
  bookableId: "room",
  ...overrides,
});

describe("requiresAcceptance", () => {
  it("asks for acceptance where the checkout required a tick", () => {
    expect(requiresAcceptance(attachment(), bookingWith([offered()]))).toBe(
      true,
    );
  });

  it("does not ask where the checkout did not require a tick", () => {
    const booking = bookingWith([offered({ required: false })]);
    expect(requiresAcceptance(attachment(), booking)).toBe(false);
  });

  it("does not ask for a required attachment the checkout did not show", () => {
    const booking = bookingWith([offered({ show: false })]);
    expect(requiresAcceptance(attachment(), booking)).toBe(false);
  });

  it("matches the attachment by bookable, type and title", () => {
    const booking = bookingWith([offered()]);
    expect(
      requiresAcceptance(attachment({ bookableId: "other" }), booking),
    ).toBe(false);
    expect(requiresAcceptance(attachment({ title: "AGB" }), booking)).toBe(
      false,
    );
  });

  it("answers false for a booking without its bookables", () => {
    expect(requiresAcceptance(attachment(), {})).toBe(false);
  });
});
