/**
 * The framework-free half of `BackgroundLayers.vue`: what a Background object
 * resolves to before the renderer paints it. `useMediaImage` is a composable
 * in name only — it holds no state and touches no Vue — so this stays a pure
 * module.
 */

import { useMediaImage } from "~/composables/utils/useMediaImage";
import type {
  Background,
  HeroMediaReference,
  ImageBackground,
  VariantBackground,
} from "~~/shared/types/hero";

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
 * properties the stylesheet reads.
 *
 * A flat colour sets `--bg-light` and `--bg-dark`, the dark one falling back
 * to the light one as the contract says. An image sets its overlay per mode:
 * the colour, which doubles as the placeholder at full opacity, and the
 * opacity as a fraction for the overlay layer — the dark overlay falling back
 * to the light one. A Variant paints from the palette in the stylesheet and
 * needs nothing inline, so it gets `undefined` rather than an empty object —
 * that keeps an empty `style=""` out of the SSR HTML.
 */
export function backgroundRootStyle(
  background: Background,
): Record<string, string> | undefined {
  if (background.type === "color") {
    return {
      "--bg-light": background.light,
      "--bg-dark": background.dark ?? background.light,
    };
  }

  if (background.type === "image") {
    const light = background.overlay.light;
    const dark = background.overlay.dark ?? light;
    return {
      "--bg-overlay-light": light.color,
      "--bg-overlay-light-opacity": String(light.opacity / 100),
      "--bg-overlay-dark": dark.color,
      "--bg-overlay-dark-opacity": String(dark.opacity / 100),
    };
  }

  return undefined;
}

/**
 * A box a cover image fills: its CSS height, under a media condition when the
 * box is a different height on another viewport. The Hero has a desktop and a
 * mobile height step; the page background is the viewport.
 */
export interface CoverBox {
  media?: string;
  height: string;
}

/**
 * The `sizes` value of a cover image: for each box, the larger of the full
 * viewport width and the box height times the image's aspect ratio — an
 * `object-cover` image in a box taller than the image is tall has to be scaled
 * to the box height, and then needs more pixels than the box is wide. The
 * ratio goes in as the raw dimensions so nothing is rounded.
 *
 * Boxes are listed most specific first, as the browser reads `sizes`. Without
 * both dimensions there is no ratio and no answer — the `banner` context's
 * own `sizes` is the floor then.
 */
export function coverImageSizes(
  boxes: readonly CoverBox[],
  image: Pick<HeroMediaReference, "width" | "height">,
): string | undefined {
  const { width, height } = image;
  if (!width || !height) return undefined;

  return boxes
    .map(({ media, height: boxHeight }) => {
      const size = `max(100vw, calc(${boxHeight} * ${width} / ${height}))`;
      return media ? `${media} ${size}` : size;
    })
    .join(", ");
}

/**
 * The image layer of an image Background: the `<img>` attributes and the
 * values its preload hint repeats. Computed once so the element and the hint
 * carry byte-identical candidate lists and `sizes` — a preload that resolves
 * to a different resource than the element is a second download, not a head
 * start.
 */
export interface ImageLayer {
  src: string;
  srcset?: string;
  sizes?: string;
  /** The medium's own dimensions; absent while the backfill has not measured it. */
  width?: number;
  height?: number;
  /** The focal point as `object-position`. */
  objectPosition: string;
}

/**
 * The image layer of an image Background in the given boxes, or `null` when
 * the reference carries no address — then only the placeholder and the overlay
 * paint.
 */
export function imageLayer(
  background: ImageBackground,
  boxes: readonly CoverBox[],
): ImageLayer | null {
  const { image, focalPoint } = background;
  const source = useMediaImage().imageSource(image, "banner");
  if (!source) return null;

  return {
    src: source.src,
    srcset: source.srcset,
    sizes: coverImageSizes(boxes, image) ?? source.sizes,
    width: image.width,
    height: image.height,
    objectPosition: `${focalPoint.x}% ${focalPoint.y}%`,
  };
}
