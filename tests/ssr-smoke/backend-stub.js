// A stand-in for the backend, answering only what the server render of the
// smoke pages asks for, from the fixtures beside this file. Any other request
// gets a 404 and is remembered, so a new backend call shows up in the log of
// the smoke test instead of silently rendering an error page.
import http from "node:http";
import { readFileSync } from "node:fs";
import { fontRoutes } from "./font.js";

const fixture = (name) =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url)));

export const TENANT = "00000000-0000-4000-8000-0000000000aa";
export const BOOKABLE = "00000000-0000-4000-8000-0000000000b1";
export const EVENT = "00000000-0000-4000-8000-0000000000e1";

/** A catalog of its own, with a stylesheet of its own (ECCdigital/tickets#555). */
export const CATALOG = "smoke";

const bookable = fixture("bookable.json");
const event = fixture("event.json");

/** The Theme Bundle of the fixture, with every setting the storefront reads. */
export const THEMES = fixture("catalog-themes.json");

const routes = {
  "/api/catalog/mode": fixture("catalog-mode.json"),
  "/api/instances/public": fixture("instances-public.json"),
  "/api/catalog/themes": THEMES,
  "/api/catalog/bundle": fixture("catalog-bundle.json"),
  [`/api/catalog/${CATALOG}`]: {
    ...fixture("catalog-bundle.json").catalog,
    slug: CATALOG,
    active: true,
    type: "catalog",
  },
  [`/json/${TENANT}/bookables/`]: [bookable],
  [`/json/${TENANT}/events/`]: [event],
  [`/json/${TENANT}/bookables/${BOOKABLE}`]: bookable,
  [`/api/${TENANT}/bookables/public/${BOOKABLE}`]: bookable,
  [`/json/${TENANT}/events/${EVENT}`]: event,
  [`/api/${TENANT}/events/${EVENT}`]: event,
  ...fontRoutes,
};

/**
 * Starts the stand-in on a free port.
 *
 * `routes` is the live table: a check may swap a fixture for a request and put
 * it back, since the smoke server revalidates the Theme Bundle on every read.
 * `hits` counts the requests per path, answered or not.
 *
 * @param {{ themes?: object }} [options] - A Theme Bundle to answer with in
 *   place of the fixture's.
 * @returns {Promise<{ url: string, unknown: Set<string>, hits: Map<string, number>, routes: Record<string, unknown>, close: () => void }>}
 */
export function startBackendStub({ themes = THEMES } = {}) {
  const unknown = new Set();
  const hits = new Map();
  const answers = {
    ...routes,
    "/api/catalog/themes": themes,
    [`/api/catalog/themes/${CATALOG}`]: themes,
  };
  const server = http.createServer((req, res) => {
    const path = req.url.split("?")[0];
    hits.set(path, (hits.get(path) ?? 0) + 1);
    const body = req.method === "GET" ? answers[path] : undefined;
    if (body === undefined) {
      unknown.add(`${req.method} ${path}`);
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ success: false, message: "Not found" }));
      return;
    }
    if (Buffer.isBuffer(body)) {
      res.writeHead(200, { "content-type": "font/woff2" });
      res.end(body);
      return;
    }
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(body));
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({
        url: `http://127.0.0.1:${port}`,
        unknown,
        hits,
        routes: answers,
        close: () => server.close(),
      });
    });
  });
}
