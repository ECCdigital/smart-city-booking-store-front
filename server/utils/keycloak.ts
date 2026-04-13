import { H3Event } from "h3";

interface KeycloakAppConfig {
    id: string;
    active: boolean;
    serverUrl: string;
    realm: string;
    publicClient: string;
    [key: string]: any;
}

let cachedConfig: KeycloakAppConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000;

export async function getKeycloakConfig(
    event?: H3Event
): Promise<KeycloakAppConfig> {
    const now = Date.now();

    if (cachedConfig && now - cacheTimestamp < CACHE_TTL) {
        return cachedConfig;
    }

    const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();

    const instance = await $fetch(`${API_BASE_URL}/api/instances/public`);

    const keycloakApp = instance?.applications?.find(
        (app: any) => app.id === "keycloak" && app.active
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