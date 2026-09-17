import { describe, expect, it } from "vitest";

import {
  COOLDOWN_MS,
  cooldownProgress,
  cooldownSecondsLeft,
  isCooling,
  startCooldown,
} from "~/utils/accessOpenFlow.js";

const NOW = Date.UTC(2026, 8, 17, 9, 0);

describe("the Cooldown after a sent command", () => {
  it("lasts eight seconds", () => {
    expect(COOLDOWN_MS).toBe(8000);
  });

  it("starts from full at the moment the command is sent", () => {
    expect(startCooldown(NOW)).toBe(NOW + COOLDOWN_MS);
  });

  it("restarts from full when started again mid-way - the second start wins", () => {
    const first = startCooldown(NOW);
    const second = startCooldown(NOW + 3000);

    expect(second).toBe(NOW + 3000 + COOLDOWN_MS);
    expect(second).toBeGreaterThan(first);
  });
});

describe("isCooling", () => {
  it("holds the button back until the very end", () => {
    const until = startCooldown(NOW);

    expect(isCooling(until, NOW)).toBe(true);
    expect(isCooling(until, NOW + COOLDOWN_MS - 1)).toBe(true);
  });

  it("lets go at the end and stays let go afterwards", () => {
    const until = startCooldown(NOW);

    expect(isCooling(until, NOW + COOLDOWN_MS)).toBe(false);
    expect(isCooling(until, NOW + COOLDOWN_MS + 60_000)).toBe(false);
  });

  it("is off where no Cooldown was ever started", () => {
    expect(isCooling(0, NOW)).toBe(false);
    expect(isCooling(null, NOW)).toBe(false);
    expect(isCooling(undefined, NOW)).toBe(false);
  });
});

describe("cooldownSecondsLeft", () => {
  it("counts the seconds still to wait, rounded up so the digit never shows 0 while cooling", () => {
    const until = startCooldown(NOW);

    expect(cooldownSecondsLeft(until, NOW)).toBe(8);
    expect(cooldownSecondsLeft(until, NOW + 1)).toBe(8);
    expect(cooldownSecondsLeft(until, NOW + 1000)).toBe(7);
    expect(cooldownSecondsLeft(until, NOW + 7999)).toBe(1);
  });

  it("never goes below zero", () => {
    const until = startCooldown(NOW);

    expect(cooldownSecondsLeft(until, NOW + COOLDOWN_MS)).toBe(0);
    expect(cooldownSecondsLeft(until, NOW + COOLDOWN_MS + 5000)).toBe(0);
    expect(cooldownSecondsLeft(0, NOW)).toBe(0);
  });
});

describe("cooldownProgress", () => {
  it("drains from 0 at the start to 1 at the end", () => {
    const until = startCooldown(NOW);

    expect(cooldownProgress(until, NOW)).toBe(0);
    expect(cooldownProgress(until, NOW + COOLDOWN_MS / 2)).toBe(0.5);
    expect(cooldownProgress(until, NOW + COOLDOWN_MS)).toBe(1);
  });

  it("is clamped: a Cooldown that is over stays fully drained", () => {
    const until = startCooldown(NOW);

    expect(cooldownProgress(until, NOW + COOLDOWN_MS * 2)).toBe(1);
    expect(cooldownProgress(0, NOW)).toBe(1);
  });
});
