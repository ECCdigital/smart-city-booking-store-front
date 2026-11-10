import { forwardCustomerUpload } from "~~/server/utils/customerUploadProxy";
import { linkFieldPath, linkRequestOf } from "~~/server/utils/customerUploadLink";

/**
 * Replaces a customer upload not checked yet, with a guest's signed link:
 * `PUT
 * /api/v2/:tenant/bookings/:id/customer-uploads-by-link/:fieldId/:mediaId`.
 */
export default defineEventHandler((event) => {
  const { path, headers } = linkRequestOf(
    event,
    linkFieldPath(event, { withMedia: true }),
  );
  return forwardCustomerUpload(event, {
    method: "PUT",
    path,
    headers,
    requireSignIn: false,
    withSession: false,
  });
});
