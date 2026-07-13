const UNSAFE_REDIRECT_PATTERN = /^\/\/|\/\\@/;

/**
 * Returns a safe in-app path for post-login redirects.
 * Rejects absolute URLs, protocol-relative paths, and backslash variants.
 */
export function getSafeRedirectPath(
  redirect: unknown,
  fallback = "/",
): string {
  if (typeof redirect !== "string") {
    return fallback;
  }

  const trimmed = redirect.trim();
  if (!trimmed.startsWith("/") || UNSAFE_REDIRECT_PATTERN.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}
