/**
 * The route patterns of the Hero's Live Preview.
 *
 * `nuxt.config.js` gives these routes their static rule — no
 * `X-Frame-Options`, `noindex` — and `server/plugins/hero-preview-headers.ts`
 * adds the admin origin to their `frame-ancestors` at start-up.
 *
 * It stays a list although there is one entry: under `strategy: "no_prefix"`
 * every language shares one path, and a prefixed strategy would add one
 * pattern per prefix here.
 */
export const HERO_PREVIEW_ROUTES = ["/preview/**"] as const;
