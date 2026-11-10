import {
  checkoutLimit,
  forwardCustomerUpload,
} from "~~/server/utils/customerUploadProxy";

/**
 * Every chosen proof of the signed-in booker's booking at once, the button
 * „Nachweise einreichen“: the multipart body
 * streams to `POST /api/v2/:tenant/bookings/:id/customer-uploads`, up to
 * the limit of a booking over all its files. Answers
 * `201 { customerUploadState }`, a refusal with the backend's status and
 * `{ code, params }`.
 */
export default defineEventHandler((event) => {
  const param = (name: string) =>
    encodeURIComponent(getRouterParam(event, name) ?? "");
  return forwardCustomerUpload(event, {
    method: "POST",
    path: `/api/v2/${param("tenantID")}/bookings/${param(
      "bookingId",
    )}/customer-uploads`,
    bodyLimit: checkoutLimit,
  });
});
