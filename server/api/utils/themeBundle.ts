import { createHash } from "node:crypto";
import type { H3Event } from "h3";
import { logger } from "./logger.js";
import {
  createThemeBundleStore,
  type ThemeBundleEntry,
  type ThemeBundleFetchResult,
  type ThemeBundleStore,
} from "~~/server/utils/themeBundleStore";
import { buildThemeView, defaultThemeView } from "~~/server/utils/themeView";
import type { ThemeBundle } from "~~/shared/types/api";
import type { ThemeView } from "~~/shared/types/hero";

const CONTEXT_KEY = "themeBundle" as const;

const DEFAULT_REVALIDATE_SECONDS = 5;
const DEFAULT_TIMEOUT_MS = 2000;

function numberFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

/**
 * How long a stored bundle may go unchecked. Disabling the server cache is how
 * local development asks for the backend's current answer on every request, so
 * it forces the interval to zero.
 */
function revalidateSeconds(): number {
  if (process.env.NUXT_CACHE_ENABLED === "false") return 0;
  return numberFromEnv(
    "NUXT_THEME_REVALIDATE_SECONDS",
    DEFAULT_REVALIDATE_SECONDS,
  );
}

/**
 * One conditional GET against the backend's Theme Bundle export.
 *
 * The bundle is the same for every visitor, so the request is deliberately
 * anonymous: it carries no access token, which is what allows one stored copy
 * per process to serve everyone.
 */
async function fetchThemeBundle({
  slug,
  etag,
  signal,
}: {
  slug: string | null;
  etag: string | null;
  signal: AbortSignal;
}): Promise<ThemeBundleFetchResult> {
  const { apiBaseUrl } = useRuntimeConfig();
  const path = slug ? `/api/catalog/themes/${slug}` : `/api/catalog/themes`;

  const response = await $fetch.raw<ThemeBundle>(`${apiBaseUrl}${path}`, {
    method: "GET",
    signal,
    headers: etag ? { "If-None-Match": etag } : undefined,
    // 304 is an answer, not a failure, so ofetch must not throw on it.
    ignoreResponseError: true,
  });

  if (response.status === 304) return { status: "not-modified" };

  if (response.status >= 400) {
    throw Object.assign(
      new Error(`Theme Bundle request failed with ${response.status}`),
      { status: response.status },
    );
  }

  const bundle = (response._data ?? {}) as ThemeBundle;

  return {
    status: "modified",
    bundle,
    // Every theme asset URL is versioned with this value, so it has to identify
    // the content. A backend that answers without an `ETag` gets one derived
    // from the body, which keeps the versioned URLs honest rather than pinning
    // a stand-in behind a year of immutable caching.
    etag: response.headers.get("etag") ?? contentEtag(bundle),
  };
}

/** A strong etag derived from the export itself, for a backend that sends none. */
function contentEtag(bundle: ThemeBundle): string {
  return createHash("sha1").update(JSON.stringify(bundle)).digest("hex").slice(0, 16);
}

let store: ThemeBundleStore | undefined;

/**
 * The process-wide store, built on first use so the environment is read after
 * Nitro has loaded it.
 */
function getStore(): ThemeBundleStore {
  if (!store) {
    const log = logger.child({ caller: "server/api/utils/themeBundle" });
    store = createThemeBundleStore({
      fetchBundle: fetchThemeBundle,
      buildView: (bundle, etag) =>
        buildThemeView(bundle, etag, {
          onIssue: (issue) =>
            log.warn(
              `Theme Bundle field ${issue.path} rejected (${issue.code}); ` +
                `falling back for that part of the theme`,
            ),
        }),
      revalidateSeconds: revalidateSeconds(),
      timeoutMs: numberFromEnv(
        "NUXT_THEME_REVALIDATE_TIMEOUT_MS",
        DEFAULT_TIMEOUT_MS,
      ),
      logger: { warn: (message) => log.warn(message) },
    });
  }
  return store;
}

/**
 * The stored bundle, its etag and its Theme View, read at most once per H3
 * request per slug.
 *
 * The store already bounds how often the backend is asked; this second, much
 * shorter memo keeps a single render that touches the stylesheet, the favicon
 * and the Hero to one lookup, which also matters when the revalidation
 * interval is zero.
 */
export async function getThemeEntry(
  event: H3Event,
  slug?: string | null,
): Promise<ThemeBundleEntry | null> {
  const context = event.context as Record<string, unknown>;
  const cacheKey = slug ? `${CONTEXT_KEY}:${slug}` : CONTEXT_KEY;

  if (context[cacheKey] !== undefined) {
    return context[cacheKey] as ThemeBundleEntry | null;
  }

  const entry = await getStore().get(slug ?? null);
  context[cacheKey] = entry;
  return entry;
}

/**
 * The raw Theme Bundle export, for the routes that need a field the Theme View
 * deliberately leaves out — the colours and the favicon URL.
 */
export async function getThemeBundle(
  event: H3Event,
  slug?: string | null,
): Promise<ThemeBundle | null> {
  const entry = await getThemeEntry(event, slug);
  return entry?.bundle ?? null;
}

/**
 * The Theme View: validated, sanitised, and safe to hand to the client.
 * Degrades to the default theme when no bundle has ever been read.
 */
export async function getThemeView(
  event: H3Event,
  slug?: string | null,
): Promise<ThemeView> {
  const entry = await getThemeEntry(event, slug);
  return entry?.view ?? defaultThemeView();
}
