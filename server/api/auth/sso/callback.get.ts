import type { H3Event } from "h3";
import {
    getKeycloakConfig,
    getKeycloakEndpoints,
} from "~~/server/utils/keycloak";
import type { KeycloakTokenResponse } from "~~/server/utils/keycloak";
import type { UpstreamError } from "~~/server/utils/upstreamError";

export default defineEventHandler(async (event) => {
    const config = await getKeycloakConfig(event);
    const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();
    const endpoints = getKeycloakEndpoints(config.serverUrl, config.realm);
    const query = getQuery(event);

    const code = query.code as string;
    const state = query.state as string;
    const error = query.error as string;

    const savedState = getCookie(event, "kc-state");
    const codeVerifier = getCookie(event, "kc-code-verifier");
    const redirectPath = getCookie(event, "kc-redirect") || "/";

    deleteCookie(event, "kc-state");
    deleteCookie(event, "kc-code-verifier");
    deleteCookie(event, "kc-redirect");

    const isSilentCheck = savedState?.startsWith("silent_");

    if (error) {
        if (
            isSilentCheck &&
            (error === "login_required" || error === "interaction_required")
        ) {
            return sendRedirect(event, redirectPath);
        }
        console.error("Keycloak auth error:", error, query.error_description);
        return sendRedirect(event, `/login?error=sso_failed`);
    }

    if (!state || state !== savedState) {
        if (isSilentCheck) return sendRedirect(event, redirectPath);
        return sendRedirect(event, `/login?error=invalid_state`);
    }

    if (!code || !codeVerifier) {
        if (isSilentCheck) return sendRedirect(event, redirectPath);
        return sendRedirect(event, `/login?error=missing_params`);
    }

    const redirectUri = `${getRequestURL(event).origin}/api/auth/sso/callback`;

    try {
        const tokenResponse = await $fetch<KeycloakTokenResponse>(endpoints.token, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: config.publicClient,
                code,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier,
            }).toString(),
        });

        const kcAccessToken = tokenResponse.access_token;
        const kcRefreshToken = tokenResponse.refresh_token;

        let userExists = false;
        try {
            await $fetch(`${API_BASE_URL}/auth/sso/signin`, {
                method: "POST",
                body: { token: kcAccessToken },
            });
            userExists = true;
        } catch (err) {
            const backendError = err as UpstreamError;
            if (backendError.response?.status !== 404) {
                throw backendError;
            }
        }

        const secure = process.env.NODE_ENV === "production";
        const pendingCookieOptions = {
            httpOnly: true,
            secure,
            sameSite: "lax" as const,
            path: "/",
            maxAge: 300,
        };

        if (isSilentCheck) {
            if (userExists) {
                setAuthCookies(event, kcAccessToken, kcRefreshToken);
                return sendRedirect(event, redirectPath);
            }
            return sendRedirect(event, redirectPath);
        }

        setCookie(
            event,
            "kc-pending-token",
            kcAccessToken,
            pendingCookieOptions
        );

        if (kcRefreshToken) {
            setCookie(
                event,
                "kc-pending-refresh",
                kcRefreshToken,
                pendingCookieOptions
            );
        }

        setCookie(event, "kc-pending-redirect", redirectPath, {
            ...pendingCookieOptions,
            httpOnly: false,
        });

        if (userExists) {
            return sendRedirect(event, "/sso/confirm");
        } else {
            return sendRedirect(event, "/sso/register");
        }
    } catch (err) {
        console.error("SSO callback error:", err);
        if (isSilentCheck) return sendRedirect(event, redirectPath);
        return sendRedirect(event, `/login?error=sso_failed`);
    }
});

function setAuthCookies(
    event: H3Event,
    accessToken: string,
    refreshToken?: string
) {
    const secure = process.env.NODE_ENV === "production";

    setCookie(event, "access-token", accessToken, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
    });

    if (refreshToken) {
        setCookie(event, "refresh-token", refreshToken, {
            httpOnly: true,
            secure,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });
    }

    setCookie(event, "auth-type", "keycloak", {
        httpOnly: false,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });
}