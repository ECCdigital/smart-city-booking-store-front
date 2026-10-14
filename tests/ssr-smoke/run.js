// Smoke test of the server render (ECCdigital/tickets#404): starts the built
// storefront (`.output/server/index.mjs`) against the backend stand-in and
// asks for each page once. Red when a page does not answer 200, misses its
// marker, or the server logs a request error. The unit tests never boot Nuxt,
// so a break that only shows on the server - as ECCdigital/tickets#395 did -
// passes them. Run after `npm run build`: `npm run test:ssr`.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import { startBackendStub, BOOKABLE, EVENT } from "./backend-stub.js";

const pages = [
  { path: "/", marker: "Smoke-Katalog" },
  { path: "/search", marker: "Smoke-Raum" },
  { path: "/login" },
  { path: "/register" },
  { path: `/bookables/${BOOKABLE}`, marker: "Smoke-Raum" },
  { path: `/events/${EVENT}`, marker: "Smoke-Veranstaltung" },
];

const serverEntry = new URL("../../.output/server/index.mjs", import.meta.url);

function freePort() {
  return new Promise((resolve) => {
    const s = net.createServer().listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

async function waitFor(url, ms) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try {
      await fetch(url);
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  return false;
}

if (!existsSync(serverEntry)) {
  console.error("No build found: run `npm run build` first.");
  process.exit(1);
}

const backend = await startBackendStub();
const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const log = [];
const server = spawn(process.execPath, [serverEntry.pathname], {
  env: {
    ...process.env,
    PORT: String(port),
    HOST: "127.0.0.1",
    NODE_ENV: "production",
    NUXT_API_BASE_URL: backend.url,
    NUXT_PUBLIC_API_BASE_URL: backend.url,
    NUXT_USER_BASE_URL: base,
    NUXT_PUBLIC_USER_BASE_URL: base,
    NUXT_CACHE_ENABLED: "false",
    NUXT_PUBLIC_SILENT_SSO_ENABLED: "false",
  },
});
server.stdout.on("data", (d) => log.push(String(d)));
server.stderr.on("data", (d) => log.push(String(d)));

const failures = [];
try {
  if (!(await waitFor(base, 30_000))) {
    failures.push("the server did not answer within 30 s");
  } else {
    for (const page of pages) {
      const res = await fetch(base + page.path, { redirect: "manual" });
      const html = await res.text();
      const ok =
        res.status === 200 && (!page.marker || html.includes(page.marker));
      console.log(`${ok ? "ok  " : "FAIL"} ${res.status} ${page.path}`);
      if (!ok) {
        failures.push(
          `${page.path}: ${res.status}` +
            (page.marker && !html.includes(page.marker)
              ? `, "${page.marker}" missing`
              : ""),
        );
      }
    }
  }
} finally {
  server.kill();
  backend.close();
}

const errors = log
  .join("")
  .split("\n")
  .filter((l) => l.includes("[request error]"));
if (errors.length)
  failures.push(`server logged ${errors.length} request error(s)`);
if (backend.unknown.size) {
  console.log(
    `Backend calls without a fixture (answered 404): ${[...backend.unknown].join(", ")}`,
  );
}
if (failures.length) {
  console.error(
    `\nSSR smoke test failed:\n- ${failures.join("\n- ")}\n\nServer log:\n${log.join("")}`,
  );
  process.exit(1);
}
console.log("\nSSR smoke test passed.");
