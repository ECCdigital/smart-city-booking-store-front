import { serverFetch } from "~~/server/api/utils/serverFetch.ts";
import { createConditionalCachedHandler } from "~~/server/utils/conditionalCache";

export default createConditionalCachedHandler(
  async (event) => {
    const { data, error } = await serverFetch(event, `/api/catalog/mode`, {
      method: "GET",
    });

    if (error) {
      throw createError({
        statusCode: error.status || 500,
        statusMessage: "Failed to fetch portal mode",
        data: error.message,
      });
    }

    return data;
  },
  // Stays cached: the answer is the portal mode, the portal URL and the
  // instance branding — no tenant, no offer, nothing a tenant supervision
  // decision changes. It is read on every SSR request, which is what the
  // cache is for.
  { maxAge: 300, swr: true }
);
