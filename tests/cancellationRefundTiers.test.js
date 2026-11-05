import { describe, expect, it } from "vitest";

import {
  sortedRefundTiers,
  tierDeadline,
  timeBeforeStart,
} from "~/utils/cancellationRefundTiers.js";

describe("tierDeadline", () => {
  it("reads a deadline that divides by 24 as days, any other as hours", () => {
    expect(tierDeadline(48)).toEqual({ amount: 2, unit: "days" });
    expect(tierDeadline(0)).toEqual({ amount: 0, unit: "days" });
    expect(tierDeadline(12)).toEqual({ amount: 12, unit: "hours" });
    expect(tierDeadline(30)).toEqual({ amount: 30, unit: "hours" });
  });
});

describe("timeBeforeStart", () => {
  it("names hours below one day, days with their hours below three days", () => {
    expect(timeBeforeStart(13)).toEqual({ days: 0, hours: 13 });
    expect(timeBeforeStart(46)).toEqual({ days: 1, hours: 22 });
    expect(timeBeforeStart(48)).toEqual({ days: 2, hours: 0 });
    expect(timeBeforeStart(71)).toEqual({ days: 2, hours: 23 });
  });

  it("drops the hours from three days on", () => {
    expect(timeBeforeStart(72)).toEqual({ days: 3, hours: 0 });
    expect(timeBeforeStart(250)).toEqual({ days: 10, hours: 0 });
  });

  it("answers null where the time is not known", () => {
    expect(timeBeforeStart(undefined)).toBeNull();
    expect(timeBeforeStart(Number.NaN)).toBeNull();
    expect(timeBeforeStart(-1)).toBeNull();
  });
});

describe("sortedRefundTiers", () => {
  it("keeps the tiers in hours, the longest deadline first", () => {
    expect(
      sortedRefundTiers([
        { hoursBeforeStart: 0, refundPercentage: 0 },
        { hoursBeforeStart: 48, refundPercentage: 100 },
        { hoursBeforeStart: 12, refundPercentage: 50 },
        { daysBeforeStart: 3, refundPercentage: 100 },
      ]),
    ).toEqual([
      { hoursBeforeStart: 48, refundPercentage: 100 },
      { hoursBeforeStart: 12, refundPercentage: 50 },
      { hoursBeforeStart: 0, refundPercentage: 0 },
    ]);
    expect(sortedRefundTiers(undefined)).toEqual([]);
  });
});
