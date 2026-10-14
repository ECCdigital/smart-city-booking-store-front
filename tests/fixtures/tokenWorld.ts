/**
 * A small world for the token tests (ECCdigital/tickets#108): a fake backend
 * that rotates refresh tokens like the real one, the storefront's real BFF
 * routes on a real h3 app, a server-rendered page that runs the real auth
 * store and `useApiClient`, and a browser that keeps cookies.
 *
 * The Nuxt and Nitro auto-imports are put on `globalThis` from h3 itself, so
 * the routes read and write real cookies and headers. The global `$fetch`
 * behaves like Nitro's: a path goes to the BFF in-process, a URL goes out to
 * the backend.
 */
import * as h3 from "h3";
import {
  createApp,
  createRouter,
  eventHandler,
  fetchWithEvent,
  getHeader,
  getRequestHeaders,
  readBody,
  setResponseStatus,
  toWebHandler,
  type EventHandler,
  type H3Event,
} from "h3";
import { createFetch } from "ofetch";
import { createPinia, defineStore, setActivePinia } from "pinia";

const g = globalThis as Record<string, unknown>;

for (const name of [
  "defineEventHandler",
  "eventHandler",
  "getCookie",
  "setCookie",
  "deleteCookie",
  "createError",
  "getRouterParam",
  "getQuery",
  "readBody",
  "getRequestURL",
] as const) {
  g[name] = (h3 as Record<string, unknown>)[name];
}
g.defineStore = defineStore;
g.useRuntimeConfig = () => ({ apiBaseUrl: "http://backend", public: {} });
g.useRoute = () => ({ path: "/" });
g.navigateTo = () => undefined;
g.useCookie = () => ({ value: undefined });

export const USER = { id: "user-1", firstName: "Ada" };
export const LOGIN_REQUIRED = {
  success: false,
  error: { checkType: "permissions", reason: "checkout.login_required" },
};

type BackendOptions = {
  /** Backend 4.3.1 (tickets#109): a public route answers 401 to an expired
   * or invalid token. Off, it treats such a token as anonymous, like 4.3.0. */
  rejectsBadTokenOnPublicRoutes?: boolean;
};

let backends = 0;

/**
 * The backend: access tokens `access-<b>.<n>`, refresh tokens
 * `refresh-<b>.<n>`, with `b` naming the backend, so that no two tests share a
 * token. Only the newest access token is valid, the older ones have expired.
 * A refresh token works once and is revoked by its use (token rotation).
 */
export function createBackend({ rejectsBadTokenOnPublicRoutes = true }: BackendOptions = {}) {
  backends += 1;
  const id = backends;
  const token = (kind: string, n: number) => `${kind}-${id}.${n}`;
  let generation = 1;
  const validAccess = new Set([token("access", 1)]);
  const validRefresh = new Set([token("refresh", 1)]);
  const keycloakRefresh = new Set([token("kc-refresh", 1)]);
  const state = {
    refreshCalls: 0,
    keycloakRefreshCalls: 0,
    /** Every call of a resource route with the token it carried. */
    calls: [] as { path: string; token: string | null }[],
    /** While set, `/auth/refresh` answers only once it resolves. */
    refreshGate: null as Promise<void> | null,
    /** While set, every token is refused, a renewed one too ("User not found"). */
    userGone: false,
    /** While set, `/auth/refresh` fails with a 503, as if the backend were briefly down. */
    refreshUnavailable: false,
  };

  function issue() {
    generation += 1;
    validAccess.clear();
    validAccess.add(token("access", generation));
    return { accessToken: token("access", generation), refreshToken: token("refresh", generation) };
  }

  function tokenOf(event: H3Event) {
    const header = getHeader(event, "authorization");
    return header?.startsWith("Bearer ") ? header.slice(7) : null;
  }

  function tokenRejection(token: string) {
    return {
      success: false,
      message: token.startsWith("access-") || token.startsWith("kc-access-")
        ? "Token has expired"
        : "Invalid token",
    };
  }

  /** `optionalAuth` of a public route: the user, `null` for anonymous, or a 401. */
  function publicPrincipal(event: H3Event) {
    const token = tokenOf(event);
    state.calls.push({ path: event.path, token });
    if (!token) return null;
    if (state.userGone) {
      setResponseStatus(event, 401);
      return { success: false, message: "User not found" };
    }
    if (validAccess.has(token)) return USER;
    if (!rejectsBadTokenOnPublicRoutes) return null;
    setResponseStatus(event, 401);
    return tokenRejection(token);
  }

  const router = createRouter()
    .post(
      "/auth/refresh",
      eventHandler(async (event) => {
        const { refreshToken } = await readBody(event);
        state.refreshCalls += 1;
        if (state.refreshGate) await state.refreshGate;
        if (state.refreshUnavailable) {
          setResponseStatus(event, 503);
          return { success: false, message: "Service unavailable" };
        }
        if (!validRefresh.delete(refreshToken)) {
          setResponseStatus(event, 401);
          return { success: false, message: "Invalid refresh token" };
        }
        const tokens = issue();
        validRefresh.add(tokens.refreshToken);
        return { success: true, ...tokens };
      }),
    )
    .get(
      "/auth/me",
      eventHandler((event) => {
        const token = tokenOf(event);
        state.calls.push({ path: event.path, token });
        if (token && validAccess.has(token)) {
          return { user: USER, permissions: {} };
        }
        setResponseStatus(event, 401);
        return token ? tokenRejection(token) : { success: false, message: "Access token required" };
      }),
    )
    .get(
      "/api/v2/:tenant/checkout/permissions/:bookable",
      eventHandler((event) => {
        const principal = publicPrincipal(event);
        if (principal && "message" in principal) return principal;
        return principal ? { success: true } : LOGIN_REQUIRED;
      }),
    )
    .get(
      "/api/instances/public",
      eventHandler(() => ({
        applications: [
          {
            id: "keycloak",
            active: true,
            serverUrl: "http://keycloak",
            realm: "city",
            publicClient: "storefront",
          },
        ],
      })),
    )
    .post(
      "/realms/city/protocol/openid-connect/token",
      eventHandler(async (event) => {
        const body = await readBody(event);
        const form = typeof body === "string" ? Object.fromEntries(new URLSearchParams(body)) : body;
        state.keycloakRefreshCalls += 1;
        if (!keycloakRefresh.delete(form.refresh_token)) {
          setResponseStatus(event, 400);
          return { error: "invalid_grant" };
        }
        generation += 1;
        validAccess.clear();
        validAccess.add(token("kc-access", generation));
        keycloakRefresh.add(token("kc-refresh", generation));
        return {
          access_token: token("kc-access", generation),
          refresh_token: token("kc-refresh", generation),
        };
      }),
    );

  const app = createApp();
  app.use(router);
  const handle = toWebHandler(app);

  return {
    state,
    handle,
    /** The token of the given kind and generation, e.g. `token("access", 2)`. */
    token,
    /** Cookies of a session whose access token has expired. */
    expiredSession: (authType?: "keycloak") =>
      authType === "keycloak"
        ? { "access-token": token("kc-access", 0), "refresh-token": token("kc-refresh", 1), "auth-type": "keycloak" }
        : { "access-token": token("access", 0), "refresh-token": token("refresh", 1) },
    /** Cookies of a session whose access token is valid. */
    validSession: () => ({ "access-token": token("access", 1), "refresh-token": token("refresh", 1) }),
    /** Lets the current access token expire. */
    expireAccessTokens() {
      validAccess.clear();
    },
    /** Revokes every refresh token, e.g. logged out elsewhere. */
    revokeRefreshTokens() {
      validRefresh.clear();
      keycloakRefresh.clear();
    },
  };
}

type Backend = ReturnType<typeof createBackend>;

/** The storefront's server: the given BFF routes plus a server-rendered page. */
export function createStorefront(
  backend: Backend,
  routes: Record<string, EventHandler>,
  /** What the page does while it renders on the server. */
  render: () => Promise<unknown> = async () => null,
) {
  const bffRouter = createRouter();
  for (const [path, handler] of Object.entries(routes)) bffRouter.get(path, handler);
  const bffApp = createApp();
  bffApp.use(bffRouter);
  const bff = toWebHandler(bffApp);

  // Nitro's in-process fetch: a path is handled by the BFF, a URL goes out.
  const internalFetch = createFetch({
    fetch: (input, init) => bff(new Request(new URL(String(input), "http://storefront"), init)),
  });
  const outboundFetch = createFetch({
    fetch: (input, init) => backend.handle(new Request(String(input), init)),
  });
  g.$fetch = (url: string, opts?: object) =>
    url.startsWith("/") ? internalFetch(url, opts) : outboundFetch(url, opts);

  const pageApp = createApp();
  pageApp.use(
    eventHandler(async (event) => {
      // What Nuxt gives the app while it renders this request.
      g.useRequestEvent = () => event;
      g.useRequestFetch = () => (url: string, opts?: object) =>
        fetchWithEvent(event, url, opts, { fetch: internalFetch as never });
      g.useRequestHeaders = (include: string[]) => {
        const all = getRequestHeaders(event);
        return Object.fromEntries(include.filter((k) => all[k]).map((k) => [k, all[k]]));
      };
      g.__nuxtServer = true;
      setActivePinia(createPinia());
      try {
        return { rendered: await render() };
      } finally {
        g.__nuxtServer = undefined;
      }
    }),
  );
  const page = toWebHandler(pageApp);

  return { bff, page, outboundFetch };
}

/**
 * Runs the app code that follows as client code in the given browser: its
 * calls to `/api/*` go through the browser, with its cookies.
 */
export function runInBrowser(
  storefront: ReturnType<typeof createStorefront>,
  browser: ReturnType<typeof createBrowser>,
) {
  const browserFetch = createFetch({
    fetch: (input, init) => browser.send(storefront.bff, new Request(new URL(String(input), "http://storefront"), init)),
  });
  g.$fetch = (url: string, opts?: object) =>
    url.startsWith("/") ? browserFetch(url, opts) : storefront.outboundFetch(url, opts);
  g.useRequestFetch = () => browserFetch;
  g.useRequestEvent = () => undefined;
  g.__nuxtServer = undefined;
  setActivePinia(createPinia());
}

/** A browser: keeps the cookies the storefront sets and sends them back. */
export function createBrowser(cookies: Record<string, string>) {
  const jar = new Map(Object.entries(cookies));

  /** Sends a request with the browser's cookies and keeps the ones it gets back. */
  async function send(handler: (req: Request) => Promise<Response>, request: Request) {
    const headers = new Headers(request.headers);
    headers.set("cookie", [...jar].map(([k, v]) => `${k}=${v}`).join("; "));
    const response = await handler(new Request(request, { headers }));
    for (const line of response.headers.getSetCookie()) {
      const [pair, ...attributes] = line.split(";");
      const name = pair.slice(0, pair.indexOf("=")).trim();
      const value = pair.slice(pair.indexOf("=") + 1).trim();
      const expired = attributes.some((a) => /^\s*max-age=0\s*$/i.test(a));
      if (expired || value === "") jar.delete(name);
      else jar.set(name, value);
    }
    return response;
  }

  async function open(handler: (req: Request) => Promise<Response>, path: string) {
    const response = await send(handler, new Request(new URL(path, "http://storefront")));
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null, setCookies: response.headers.getSetCookie() };
  }

  return {
    cookies: jar,
    send,
    /** Loads a page: the storefront renders it on the server. */
    load: (storefront: { page: (req: Request) => Promise<Response> }, path = "/checkout/bookable-1") =>
      open(storefront.page, path),
    /** A call of the client code to a BFF route. */
    call: (storefront: { bff: (req: Request) => Promise<Response> }, path: string) =>
      open(storefront.bff, path),
  };
}
