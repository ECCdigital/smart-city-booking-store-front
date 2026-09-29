/**
 * Step of a filter slider: about 20 steps over the range, rounded up to a
 * multiple of 5 once the range reaches 20. `minStep` raises the floor for
 * sliders whose bounds are multiples of 5 already (price, distance), so they
 * never fall back to single units. An empty range yields the floor.
 */
export function computeSliderStep(
  min: number,
  max: number,
  { minStep = 1 }: { minStep?: number } = {},
) {
  const range = max - min;
  if (range <= 0) return minStep;

  let step = Math.ceil(range / 20);
  if (range >= 20 || minStep > 1) {
    step = Math.max(minStep, Math.ceil(step / 5) * 5);
  }
  return step;
}
