import {
  checkoutLimit,
  forwardCustomerUpload,
} from "~~/server/utils/customerUploadProxy";

/**
 * The checkout of a single booking with the files of its upload fields "in
 * the checkout": the multipart body - the checkout
 * as JSON in `checkout`, each file in `customerUpload:<fieldId>` - streams
 * to `POST /api/v2/:tenant/checkout`, never buffered here. A guest books
 * too. A body above the instance limit of a booking's files is refused
 * before the backend is asked; the backend's answer comes back as it is,
 * `{ success, data | error }` like `complete.post.js`.
 *
 * `?tenantID=` names the tenant: the body is a stream and is not read here.
 */
export default defineEventHandler((event) => {
  const { tenantID } = getQuery(event);
  if (!tenantID || typeof tenantID !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing tenantID",
    });
  }

  return forwardCustomerUpload(event, {
    method: "POST",
    path: `/api/v2/${encodeURIComponent(tenantID)}/checkout?simulate=false`,
    requireSignIn: false,
    bodyLimit: checkoutLimit,
  });
});
