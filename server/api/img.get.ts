import {
  eventHandler,
  getQuery,
  setHeader,
  sendError,
  createError,
  H3Error,
} from "h3";
import dns from "node:dns/promises";
import net from "node:net";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB Limit
const TIMEOUT_MS = 8000;

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

  const isDev = process.env.NODE_ENV === "development";
  if (isDev && (hostname === "localhost" || hostname === "127.0.0.1")) {
    return;
  }

  const addrs = await dns.lookup(hostname, { all: true });
  for (const a of addrs) {
    if (isPrivateIp(a.address)) {
      throw new H3Error("Blocked private IP");
    }
  }
}

export default eventHandler(async (event) => {
  try {
    const { url: rawUrl } = getQuery(event);
    if (typeof rawUrl !== "string") {
      throw new H3Error("Missing url parameter");
    }

    const u = new URL(rawUrl);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new H3Error("Only http/https allowed");
    }

    await assertSafeHost(u.hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(u.toString(), {
      redirect: "follow",
      signal: controller.signal,
    }).catch((e) => {
      throw new H3Error("Fetch failed: " + String(e));
    });
    clearTimeout(timer);

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

    // Optional: Transform mit sharp (strip metadata, resize etc.)
    // const processed = await sharp(buf).rotate().withMetadata({}).toBuffer()

    setHeader(event, "Content-Type", ct);
    setHeader(event, "Cache-Control", "public, max-age=3600, s-maxage=86400");
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
