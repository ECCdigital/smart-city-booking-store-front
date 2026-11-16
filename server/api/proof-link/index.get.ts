import { forwardByLink } from "~~/server/utils/customerUploadLink";

/**
 * The bookings of a guest's signed link, the
 * token in `X-Customer-Upload-Link`: `GET
 * /api/v2/:tenant/customer-uploads-by-link` - the one booking of a
 * booking's link, every booking of the series not ended yet of a series'
 * link. Answers `{ tenant, bookings }`, each booking with its
 * `customerUploadState`, a refusal (`customer_upload_link_invalid`,
 * `_expired`) as the backend sends it.
 */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  return forwardByLink(event, "GET", "", $fetch, { all: true });
});
