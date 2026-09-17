import { describe, expect, it } from "vitest";

import {
  BURST_DELAYS_MS,
  COOLDOWN_MS,
  commandConfirmed,
  concludeBurst,
  planBurst,
} from "~/utils/accessOpenFlow.js";

const reading = (fields) => ({
  open: null,
  locked: null,
  doorOpen: null,
  statusSource: "provider",
  ...fields,
});

describe("the Confirmation Burst schedule", () => {
  it("reads three times at about 1.5 s, 4 s and 6.5 s after the command's answer", () => {
    expect([...BURST_DELAYS_MS]).toEqual([1500, 4000, 6500]);
  });

  it("lands its last read before the Cooldown ends", () => {
    expect(BURST_DELAYS_MS.at(-1)).toBeLessThan(COOLDOWN_MS);
  });
});

describe("commandConfirmed", () => {
  it("open is confirmed by open === true and nothing less", () => {
    expect(commandConfirmed("open", reading({ open: true }))).toBe(true);
    expect(commandConfirmed("open", reading({ open: false }))).toBe(false);
    expect(commandConfirmed("open", reading({ open: null, locked: false }))).toBe(
      false,
    );
  });

  it("close is confirmed by locked === true; still locking is not yet", () => {
    expect(commandConfirmed("close", reading({ locked: true }))).toBe(true);
    expect(
      commandConfirmed("close", reading({ open: false, locked: false })),
    ).toBe(false);
    expect(commandConfirmed("close", reading({ open: false }))).toBe(false);
  });

  it("an unreadable status confirms nothing", () => {
    expect(commandConfirmed("open", null)).toBe(false);
    expect(commandConfirmed("close", undefined)).toBe(false);
  });
});

describe("planBurst", () => {
  it("an open always needs the full burst - its answer carries no status", () => {
    expect(planBurst("open", null)).toEqual(BURST_DELAYS_MS);
  });

  it("a close whose own answer already reports locked is read zero: no burst", () => {
    expect(planBurst("close", reading({ locked: true }))).toEqual([]);
  });

  it("a close whose answer caught the lock still locking needs the burst", () => {
    expect(planBurst("close", reading({ open: false, locked: false }))).toEqual(
      BURST_DELAYS_MS,
    );
    expect(planBurst("close", null)).toEqual(BURST_DELAYS_MS);
  });
});

describe("concludeBurst - when no read matched before the burst ran out", () => {
  it("the last readable reading wins, even against the command", () => {
    const last = reading({ open: true, locked: false });

    expect(concludeBurst("close", last)).toBe(last);
  });

  it("unreadable throughout: the command's own word stands", () => {
    expect(concludeBurst("open", null)).toEqual({
      open: true,
      locked: null,
      doorOpen: null,
      statusSource: "command_result",
    });
    expect(concludeBurst("close", undefined)).toEqual({
      open: false,
      locked: null,
      doorOpen: null,
      statusSource: "command_result",
    });
  });
});
