import {
    getKeycloakConfig,
    getKeycloakEndpoints,
} from "~~/server/utils/keycloak";
import crypto from "crypto";

function generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
    return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export default defineEventHandler(async (event) => {

    const query = getQuery(event);
    const redirect = (query.redirect as string) || "/";

    let config;
    try {
        config = await getKeycloakConfig(event);
    } catch {
        return sendRedirect(event, redirect);
    }

    const endpoints = getKeycloakEndpoints(config.serverUrl, config.realm);

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const state = `silent_${crypto.randomBytes(16).toString("hex")}`;

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: 300,
    };

    setCookie(event, "kc-code-verifier", codeVerifier, cookieOptions);
    setCookie(event, "kc-state", state, cookieOptions);
    setCookie(event, "kc-redirect", redirect, cookieOptions);

    const redirectUri = `${getRequestURL(event).origin}/api/auth/sso/callback`;

    const authUrl = new URL(endpoints.authorization);
    authUrl.searchParams.set("client_id", config.publicClient);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("prompt", "none");

    return sendRedirect(event, authUrl.toString());
});