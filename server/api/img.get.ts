/**
 * The image proxy. Every image the storefront renders comes through here, so
 * the page stays same-origin and its `img-src` policy stays `'self'`.
 *
 * It is deliberately dumb: it never resizes, re-encodes or otherwise inspects
 * an image. Sizing is the backend's job (`?size=` presets), and choosing among
 * those presets is the client's (`useMediaImage`). All this route does is
 * fetch, guard and forward.
 */
import {
  eventHandler,
  getQuery,
  getRequestHeader,
  setHeader,
  setResponseStatus,
  sendError,
  createError,
  H3Error,
} from "h3";
import dns from "node:dns/promises";
import net from "node:net";
import { isMediaFilePath } from "~~/shared/utils/mediaUrl";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB Limit
const TIMEOUT_MS = 8000;

// Cache policy for anything that is not ours: we know nothing about how a
// foreign host versions its images, so we pick a modest lifetime ourselves.
const EXTERNAL_CACHE_CONTROL = "public, max-age=3600, s-maxage=86400";

// Headers a media response carries from the backend. Its cache policy is part
// of the media contract — an immutable original, a revalidatable preset, a
// booking document that must not be stored — so it is passed on unchanged
// instead of being overwritten here.
const PASSTHROUGH_HEADERS = ["cache-control", "etag", "last-modified"];

// Conditional-request headers we hand upstream, so a revalidating browser gets
// the backend's own 304 instead of a full image re-fetch.
const CONDITIONAL_HEADERS = ["if-none-match", "if-modified-since"];

function isPrivateIp(ip: string) {
  if (!net.isIP(ip)) return false;
  // IPv4 private ranges
  const parts = ip.split(".").map(Number);
  const [a, b] = parts;
  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    ip === "127.0.0.1" ||
    ip === "::1"
  );
}

async function assertSafeHost(hostname: string) {
  if (!hostname) throw new H3Error("Invalid hostname");

  const addrs = await dns.lookup(hostname, { all: true });
  for (const a of addrs) {
    if (isPrivateIp(a.address)) {
      throw new H3Error("Blocked private IP");
    }
  }
}

// A foreign host is checked before we call it, so its redirects have to be
// checked too — otherwise an open redirect there walks us straight into the
// private network the check exists to keep us out of.
const MAX_REDIRECTS = 3;

/**
 * Resolves what was asked for into an absolute address.
 *
 * Media URLs arrive relative — the backend exports them that way so the same
 * response works behind any host — and are resolved against the configured
 * backend. External references arrive absolute and are taken as they are.
 */
function resolveTarget(rawUrl: string, apiBaseUrl: string) {
  if (rawUrl.startsWith("/")) {
    if (!apiBaseUrl) {
      throw new H3Error("Backend base URL is not configured");
    }

    return new URL(rawUrl, apiBaseUrl);
  }

  return new URL(rawUrl);
}

export default eventHandler(async (event) => {
  try {
    const { url: rawUrl } = getQuery(event);
    if (typeof rawUrl !== "string") {
      throw new H3Error("Missing url parameter");
    }

    const { apiBaseUrl } = useRuntimeConfig(event);
    const target = resolveTarget(rawUrl, apiBaseUrl);

    if (target.protocol !== "http:" && target.protocol !== "https:") {
      throw new H3Error("Only http/https allowed");
    }

    // The backend is the one private address we are allowed to reach: it is
    // configured by the operator, and in a container network it almost always
    // resolves to a private IP. Nothing else gets an exception.
    const isBackend =
      Boolean(apiBaseUrl) && target.origin === new URL(apiBaseUrl).origin;

    if (!isBackend) {
      await assertSafeHost(target.hostname);
    }

    const isMediaFile = isBackend && isMediaFilePath(target.pathname);

    const headers: Record<string, string> = {};
    if (isMediaFile) {
      for (const name of CONDITIONAL_HEADERS) {
        const value = getRequestHeader(event, name);
        if (value) headers[name] = value;
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // Redirects are followed by hand so every hop passes the same host check
    // as the first one. The backend is trusted for its whole chain.
    const res = await (async () => {
      let current = target;

      for (let hop = 0; ; hop++) {
        const response = await fetch(current.toString(), {
          redirect: isBackend ? "follow" : "manual",
          headers,
          signal: controller.signal,
        });

        const location = response.headers.get("location");
        if (response.status < 300 || response.status >= 400 || !location) {
          return response;
        }

        if (hop >= MAX_REDIRECTS) {
          throw new H3Error("Too many redirects");
        }

        current = new URL(location, current);
        if (current.protocol !== "http:" && current.protocol !== "https:") {
          throw new H3Error("Only http/https allowed");
        }
        await assertSafeHost(current.hostname);
      }
    })()
      .catch((e) => {
        if (e instanceof H3Error) throw e;
        throw new H3Error("Fetch failed: " + String(e));
      })
      .finally(() => clearTimeout(timer));

    const forwardHeaders = () => {
      if (!isMediaFile) {
        setHeader(event, "Cache-Control", EXTERNAL_CACHE_CONTROL);
        return;
      }

      for (const name of PASSTHROUGH_HEADERS) {
        const value = res.headers.get(name);
        if (value) setHeader(event, name, value);
      }
    };

    // The backend says the copy the browser already holds is still good.
    if (res.status === 304) {
      forwardHeaders();
      setResponseStatus(event, 304);
      return null;
    }

    if (!res.ok) {
      throw new H3Error(`Upstream ${res.status}`);
    }

    const ct = res.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) {
      throw new H3Error("Content is not an image");
    }

    // Begrenze Größe
    const reader = res.body!.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        received += value.byteLength;
        if (received > MAX_BYTES) {
          throw new H3Error("Image too large");
        }
        chunks.push(value);
      }
    }
    const buf = Buffer.concat(chunks);

    setHeader(event, "Content-Type", ct);
    forwardHeaders();
    return buf;
  } catch (err: unknown) {
    if (err instanceof H3Error) {
      return sendError(event, err);
    }
    const h3Error = createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: err instanceof Error ? err.message : String(err),
    });

    return sendError(event, h3Error);
  }
});
