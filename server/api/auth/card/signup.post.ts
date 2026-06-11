export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { apiBaseUrl: API_BASE_URL, userBaseUrl: USER_BASE_URL } =
        useRuntimeConfig();

    const {
        appId,
        publicId,
        secret,
        email,
        firstName,
        lastName,
        company,
        legalAcceptance,
    } = body;

    if (!appId || !publicId || !secret || !email) {
        throw createError({
            statusCode: 400,
            statusMessage: "appId, publicId, secret, and email are required",
        });
    }

    const sanitizedEmail = String(email).trim().toLowerCase();

    try {
        const response = await $fetch<any>(`${API_BASE_URL}/auth/card/signup`, {
            method: "POST",
            body: {
                appId,
                publicId,
                secret,
                email: sanitizedEmail,
                firstName: String(firstName || "").trim(),
                lastName: String(lastName || "").trim(),
                company: String(company || "").trim(),
                verifyUrl: `${USER_BASE_URL}/register/email-verify`,
                linkUrl: `${USER_BASE_URL}/card/link`,
                ...(legalAcceptance ? { legalAcceptance } : {}),
            },
        });

        return {
            success: true,
            data: response,
        };
    } catch (error: any) {
        throw createError({
            statusCode: error.status || 500,
            statusMessage:
                error.data?.message || "Card registration failed",
            data: {
                reason: error.data?.reason,
            },
        });
    }
});