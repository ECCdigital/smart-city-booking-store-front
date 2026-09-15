import { adminOrigin } from "~~/shared/utils/adminOrigin";
import { HERO_PREVIEW_ROUTES } from "~~/shared/utils/heroPreviewRoutes";

/**
 * Lets the configured admin origin frame the Hero's Live Preview.
 *
 * The `frame-ancestors` source has to come from the environment at start-up:
 * the Docker image is built without one, and `routeRules` in `nuxt.config.js`
 * are fixed at build time. nuxt-security offers exactly this seam — it runs
 * its own Nitro plugins after every project plugin and fires
 * `nuxt-security:ready` before it resolves a single header — so the preview
 * routes get their extra ancestor here, at runtime, while every other route
 * keeps `'self'`. The static half of the rule — no `X-Frame-Options`, the
 * noindex header — stays in `nuxt.config.js`.
 *
 * With no admin origin configured nothing is added; the preview page answers
 * 404 in that case anyway.
 */
export default defineNitroPlugin((nitroApp) => {
  const origin = adminOrigin(useRuntimeConfig().public.adminBaseUrl);
  if (!origin) return;

  nitroApp.hooks.hook("nuxt-security:ready", () => {
    for (const route of HERO_PREVIEW_ROUTES) {
      nitroApp.hooks.callHook("nuxt-security:headers", {
        route,
        headers: {
          contentSecurityPolicy: { "frame-ancestors": ["'self'", origin] },
        },
      });
    }
  });
});
