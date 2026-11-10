import {
  customerUploadPath,
  forwardCustomerUpload,
} from "~~/server/utils/customerUploadProxy";

/**
 * Hands a customer upload in for an upload field of the signed-in booker's
 * booking: the multipart body streams to
 * `POST /api/v2/:tenant/bookings/:id/customer-uploads/:fieldId`. Answers
 * `201 { customerUploadState }`, a refusal with the backend's status and
 * `{ code, params }`.
 */
export default defineEventHandler((event) =>
  forwardCustomerUpload(event, {
    method: "POST",
    path: customerUploadPath(event),
  }),
);
