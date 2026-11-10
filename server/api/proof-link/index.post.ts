import {
  checkoutLimit,
  forwardCustomerUpload,
} from "~~/server/utils/customerUploadProxy";
import { linkRequestOf } from "~~/server/utils/customerUploadLink";

/**
 * Every chosen proof of a guest's booking at once, with the signed link:
 * the multipart body streams to `POST
 * /api/v2/:tenant/bookings/:id/customer-uploads-by-link`, without the
 * session, up to the limit of a booking over all its files. Answers
 * `201 { customerUploadState }`.
 */
export default defineEventHandler((event) => {
  const { path, headers } = linkRequestOf(event);
  return forwardCustomerUpload(event, {
    method: "POST",
    path,
    headers,
    requireSignIn: false,
    withSession: false,
    bodyLimit: checkoutLimit,
  });
});
