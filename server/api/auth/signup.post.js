export default defineEventHandler(async (event) => {
  const {
    email,
    password,
    passwordRepeat,
    firstname,
    lastname,
    company,
    legalAcceptance,
  } = await readBody(event);
  const { apiBaseUrl: API_BASE_URL, userBaseUrl: USER_BASE_URL } =
    useRuntimeConfig();

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
      body: {
        id: sanitizedEmail,
        password,
        firstname: sanitizedFirstname,
        lastname: sanitizedLastname,
        company: sanitizedCompany,
        verifyUrl: `${USER_BASE_URL}/register/email-verify`,
        ...(legalAcceptance ? { legalAcceptance } : {}),
      },
    });

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    throw createError({
      success: false,
      statusCode: error.response?.status || 500,
      statusMessage: error.response?.data?.message || "Signup failed",
    });
  }
});
