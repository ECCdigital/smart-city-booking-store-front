import { describe, expect, it } from "vitest";

import { openCancellationRequestOf } from "~/utils/bookingCancellation.js";

const REJECT_HOOK = {
  id: "hook-1",
  type: "REJECT",
  timeCreated: 1_760_000_000_000,
  payload: { reason: "Termin passt nicht" },
};

function bookingWith(status: string, hooks: unknown[] = [REJECT_HOOK]) {
  return { status, hooks };
}

describe("openCancellationRequestOf", () => {
  it.each(["requested", "payment_due", "confirmed"])(
    "reads an open request off a REJECT hook on a %s booking",
    (status) => {
      expect(openCancellationRequestOf(bookingWith(status))).toEqual({
        id: "hook-1",
        timeCreated: REJECT_HOOK.timeCreated,
        reason: "Termin passt nicht",
        bankDetails: null,
      });
    },
  );

  it.each(["rejected", "cancelled"])(
    "shows no request on a %s booking, even with the hook still there",
    (status) => {
      expect(openCancellationRequestOf(bookingWith(status))).toBeNull();
    },
  );

  it("shows no request on a live booking without a REJECT hook", () => {
    expect(
      openCancellationRequestOf(
        bookingWith("confirmed", [{ id: "hook-2", type: "OTHER" }]),
      ),
    ).toBeNull();
    expect(openCancellationRequestOf({ status: "confirmed" })).toBeNull();
  });

  it("reads a flag-only payload the same way", () => {
    expect(
      openCancellationRequestOf({ isCommitted: true, hooks: [REJECT_HOOK] }),
    ).not.toBeNull();
    expect(
      openCancellationRequestOf({
        isCommitted: true,
        isRejected: true,
        hooks: [REJECT_HOOK],
      }),
    ).toBeNull();
  });
});
