import { describe, expect, it } from "vitest";

import {
  COOLDOWN_MS,
  LOCK_BUSY_READ_MS,
  buildBusyResult,
  isLockBusy,
} from "~/utils/accessOpenFlow.js";

describe("isLockBusy", () => {
  it("reads a raw HTTP 423, body or not", () => {
    expect(isLockBusy({ statusCode: 423 })).toBe(true);
    expect(isLockBusy({ statusCode: 423, data: undefined })).toBe(true);
  });

  it("reads the backend's lock_busy code whatever the status", () => {
    expect(
      isLockBusy({
        statusCode: 423,
        data: {
          error: "LockBusyError",
          code: "lock_busy",
          statusCode: 423,
          params: { provider: "nuki", action: "open" },
        },
      }),
    ).toBe(true);
    expect(isLockBusy({ statusCode: 500, data: { code: "lock_busy" } })).toBe(
      true,
    );
  });

  it("is false for every other failure", () => {
    expect(isLockBusy({ statusCode: 500 })).toBe(false);
    expect(isLockBusy({ statusCode: 502, data: { code: "unreachable" } })).toBe(
      false,
    );
    expect(isLockBusy({ statusCode: 403, data: { reason: "no_booking" } })).toBe(
      false,
    );
    expect(isLockBusy(new Error("network"))).toBe(false);
    expect(isLockBusy({})).toBe(false);
  });

  it("is false where there is no error at all", () => {
    expect(isLockBusy(null)).toBe(false);
    expect(isLockBusy(undefined)).toBe(false);
    expect(isLockBusy("423")).toBe(false);
  });
});

describe("buildBusyResult", () => {
  it("is an outcome, not an error: an open that was not carried out", () => {
    expect(buildBusyResult("open")).toEqual({
      opened: false,
      busy: true,
      error: null,
    });
  });

  it("names the close the same way", () => {
    expect(buildBusyResult("close")).toEqual({
      closed: false,
      busy: true,
      error: null,
    });
  });
});

describe("the single read after Lock Busy", () => {
  it("lands about four seconds in, well inside the restarted Cooldown", () => {
    expect(LOCK_BUSY_READ_MS).toBe(4000);
    expect(LOCK_BUSY_READ_MS).toBeLessThan(COOLDOWN_MS);
  });
});
