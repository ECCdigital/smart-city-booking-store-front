/**
 * Reads the footer logos of a Theme Bundle export into the Theme View.
 *
 * The backend validates on save; this is the storefront's own guard, because
 * the link ends up in an `href` and the images in `src`. A logo whose image
 * fails is dropped on its own, so one broken medium does not cost the row.
 */

import {
  parseHeroMediaReference,
  type HeroParseIssue,
  type HeroParseOptions,
} from "~~/shared/utils/heroLayout";
import {
  FOOTER_LOGO_SIZES,
  type FooterLogo,
  type FooterLogoImage,
  type FooterLogoSize,
} from "~~/shared/types/footerLogo";

const PATH = "footerLogos";

/**
 * One image of a footer logo, with the medium's title as its alternative
 * text. The reference guard names its path `logo`; the issue is renamed to
 * the image's place in the list.
 */
function readImage(
  value: unknown,
  path: string,
  report: (issue: HeroParseIssue) => void,
): FooterLogoImage | null {
  const reference = parseHeroMediaReference(value, {
    onIssue: (issue) =>
      report({ ...issue, path: issue.path.replace(/^logo/, path) }),
  });
  if (!reference) return null;
  // The guard lets an unaddressed reference through, the export always has
  // one; without it there is nothing to show.
  if (!reference.url) {
    report({ path: `${path}.url`, code: "required" });
    return null;
  }

  const name = (value as { name?: unknown }).name;
  return { ...reference, name: typeof name === "string" ? name : "" };
}

/** An off-list size reads as M, the backend's default. */
function readSize(value: unknown): FooterLogoSize {
  return (FOOTER_LOGO_SIZES as readonly unknown[]).includes(value)
    ? (value as FooterLogoSize)
    : "md";
}

/** Only an absolute `http(s)` URL becomes a link; anything else none. */
function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function readLink(
  value: unknown,
  path: string,
  report: (issue: HeroParseIssue) => void,
): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "string" && isHttpUrl(value)) return value;
  report({ path, code: "invalid_format" });
  return "";
}

/**
 * The footer logos of one bundle, in their order.
 *
 * @param input - Untrusted JSON: the `footerLogos` of a Theme Bundle export.
 *   A backend before the setting sends none, which reads as no row.
 * @param options - Where to report a rejected logo, link or variant.
 */
export function parseFooterLogos(
  input: unknown,
  options: HeroParseOptions = {},
): FooterLogo[] {
  const report = options.onIssue ?? (() => {});
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) {
    report({ path: PATH, code: "invalid_format" });
    return [];
  }

  const logos: FooterLogo[] = [];
  input.forEach((raw, index) => {
    const path = `${PATH}[${index}]`;
    const logo = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

    const image = readImage(logo.image, `${path}.image`, report);
    if (!image) return;

    logos.push({
      image,
      size: readSize(logo.size),
      link: readLink(logo.link, `${path}.link`, report),
      imageDark:
        logo.imageDark === undefined || logo.imageDark === null
          ? null
          : readImage(logo.imageDark, `${path}.imageDark`, report),
    });
  });
  return logos;
}
