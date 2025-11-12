import {apiFetch} from "../../../utils/apiFetch.js";

export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");
  const bookableID = getRouterParam(event, "bookableId");
  const body = await readBody(event);

  try {
      return await apiFetch(
        event,
        `/api/${tenantID}/checkout/validateItem`,
        {
            method: "POST",
            body: {
                bookableId: bookableID,
                timeBegin: body.start,
                timeEnd: body.end,
                amount: 1,
            },
        },
    );
  } catch (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to check bookable calculatedPrice",
      data: error.message,
    });
  }
});
