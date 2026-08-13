import { describe, expect, it } from "vitest";

import {
  ACCESS_ERRORS,
  buildOpenRequest,
  decideScanMatch,
  decideStage,
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

describe("decideScanMatch", () => {
  const PANEL = {
    expectedAccessPointId: "ap-7f3a",
    expectedTenantId: "rostock",
  };
  const resolved = (point) => ({ success: true, data: point });

  const HAUPTEINGANG = {
    id: "ap-7f3a",
    label: "Haupteingang",
    tenantId: "rostock",
    type: "door",
  };
  const NEBENEINGANG = {
    id: "ap-2m8x",
    label: "Nebeneingang Ost",
    tenantId: "rostock",
    type: "door",
  };

  it("takes the scan as the proof once the code resolves to the door in front of the person", () => {
    expect(
      decideScanMatch(resolved(HAUPTEINGANG), {
        ...PANEL,
        scanCode: "SC-7F3K9Q",
      }),
    ).toEqual({
      matched: true,
      evidence: [{ type: "qrScan", scanCode: "SC-7F3K9Q" }],
      mismatch: null,
      scannedLabel: "Haupteingang",
    });
  });

  it("names the scanned door when the sticker belongs to another one - the way out has to say where it leads", () => {
    expect(
      decideScanMatch(resolved(NEBENEINGANG), {
        ...PANEL,
        scanCode: "SC-2M8XPT",
      }),
    ).toEqual({
      matched: false,
      evidence: [],
      mismatch: "wrong_door",
      scannedLabel: "Nebeneingang Ost",
    });
  });

  it("keeps a foreign tenant apart from a wrong door - only one of the two has a way out", () => {
    expect(
      decideScanMatch(
        resolved({ ...NEBENEINGANG, tenantId: "stadtwerke" }),
        { ...PANEL, scanCode: "SC-4B1LZR" },
      ),
    ).toMatchObject({ matched: false, mismatch: "wrong_tenant", evidence: [] });
  });

  it("does not let an unreadable answer pass for a match", () => {
    const noMatch = {
      matched: false,
      evidence: [],
      mismatch: "unreadable",
      scannedLabel: null,
    };
    const scanned = (response) =>
      decideScanMatch(response, { ...PANEL, scanCode: "SC-7F3K9Q" });

    expect(scanned(undefined)).toEqual(noMatch);
    expect(scanned(null)).toEqual(noMatch);
    expect(scanned({ success: false, data: { reason: "unknown_scan_code" } }))
      .toEqual(noMatch);
    expect(scanned({ success: true, data: {} })).toEqual(noMatch);
    expect(scanned("Gateway Timeout")).toEqual(noMatch);
  });

  it("compares no tenant where the answer names none - today's resolve-scan sends none, and every scan would be a miss", () => {
    const withoutTenant = { ...HAUPTEINGANG, tenantId: undefined };

    expect(
      decideScanMatch(resolved(withoutTenant), {
        ...PANEL,
        scanCode: "SC-7F3K9Q",
      }),
    ).toMatchObject({ matched: true, mismatch: null });
  });

  it("confirms no tenant the panel leaves unnamed - an unverifiable side is a miss, not a pass", () => {
    expect(
      decideScanMatch(resolved(HAUPTEINGANG), {
        expectedAccessPointId: "ap-7f3a",
        scanCode: "SC-7F3K9Q",
      }),
    ).toMatchObject({ matched: false, mismatch: "wrong_tenant" });
  });

  it("does not match a door the panel cannot name either", () => {
    expect(
      decideScanMatch(resolved(HAUPTEINGANG), {
        expectedTenantId: "rostock",
        scanCode: "SC-7F3K9Q",
      }),
    ).toMatchObject({ matched: false, mismatch: "wrong_door" });
  });

  it("invents no proof where nothing was decoded - evidence without a scan code is the fake this flow removes", () => {
    expect(decideScanMatch(resolved(HAUPTEINGANG), PANEL)).toEqual({
      matched: false,
      evidence: [],
      mismatch: "unreadable",
      scannedLabel: null,
    });
  });
});

const EVERY_CAPABILITY = ["open", "close", "getStatus"];
const LOCKED = {
  open: false,
  locked: true,
  doorOpen: false,
  statusSource: "provider_status",
};
const UNLOCKED = {
  open: true,
  locked: false,
  doorOpen: false,
  statusSource: "provider_status",
};
const SCANNED = [{ type: "qrScan", scanCode: "k7f3xyz" }];

/** A door as it stands today: it demands a scan and can do all three actions. */
const scanDoor = (facts) => ({
  capabilities: EVERY_CAPABILITY,
  validationRuleTypes: ["qrScan"],
  evidence: SCANNED,
  ...facts,
});

/** A locker on a bypass: no proof demanded, so no evidence stage. */
const bypass = (facts) => ({
  capabilities: EVERY_CAPABILITY,
  validationRuleTypes: [],
  ...facts,
});

describe("decideStage", () => {
  // "Comes up" is what this table says; *why* is what the named cases below
  // say. Every stage needs a row here, and the count case keeps it that way.
  const STAGE_ROWS = [
    {
      name: "nobody has read a status yet",
      facts: bypass({}),
      stage: "loading",
    },
    {
      name: "the door demands a scan and none is in hand",
      facts: scanDoor({ status: LOCKED, evidence: [] }),
      stage: "evidence",
    },
    {
      name: "locked, and the proof is in hand",
      facts: scanDoor({ status: LOCKED }),
      stage: "can_open",
    },
    {
      name: "standing open, and this door can lock",
      facts: bypass({ status: UNLOCKED }),
      stage: "can_close",
    },
    {
      name: "the open command is on its way",
      facts: scanDoor({ status: LOCKED, action: "open" }),
      stage: "opening",
    },
    {
      name: "the close command is on its way",
      facts: bypass({ status: UNLOCKED, action: "close" }),
      stage: "closing",
    },
    {
      name: "the provider confirmed the open",
      facts: scanDoor({
        action: "open",
        result: { opened: true, error: null },
      }),
      stage: "opened",
    },
    {
      name: "the close came back confirmed",
      facts: bypass({ action: "close", result: { closed: true, error: null } }),
      stage: "closed",
    },
    {
      name: "the status was read and there was none",
      facts: bypass({ status: null }),
      stage: "error",
    },
  ];

  it.each(STAGE_ROWS)("$stage: $name", ({ facts, stage }) => {
    expect(decideStage(facts).stage).toBe(stage);
  });

  it("reaches all nine stages - the table is the proof, not a promise", () => {
    expect(new Set(STAGE_ROWS.map((row) => row.stage)).size).toBe(9);
  });

  it("sends whoever demands a scan and has none through the evidence stage", () => {
    expect(
      decideStage(scanDoor({ status: LOCKED, evidence: [] })),
    ).toMatchObject({ stage: "evidence", error: null });
    // Proof of another kind is no answer to the question this door asked.
    expect(
      decideStage(
        scanDoor({ status: LOCKED, evidence: [{ type: "geofence" }] }),
      ).stage,
    ).toBe("evidence");
  });

  it("skips the evidence stage for evidence from the scan URL - that scan already happened at the door", () => {
    expect(decideStage(scanDoor({ status: LOCKED })).stage).toBe("can_open");
  });

  it("skips the evidence stage where nothing is demanded - a bypass and a locker say so with an empty list", () => {
    expect(decideStage(bypass({ status: LOCKED })).stage).toBe("can_open");
  });

  it("offers no lock a door cannot perform - an open one without the capability is a result, not a control", () => {
    expect(decideStage(bypass({ status: UNLOCKED })).stage).toBe("can_close");
    expect(
      decideStage(
        bypass({ status: UNLOCKED, capabilities: ["open", "getStatus"] }),
      ).stage,
    ).toBe("opened");
  });

  it("lets an error beat a running action, never the other way round", () => {
    expect(
      decideStage(
        scanDoor({
          status: LOCKED,
          action: "open",
          result: {
            opened: false,
            error: ACCESS_ERRORS.DOOR_UNREACHABLE,
            blockingReason: null,
          },
        }),
      ),
    ).toMatchObject({ stage: "error", error: ACCESS_ERRORS.DOOR_UNREACHABLE });
    // A spinner that can only end in this very error is shown for nothing.
    expect(
      decideStage(
        scanDoor({
          status: LOCKED,
          action: "open",
          booking: {
            accessEligibility: {
              canOperate: false,
              primaryBlockingReason: "authorization_revoked",
            },
          },
        }),
      ),
    ).toMatchObject({
      stage: "error",
      blockingReason: "authorization_revoked",
    });
  });

  it("waits for the open it sent and reports the one that came back", () => {
    expect(
      decideStage(scanDoor({ status: LOCKED, action: "open" })).stage,
    ).toBe("opening");
    expect(
      decideStage(
        scanDoor({
          status: LOCKED,
          action: "open",
          result: readOpenConfirmation({ data: { confirmed: true } }),
        }),
      ).stage,
    ).toBe("opened");
  });

  it("waits for the close it sent and reports the one that came back", () => {
    expect(
      decideStage(bypass({ status: UNLOCKED, action: "close" })).stage,
    ).toBe("closing");
    expect(
      decideStage(
        bypass({
          status: UNLOCKED,
          action: "close",
          result: readCloseOutcome({ success: true, data: LOCKED }),
        }),
      ).stage,
    ).toBe("closed");
  });

  it("calls an unreadable status an error with a way out, not an endless spinner", () => {
    expect(decideStage(bypass({ status: null }))).toMatchObject({
      stage: "error",
      error: ACCESS_ERRORS.STATUS_UNAVAILABLE,
      blockingReason: null,
    });
  });

  it("does not wait for a status a door cannot report", () => {
    expect(decideStage(bypass({ capabilities: ["open", "close"] })).stage).toBe(
      "can_open",
    );
  });

  it("takes the blocking reason from the eligibility and keeps naming it", () => {
    const blocked = (reason, booking = {}) =>
      decideStage(
        scanDoor({
          status: LOCKED,
          booking: {
            ...booking,
            accessEligibility: {
              canOperate: false,
              primaryBlockingReason: reason,
            },
          },
          now: NOW,
        }),
      );

    expect(blocked("payment_required")).toMatchObject({
      stage: "error",
      error: ACCESS_ERRORS.PAYMENT_REQUIRED,
    });
    // The six mute reasons share the generic screen - which still names them.
    expect(blocked("locker_not_ready")).toMatchObject({
      stage: "error",
      error: ACCESS_ERRORS.GENERIC,
      blockingReason: "locker_not_ready",
    });
    expect(
      blocked("outside_access_window", {
        timeBegin: NOW + HOUR,
        timeEnd: NOW + 2 * HOUR,
      }),
    ).toMatchObject({ stage: "error", error: ACCESS_ERRORS.TOO_EARLY });
    expect(
      blocked("outside_access_window", {
        timeBegin: NOW - 3 * HOUR,
        timeEnd: NOW - HOUR,
      }),
    ).toMatchObject({ stage: "error", error: ACCESS_ERRORS.TOO_LATE });
  });

  it("describes a two-step way from the first spinner on and moves on once the proof is in", () => {
    expect(
      decideStage(scanDoor({ status: LOCKED, evidence: [] })),
    ).toMatchObject({ steps: ["verify", "open"], currentStep: 0 });
    expect(decideStage(scanDoor({ status: LOCKED }))).toMatchObject({
      steps: ["verify", "open"],
      currentStep: 1,
    });
    // One step is a stepper that hides itself.
    expect(decideStage(bypass({ status: LOCKED })).steps).toEqual(["open"]);
  });

  // What the panel decides in its template today lands here. Named, because
  // otherwise nobody can tell afterwards what was carried over and what was
  // lost on the way.
  describe("what the list way does today", () => {
    it("offers opening for a locked door", () => {
      expect(decideStage(scanDoor({ status: LOCKED })).stage).toBe("can_open");
    });

    it("offers locking for an open one", () => {
      expect(decideStage(scanDoor({ status: UNLOCKED })).stage).toBe(
        "can_close",
      );
    });

    it("shows the spinner while the status is being loaded", () => {
      expect(decideStage(scanDoor({})).stage).toBe("loading");
    });

    it("reports the door as opened once the open is confirmed", () => {
      expect(
        decideStage(
          scanDoor({
            action: "open",
            result: readOpenOutcome({ success: true, data: { state: "open" } }),
          }),
        ).stage,
      ).toBe("opened");
    });
  });

  describe("the three deliberate departures from today", () => {
    it("demands the proof instead of faking it, as the panel does today behind a three-second timeout", () => {
      expect(
        decideStage(scanDoor({ status: LOCKED, evidence: [] })).stage,
      ).toBe("evidence");
    });

    it("knows no provider - the box that used to skip both the status and the proof now walks the same way as every door", () => {
      const locker = {
        type: "locker",
        capabilities: EVERY_CAPABILITY,
        validationRuleTypes: ["qrScan"],
        evidence: [],
      };

      expect(decideStage(locker).stage).toBe("loading");
      expect(decideStage({ ...locker, status: LOCKED }).stage).toBe("evidence");
      expect(decideStage({ ...locker, status: UNLOCKED }).stage).toBe(
        "can_close",
      );
    });

    it("has no refresh-status button - a fresh status follows every action, and an unreadable one is a case of its own", () => {
      expect(decideStage(bypass({ status: null })).error).toBe(
        ACCESS_ERRORS.STATUS_UNAVAILABLE,
      );
      expect(
        decideStage(
          bypass({
            action: "close",
            result: readCloseOutcome({ success: true, data: LOCKED }),
          }),
        ).stage,
      ).toBe("closed");
    });
  });
});
