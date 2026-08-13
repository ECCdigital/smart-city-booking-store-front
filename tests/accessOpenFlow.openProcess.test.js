import { describe, expect, it } from "vitest";

import {
  ACCESS_ERRORS,
  buildOpenRequest,
  readAccessPoint,
  readCloseOutcome,
  readOpenConfirmation,
  readOpenOutcome,
  readStatus,
} from "~/utils/accessOpenFlow.js";

const NOW = Date.UTC(2026, 7, 12, 18, 30);
const HOUR = 60 * 60 * 1000;

describe("readAccessPoint", () => {
  it("lets a payload that answers for itself through unchanged", () => {
    const raw = {
      id: "ap-7f3a",
      tenantId: "rostock",
      type: "door",
      provider: "nuki",
      label: "Werkstatt Nord",
      mode: "remote",
      validationRuleTypes: ["qrScan"],
      capabilities: ["open", "getStatus"],
    };

    expect(readAccessPoint(raw)).toEqual(raw);
  });

  it("assumes a scan is demanded where the payload does not say", () => {
    expect(readAccessPoint({ id: "ap-7f3a", label: "Werkstatt Nord" })).toEqual({
      id: "ap-7f3a",
      label: "Werkstatt Nord",
      tenantId: null,
      validationRuleTypes: ["qrScan"],
      capabilities: ["open", "close", "getStatus"],
    });
  });

  it("keeps an empty list empty - a bypass is not a missing field", () => {
    expect(
      readAccessPoint({
        id: "42",
        type: "locker",
        validationRuleTypes: [],
        capabilities: [],
      }),
    ).toMatchObject({ validationRuleTypes: [], capabilities: [] });
  });

  it("carries the tenant over as tenantId and leaves nothing to read it from", () => {
    const point = readAccessPoint({ id: "ap-7f3a", tenant: "rostock" });

    expect(point.tenantId).toBe("rostock");
    expect(point).not.toHaveProperty("tenant");
  });
});

describe("readStatus", () => {
  it("reads the four fields of the status answer", () => {
    expect(
      readStatus({
        success: true,
        data: {
          open: false,
          locked: true,
          doorOpen: null,
          statusSource: "provider_status",
        },
      }),
    ).toEqual({
      open: false,
      locked: true,
      doorOpen: null,
      statusSource: "provider_status",
    });
  });

  it("keeps 'the provider says nothing' apart from 'no'", () => {
    expect(
      readStatus({ data: { open: null, statusSource: "provider_status" } }),
    ).toEqual({
      open: null,
      locked: null,
      doorOpen: null,
      statusSource: "provider_status",
    });
  });

  it("ignores provider-owned keys instead of passing them on", () => {
    expect(
      readStatus({
        success: true,
        data: {
          open: true,
          locked: false,
          doorOpen: true,
          statusSource: "provider_status",
          batteryCritical: true,
          nukiState: 3,
        },
      }),
    ).toEqual({
      open: true,
      locked: false,
      doorOpen: true,
      statusSource: "provider_status",
    });
  });

  it("reads a missing or unreadable answer as no status, never as closed", () => {
    expect(readStatus(undefined)).toBeNull();
    expect(readStatus(null)).toBeNull();
    expect(
      readStatus({ success: false, data: { reason: "provider_down" } }),
    ).toBeNull();
    expect(readStatus({ success: true, data: {} })).toBeNull();
    expect(readStatus("Bad Gateway")).toBeNull();
  });
});

describe("readCloseOutcome", () => {
  it("reports the close together with the status behind it", () => {
    expect(
      readCloseOutcome({
        success: true,
        data: {
          open: false,
          locked: true,
          doorOpen: false,
          statusSource: "provider_status",
        },
      }),
    ).toEqual({
      closed: true,
      error: null,
      status: {
        open: false,
        locked: true,
        doorOpen: false,
        statusSource: "provider_status",
      },
    });
  });

  it("confirms a close the provider cannot describe", () => {
    expect(readCloseOutcome({ success: true, data: {} })).toEqual({
      closed: true,
      error: null,
      status: null,
    });
  });

  it("does not call an unconfirmed close closed", () => {
    expect(
      readCloseOutcome({
        success: false,
        data: { blockingReasons: ["no_remote_access"] },
      }),
    ).toEqual({
      closed: false,
      error: ACCESS_ERRORS.CLOSE_FAILED,
      status: null,
    });
  });

  it("reads a missing answer as a failed close, never as silent success", () => {
    expect(readCloseOutcome(undefined)).toEqual({
      closed: false,
      error: ACCESS_ERRORS.CLOSE_FAILED,
      status: null,
    });
  });
});

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
    expect(
      readOpenConfirmation({ data: { errorMessage: "lock offline" } }),
    ).toEqual({
      opened: false,
      error: ACCESS_ERRORS.DOOR_UNREACHABLE,
    });
  });

  it("calls a poll that ran out silent, not unreachable - the box may well have sprung open", () => {
    expect(readOpenConfirmation({ data: {} })).toEqual({
      opened: false,
      error: ACCESS_ERRORS.OPEN_UNCONFIRMED,
    });
    expect(
      readOpenConfirmation({
        data: { confirmed: null, errorCode: null, errorMessage: null },
      }),
    ).toEqual({
      opened: false,
      error: ACCESS_ERRORS.OPEN_UNCONFIRMED,
    });
  });

  it("does not read a missing or unreadable answer as an open door", () => {
    expect(readOpenConfirmation(null)).toMatchObject({ opened: false });
    expect(readOpenConfirmation(undefined)).toMatchObject({ opened: false });
    expect(readOpenConfirmation("Gateway Timeout")).toMatchObject({
      opened: false,
    });
  });
});
