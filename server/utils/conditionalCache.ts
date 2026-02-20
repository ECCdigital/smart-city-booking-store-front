import type { EventHandler, EventHandlerRequest } from "h3";

interface CacheOptions {
  maxAge?: number;
  swr?: boolean;
  name?: string;
  getKey?: (event: any) => string | Promise<string>;
}

export function createConditionalCachedHandler<T extends EventHandlerRequest>(
  handler: EventHandler<T>,
  options: CacheOptions = {}
): EventHandler<T> {
  const cacheEnabled = process.env.NUXT_CACHE_ENABLED !== "false";

  if (cacheEnabled) {
    return cachedEventHandler(handler, {
      maxAge: options.maxAge ?? 300,
      swr: options.swr ?? true,
      name: options.name,
      getKey: options.getKey,
    });
  }

  return defineEventHandler(handler);
}
