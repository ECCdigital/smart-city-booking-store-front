import { forwardCustomerUpload } from "~~/server/utils/customerUploadProxy";
import { linkFieldPath, linkRequestOf } from "~~/server/utils/customerUploadLink";

/**
 * Hands a customer upload in with a guest's signed link:
 * the multipart body streams to `POST
 * /api/v2/:tenant/bookings/:id/customer-uploads-by-link/:fieldId`, without
 * the session. Answers `201 { customerUploadState }`.
 */
export default defineEventHandler((event) => {
  const { path, headers } = linkRequestOf(event, linkFieldPath(event));
  return forwardCustomerUpload(event, {
    method: "POST",
    path,
    headers,
    requireSignIn: false,
    withSession: false,
  });
});
