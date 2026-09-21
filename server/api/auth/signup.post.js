import { adminOrigin } from "~~/shared/utils/adminOrigin";
import { parseReturnTarget } from "~~/shared/utils/returnTarget";
import { clientIpHeaders, throwIfRateLimited } from "~~/server/utils/rateLimit";

export default defineEventHandler(async (event) => {
  const {
    email,
    password,
    passwordRepeat,
    firstname,
    lastname,
    company,
    legalAcceptance,
    nextUrl,
  } = await readBody(event);
  const {
    apiBaseUrl: API_BASE_URL,
    userBaseUrl: USER_BASE_URL,
    public: { adminBaseUrl },
  } = useRuntimeConfig();

  // The return target travels with the verification mail; the backend keeps
  // it on the verification hook and answers it on verify.
  const returnTarget = parseReturnTarget(nextUrl, {
    adminOrigin: adminOrigin(adminBaseUrl),
  });

  //sanitize input
  const sanitizedEmail = String(email).trim().toLowerCase();
  const sanitizedFirstname = String(firstname).trim();
  const sanitizedLastname = String(lastname).trim();
  const sanitizedCompany = String(company).trim();

  if (password !== passwordRepeat) {
    throw createError({
      success: false,
      statusCode: 400,
      statusMessage: "Passwords do not match",
    });
  }


  try {
    const response = await $fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: clientIpHeaders(event),
      body: {
        id: sanitizedEmail,
        password,
        firstname: sanitizedFirstname,
        lastname: sanitizedLastname,
        company: sanitizedCompany,
        verifyUrl: `${USER_BASE_URL}/register/email-verify`,
        ...(returnTarget ? { nextUrl: returnTarget } : {}),
        ...(legalAcceptance ? { legalAcceptance } : {}),
      },
    });

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    throwIfRateLimited(event, error);
    throw createError({
      success: false,
      statusCode: error.response?.status || 500,
      statusMessage: error.response?.data?.message || "Signup failed",
    });
  }
});
