import { NO_STORE, isReleaseSensitivePath } from "~~/server/utils/releaseFreshness";

/**
 * Answers that carry a tenant or offer release go out with
 * `Cache-Control: no-store`, errors included, so a cache between the
 * storefront and the visitor cannot serve a release that has been withdrawn.
 */
export default defineEventHandler((event) => {
  if (isReleaseSensitivePath(event.path)) {
    setResponseHeader(event, "Cache-Control", NO_STORE);
  }
});
