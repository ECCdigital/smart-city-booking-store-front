import { describe, expect, it } from "vitest";

import {
  ACCESS_ERRORS,
  decideBookingOutcome,
  decideStage,
  doorBlockingReason,
  remoteOperable,
} from "~/utils/accessOpenFlow.js";

const HOUR = 60 * 60 * 1000;
const NOW = Date.UTC(2026, 8, 17, 9, 0);

const DOOR_ID = "ap-7f3a";
const TENANT_ID = "rostock";

const LOCKED = {
  open: false,
  locked: true,
  doorOpen: false,
  statusSource: "provider_status",
};

/**
 * A booking whose eligibility names the door in both lists, with the door's
 * own buffered window on its access point - as backend 4.3 projects it.
 */
const booking = ({ from, to, door = {}, eligibility = {} } = {}) => ({
  id: "B-1042",
  tenantId: TENANT_ID,
  timeBegin: NOW - HOUR,
  timeEnd: NOW + HOUR,
  accessPointIds: [DOOR_ID],
  accessPoints: [{ id: DOOR_ID, accessFrom: from, accessTo: to, ...door }],
  accessEligibility: {
    canOperate: true,
    blockingReasons: [],
    primaryBlockingReason: null,
    operableAccessPointIds: [DOOR_ID],
    remoteOperableAccessPointIds: [DOOR_ID],
    accessWindow: from !== undefined ? { from, to } : null,
    ...eligibility,
  },
});

describe("remoteOperable with the clock", () => {
  it("needs the server's list and now inside the door's own window", () => {
    const b = booking({ from: NOW - HOUR, to: NOW + HOUR });

    expect(remoteOperable(b, DOOR_ID, NOW)).toBe(true);
    expect(remoteOperable(b, DOOR_ID, NOW - 2 * HOUR)).toBe(false);
    expect(remoteOperable(b, DOOR_ID, NOW + HOUR)).toBe(false);
  });

  it("is false outside the window even where the list still names the door", () => {
    // The list is a fact from the last load; the clock has moved on since.
    // A button that would only fail is not offered.
    const b = booking({ from: NOW - 3 * HOUR, to: NOW - HOUR });

    expect(remoteOperable(b, DOOR_ID, NOW)).toBe(false);
  });

  it("lets the list alone decide for a door without window fields", () => {
    // A missing window never withholds a button the server granted.
    const b = booking();
    delete b.accessPoints[0].accessFrom;
    delete b.accessPoints[0].accessTo;

    expect(remoteOperable(b, DOOR_ID, NOW)).toBe(true);
    expect(remoteOperable(b, DOOR_ID, NOW + 10 * HOUR)).toBe(true);
  });

  it("lets the list alone decide where the booking carries no access points", () => {
    const b = booking();
    delete b.accessPoints;

    expect(remoteOperable(b, DOOR_ID, NOW)).toBe(true);
  });

  it("never opens a door the list does not name, whatever the window says", () => {
    const b = booking({
      from: NOW - HOUR,
      to: NOW + HOUR,
      eligibility: { remoteOperableAccessPointIds: [] },
    });

    expect(remoteOperable(b, DOOR_ID, NOW)).toBe(false);
  });
});

describe("doorBlockingReason with the clock", () => {
  it("names the window once the clock has left it", () => {
    const b = booking({ from: NOW - 3 * HOUR, to: NOW - HOUR });

    expect(doorBlockingReason(b, DOOR_ID, NOW)).toBe("outside_access_window");
    expect(doorBlockingReason(b, DOOR_ID, NOW - 2 * HOUR)).toBeNull();
  });

  it("still names the code door for what it is", () => {
    const b = booking({
      from: NOW - HOUR,
      to: NOW + HOUR,
      eligibility: { remoteOperableAccessPointIds: [] },
    });

    expect(doorBlockingReason(b, DOOR_ID, NOW)).toBe("no_remote_access");
  });
});

describe("decideStage at the window's end", () => {
  const door = (facts = {}) => ({
    capabilities: ["open", "close", "getStatus"],
    validationRuleTypes: [],
    status: LOCKED,
    accessPointId: DOOR_ID,
    ...facts,
  });

  it("stands on the button while the window is open", () => {
    const b = booking({ from: NOW - HOUR, to: NOW + HOUR });

    expect(decideStage(door({ booking: b, now: NOW })).stage).toBe("can_open");
  });

  it("turns to too_late once the door's window has ended", () => {
    const b = booking({ from: NOW - HOUR, to: NOW + HOUR });

    expect(decideStage(door({ booking: b, now: NOW + HOUR }))).toMatchObject({
      stage: "error",
      error: ACCESS_ERRORS.TOO_LATE,
      blockingReason: "outside_access_window",
    });
  });

  it("reads the door's own window, not the booking's raw times", () => {
    // The lag buffer is the operator's grace: the booking ended an hour ago,
    // the door's window has not.
    const b = booking({ from: NOW - 3 * HOUR, to: NOW + 2 * HOUR });
    b.timeEnd = NOW - HOUR;

    expect(decideStage(door({ booking: b, now: NOW })).stage).toBe("can_open");
  });

  it("never flips mid-command: a settling Cooldown or burst finishes first", () => {
    const b = booking({ from: NOW - HOUR, to: NOW + HOUR });
    const afterEnd = NOW + HOUR + 1000;

    expect(
      decideStage(door({ booking: b, now: afterEnd, settling: true })).stage,
    ).toBe("can_open");
    expect(
      decideStage(
        door({ booking: b, now: afterEnd, settling: true, action: "open" }),
      ).stage,
    ).toBe("opening");
    // Once nothing settles any more, the window's end is the stage.
    expect(
      decideStage(door({ booking: b, now: afterEnd, settling: false })).error,
    ).toBe(ACCESS_ERRORS.TOO_LATE);
  });

  it("does not let settling excuse a door the server never named", () => {
    const b = booking({
      from: NOW - HOUR,
      to: NOW + HOUR,
      eligibility: { remoteOperableAccessPointIds: [] },
    });

    expect(
      decideStage(door({ booking: b, now: NOW, settling: true })),
    ).toMatchObject({ stage: "error", blockingReason: "no_remote_access" });
  });

  it("says too_early before the door's window, with no grace either way", () => {
    const b = booking({ from: NOW + HOUR, to: NOW + 3 * HOUR });

    expect(decideStage(door({ booking: b, now: NOW })).error).toBe(
      ACCESS_ERRORS.TOO_EARLY,
    );
    expect(decideStage(door({ booking: b, now: NOW + HOUR })).stage).toBe(
      "can_open",
    );
  });
});

describe("decideBookingOutcome with the clock", () => {
  it("blocks the door once the clock has left its window, and says too_late", () => {
    const b = booking({ from: NOW - 3 * HOUR, to: NOW - HOUR });

    expect(
      decideBookingOutcome({
        accessPointId: DOOR_ID,
        tenantId: TENANT_ID,
        activeBookings: [b],
        now: NOW,
      }),
    ).toMatchObject({
      screen: "error",
      error: ACCESS_ERRORS.TOO_LATE,
      blockingReason: "outside_access_window",
    });
  });
});
