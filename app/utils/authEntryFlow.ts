import { adminOrigin } from "~~/shared/utils/adminOrigin";
import { rateLimitWait } from "~~/shared/utils/retryAfter";
import {
  parseReturnTarget,
  type ReturnTargetOptions,
} from "~~/shared/utils/returnTarget";

/**
 * Decisions of the entry flow (signup → verification mail → verify → login),
 * kept free of Vue so they can be tested on their own.
 */

export type SignupOutcome =
  | { kind: "confirmation" }
  | { kind: "rateLimited"; seconds: number | null }
  | { kind: "failed" };

/**
 * What the signup page shows for the answer of `POST /api/auth/signup`.
 *
 * Account-neutral: the backend answers `201` whether or not the address has
 * an account. A `409` of an older backend lands on the same confirmation, so
 * the page never tells a registered address from a new one.
 *
 * @param error - The rejected `$fetch`, or `null`/`undefined` on success.
 */
export function signupOutcome(
  error: unknown,
  now: number = Date.now(),
): SignupOutcome {
  if (!error) {
    return { kind: "confirmation" };
  }

  const failure = error as { status?: number; statusCode?: number };
  if ((failure.statusCode ?? failure.status) === 409) {
    return { kind: "confirmation" };
  }

  const wait = rateLimitWait(error, now);
  if (wait) {
    return { kind: "rateLimited", seconds: wait.seconds };
  }
  return { kind: "failed" };
}

/**
 * The return target after a verification: the one the backend answers
 * (`nextUrl`, kept on the verification hook), else the one on the mail link
 * (`?next=`). Both are validated; an unsafe one is skipped.
 */
export function verifiedReturnTarget(
  { answered, linked }: { answered?: unknown; linked?: unknown },
  options: ReturnTargetOptions = {},
): string | null {
  return (
    parseReturnTarget(answered, options) ?? parseReturnTarget(linked, options)
  );
}

/**
 * The address of the public entry "Offer spaces": the admin UI's onboarding.
 *
 * @param adminBaseUrl - `NUXT_PUBLIC_ADMIN_BASE_URL`; may carry a base path.
 * @param instance - The public instance (`GET /api/instances/public`).
 * @returns `null` unless an admin UI is configured and the public instance
 *   says that every user may create a tenant.
 */
export function offerSpacesEntryUrl(
  adminBaseUrl: unknown,
  instance: { allowAllUsersToCreateTenant?: unknown } | null | undefined,
): string | null {
  if (instance?.allowAllUsersToCreateTenant !== true) {
    return null;
  }
  if (typeof adminBaseUrl !== "string" || !adminOrigin(adminBaseUrl)) {
    return null;
  }

  const url = new URL(adminBaseUrl.trim());
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}/onboarding`;
}
