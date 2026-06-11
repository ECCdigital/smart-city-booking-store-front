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
  { maxAge: 300, swr: true }
);
