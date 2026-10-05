/**
 * The `X-Forwarded-For` value a Nitro proxy hands to the backend.
 *
 * The backend counts its public rate limits (signup, verification mails) per
 * client IP. Without this header every storefront visitor would count as the
 * storefront server's own address and share one limit.
 *
 * @param incoming - The `X-Forwarded-For` chain of the incoming request.
 * @param remoteAddress - The address the request connected from.
 * @returns The chain extended by `remoteAddress`, `null` when both are empty.
 */
export function forwardedFor(
  incoming: string | undefined | null,
  remoteAddress: string | undefined | null,
): string | null {
  const chain = (incoming ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const remote = remoteAddress?.trim();
  if (remote) {
    chain.push(remote);
  }
  return chain.length > 0 ? chain.join(", ") : null;
}
