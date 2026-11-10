import { forwardByLink } from "~~/server/utils/customerUploadLink";

/**
 * The one booking of a guest's signed link, the
 * token in `X-Customer-Upload-Link`: `GET
 * /api/v2/:tenant/bookings/:id/customer-uploads-by-link`. Answers
 * `{ tenant, booking }` with the booking's `customerUploadState`, a
 * refusal (`customer_upload_link_invalid`, `_expired`) as the backend sends
 * it.
 */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  return forwardByLink(event, "GET");
});
