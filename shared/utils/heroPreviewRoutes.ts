/**
 * The route patterns of the Hero's Live Preview, one per locale prefix
 * (`prefix_except_default`: German has none, English has `/en`).
 *
 * `nuxt.config.js` gives these routes their static rule — no
 * `X-Frame-Options`, `noindex` — and `server/plugins/hero-preview-headers.ts`
 * adds the admin origin to their `frame-ancestors` at start-up. One list, so
 * a new locale prefix is one edit.
 */
export const HERO_PREVIEW_ROUTES = ["/preview/**", "/en/preview/**"] as const;
