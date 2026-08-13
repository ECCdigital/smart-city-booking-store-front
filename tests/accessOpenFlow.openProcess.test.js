import { describe, expect, it } from "vitest";

import {
  ACCESS_ERRORS,
  buildOpenRequest,
  readOpenConfirmation,
  readOpenOutcome,
} from "~/utils/accessOpenFlow.js";

const NOW = Date.UTC(2026, 7, 12, 18, 30);
const HOUR = 60 * 60 * 1000;

describe("buildOpenRequest", () => {
  it("carries the evidence and marks the channel", () => {
    expect(
      buildOpenRequest({ evidence: [{ type: "qrScan", scanCode: "k7f3xyz" }] }),
    ).toEqual({
      evidence: [{ type: "qrScan", scanCode: "k7f3xyz" }],
      channel: "qrScan",
    });
  });

  it("invents no evidence when there is none", () => {
    expect(buildOpenRequest({ evidence: [] })).toEqual({ channel: "qrScan" });
    expect(buildOpenRequest()).toEqual({ channel: "qrScan" });
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

    expect(
      readOpenOutcome(refusal, { booking: expired, now: NOW }),
    ).toMatchObject({ error: ACCESS_ERRORS.TOO_LATE });
    expect(
      readOpenOutcome(refusal, { booking: notYet, now: NOW }),
    ).toMatchObject({ error: ACCESS_ERRORS.TOO_EARLY });
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
      error: ACCESS_ERRORS.EVIDENCE_INVALID,
      blockingReason: "evidence_invalid",
    });
  });

  it("does not read an unknown refusal as success", () => {
    expect(
      readOpenOutcome({ success: false, data: { blockingReasons: ["wat"] } }),
    ).toMatchObject({
      opened: false,
      error: ACCESS_ERRORS.GENERIC,
      blockingReason: "wat",
    });
    expect(readOpenOutcome({ success: false, data: {} })).toMatchObject({
      opened: false,
      error: ACCESS_ERRORS.GENERIC,
      blockingReason: null,
    });
  });

  it("does not read a missing envelope as success", () => {
    expect(readOpenOutcome(undefined)).toMatchObject({
      opened: false,
      error: ACCESS_ERRORS.GENERIC,
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
    expect(readOpenConfirmation({ data: { errorCode: "BOX_BUSY" } })).toEqual({
      opened: false,
      error: ACCESS_ERRORS.DOOR_UNREACHABLE,
    });
  });

  it("treats an exhausted poll as an unreachable door rather than success", () => {
    expect(readOpenConfirmation({ data: {} })).toEqual({
      opened: false,
      error: ACCESS_ERRORS.DOOR_UNREACHABLE,
    });
    expect(readOpenConfirmation(null)).toEqual({
      opened: false,
      error: ACCESS_ERRORS.DOOR_UNREACHABLE,
    });
  });
});
