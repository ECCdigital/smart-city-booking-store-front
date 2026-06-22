export const CHECKOUT_ONLY_QUERY_KEYS = [
  "start",
  "end",
  "step",
  "amount",
  "tenantId",
] as const;

function normalizePath(path: string): string {
  const withoutQuery = path.split("?")[0].split("#")[0];
  const withoutTenantPrefix = withoutQuery.replace(/^\/t\/[^/]+/, "");
  return withoutTenantPrefix.length > 0 ? withoutTenantPrefix : withoutQuery;
}

export function isCheckoutPath(path: string): boolean {
  return normalizePath(path).startsWith("/checkout");
}

export function stripCheckoutQuery(
  query: Record<string, unknown> | null | undefined,
): Record<string, string | string[]> {
  if (!query) return {};

  const checkoutKeys = new Set<string>(CHECKOUT_ONLY_QUERY_KEYS);
  return Object.fromEntries(
    Object.entries(query).filter(([key]) => !checkoutKeys.has(key)),
  ) as Record<string, string | string[]>;
}

export function hasCheckoutQueryKeys(
  query: Record<string, unknown> | null | undefined,
): boolean {
  if (!query) return false;
  return CHECKOUT_ONLY_QUERY_KEYS.some((key) => key in query);
}
