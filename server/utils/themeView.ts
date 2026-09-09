/**
 * Turns the backend's raw Theme Bundle export into the Theme View the
 * storefront serves at `/api/theme/bundle`.
 *
 * This is where the guards of the Shared contract and the rich-text sanitiser
 * meet: the client is never handed a layout that failed validation, and never
 * handed markup that has not been through the frozen allowlist. Everything the
 * bundle carries beyond the Theme View — backend URLs, colours, visibility —
 * stays on the server.
 *
 * **Server-side only**, because it pulls in the jsdom-backed sanitiser.
 */

import {
  parseBackground,
  parseHeroLayout,
  parseHeroMediaReference,
  type HeroParseIssue,
  type HeroParseOptions,
} from "~~/shared/utils/heroLayout";
import {
  HERO_RICHTEXT_MAX_LENGTH,
  type HeroLayout,
  type ThemeView,
} from "~~/shared/types/hero";
import type { ThemeBundle } from "~~/shared/types/api";
import { sanitizeHeroRichtext } from "./heroRichtext";

/**
 * The etag of the Theme View served when no bundle could ever be read. It is a
 * literal rather than an empty string so the versioned asset URLs stay
 * well-formed; once a real bundle arrives its own etag takes over, and because
 * the etag is part of the URL the browser fetches the new one rather than
 * holding the immutable default.
 */
export const DEFAULT_THEME_ETAG = "default";

/**
 * The Theme View for a storefront that has no bundle: every look-bearing field
 * is `null`, so the renderer applies the Fallback Hero Layout and the default
 * Background.
 */
export function defaultThemeView(): ThemeView {
  return {
    etag: DEFAULT_THEME_ETAG,
    name: "",
    heroLayout: null,
    background: null,
    logo: null,
  };
}

/**
 * Sanitises every rich-text Block in place.
 *
 * The contract caps rich text twice: 50 000 characters raw, which the guard
 * already enforced, and {@link HERO_RICHTEXT_MAX_LENGTH} after sanitising,
 * which only this side of the wire can measure. Over the cap the whole layout
 * is rejected, the same verdict the backend reaches on save, so the Fallback
 * Hero Layout takes over instead of a Hero built around one runaway Block.
 *
 * @returns The layout, or `null` when a sanitised value is over the cap.
 */
function sanitizeLayout(
  layout: HeroLayout,
  report: (issue: HeroParseIssue) => void,
): HeroLayout | null {
  for (const [index, block] of layout.blocks.entries()) {
    if (block.type !== "richtext") continue;

    for (const locale of ["de", "en"] as const) {
      const html = block.html[locale];
      if (html === undefined) continue;

      const sanitised = sanitizeHeroRichtext(html);
      if (sanitised.length > HERO_RICHTEXT_MAX_LENGTH) {
        report({
          path: `heroLayout.blocks[${index}].html.${locale}`,
          code: "max_length",
        });
        return null;
      }
      block.html[locale] = sanitised;
    }
  }

  return layout;
}

/**
 * Builds the Theme View of one bundle.
 *
 * A field that fails its guard becomes `null` on its own: a broken Background
 * does not cost the Portal Name, and a broken layout does not cost the logo.
 *
 * @param bundle - The backend's export, untrusted.
 * @param etag - The bundle's strong etag, passed through to the client.
 * @param options - Where to report the first failing field of each guard.
 */
export function buildThemeView(
  bundle: ThemeBundle,
  etag: string,
  options: HeroParseOptions = {},
): ThemeView {
  const report = options.onIssue;
  const layout = parseHeroLayout(bundle.heroLayout, options);

  return {
    etag,
    name: typeof bundle.name === "string" ? bundle.name : "",
    heroLayout: layout
      ? sanitizeLayout(layout, report ?? (() => {}))
      : null,
    background: parseBackground(bundle.background, options),
    logo:
      bundle.logo === undefined || bundle.logo === null
        ? null
        : parseHeroMediaReference(bundle.logo, options),
  };
}
