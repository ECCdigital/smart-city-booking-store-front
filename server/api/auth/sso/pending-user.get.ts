import jwt from "jsonwebtoken";

/** The OpenID claims the pending Keycloak token is read for. */
interface KeycloakIdTokenClaims {
    email?: string;
    given_name?: string;
    family_name?: string;
    preferred_username?: string;
}

export default defineEventHandler(async (event) => {

    const pendingToken = getCookie(event, "kc-pending-token");

    if (!pendingToken) {
        throw createError({
            statusCode: 400,
            statusMessage: "No pending SSO session",
        });
    }

    try {
        const decoded = jwt.decode(pendingToken) as KeycloakIdTokenClaims | null;


        return {
            email: decoded?.email || "",
            firstName: decoded?.given_name || "",
            lastName: decoded?.family_name || "",
            name:
                [decoded?.given_name, decoded?.family_name]
                    .filter(Boolean)
                    .join(" ") || decoded?.preferred_username || "",
            username: decoded?.preferred_username || "",
        };
    } catch {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid pending token",
        });
    }
});