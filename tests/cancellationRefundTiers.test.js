import { describe, expect, it } from "vitest";

import {
  sortedRefundTiers,
  tierDeadline,
} from "~/utils/cancellationRefundTiers.js";

describe("tierDeadline", () => {
  it("reads a deadline that divides by 24 as days, any other as hours", () => {
    expect(tierDeadline(48)).toEqual({ amount: 2, unit: "days" });
    expect(tierDeadline(0)).toEqual({ amount: 0, unit: "days" });
    expect(tierDeadline(12)).toEqual({ amount: 12, unit: "hours" });
    expect(tierDeadline(30)).toEqual({ amount: 30, unit: "hours" });
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
