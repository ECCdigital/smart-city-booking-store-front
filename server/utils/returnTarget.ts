import { adminOrigin } from "~~/shared/utils/adminOrigin";
import { resolveReturnTarget } from "~~/shared/utils/returnTarget";

/**
 * The return target of an auth route, validated: a relative in-app path or an
 * address on the configured admin origin, otherwise `/`. Used wherever a
 * route takes a target from the query or a cookie and later redirects to it.
 */
export function safeReturnTarget(raw: unknown): string {
  return resolveReturnTarget(raw, {
    adminOrigin: adminOrigin(useRuntimeConfig().public.adminBaseUrl),
  });
}
