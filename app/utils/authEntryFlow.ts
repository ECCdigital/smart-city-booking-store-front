import type { Permissions } from "~~/shared/types/api";
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
  return onboardingUrl(adminBaseUrl);
}

/** The admin UI's onboarding under a configured admin base URL, else `null`. */
function onboardingUrl(adminBaseUrl: unknown): string | null {
  if (typeof adminBaseUrl !== "string" || !adminOrigin(adminBaseUrl)) {
    return null;
  }

  const url = new URL(adminBaseUrl.trim());
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}/onboarding`;
}

export type AdminEntry = {
  kind: "admin" | "offerSpaces";
  url: string;
  target: "_blank" | "_self";
};

/**
 * Which entry into the admin UI the user menu shows, if any.
 *
 * Admin Entry for an instance owner or anyone with an active membership;
 * Offer Spaces Entry (the admin UI's onboarding) for everyone else who may
 * create a tenant. The rights come from `GET /api/auth/me` as the auth store
 * keeps them; the storefront computes none of its own.
 *
 * @param permissions - `authStore.permissions`; may be missing before login.
 * @param adminBaseUrl - `NUXT_PUBLIC_ADMIN_BASE_URL`; no admin UI, no entry.
 */
export function adminEntry(
  permissions: Partial<Permissions> | null | undefined,
  adminBaseUrl: unknown,
): AdminEntry | null {
  const onboarding = onboardingUrl(adminBaseUrl);
  if (!onboarding) {
    return null;
  }

  const tenants = Array.isArray(permissions?.tenants)
    ? permissions.tenants
    : [];
  if (permissions?.instanceOwner === true || tenants.length > 0) {
    return {
      kind: "admin",
      url: (adminBaseUrl as string).trim(),
      target: "_blank",
    };
  }
  if (permissions?.allowCreateTenant === true) {
    return { kind: "offerSpaces", url: onboarding, target: "_self" };
  }
  return null;
}
