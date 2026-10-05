import {
    getKeycloakConfig,
    getKeycloakEndpoints,
    getPublicOrigin,
} from "~~/server/utils/keycloak";
import crypto from "crypto";

function generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
    return crypto.createHash("sha256").update(verifier).digest("base64url");
}

/**
 * SSO sign-in: sends the browser to Keycloak with `/api/auth/sso/callback`
 * as `redirect_uri`.
 *
 * The paths of these SSO routes are known fixed outside this repo. The
 * Admin UI's guide (tab „Single Sign-On“) lists `/api/auth/sso/callback`
 * and `/api/auth/sso/login*` („Benutzer wechseln“) as the Storefront's
 * Rücksprungadressen for the realm, and the backend's live check („Realm
 * prüfen“, row 10) calls `/api/auth/sso/login` under the Portal-URL.
 * Changing one of these paths needs both changed: see
 * smart-city-booking-vue-app docs/agents/keycloak-realm.md.
 */
export default defineEventHandler(async (event) => {
    const config = await getKeycloakConfig(event);
    console.log("Starting SSO login flow with Keycloak config:", {
        serverUrl: config.serverUrl,
        realm: config.realm,
        publicClient: config.publicClient,
    });
    const endpoints = getKeycloakEndpoints(config.serverUrl, config.realm);
    const query = getQuery(event);
    const redirect = safeReturnTarget(query.redirect);

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = crypto.randomBytes(16).toString("hex");

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

    const redirectUri = `${getPublicOrigin(event)}/api/auth/sso/callback`;

    const authUrl = new URL(endpoints.authorization);
    authUrl.searchParams.set("client_id", config.publicClient);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    return sendRedirect(event, authUrl.toString());
});