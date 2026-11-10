import { serverFetch } from "~~/server/api/utils/serverFetch";
import { proxyErrorOf } from "~~/server/utils/proxyError";
import { customerUploadPath } from "~~/server/utils/customerUploadProxy";
import { clientIpHeaders } from "~~/server/utils/rateLimit";

/**
 * Deletes a customer upload not checked yet, the customer's withdrawal:
 * `DELETE
 * /api/v2/:tenant/bookings/:id/customer-uploads/:fieldId/:mediaId`.
 * Answers `{ customerUploadState }`, a refusal as the backend sends it.
 */
export default defineEventHandler(async (event) => {
  const { data, error } = await serverFetch(
    event,
    customerUploadPath(event, { withMedia: true }),
    { method: "DELETE", headers: clientIpHeaders(event) },
  );

  if (error) {
    if (error.status === 429) {
      const seconds = (error.data as { params?: { retryAfterSeconds?: number } })
        ?.params?.retryAfterSeconds;
      if (seconds) setResponseHeader(event, "Retry-After", seconds);
    }
    throw createError(proxyErrorOf(error, "Customer upload not deleted"));
  }
  return data;
});
