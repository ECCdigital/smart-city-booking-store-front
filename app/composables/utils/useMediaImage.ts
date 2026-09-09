/**
 * The single place that turns a media reference into `<img>` attributes.
 *
 * Every image the storefront shows stays same-origin: it is fetched through
 * the `/api/img` proxy, never from the backend or a foreign host directly.
 * The proxy itself is dumb — it has no image logic. The size decision is made
 * here, by asking the backend for one of its generated presets, and the
 * browser picks from that list against the rendered width.
 */
import { isMediaFileUrl } from "~~/shared/utils/mediaUrl";

/**
 * The presets the backend's media library actually generates, smallest first.
 *
 * `thumb` is a 160x160 centre crop; `sm`, `md` and `lg` keep the original
 * aspect ratio. That is why `thumb` never shares a `srcset` with the other
 * three — a browser stepping between them would change the crop, not just the
 * resolution.
 */
const PRESET_WIDTHS = {
  thumb: 160,
  sm: 480,
  md: 800,
  lg: 1600,
} as const;

export type ImagePreset = keyof typeof PRESET_WIDTHS;

/**
 * What a display context asks for: which presets may be offered, which one the
 * `src` fallback uses, and how wide the image will actually be rendered.
 *
 * The `sizes` values describe the *resource* width, not the CSS box: an image
 * laid out with `object-cover` in a box taller than it is wide needs far more
 * pixels than the box is wide.
 */
const IMAGE_CONTEXTS = {
  /** Detail page hero — left column of the detail grid, full width on phones. */
  hero: {
    presets: ["sm", "md", "lg"],
    fallback: "lg",
    sizes: "(min-width: 768px) min(60vw, 840px), 92vw",
  },
  /** Checkout sidebar image — `w-[80vw] md:w-[45vw]`, capped at 800px. */
  panel: {
    presets: ["sm", "md", "lg"],
    fallback: "md",
    sizes: "(min-width: 768px) min(45vw, 800px), 80vw",
  },
  /** Result card — the phone list, and the three-column event row on desktop. */
  card: {
    presets: ["sm", "md", "lg"],
    fallback: "md",
    sizes: "(min-width: 768px) 460px, 92vw",
  },
  /** Result strip — the desktop list; a narrow but tall `object-cover` box. */
  strip: {
    presets: ["sm", "md", "lg"],
    fallback: "md",
    sizes: "(min-width: 768px) 320px, 96px",
  },
  /** Detail page gallery thumbnail. */
  thumbnail: {
    presets: ["thumb"],
    fallback: "thumb",
    sizes: "80px",
  },
  /**
   * The image Background behind the Hero and the auth pages — a full-bleed
   * `object-cover` box. `100vw` is the floor for an unmeasured medium: with
   * dimensions, `coverImageSizes` replaces it with the larger of the viewport
   * width and the box height times the aspect ratio, because a box taller
   * than the image is tall needs more pixels than it is wide.
   */
  banner: {
    presets: ["sm", "md", "lg"],
    fallback: "lg",
    sizes: "100vw",
  },
  /** Checkout add-on icon — a 32px square. */
  mini: {
    presets: ["thumb"],
    fallback: "thumb",
    sizes: "32px",
  },
} as const satisfies Record<
  string,
  { presets: readonly ImagePreset[]; fallback: ImagePreset; sizes: string }
>;

export type ImageContext = keyof typeof IMAGE_CONTEXTS;

/**
 * A reference site as the backend exports it: either a reference object from
 * an entity's image list, or one of the derived plain-URL fields (`imgUrl`,
 * `teaserImage`) that already resolve a reference to its address. Only the
 * resolved address is read — the reference carries more, but nothing here
 * needs it.
 */
export type MediaReferenceLike =
  | string
  | { url?: string | null }
  | null
  | undefined;

export interface ImageSource {
  src: string;
  srcset?: string;
  sizes?: string;
}

/** As much of a bookable or an event as the cover image lookup needs. */
export interface ImageBearingItem {
  imgUrl?: string | null;
  images?: MediaReferenceLike[];
  information?: { teaserImage?: MediaReferenceLike } | null;
}

/**
 * The address a reference site resolves to.
 */
function referenceUrl(value: MediaReferenceLike): string | null {
  if (!value) return null;
  if (typeof value === "string") return value || null;
  if (typeof value === "object") return value.url || null;
  return null;
}

/**
 * Everything goes through the storefront proxy, so the page stays same-origin
 * and its `img-src` policy stays `'self'`.
 */
function proxied(url: string): string {
  return `/api/img?url=${encodeURIComponent(url)}`;
}

function withPreset(url: string, preset: ImagePreset): string {
  return `${url}${url.includes("?") ? "&" : "?"}size=${preset}`;
}

export function useMediaImage() {
  /**
   * The cover image of a bookable or an event.
   *
   * The two carry it in different places — a bookable exports the address of
   * its first image as `imgUrl`, an event has a single `teaserImage` — and
   * every list and card in the storefront has to ask the same question, so it
   * is answered once here rather than at each call site.
   */
  function coverImageOf(
    item: ImageBearingItem | null | undefined,
    isEvent = false,
  ): MediaReferenceLike {
    return isEvent ? item?.information?.teaserImage : item?.imgUrl;
  }

  /**
   * The `<img>` attributes for a reference site in a given display context.
   *
   * Media references get the preset ladder of the context; external references
   * get a plain proxied `src`, because nothing on a foreign host resizes for
   * us. Returns `null` when the site is empty, so callers can fall back to
   * their placeholder.
   */
  function imageSource(
    value: MediaReferenceLike,
    context: ImageContext,
  ): ImageSource | null {
    const url = referenceUrl(value);
    if (!url) return null;

    if (!isMediaFileUrl(url)) {
      return { src: proxied(url) };
    }

    const { presets, fallback, sizes } = IMAGE_CONTEXTS[context];

    return {
      src: proxied(withPreset(url, fallback)),
      srcset: presets
        .map(
          (preset) =>
            `${proxied(withPreset(url, preset))} ${PRESET_WIDTHS[preset]}w`,
        )
        .join(", "),
      sizes,
    };
  }

  return { coverImageOf, imageSource };
}
