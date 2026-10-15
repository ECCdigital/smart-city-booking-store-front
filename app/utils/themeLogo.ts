import { imageClasses, imageStyle } from "~/components/hero/heroClasses";
import { useMediaImage } from "~/composables/utils/useMediaImage";
import type {
  HeroImageAddress,
  HeroImageBlock,
  HeroImageMaxHeight,
} from "~~/shared/types/hero";

/** An image from the Theme View: its address, and its dimensions when measured. */
type ThemeImage = Partial<HeroImageAddress>;

/** What `ThemeLogo` is given. */
export interface ThemeLogoOptions {
  /** An image from the Theme View, with its dimensions when measured. */
  image: ThemeImage;
  /** The variant the dark mode shows in place of `image`, if there is one. */
  imageDark?: ThemeImage | null;
  /** The height step of the contract's image scale. */
  maxHeight: HeroImageMaxHeight;
  /** Whether a logo without a variant is inverted in the dark mode. */
  invertInDarkMode: boolean;
  /** Whether this is the image the page fetches first. */
  priority?: boolean;
}

/** The attributes of one `<img>` of the logo, apart from those every one shares. */
export interface ThemeLogoImage {
  src: string;
  srcset?: string;
  sizes?: string;
  width?: number;
  height?: number;
  style?: Record<string, string>;
  fetchpriority?: "high";
  class: string[];
}

/** Shown in the light mode only, when a variant takes over in the dark. */
const LIGHT_ONLY = ["dark:hidden"];
/** The variant: shown in the dark mode only. */
const DARK_ONLY = ["hidden", "dark:block"];

/** One image of a logo and the classes that show it in its colour mode only. */
export interface ThemeImageInMode<T extends ThemeImage = ThemeImage> {
  image: T;
  /** Empty for a logo without a variant: it shows in both modes. */
  modeClasses: string[];
}

/**
 * A logo by colour mode: the logo alone, or the logo for the light mode and
 * its variant for the dark one. Only a variant with an address counts. The
 * class `.dark` on `<html>` picks one image, see {@link themeLogoImages}; the
 * footer logos follow the same rule.
 */
export function imagesByColourMode<T extends ThemeImage>(
  image: T,
  imageDark: T | null | undefined,
): ThemeImageInMode<T>[] {
  if (!imageDark?.url) return [{ image, modeClasses: [] }];
  return [
    { image, modeClasses: LIGHT_ONLY },
    { image: imageDark, modeClasses: DARK_ONLY },
  ];
}

/**
 * The images `ThemeLogo` renders: none without an address, one for a logo
 * alone, two for a logo with a variant for the dark mode.
 *
 * With a variant both images go into the server-rendered HTML and the class
 * `.dark` on `<html>` shows one of them. The colour mode module sets the class
 * before the first paint, also in the mode "System", so the right logo is
 * there at once and on every toggle, without a reload. The server cannot
 * choose: it does not know the mode "System" resolves to, and a `<picture>`
 * with `prefers-color-scheme` follows the system rather than the toggle.
 * Each image reserves its own box from its own dimensions, so a variant of
 * another aspect ratio does not jump. Neither is inverted.
 *
 * Every value is an attribute: an inline style only when measured, the fetch
 * priority only when high, the dimensions only when known — the server
 * renderer writes an empty attribute for a bound `undefined`.
 */
export function themeLogoImages(options: ThemeLogoOptions): ThemeLogoImage[] {
  const { imageSource } = useMediaImage();
  const inModes = imagesByColourMode(options.image, options.imageDark);
  // Only a logo without a variant may be inverted.
  const invertInDarkMode = inModes.length === 1 && options.invertInDarkMode;

  const [logo, variant] = inModes.map(
    ({ image, modeClasses }): ThemeLogoImage | null => {
      const source = imageSource(image, "logo");
      if (!source) return null;

      const imageOptions = { image, maxHeight: options.maxHeight, invertInDarkMode };
      const style = imageStyle(imageOptions);
      return {
        ...source,
        ...(image.width ? { width: image.width } : {}),
        ...(image.height ? { height: image.height } : {}),
        ...(style ? { style } : {}),
        ...(options.priority ? { fetchpriority: "high" as const } : {}),
        class: [...imageClasses(imageOptions), ...modeClasses],
      };
    },
  );

  if (!logo) return [];
  return variant ? [logo, variant] : [logo];
}

/**
 * What an image Block of the Hero hands `ThemeLogo`. A Block that follows the
 * app logo takes the app logo's rule, as the auth pages do: its variant in
 * the dark mode, or the logo inverted without one. A Block with a medium of
 * its own inverts as its switch says — also one holding a copy of the app
 * logo's medium, which is shown as stored, not swapped for the app logo.
 */
export function imageBlockLogo(
  block: HeroImageBlock,
): Pick<ThemeLogoOptions, "image" | "imageDark" | "invertInDarkMode"> {
  if (block.image.source === "app-logo") {
    return {
      image: block.image,
      imageDark: block.image.dark ?? null,
      invertInDarkMode: true,
    };
  }
  return {
    image: block.image,
    imageDark: null,
    invertInDarkMode: "invertInDarkMode" in block && block.invertInDarkMode,
  };
}
