import { describe, expect, it } from "vitest";

import {
  ACCESS_ERRORS,
  decideBookingOutcome,
  mapBlockingReason,
  readScanResolution,
} from "~/utils/accessOpenFlow.js";

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
    ).toEqual({ accessPoint: null, error: ACCESS_ERRORS.STALE_SCAN_CODE });
  });

  it("reports an unknown code", () => {
    expect(
      readScanResolution({
        success: false,
        data: { reason: "unknown_scan_code", accessPointId: null },
      }),
    ).toEqual({ accessPoint: null, error: ACCESS_ERRORS.UNKNOWN_SCAN_CODE });
  });

  it("falls back to a generic error instead of trusting an unknown reason", () => {
    expect(
      readScanResolution({ success: false, data: { reason: "wat" } }),
    ).toEqual({ accessPoint: null, error: ACCESS_ERRORS.GENERIC });
  });

  it("does not read a missing envelope as success", () => {
    expect(readScanResolution(null)).toEqual({
      accessPoint: null,
      error: ACCESS_ERRORS.GENERIC,
    });
    expect(readScanResolution({ success: true })).toEqual({
      accessPoint: null,
      error: ACCESS_ERRORS.GENERIC,
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
      error: ACCESS_ERRORS.NO_BOOKING,
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
      error: ACCESS_ERRORS.NO_BOOKING,
      booking: null,
      blockingReason: null,
    });
  });

  it("sends an unpaid booking to the payment screen", () => {
    const unpaid = blocked("payment_required");

    expect(decide({ activeBookings: [unpaid] })).toEqual({
      screen: "error",
      error: ACCESS_ERRORS.PAYMENT_REQUIRED,
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
      error: ACCESS_ERRORS.TOO_EARLY,
      booking: notYet,
    });
    expect(decide({ activeBookings: [over] })).toMatchObject({
      screen: "error",
      error: ACCESS_ERRORS.TOO_LATE,
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
      error: ACCESS_ERRORS.GENERIC,
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
      error: ACCESS_ERRORS.GENERIC,
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
      error: ACCESS_ERRORS.GENERIC,
      booking: noReason,
      blockingReason: null,
    });
  });

  it("picks the blocked booking it can actually say something about", () => {
    const opaque = blocked("authorization_revoked", { id: "B-1042" });
    const unpaid = blocked("payment_required", { id: "B-1043" });

    expect(decide({ activeBookings: [opaque, unpaid] })).toMatchObject({
      error: ACCESS_ERRORS.PAYMENT_REQUIRED,
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
      error: ACCESS_ERRORS.TOO_EARLY,
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
      error: ACCESS_ERRORS.TOO_LATE,
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
      error: ACCESS_ERRORS.TOO_EARLY,
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
      error: ACCESS_ERRORS.TOO_EARLY,
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
      error: ACCESS_ERRORS.NO_BOOKING,
      booking: null,
    });
  });

  describe("read off `status` (backend 4.3) without any flags", () => {
    /** A booking as the 4.3 fallback query returns it: `status`, no flags. */
    const upcomingWithStatus = (status) =>
      booking({
        id: "B-3000",
        timeBegin: NOW + HOUR,
        timeEnd: NOW + 2 * HOUR,
        status,
        accessEligibility: undefined,
      });

    it("points at a booking with payment outstanding", () => {
      const payable = upcomingWithStatus("payment_due");

      expect(decide({ otherBookings: [payable] })).toMatchObject({
        error: ACCESS_ERRORS.TOO_EARLY,
        booking: payable,
      });
    });

    it("does not offer a request the provider has not approved yet", () => {
      expect(
        decide({ otherBookings: [upcomingWithStatus("requested")] }),
      ).toMatchObject({ error: ACCESS_ERRORS.NO_BOOKING, booking: null });
    });

    it("does not offer a cancelled booking", () => {
      expect(
        decide({ otherBookings: [upcomingWithStatus("cancelled")] }),
      ).toMatchObject({ error: ACCESS_ERRORS.NO_BOOKING, booking: null });
    });
  });

  it("reports no booking at all when nothing matches", () => {
    expect(decide()).toEqual({
      screen: "error",
      error: ACCESS_ERRORS.NO_BOOKING,
      booking: null,
      blockingReason: null,
    });
  });
});

describe("mapBlockingReason", () => {
  it("leaves the time window generic without a booking to compare against", () => {
    expect(mapBlockingReason("outside_access_window")).toBe(
      ACCESS_ERRORS.GENERIC,
    );
  });

  it("maps the evidence reasons one to one", () => {
    expect(mapBlockingReason("evidence_missing")).toBe(
      ACCESS_ERRORS.EVIDENCE_MISSING,
    );
  });
});
