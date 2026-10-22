import type { UpstreamError } from "~~/server/utils/upstreamError";
import { storefrontUrl } from "~~/shared/utils/storefrontUrl";

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
        const response = await $fetch<{ status?: string }>(`${API_BASE_URL}/auth/card/signup`, {
            method: "POST",
            body: {
                appId,
                publicId,
                secret,
                email: sanitizedEmail,
                firstName: String(firstName || "").trim(),
                lastName: String(lastName || "").trim(),
                company: String(company || "").trim(),
                verifyUrl: storefrontUrl(USER_BASE_URL, "/register/email-verify"),
                linkUrl: storefrontUrl(USER_BASE_URL, "/card/link"),
                ...(legalAcceptance ? { legalAcceptance } : {}),
            },
        });

        return {
            success: true,
            data: response,
        };
    } catch (err) {
        const error = err as UpstreamError;
        throw createError({
            statusCode: error.status || 500,
            statusMessage:
                error.data?.message || "Card registration failed",
            // The backend's body: the `reason` the card login names, or the
            // refusal of an address on the blacklist (ECCdigital/tickets#628).
            data: error.data,
        });
    }
});