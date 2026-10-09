// A stand-in for the backend, answering only what the server render of the
// smoke pages asks for, from the fixtures beside this file. Any other request
// gets a 404 and is remembered, so a new backend call shows up in the log of
// the smoke test instead of silently rendering an error page.
import http from "node:http";
import { readFileSync } from "node:fs";

const fixture = (name) =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url)));

export const TENANT = "00000000-0000-4000-8000-0000000000aa";
export const BOOKABLE = "00000000-0000-4000-8000-0000000000b1";
export const EVENT = "00000000-0000-4000-8000-0000000000e1";

const bookable = fixture("bookable.json");
const event = fixture("event.json");

const routes = {
  "/api/catalog/mode": fixture("catalog-mode.json"),
  "/api/instances/public": fixture("instances-public.json"),
  "/api/catalog/themes": fixture("catalog-themes.json"),
  "/api/catalog/bundle": fixture("catalog-bundle.json"),
  [`/json/${TENANT}/bookables/`]: [bookable],
  [`/json/${TENANT}/events/`]: [event],
  [`/json/${TENANT}/bookables/${BOOKABLE}`]: bookable,
  [`/api/${TENANT}/bookables/public/${BOOKABLE}`]: bookable,
  [`/json/${TENANT}/events/${EVENT}`]: event,
  [`/api/${TENANT}/events/${EVENT}`]: event,
};

/**
 * Starts the stand-in on a free port.
 *
 * @returns {Promise<{ url: string, unknown: Set<string>, close: () => void }>}
 */
export function startBackendStub() {
  const unknown = new Set();
  const server = http.createServer((req, res) => {
    const path = req.url.split("?")[0];
    const body = req.method === "GET" ? routes[path] : undefined;
    if (body === undefined) {
      unknown.add(`${req.method} ${path}`);
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ success: false, message: "Not found" }));
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
        close: () => server.close(),
      });
    });
  });
}
