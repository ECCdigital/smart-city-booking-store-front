import { adminOrigin } from "~~/shared/utils/adminOrigin";
import { parseReturnTarget } from "~~/shared/utils/returnTarget";
import { clientIpHeaders, throwIfRateLimited } from "~~/server/utils/rateLimit";

/**
 * Asks the backend to send an account's verification mail again. The backend
 * answers account-neutrally (202 for a known and an unknown address alike);
 * only its per-IP limit answers 429 with `Retry-After`, which is handed on.
 */
export default defineEventHandler(async (event) => {
  const { email, nextUrl } = await readBody(event);
  const {
    apiBaseUrl: API_BASE_URL,
    userBaseUrl: USER_BASE_URL,
    public: { adminBaseUrl },
  } = useRuntimeConfig();

  const sanitizedEmail = String(email ?? "")
    .trim()
    .toLowerCase();
  if (!sanitizedEmail) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email is required",
    });
  }

  const returnTarget = parseReturnTarget(nextUrl, {
    adminOrigin: adminOrigin(adminBaseUrl),
  });

  try {
    await $fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: "POST",
      headers: clientIpHeaders(event),
      body: {
        id: sanitizedEmail,
        verifyUrl: `${USER_BASE_URL}/register/email-verify`,
        ...(returnTarget ? { nextUrl: returnTarget } : {}),
      },
    });

    setResponseStatus(event, 202);
    return { success: true };
  } catch (error) {
    throwIfRateLimited(event, error);
    throw createError({
      statusCode: error.response?.status || 500,
      statusMessage: "Resending the verification mail failed",
    });
  }
});
