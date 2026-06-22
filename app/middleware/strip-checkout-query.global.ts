import {
  hasCheckoutQueryKeys,
  isCheckoutPath,
  stripCheckoutQuery,
} from "~/utils/checkoutQuery";

export default defineNuxtRouteMiddleware((to, from) => {
  if (!isCheckoutPath(from.path) || isCheckoutPath(to.path)) return;
  if (!hasCheckoutQueryKeys(to.query as Record<string, unknown>)) return;

  return {
    path: to.path,
    hash: to.hash,
    params: to.params,
    query: stripCheckoutQuery(to.query as Record<string, unknown>),
  };
});
