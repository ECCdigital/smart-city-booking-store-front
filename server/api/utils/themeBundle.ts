import type { H3Event } from "h3";
import { serverFetch } from "./serverFetch";
import type { ThemeBundle } from "~~/shared/types/api";

const CONTEXT_KEY = "themeBundle" as const;

/**
 * Fetches the theme bundle from the backend at most once per H3 request.
 * All theme-related endpoints share the same in-request cache, eliminating
 * the previous 3x backend roundtrip for css/hero/logo on a single render.
 */
export async function getThemeBundle(
  event: H3Event,
  slug?: string | null
): Promise<ThemeBundle | null> {
  const ctx = (event.context as Record<string, unknown>) || {};
  const cacheKey = slug ? `${CONTEXT_KEY}:${slug}` : CONTEXT_KEY;

  if (ctx[cacheKey] !== undefined) {
    return ctx[cacheKey] as ThemeBundle | null;
  }

  const path = slug ? `/api/catalog/themes/${slug}` : `/api/catalog/themes`;
  const { data, error } = await serverFetch<ThemeBundle>(event, path, {
    method: "GET",
  });

  const result = error ? null : data ?? null;
  (event.context as Record<string, unknown>)[cacheKey] = result;
  return result;
}
