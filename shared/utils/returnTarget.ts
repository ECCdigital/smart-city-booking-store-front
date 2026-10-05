/**
 * The return target (backend glossary "Rückkehrziel", `nextUrl`): where a user
 * is sent once signup, verification and login (local or SSO) are through —
 * e.g. back to the tenant creation of the admin UI they came from.
 *
 * It travels as the `redirect` query parameter inside the storefront, as
 * `nextUrl` to the backend signup and as `next` on the verification mail's
 * link. Every hop reads it through this module, so there is exactly one place
 * that decides what is safe to follow:
 *
 * - a relative in-app path (`/…`), or
 * - an absolute address on the configured admin origin (`adminOrigin()`).
 *
 * Anything else is refused, which keeps the storefront from being an open
 * redirect.
 */

/** The query parameter that carries the target between storefront pages. */
export const RETURN_TARGET_PARAM = "redirect";

/** The query parameter the backend puts on the verification mail's link. */
export const VERIFY_RETURN_TARGET_PARAM = "next";

export interface ReturnTargetOptions {
  /** The admin UI's origin (`adminOrigin(config.public.adminBaseUrl)`). */
  adminOrigin?: string | null;
}

// Browsers read `\` as `/` and drop tab/newline inside URLs, so `/\host` and
// `/<tab>/host` both end up protocol-relative. Neither has a place in a target.
// eslint-disable-next-line no-control-regex
const FORBIDDEN_CHARS = /[\\\u0000-\u001f\u007f]/;

// Only used to resolve relative paths; `.invalid` never resolves (RFC 2606).
const PLACEHOLDER_ORIGIN = "http://storefront.invalid";

/**
 * @param raw - The target as it arrived (query value, cookie, backend answer).
 * @returns The target as given when it is safe to follow, otherwise `null`.
 */
export function parseReturnTarget(
  raw: unknown,
  { adminOrigin = null }: ReturnTargetOptions = {},
): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") {
    return null;
  }

  const target = value.trim();
  if (!target || FORBIDDEN_CHARS.test(target)) {
    return null;
  }

  if (target.startsWith("/")) {
    if (target.startsWith("//")) {
      return null;
    }
    try {
      return new URL(target, PLACEHOLDER_ORIGIN).origin === PLACEHOLDER_ORIGIN
        ? target
        : null;
    } catch {
      return null;
    }
  }

  if (!adminOrigin || !/^https?:\/\//i.test(target)) {
    return null;
  }
  try {
    const url = new URL(target);
    return url.origin === adminOrigin && !url.username && !url.password
      ? target
      : null;
  } catch {
    return null;
  }
}

/** Like `parseReturnTarget`, but answers `fallback` instead of `null`. */
export function resolveReturnTarget(
  raw: unknown,
  {
    fallback = "/",
    ...options
  }: ReturnTargetOptions & { fallback?: string } = {},
): string {
  return parseReturnTarget(raw, options) ?? fallback;
}

/** Whether a validated target leaves the storefront (admin origin). */
export function isExternalReturnTarget(target: string): boolean {
  return !target.startsWith("/");
}

/**
 * Appends the target to an in-app path so the next page can pick it up.
 *
 * @param path - An in-app path, with or without a query.
 * @param target - The target to carry; nothing is appended without one.
 */
export function appendReturnTarget(
  path: string,
  target: string | null | undefined,
  param: string = RETURN_TARGET_PARAM,
): string {
  if (!target) {
    return path;
  }
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${param}=${encodeURIComponent(target)}`;
}
