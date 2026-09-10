import type { H3Event } from "h3";

interface KeycloakAppConfig {
    id: string;
    active: boolean;
    serverUrl: string;
    realm: string;
    publicClient: string;
    [key: string]: unknown;
}

/** What Keycloak's token endpoint answers with. */
export interface KeycloakTokenResponse {
    access_token: string;
    refresh_token?: string;
}

let cachedConfig: KeycloakAppConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000;

export async function getKeycloakConfig(
    _event?: H3Event
): Promise<KeycloakAppConfig> {
    const now = Date.now();

    if (cachedConfig && now - cacheTimestamp < CACHE_TTL) {
        return cachedConfig;
    }

    const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();

    const instance = await $fetch<{ applications?: KeycloakAppConfig[] }>(
        `${API_BASE_URL}/api/instances/public`
    );

    const keycloakApp = instance?.applications?.find(
        (app) => app.id === "keycloak" && app.active
    );


    if (!keycloakApp) {
        throw createError({
            statusCode: 503,
            statusMessage: "Keycloak SSO is not configured or inactive",
        });
    }

    cachedConfig = keycloakApp;
    cacheTimestamp = now;

    return keycloakApp;
}

export function getKeycloakEndpoints(serverUrl: string, realm: string) {
    const base = `${serverUrl}/realms/${realm}/protocol/openid-connect`;
    return {
        authorization: `${base}/auth`,
        token: `${base}/token`,
        userinfo: `${base}/userinfo`,
        logout: `${base}/logout`,
    };
}

export function invalidateKeycloakCache() {
    cachedConfig = null;
    cacheTimestamp = 0;
}