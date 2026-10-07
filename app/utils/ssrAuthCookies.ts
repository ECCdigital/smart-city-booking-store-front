import type { H3Event } from "h3";

/** The cookies of the session, as `server/utils/authCookies.ts` names them. */
const AUTH_COOKIES = new Set(["access-token", "refresh-token", "auth-type"]);

type SetCookie = { name: string; value: string; cleared: boolean };

function parseSetCookie(line: string): SetCookie | null {
  const [pair = "", ...attributes] = line.split(";");
  const eq = pair.indexOf("=");
  if (eq < 1) return null;
  const maxAge = attributes
    .map((a) => a.trim().toLowerCase())
    .find((a) => a.startsWith("max-age="));
  const value = pair.slice(eq + 1).trim();
  return {
    name: pair.slice(0, eq).trim(),
    value,
    cleared: value === "" || (maxAge !== undefined && Number(maxAge.slice(8)) <= 0),
  };
}

function nameOf(line: string) {
  return line.slice(0, line.indexOf("=")).trim();
}

/** Puts the cookie on the page's answer, in place of an earlier one of the same name. */
function passToBrowser(event: H3Event, name: string, line: string) {
  const res = event.node.res;
  if (res.headersSent) return;
  const current = res.getHeader("set-cookie");
  const lines = current === undefined ? [] : Array.isArray(current) ? current : [String(current)];
  res.setHeader("set-cookie", [...lines.filter((l) => nameOf(l) !== name), line]);
}

/** Puts the cookie on the page's request, which every later BFF call of the render forwards. */
function passToRequest(event: H3Event, name: string, value: string | null) {
  const req = event.node.req;
  const pairs = (req.headers.cookie ?? "")
    .split(";")
    .map((p) => p.trim())
    .filter((p) => p && nameOf(p) !== name);
  if (value !== null) pairs.push(`${name}=${value}`);
  req.headers.cookie = pairs.join("; ");
}

/**
 * During server rendering the page calls the BFF in-process. When such a call
 * renews or ends the session, the new cookies land on the answer of that inner
 * call only, and the browser would keep the expired token
 * (ECCdigital/tickets#108). This hook hands the session cookies on to the
 * page's answer for the browser, and to the page's request, so the rest of the
 * render sends the renewed token too.
 *
 * @param event - The page's request, `useRequestEvent()`. Without one, in the
 *   browser, the hook does nothing: there the browser keeps the cookies itself.
 * @returns An ofetch `onResponse` hook.
 */
export function relayAuthCookies(event: H3Event | undefined) {
  return ({ response }: { response: Response }) => {
    if (!event) return;
    for (const line of response.headers.getSetCookie()) {
      const cookie = parseSetCookie(line);
      if (!cookie || !AUTH_COOKIES.has(cookie.name)) continue;
      passToBrowser(event, cookie.name, line);
      passToRequest(event, cookie.name, cookie.cleared ? null : cookie.value);
    }
  };
}
