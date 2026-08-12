import { describe, expect, it } from "vitest";

import {
  SCAN_ERRORS,
  buildScanOpenRequest,
  decideBookingOutcome,
  mapBlockingReason,
  readOpenConfirmation,
  readOpenOutcome,
  readScanResolution,
} from "~/utils/scanLandingFlow.js";

const NOW = Date.UTC(2026, 7, 12, 18, 30);
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const ACCESS_POINT_ID = "ap-1";
const TENANT_ID = "musterstadt";

const booking = (overrides = {}) => ({
  id: "B-1042",
  tenantId: TENANT_ID,
  timeBegin: NOW - HOUR,
  timeEnd: NOW + HOUR,
  accessPointIds: [ACCESS_POINT_ID],
  accessEligibility: {
    blockingReasons: [],
    primaryBlockingReason: null,
    operableAccessPointIds: [ACCESS_POINT_ID],
  },
  ...overrides,
});

const blocked = (reason, overrides = {}) =>
  booking({
    accessEligibility: {
      blockingReasons: [reason],
      primaryBlockingReason: reason,
      operableAccessPointIds: [],
    },
    ...overrides,
  });

/** A booking as the wider fallback query returns it: no eligibility attached. */
const outsideWindow = (overrides = {}) =>
  booking({
    isCommitted: true,
    isRejected: false,
    accessEligibility: undefined,
    ...overrides,
  });

const decide = (overrides = {}) =>
  decideBookingOutcome({
    accessPointId: ACCESS_POINT_ID,
    tenantId: TENANT_ID,
    activeBookings: [],
    otherBookings: [],
    now: NOW,
    ...overrides,
  });

describe("readScanResolution", () => {
  it("reads the access point out of the success envelope", () => {
    const accessPoint = {
      id: ACCESS_POINT_ID,
      label: "Werkraum",
      type: "door",
      provider: "nuki",
      mode: "remote",
    };

    expect(readScanResolution({ success: true, data: accessPoint })).toEqual({
      accessPoint,
      error: null,
    });
  });

  it("reports a rotated sticker as a stale scan code", () => {
    expect(
      readScanResolution({
        success: false,
        data: { reason: "stale_scan_code", accessPointId: ACCESS_POINT_ID },
      }),
    ).toEqual({ accessPoint: null, error: SCAN_ERRORS.STALE_SCAN_CODE });
  });

  it("reports an unknown code", () => {
    expect(
      readScanResolution({
        success: false,
        data: { reason: "unknown_scan_code", accessPointId: null },
      }),
    ).toEqual({ accessPoint: null, error: SCAN_ERRORS.UNKNOWN_SCAN_CODE });
  });

  it("falls back to a generic error instead of trusting an unknown reason", () => {
    expect(
      readScanResolution({ success: false, data: { reason: "wat" } }),
    ).toEqual({ accessPoint: null, error: SCAN_ERRORS.GENERIC });
  });

  it("does not read a missing envelope as success", () => {
    expect(readScanResolution(null)).toEqual({
      accessPoint: null,
      error: SCAN_ERRORS.GENERIC,
    });
    expect(readScanResolution({ success: true })).toEqual({
      accessPoint: null,
      error: SCAN_ERRORS.GENERIC,
    });
  });
});

describe("decideBookingOutcome", () => {
  it("auto-picks the single active booking", () => {
    const only = booking();

    expect(decide({ activeBookings: [only] })).toEqual({
      screen: "ready",
      booking: only,
    });
  });

  it("asks which booking when several are active at once", () => {
    const first = booking({ id: "B-1042" });
    const second = booking({ id: "B-1043", timeBegin: NOW - 2 * HOUR });

    expect(decide({ activeBookings: [first, second] })).toEqual({
      screen: "select",
      bookings: [first, second],
    });
  });

  it("only offers bookings that can actually open the scanned door", () => {
    const openable = booking({ id: "B-1042" });
    const other = booking({
      id: "B-1043",
      accessEligibility: {
        blockingReasons: [],
        primaryBlockingReason: null,
        operableAccessPointIds: ["ap-other"],
      },
    });

    expect(decide({ activeBookings: [openable, other] })).toEqual({
      screen: "ready",
      booking: openable,
    });
  });

  it("ignores bookings of a different tenant", () => {
    const foreign = booking({ tenantId: "anderswo" });

    expect(decide({ activeBookings: [foreign] })).toEqual({
      screen: "error",
      error: SCAN_ERRORS.NO_BOOKING,
      booking: null,
      blockingReason: null,
    });
  });

  it("ignores bookings that do not reference the scanned door", () => {
    const elsewhere = booking({
      accessPointIds: ["ap-other"],
      accessEligibility: {
        blockingReasons: [],
        primaryBlockingReason: null,
        operableAccessPointIds: ["ap-other"],
      },
    });

    expect(decide({ activeBookings: [elsewhere] })).toEqual({
      screen: "error",
      error: SCAN_ERRORS.NO_BOOKING,
      booking: null,
      blockingReason: null,
    });
  });

  it("sends an unpaid booking to the payment screen", () => {
    const unpaid = blocked("payment_required");

    expect(decide({ activeBookings: [unpaid] })).toEqual({
      screen: "error",
      error: SCAN_ERRORS.PAYMENT_REQUIRED,
      booking: unpaid,
      blockingReason: "payment_required",
    });
  });

  it("splits outside_access_window into too early and too late", () => {
    const notYet = blocked("outside_access_window", {
      timeBegin: NOW + 30 * MINUTE,
      timeEnd: NOW + 2 * HOUR,
    });
    const over = blocked("outside_access_window", {
      timeBegin: NOW - 3 * HOUR,
      timeEnd: NOW - 2 * HOUR,
    });

    expect(decide({ activeBookings: [notYet] })).toMatchObject({
      screen: "error",
      error: SCAN_ERRORS.TOO_EARLY,
      booking: notYet,
    });
    expect(decide({ activeBookings: [over] })).toMatchObject({
      screen: "error",
      error: SCAN_ERRORS.TOO_LATE,
      booking: over,
    });
  });

  it("stays generic when the time window is blocked but the booking has no times", () => {
    const timeless = blocked("outside_access_window", {
      timeBegin: undefined,
      timeEnd: undefined,
    });

    expect(decide({ activeBookings: [timeless] })).toMatchObject({
      screen: "error",
      error: SCAN_ERRORS.GENERIC,
      blockingReason: "outside_access_window",
    });
  });

  it("keeps the evidence reasons as their own screens", () => {
    for (const reason of [
      "evidence_rule_unavailable",
      "evidence_invalid",
      "evidence_missing",
    ]) {
      expect(decide({ activeBookings: [blocked(reason)] })).toMatchObject({
        screen: "error",
        error: reason,
      });
    }
  });

  it("shows a generic error for a blocking reason it has no screen for", () => {
    const revoked = blocked("authorization_revoked");

    expect(decide({ activeBookings: [revoked] })).toEqual({
      screen: "error",
      error: SCAN_ERRORS.GENERIC,
      booking: revoked,
      blockingReason: "authorization_revoked",
    });
  });

  it("shows a generic error rather than opening when a booking is blocked without a reason", () => {
    const noReason = booking({
      accessEligibility: {
        blockingReasons: [],
        primaryBlockingReason: null,
        operableAccessPointIds: [],
      },
    });

    expect(decide({ activeBookings: [noReason] })).toEqual({
      screen: "error",
      error: SCAN_ERRORS.GENERIC,
      booking: noReason,
      blockingReason: null,
    });
  });

  it("picks the blocked booking it can actually say something about", () => {
    const opaque = blocked("authorization_revoked", { id: "B-1042" });
    const unpaid = blocked("payment_required", { id: "B-1043" });

    expect(decide({ activeBookings: [opaque, unpaid] })).toMatchObject({
      error: SCAN_ERRORS.PAYMENT_REQUIRED,
      booking: unpaid,
    });
  });

  it("points at the next booking when the user is early", () => {
    const later = outsideWindow({
      id: "B-2000",
      timeBegin: NOW + 3 * HOUR,
      timeEnd: NOW + 4 * HOUR,
    });
    const evenLater = outsideWindow({
      id: "B-2001",
      timeBegin: NOW + 5 * HOUR,
      timeEnd: NOW + 6 * HOUR,
    });

    expect(decide({ otherBookings: [evenLater, later] })).toEqual({
      screen: "error",
      error: SCAN_ERRORS.TOO_EARLY,
      booking: later,
      blockingReason: null,
    });
  });

  it("points at the most recent booking when the user is late", () => {
    const older = outsideWindow({
      id: "B-1000",
      timeBegin: NOW - 6 * HOUR,
      timeEnd: NOW - 5 * HOUR,
    });
    const recent = outsideWindow({
      id: "B-1001",
      timeBegin: NOW - 3 * HOUR,
      timeEnd: NOW - 2 * HOUR,
    });

    expect(decide({ otherBookings: [older, recent] })).toEqual({
      screen: "error",
      error: SCAN_ERRORS.TOO_LATE,
      booking: recent,
      blockingReason: null,
    });
  });

  it("prefers the upcoming booking over the expired one", () => {
    const past = outsideWindow({
      id: "B-1000",
      timeBegin: NOW - 3 * HOUR,
      timeEnd: NOW - 2 * HOUR,
    });
    const future = outsideWindow({
      id: "B-2000",
      timeBegin: NOW + 2 * HOUR,
      timeEnd: NOW + 3 * HOUR,
    });

    expect(decide({ otherBookings: [past, future] })).toMatchObject({
      error: SCAN_ERRORS.TOO_EARLY,
      booking: future,
    });
  });

  it("still names an unpaid upcoming booking rather than claiming there is none", () => {
    const unpaidUpcoming = outsideWindow({
      id: "B-2000",
      timeBegin: NOW + 3 * HOUR,
      timeEnd: NOW + 4 * HOUR,
      isPayed: false,
      accessEligibility: {
        blockingReasons: ["payment_required"],
        primaryBlockingReason: "payment_required",
        operableAccessPointIds: [],
      },
    });

    expect(decide({ otherBookings: [unpaidUpcoming] })).toMatchObject({
      error: SCAN_ERRORS.TOO_EARLY,
      booking: unpaidUpcoming,
    });
  });

  it("does not offer a rejected or uncommitted booking as the next one", () => {
    const rejected = outsideWindow({
      id: "B-2000",
      timeBegin: NOW + HOUR,
      timeEnd: NOW + 2 * HOUR,
      isRejected: true,
    });
    const uncommitted = outsideWindow({
      id: "B-2001",
      timeBegin: NOW + 2 * HOUR,
      timeEnd: NOW + 3 * HOUR,
      isCommitted: false,
    });

    expect(decide({ otherBookings: [rejected, uncommitted] })).toMatchObject({
      error: SCAN_ERRORS.NO_BOOKING,
      booking: null,
    });
  });

  it("reports no booking at all when nothing matches", () => {
    expect(decide()).toEqual({
      screen: "error",
      error: SCAN_ERRORS.NO_BOOKING,
      booking: null,
      blockingReason: null,
    });
  });
});

describe("buildScanOpenRequest", () => {
  it("carries the scan as evidence and marks the channel", () => {
    expect(buildScanOpenRequest("k7f3xyz")).toEqual({
      evidence: [{ type: "qrScan", scanCode: "k7f3xyz" }],
      channel: "qrScan",
    });
  });
});

describe("readOpenOutcome", () => {
  it("treats the success envelope as opened", () => {
    expect(readOpenOutcome({ success: true, data: { state: "open" } })).toEqual({
      opened: true,
      pendingProcessId: null,
      error: null,
      blockingReason: null,
    });
  });

  it("does not call an unconfirmed open process opened", () => {
    expect(
      readOpenOutcome({
        success: true,
        data: { processId: "P-1", openProcessId: "OP-9" },
      }),
    ).toEqual({
      opened: false,
      pendingProcessId: "OP-9",
      error: null,
      blockingReason: null,
    });
  });

  it("names the closed window when the booking ran out while the screen was open", () => {
    const expired = { timeBegin: NOW - 3 * HOUR, timeEnd: NOW - HOUR };
    const notYet = { timeBegin: NOW + HOUR, timeEnd: NOW + 2 * HOUR };
    const refusal = {
      success: false,
      data: { blockingReasons: ["outside_access_window"] },
    };

    expect(readOpenOutcome(refusal, { booking: expired, now: NOW })).toMatchObject(
      { error: SCAN_ERRORS.TOO_LATE },
    );
    expect(readOpenOutcome(refusal, { booking: notYet, now: NOW })).toMatchObject(
      { error: SCAN_ERRORS.TOO_EARLY },
    );
  });

  it("maps a refusal to its screen", () => {
    expect(
      readOpenOutcome({
        success: false,
        data: { blockingReasons: ["evidence_invalid", "evidence_missing"] },
      }),
    ).toEqual({
      opened: false,
      pendingProcessId: null,
      error: SCAN_ERRORS.EVIDENCE_INVALID,
      blockingReason: "evidence_invalid",
    });
  });

  it("does not read an unknown refusal as success", () => {
    expect(
      readOpenOutcome({ success: false, data: { blockingReasons: ["wat"] } }),
    ).toMatchObject({
      opened: false,
      error: SCAN_ERRORS.GENERIC,
      blockingReason: "wat",
    });
    expect(readOpenOutcome({ success: false, data: {} })).toMatchObject({
      opened: false,
      error: SCAN_ERRORS.GENERIC,
      blockingReason: null,
    });
  });

  it("does not read a missing envelope as success", () => {
    expect(readOpenOutcome(undefined)).toMatchObject({
      opened: false,
      error: SCAN_ERRORS.GENERIC,
      blockingReason: null,
    });
  });
});

describe("readOpenConfirmation", () => {
  it("opens only once the provider confirms", () => {
    expect(readOpenConfirmation({ data: { confirmed: true } })).toEqual({
      opened: true,
      error: null,
    });
  });

  it("treats a reported error as an unreachable door", () => {
    expect(
      readOpenConfirmation({ data: { errorCode: "BOX_BUSY" } }),
    ).toEqual({ opened: false, error: SCAN_ERRORS.DOOR_UNREACHABLE });
  });

  it("treats an exhausted poll as an unreachable door rather than success", () => {
    expect(readOpenConfirmation({ data: {} })).toEqual({
      opened: false,
      error: SCAN_ERRORS.DOOR_UNREACHABLE,
    });
    expect(readOpenConfirmation(null)).toEqual({
      opened: false,
      error: SCAN_ERRORS.DOOR_UNREACHABLE,
    });
  });
});

describe("mapBlockingReason", () => {
  it("leaves the time window generic without a booking to compare against", () => {
    expect(mapBlockingReason("outside_access_window")).toBe(SCAN_ERRORS.GENERIC);
  });

  it("maps the evidence reasons one to one", () => {
    expect(mapBlockingReason("evidence_missing")).toBe(
      SCAN_ERRORS.EVIDENCE_MISSING,
    );
  });
});
