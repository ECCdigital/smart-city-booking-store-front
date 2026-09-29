import { describe, expect, it } from "vitest";

import { computeSliderStep } from "~/utils/sliderStep";

describe("computeSliderStep", () => {
  it("keeps single units for a small custom field range", () => {
    expect(computeSliderStep(1, 10)).toBe(1);
    expect(computeSliderStep(0, 19)).toBe(1);
  });

  it("rounds to multiples of 5 once the range reaches 20", () => {
    expect(computeSliderStep(0, 20)).toBe(5);
    expect(computeSliderStep(0, 100)).toBe(5);
    expect(computeSliderStep(0, 200)).toBe(10);
    expect(computeSliderStep(100, 380)).toBe(15);
  });

  it("never drops below the floor for price and distance", () => {
    expect(computeSliderStep(0, 10, { minStep: 5 })).toBe(5);
    expect(computeSliderStep(0, 100, { minStep: 5 })).toBe(5);
    expect(computeSliderStep(0, 500, { minStep: 5 })).toBe(25);
  });

  it("answers the floor for an empty range", () => {
    expect(computeSliderStep(5, 5)).toBe(1);
    expect(computeSliderStep(0, 0, { minStep: 5 })).toBe(5);
  });
});
