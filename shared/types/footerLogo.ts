import type { HeroMediaReference, LogoSize } from "./hero";

/** The height step of a footer logo: 48, 80 or 120 px, × 0.8 on a phone. */
export type FooterLogoSize = LogoSize;

/**
 * An image of a footer logo: a media reference with the title of the medium,
 * which is the logo's alternative text.
 */
export interface FooterLogoImage extends HeroMediaReference {
  name: string;
}

/**
 * One logo in the footer row, as the Theme View carries it. `link` is empty
 * or an absolute `http(s)` URL; `imageDark` is the variant shown in dark mode
 * instead of the white plate.
 */
export interface FooterLogo {
  image: FooterLogoImage;
  size: FooterLogoSize;
  link: string;
  imageDark: FooterLogoImage | null;
}
