/**
 * The framework-free half of `BackgroundLayers.vue`: what a Background object
 * resolves to before the renderer paints it.
 */

import type { Background, VariantBackground } from "~~/shared/types/hero";

/**
 * The Background painted when the Theme View carries none: the contract's
 * first example, today's `poly` look. Never stored — the backend derives the
 * same object when an Instance has no Background.
 */
export const DEFAULT_BACKGROUND: VariantBackground = {
  version: 1,
  type: "variant",
  variant: "poly",
  orbs: true,
  noise: true,
  intensity: "normal",
};

/**
 * The Background to paint: the stored one, or the default when the Theme View
 * has none because no bundle could be read or the stored one failed its guard.
 */
export function resolveBackground(
  background: Background | null | undefined,
): Background {
  return background ?? DEFAULT_BACKGROUND;
}

/**
 * The runtime values the renderer sets inline on its root, as custom
 * properties the stylesheet reads. A flat colour is the only family with any
 * so far: `--bg-light` and `--bg-dark`, the dark one falling back to the light
 * one as the contract says. A Variant paints from the palette in the
 * stylesheet and needs nothing inline, so it gets `undefined` rather than an
 * empty object — that keeps an empty `style=""` out of the SSR HTML.
 */
export function backgroundRootStyle(
  background: Background,
): Record<string, string> | undefined {
  if (background.type !== "color") return undefined;

  return {
    "--bg-light": background.light,
    "--bg-dark": background.dark ?? background.light,
  };
}
