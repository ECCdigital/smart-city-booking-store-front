import type { EventHandler, EventHandlerRequest, H3Event } from "h3";

interface CacheOptions {
  maxAge?: number;
  swr?: boolean;
  name?: string;
  getKey?: (event: H3Event) => string | Promise<string>;
  /**
   * When true, the cache key is scoped to "anon" vs "auth" based on the
   * presence of an access-token cookie. Prevents leaking private responses
   * between users while still allowing anonymous responses to be shared.
   */
  authScoped?: boolean;
  /**
   * Marks an answer that carries a tenant or offer release (tenant
   * supervision): catalog bundles, tenants, bookables, events. Such an answer
   * is never cached, whatever `NUXT_CACHE_ENABLED` says, so a tenant going
   * non-public or a withdrawn approval shows on the very next request.
   */
  releaseSensitive?: boolean;
}

export type CachePolicy =
  | { cached: false }
  | { cached: true; maxAge: number; swr: boolean };

/**
 * Decides whether a handler's answers may be kept in the server-side response
 * cache, and for how long.
 */
export function resolveCachePolicy(
  options: Pick<CacheOptions, "maxAge" | "swr" | "releaseSensitive"> = {},
  env: Record<string, string | undefined> = process.env
): CachePolicy {
  if (options.releaseSensitive) return { cached: false };
  if (env.NUXT_CACHE_ENABLED === "false") return { cached: false };
  return {
    cached: true,
    maxAge: options.maxAge ?? 300,
    swr: options.swr ?? true,
  };
}

function buildDefaultKey(event: H3Event, authScoped: boolean): string {
  const path = event.path || event.node?.req?.url || "";
  if (!authScoped) return path;
  const token = getCookie(event, "access-token");
  const scope = token ? "auth" : "anon";
  return `${scope}::${path}`;
}

export function createConditionalCachedHandler<T extends EventHandlerRequest>(
  handler: EventHandler<T>,
  options: CacheOptions = {}
): EventHandler<T> {
  const policy = resolveCachePolicy(options);

  if (policy.cached) {
    const authScoped = options.authScoped ?? true;
    return cachedEventHandler(handler, {
      maxAge: policy.maxAge,
      swr: policy.swr,
      name: options.name,
      getKey: (event) =>
        options.getKey
          ? options.getKey(event as H3Event)
          : buildDefaultKey(event as H3Event, authScoped),
    });
  }

  return defineEventHandler(handler);
}
