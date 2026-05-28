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
  const cacheEnabled = process.env.NUXT_CACHE_ENABLED !== "false";

  if (cacheEnabled) {
    const authScoped = options.authScoped ?? true;
    return cachedEventHandler(handler, {
      maxAge: options.maxAge ?? 300,
      swr: options.swr ?? true,
      name: options.name,
      getKey: (event) =>
        options.getKey
          ? options.getKey(event as H3Event)
          : buildDefaultKey(event as H3Event, authScoped),
    });
  }

  return defineEventHandler(handler);
}
