/**
 * The guards that stand between untrusted JSON and the Hero renderer.
 *
 * `parseHeroLayout` and `parseBackground` answer with a complete, normalised
 * value or with `null` — never with a half-valid object and never by throwing.
 * A `null` means the caller falls back: the BFF route serves the Fallback Hero
 * Layout, the Live Preview keeps the last valid Draft.
 *
 * They are hand-written on purpose. The contract is small and frozen at schema
 * v1, and the storefront ships this code to the browser for the Live Preview,
 * so a validation library would be a dependency in the client bundle for one
 * fixed shape. Cross-reference for the rules:
 * `.scratch/hero-layout/spec.md`, section "Shared contract (schema v1)".
 *
 * Unknown keys are ignored rather than rejected. Rejecting them is the
 * backend's job on save; here the input is the backend's own export, and
 * tolerating a key a newer backend added keeps the storefront from blanking
 * the Hero over a field it does not need.
 */

import {
  BACKGROUND_INTENSITIES,
  BACKGROUND_TYPES,
  BACKGROUND_VARIANTS,
  HERO_BLOCK_ID_PATTERN,
  HERO_BLOCK_PANELS,
  HERO_BLOCK_TYPES,
  HERO_BLOCK_WIDTHS,
  HERO_COLOR_TOKENS,
  HERO_HEIGHTS,
  HERO_IMAGE_MAX_HEIGHTS,
  HERO_LAYOUT_MAX_BLOCKS,
  HERO_RICHTEXT_RAW_MAX_LENGTH,
  HERO_SPACINGS,
  HERO_TEXT_MAX_LENGTH,
  HERO_TEXT_SIZES,
  HERO_TEXT_WEIGHTS,
  HERO_ZONES,
  HEX_COLOR_PATTERN,
  type Background,
  type BackgroundFocalPoint,
  type BackgroundOverlay,
  type HeroBlock,
  type HeroColor,
  type HeroColorToken,
  type HeroLayout,
  type HeroMediaReference,
  type HexColor,
  type LocalizedString,
} from "../types/hero";

/**
 * The error codes of the backend's `ValidationError` contract, reused here so
 * a rejected export is described in the same words on both sides of the wire.
 * `unknown_field` is absent by design — see the note on unknown keys above.
 */
export type HeroParseIssueCode =
  | "required"
  | "invalid_enum"
  | "invalid_format"
  | "duplicate_id"
  | "max_items"
  | "max_length"
  | "invalid_custom";

/** `path` is a JSON path into the parsed value, `heroLayout.blocks[2].zone`. */
export interface HeroParseIssue {
  path: string;
  code: HeroParseIssueCode;
}

export interface HeroParseOptions {
  /**
   * What to do with the first failing field. Defaults to a console warning,
   * which is what the Live Preview wants; server callers pass the Pino logger.
   */
  onIssue?: (issue: HeroParseIssue) => void;
}

/** Internal control flow: thrown at the first failure, caught at the top. */
class HeroParseFailure extends Error {
  constructor(readonly issue: HeroParseIssue) {
    super(`${issue.path}: ${issue.code}`);
    this.name = "HeroParseFailure";
  }
}

function fail(path: string, code: HeroParseIssueCode): never {
  throw new HeroParseFailure({ path, code });
}

function defaultReporter(issue: HeroParseIssue): void {
  console.warn(`[hero] rejected ${issue.path}: ${issue.code}`);
}

/**
 * Runs a reader and turns its first failure into `null` plus one report.
 * Anything that is not a validation failure is a bug in this module and is
 * rethrown rather than swallowed as "invalid input".
 */
function guard<T>(
  read: (path: string) => T,
  path: string,
  options: HeroParseOptions,
): T | null {
  try {
    return read(path);
  } catch (error) {
    if (!(error instanceof HeroParseFailure)) throw error;
    (options.onIssue ?? defaultReporter)(error.issue);
    return null;
  }
}

/** JSON has two ways of saying "not set", and the contract treats them alike. */
function isPresent(value: unknown): boolean {
  return value !== undefined && value !== null;
}

function readObject(value: unknown, path: string): Record<string, unknown> {
  if (!isPresent(value)) fail(path, "required");
  if (typeof value !== "object" || Array.isArray(value)) {
    fail(path, "invalid_format");
  }
  return value as Record<string, unknown>;
}

/** Schema version: the one literal both repositories agree on. */
function readVersion(value: unknown, path: string): 1 {
  if (value === undefined) fail(path, "required");
  if (value !== 1) fail(path, "invalid_enum");
  return 1;
}

function readEnum<T extends string>(
  value: unknown,
  path: string,
  allowed: readonly T[],
  fallback?: T,
): T {
  if (!isPresent(value)) {
    if (fallback !== undefined) return fallback;
    fail(path, "required");
  }
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    fail(path, "invalid_enum");
  }
  return value as T;
}

function readBoolean(value: unknown, path: string, fallback: boolean): boolean {
  if (!isPresent(value)) return fallback;
  if (typeof value !== "boolean") fail(path, "invalid_format");
  return value;
}

function readString(value: unknown, path: string): string {
  if (!isPresent(value)) fail(path, "required");
  if (typeof value !== "string") fail(path, "invalid_format");
  return value;
}

/**
 * A localised string. `de` carries the content; an empty `en` counts as absent
 * and is dropped, so consumers may read `en ?? de` without a second check.
 */
function readLocalizedString(
  value: unknown,
  path: string,
  maxLength: number,
): LocalizedString {
  const source = readObject(value, path);
  const de = readString(source.de, `${path}.de`);
  if (de.trim() === "") fail(`${path}.de`, "required");
  if (de.length > maxLength) fail(`${path}.de`, "max_length");

  const localized: LocalizedString = { de };

  if (isPresent(source.en)) {
    const en = readString(source.en, `${path}.en`);
    if (en.length > maxLength) fail(`${path}.en`, "max_length");
    if (en !== "") localized.en = en;
  }

  return localized;
}

function readHexColor(
  value: unknown,
  path: string,
  fallback?: HexColor,
): HexColor {
  if (!isPresent(value)) {
    if (fallback !== undefined) return fallback;
    fail(path, "required");
  }
  const color = readString(value, path);
  if (!HEX_COLOR_PATTERN.test(color)) fail(path, "invalid_format");
  return color as HexColor;
}

/** A text colour: one of the named tokens, or `#rrggbb`. */
function readHeroColor(value: unknown, path: string): HeroColor {
  if (!isPresent(value)) return "default";
  const color = readString(value, path);
  if ((HERO_COLOR_TOKENS as readonly string[]).includes(color)) {
    return color as HeroColorToken;
  }
  if (!HEX_COLOR_PATTERN.test(color)) fail(path, "invalid_format");
  return color as HexColor;
}

/**
 * A whole percentage. Used for focal points and overlay opacities, which are
 * both 0–100 and both meaningless as fractions.
 */
function readPercentage(
  value: unknown,
  path: string,
  fallback: number,
): number {
  if (!isPresent(value)) return fallback;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    fail(path, "invalid_format");
  }
  if (value < 0 || value > 100) fail(path, "invalid_format");
  return value;
}

/**
 * A reference into the Media Library. `source: "external"` is in the contract
 * only so it can be named as rejected. `url`, `width` and `height` are derived
 * on export: they are kept when present, and `null` dimensions mean the medium
 * has not been measured yet, which the renderer handles by reserving height
 * only.
 */
function readMediaReference(
  value: unknown,
  path: string,
): HeroMediaReference {
  const source = readObject(value, path);
  if (source.source !== "media") fail(`${path}.source`, "invalid_custom");

  const mediaId = readString(source.mediaId, `${path}.mediaId`);
  if (mediaId.trim() === "") fail(`${path}.mediaId`, "required");

  const reference: HeroMediaReference = { source: "media", mediaId };

  if (isPresent(source.url)) {
    reference.url = readString(source.url, `${path}.url`);
  }
  for (const key of ["width", "height"] as const) {
    const dimension = source[key];
    if (typeof dimension !== "number" || !Number.isInteger(dimension)) continue;
    if (dimension <= 0) continue;
    reference[key] = dimension;
  }

  return reference;
}

function readBlock(value: unknown, path: string): HeroBlock {
  const source = readObject(value, path);

  const id = readString(source.id, `${path}.id`);
  if (!HERO_BLOCK_ID_PATTERN.test(id)) fail(`${path}.id`, "invalid_format");

  const common = {
    id,
    zone: readEnum(source.zone, `${path}.zone`, HERO_ZONES),
    outerSpacing: readEnum(
      source.outerSpacing,
      `${path}.outerSpacing`,
      HERO_SPACINGS,
      "none",
    ),
    innerSpacing: readEnum(
      source.innerSpacing,
      `${path}.innerSpacing`,
      HERO_SPACINGS,
      "none",
    ),
    width: readEnum(source.width, `${path}.width`, HERO_BLOCK_WIDTHS, "auto"),
    panel: readEnum(source.panel, `${path}.panel`, HERO_BLOCK_PANELS, "none"),
    homeOnly: readBoolean(source.homeOnly, `${path}.homeOnly`, false),
    hideOnMobile: readBoolean(source.hideOnMobile, `${path}.hideOnMobile`, false),
  };

  const type = readEnum(source.type, `${path}.type`, HERO_BLOCK_TYPES);

  switch (type) {
    case "text":
      return {
        ...common,
        type,
        text: readLocalizedString(
          source.text,
          `${path}.text`,
          HERO_TEXT_MAX_LENGTH,
        ),
        size: readEnum(source.size, `${path}.size`, HERO_TEXT_SIZES, "md"),
        color: readHeroColor(source.color, `${path}.color`),
        weight: readEnum(
          source.weight,
          `${path}.weight`,
          HERO_TEXT_WEIGHTS,
          "normal",
        ),
        shadow: readBoolean(source.shadow, `${path}.shadow`, false),
      };
    case "richtext":
      return {
        ...common,
        type,
        html: readLocalizedString(
          source.html,
          `${path}.html`,
          HERO_RICHTEXT_RAW_MAX_LENGTH,
        ),
        color: readHeroColor(source.color, `${path}.color`),
        shadow: readBoolean(source.shadow, `${path}.shadow`, false),
      };
    case "image":
      return {
        ...common,
        type,
        image: readMediaReference(source.image, `${path}.image`),
        alt: readLocalizedString(
          source.alt,
          `${path}.alt`,
          HERO_TEXT_MAX_LENGTH,
        ),
        maxHeight: readEnum(
          source.maxHeight,
          `${path}.maxHeight`,
          HERO_IMAGE_MAX_HEIGHTS,
          "md",
        ),
        invertInDarkMode: readBoolean(
          source.invertInDarkMode,
          `${path}.invertInDarkMode`,
          false,
        ),
      };
  }
}

function readHeroLayout(value: unknown, path: string): HeroLayout {
  const source = readObject(value, path);
  const version = readVersion(source.version, `${path}.version`);

  if (!Array.isArray(source.blocks)) {
    fail(`${path}.blocks`, source.blocks === undefined ? "required" : "invalid_format");
  }
  if (source.blocks.length > HERO_LAYOUT_MAX_BLOCKS) {
    fail(`${path}.blocks`, "max_items");
  }

  const blocks: HeroBlock[] = [];
  const seen = new Set<string>();

  source.blocks.forEach((entry, index) => {
    const block = readBlock(entry, `${path}.blocks[${index}]`);
    if (seen.has(block.id)) {
      fail(`${path}.blocks[${index}].id`, "duplicate_id");
    }
    seen.add(block.id);
    blocks.push(block);
  });

  return {
    version,
    height: readEnum(source.height, `${path}.height`, HERO_HEIGHTS, "lg"),
    mobileHeight: readEnum(
      source.mobileHeight,
      `${path}.mobileHeight`,
      HERO_HEIGHTS,
      "lg",
    ),
    compactHeight: readEnum(
      source.compactHeight,
      `${path}.compactHeight`,
      HERO_HEIGHTS,
      "sm",
    ),
    blocks,
  };
}

/**
 * One overlay layer. `fallback` is what an unset field falls back to: the
 * contract's own default for `overlay.light`, and the parsed `overlay.light`
 * for `overlay.dark`, because the contract says `dark` falls back to `light` —
 * a half-specified dark overlay inherits the light one's colour, not black.
 */
function readOverlay(
  value: unknown,
  path: string,
  fallback: BackgroundOverlay,
): BackgroundOverlay {
  const source = readObject(value, path);
  return {
    color: readHexColor(source.color, `${path}.color`, fallback.color),
    opacity: readPercentage(source.opacity, `${path}.opacity`, fallback.opacity),
  };
}

/** The contract's default overlay, and so the fallback for `overlay.light`. */
const DEFAULT_OVERLAY: BackgroundOverlay = { color: "#000000", opacity: 40 };

function readFocalPoint(value: unknown, path: string): BackgroundFocalPoint {
  if (!isPresent(value)) return { x: 50, y: 50 };
  const source = readObject(value, path);
  return {
    x: readPercentage(source.x, `${path}.x`, 50),
    y: readPercentage(source.y, `${path}.y`, 50),
  };
}

function readBackground(value: unknown, path: string): Background {
  const source = readObject(value, path);
  const version = readVersion(source.version, `${path}.version`);
  const type = readEnum(source.type, `${path}.type`, BACKGROUND_TYPES);

  switch (type) {
    case "variant":
      return {
        version,
        type,
        variant: readEnum(
          source.variant,
          `${path}.variant`,
          BACKGROUND_VARIANTS,
        ),
        orbs: readBoolean(source.orbs, `${path}.orbs`, true),
        noise: readBoolean(source.noise, `${path}.noise`, true),
        intensity: readEnum(
          source.intensity,
          `${path}.intensity`,
          BACKGROUND_INTENSITIES,
          "normal",
        ),
      };
    case "color": {
      // `dark` stays absent when it is absent: the renderer falls back to
      // `light`, and copying the value here would hide from it — and from the
      // Live Preview — that no dark colour was ever configured.
      const background: Background = {
        version,
        type,
        light: readHexColor(source.light, `${path}.light`),
      };
      if (isPresent(source.dark)) {
        background.dark = readHexColor(source.dark, `${path}.dark`);
      }
      return background;
    }
    case "image": {
      const overlaySource = readObject(
        source.overlay ?? {},
        `${path}.overlay`,
      );
      const light = readOverlay(
        overlaySource.light ?? {},
        `${path}.overlay.light`,
        DEFAULT_OVERLAY,
      );
      const background: Background = {
        version,
        type,
        image: readMediaReference(source.image, `${path}.image`),
        focalPoint: readFocalPoint(source.focalPoint, `${path}.focalPoint`),
        overlay: { light },
      };
      if (isPresent(overlaySource.dark)) {
        background.overlay.dark = readOverlay(
          overlaySource.dark,
          `${path}.overlay.dark`,
          light,
        );
      }
      return background;
    }
  }
}

/**
 * Reads a Hero Layout as the backend exports it.
 *
 * @param input - Untrusted JSON: a Theme Bundle export or a Live Preview Draft.
 * @param options - Where the value sits in the payload, and where to report.
 * @returns The normalised layout with every default filled, or `null`.
 */
export function parseHeroLayout(
  input: unknown,
  options: HeroParseOptions = {},
): HeroLayout | null {
  return guard((path) => readHeroLayout(input, path), "heroLayout", options);
}

/**
 * Reads the enriched media reference the Theme Bundle exports for the logo.
 *
 * The Blocks carry their own references through {@link parseHeroLayout}; this
 * is the one reference that stands on its own in the Theme View.
 *
 * @param input - Untrusted JSON: the `logo` of a Theme Bundle export.
 * @param options - Where to report the first failing field.
 * @returns The reference, or `null`.
 */
export function parseHeroMediaReference(
  input: unknown,
  options: HeroParseOptions = {},
): HeroMediaReference | null {
  return guard((path) => readMediaReference(input, path), "logo", options);
}

/**
 * Reads a Background as the backend exports it.
 *
 * @param input - Untrusted JSON: a Theme Bundle export or a Live Preview Draft.
 * @param options - Where the value sits in the payload, and where to report.
 * @returns The normalised Background with every default filled, or `null`.
 */
export function parseBackground(
  input: unknown,
  options: HeroParseOptions = {},
): Background | null {
  return guard((path) => readBackground(input, path), "background", options);
}
