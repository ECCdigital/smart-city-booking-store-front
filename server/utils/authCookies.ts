/**
 * Shared-session cookie helpers — keep flags aligned with Admin BFF
 * (`bff/src/cookieContract.js` / `bff/src/cookies.js`).
 */

const SECURE = process.env.NODE_ENV === "production";

export function authCookieOptions(maxAge: number, httpOnly = true) {
  return {
    httpOnly,
    secure: SECURE,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** Clear with the same path/sameSite/secure used when setting — required across apps. */
export function clearAuthCookies(event: any) {
  const base = {
    path: "/",
    sameSite: "lax" as const,
    secure: SECURE,
  };
  deleteCookie(event, "access-token", { ...base, httpOnly: true });
  deleteCookie(event, "refresh-token", { ...base, httpOnly: true });
  deleteCookie(event, "auth-type", { ...base, httpOnly: false });
}
