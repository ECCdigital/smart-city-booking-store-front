import {
  customerUploadPath,
  forwardCustomerUpload,
} from "~~/server/utils/customerUploadProxy";

/**
 * Replaces a customer upload not checked yet: the
 * multipart body streams to
 * `PUT /api/v2/:tenant/bookings/:id/customer-uploads/:fieldId/:mediaId`.
 * Answers `{ customerUploadState }`, a refusal as the backend sends it.
 */
export default defineEventHandler((event) =>
  forwardCustomerUpload(event, {
    method: "PUT",
    path: customerUploadPath(event, { withMedia: true }),
  }),
);
