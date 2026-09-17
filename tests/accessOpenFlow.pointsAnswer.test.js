import { describe, expect, it } from "vitest";

import { readAccessPointsAnswer } from "~/utils/accessOpenFlow.js";

const POINT = { id: "ap-1", validationRuleTypes: [], capabilities: ["open"] };
const ELIGIBILITY = {
  blockingReasons: [],
  primaryBlockingReason: null,
  operableAccessPointIds: ["ap-1"],
  remoteOperableAccessPointIds: ["ap-1"],
  overriddenAccessPointIds: [],
  accessWindow: { from: 1, to: 2 },
};

describe("readAccessPointsAnswer", () => {
  it("reads the points and the decision from the backend body", () => {
    expect(
      readAccessPointsAnswer({
        success: true,
        data: [POINT],
        accessEligibility: ELIGIBILITY,
      }),
    ).toEqual({ points: [POINT], accessEligibility: ELIGIBILITY });
  });

  it("reads a bare list as an unreadable body - the 4.3 envelope is required", () => {
    expect(readAccessPointsAnswer([POINT])).toEqual({
      points: [],
      accessEligibility: null,
    });
  });

  it("names no decision where the body carries none", () => {
    expect(readAccessPointsAnswer({ success: true, data: [POINT] })).toEqual({
      points: [POINT],
      accessEligibility: null,
    });
  });

  it("reads an unreadable body as no points and no decision", () => {
    expect(readAccessPointsAnswer(null)).toEqual({
      points: [],
      accessEligibility: null,
    });
    expect(readAccessPointsAnswer({ data: "nope" })).toEqual({
      points: [],
      accessEligibility: null,
    });
    expect(
      readAccessPointsAnswer({ data: [POINT], accessEligibility: "nope" }),
    ).toEqual({ points: [POINT], accessEligibility: null });
  });
});
