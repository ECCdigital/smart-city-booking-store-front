import type { HeroMode } from "~/composables/useHeroMode";
import type { HeroPreviewView } from "~/composables/useThemeBundle";
import {
  HERO_PREVIEW_DRAFT,
  HERO_PREVIEW_PROTOCOL_VERSION,
  type HeroMediaReference,
  type HeroPreviewDraftMessage,
} from "~~/shared/types/hero";
import {
  parseBackground,
  parseHeroLayout,
  type HeroParseIssue,
} from "~~/shared/utils/heroLayout";
import {
  sanitizeHeroLayoutRichtext,
  type HeroRichtextSanitizer,
} from "~~/shared/utils/heroRichtextAllowlist";

/**
 * Which arrangement the Live Preview shows, from its `?mode=` parameter:
 * `home` is the start page under the tall Hero, `compact` a catalog sub-page
 * under the Compact Hero. The start page is what an editor opens first, so it
 * is also what an absent or unknown value shows.
 *
 * The parameter is `mode`, not `view`: `view` already belongs to the catalog
 * search beneath the Hero, which reads it as its list/map switch.
 */
export function previewHeroMode(mode: unknown): HeroMode {
  return mode === "compact" ? "compact" : "home";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * A Draft message that is addressed to this frame — right protocol, right
 * type, a usable `draftId` — but whose content has not been checked yet.
 * Everything the admin fills in stays `unknown` until the builder reads it.
 */
export interface HeroPreviewDraftEnvelope {
  draftId: number;
  heroLayout: unknown;
  background: unknown;
  name: unknown;
  selectedBlockId: unknown;
  colorMode: unknown;
}

/**
 * Reads a Draft message out of whatever arrived through `postMessage`.
 *
 * Only the addressing is checked here: protocol version, message type and
 * the `draftId`. A message of another version or type is simply not for this
 * frame, so the answer is `null` and nothing is logged; without a usable
 * `draftId` there is nothing to answer under, so the same applies. Everything
 * else stays unvalidated on purpose — that is the builder's job, and an
 * invalid Draft still has to be answered with `invalid-draft` under its own
 * `draftId`, or the admin never learns that a snapshot was rejected.
 *
 * @param data - The `data` of a message event, untrusted.
 * @returns The Draft envelope, or `null` when the message is not one.
 */
export function parseHeroPreviewMessage(
  data: unknown,
): HeroPreviewDraftEnvelope | null {
  if (!isRecord(data)) return null;
  if (data.protocol !== HERO_PREVIEW_PROTOCOL_VERSION) return null;
  if (data.type !== HERO_PREVIEW_DRAFT) return null;

  const { draftId } = data;
  if (typeof draftId !== "number" || !Number.isFinite(draftId)) return null;

  return {
    draftId,
    heroLayout: data.heroLayout,
    background: data.background,
    name: data.name,
    selectedBlockId: data.selectedBlockId,
    colorMode: data.colorMode,
  };
}

export interface HeroPreviewBuildOptions {
  /** The browser DOMPurify build, bound to the frozen allowlist. */
  sanitize: HeroRichtextSanitizer;
  /**
   * The logo of the stored Theme View. A Draft does not carry one — the
   * Hero Editor does not edit it — so the view keeps showing the stored one.
   */
  logo: HeroMediaReference | null;
  /** Where the first failing field is reported. */
  onIssue: (issue: HeroParseIssue) => void;
}

/** What a valid Draft asks the frame to show. */
export interface HeroPreviewSnapshot {
  view: HeroPreviewView;
  colorMode: HeroPreviewDraftMessage["colorMode"];
  selectedBlockId: string | null;
}

/**
 * Turns a Draft envelope into what the frame shows: the view the Hero
 * renders in place of the stored Theme View — the same guards the BFF runs
 * on a bundle, then the same rich-text walk, only with the browser's
 * sanitiser — plus the colour mode and the selected Block.
 *
 * A Draft is a whole. The backend's preview endpoint always answers with a
 * Hero Layout and a Background, and the admin fills in the rest itself, so
 * any field failing — or missing — is a broken snapshot, and the answer is
 * `null`: the last valid render stays and the bridge reports `invalid-draft`.
 * That differs from the Theme View, where one broken field costs only
 * itself, because there a `null` field means "fall back", which is not
 * something an editor asked to see.
 *
 * @param draft - A Draft envelope the addressing check accepted.
 * @param options - The sanitiser, the stored logo, and where to report the
 *   first failing field.
 * @returns The snapshot, or `null` when the Draft failed validation.
 */
export function buildHeroPreviewSnapshot(
  draft: HeroPreviewDraftEnvelope,
  options: HeroPreviewBuildOptions,
): HeroPreviewSnapshot | null {
  const { sanitize, logo, onIssue } = options;
  const { name, colorMode, selectedBlockId } = draft;

  if (typeof name !== "string") {
    onIssue({ path: "name", code: "required" });
    return null;
  }
  if (colorMode !== "light" && colorMode !== "dark") {
    onIssue({ path: "colorMode", code: "invalid_enum" });
    return null;
  }
  if (selectedBlockId !== undefined && typeof selectedBlockId !== "string") {
    onIssue({ path: "selectedBlockId", code: "invalid_format" });
    return null;
  }

  const parsed = parseHeroLayout(draft.heroLayout, { onIssue });
  const heroLayout =
    parsed && sanitizeHeroLayoutRichtext(parsed, sanitize, onIssue);
  if (!heroLayout) return null;

  const background = parseBackground(draft.background, { onIssue });
  if (!background) return null;

  return {
    view: { name, heroLayout, background, logo },
    colorMode,
    selectedBlockId: selectedBlockId ?? null,
  };
}
