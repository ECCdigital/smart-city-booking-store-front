import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const bookableID = getRouterParam(event, "bookableID");
  const body = await readBody(event);

  const { data, error } = await serverFetch(
    event,
    `/api/v2/${body.tenantID}/checkout/validate/${bookableID}`,
    {
      method: "POST",
      body: await readBody(event),
    }
  );

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message });
  }

  return data;
});
