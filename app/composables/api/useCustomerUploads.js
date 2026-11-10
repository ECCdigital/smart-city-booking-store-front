/**
 * The customer uploads of a booking through the BFF:
 * hand one in for an upload field, replace one, delete one while it is not
 * checked, or every chosen one of a booking at once. Each call answers `{ data, error }` as `useApiClient` does; on
 * success `data.customerUploadState` is the booking's state afresh.
 *
 * With `link`, the signed link of a guest's booking:
 * the calls go to `/api/proof-link/...` with the token in
 * `X-Customer-Upload-Link`, and `read` loads the one booking of the link.
 *
 * @param {Object} [options]
 * @param {string} [options.link] The token of a guest's link
 */
import { submissionFormOf } from "~/utils/customerUploads.js";

export function useCustomerUploads({ link = "" } = {}) {
  const api = useApiClient();
  const opts = link ? { headers: { "x-customer-upload-link": link } } : {};

  const fieldPath = (tenantId, bookingId, fieldId) =>
    link
      ? `/api/proof-link/${encodeURIComponent(fieldId)}`
      : `/api/bookings/${encodeURIComponent(tenantId)}/${encodeURIComponent(
          bookingId,
        )}/customer-uploads/${encodeURIComponent(fieldId)}`;

  const formOf = (file) => {
    const form = new FormData();
    form.append("file", file, file.name);
    return form;
  };

  /** The booking of the link: `{ tenant, booking }`. */
  const read = () => api.get("/api/proof-link", opts);

  const upload = (tenantId, bookingId, fieldId, file) =>
    api.post(fieldPath(tenantId, bookingId, fieldId), formOf(file), opts);

  const replace = (tenantId, bookingId, fieldId, mediaId, file) =>
    api.put(
      `${fieldPath(tenantId, bookingId, fieldId)}/${encodeURIComponent(mediaId)}`,
      formOf(file),
      opts,
    );

  const remove = (tenantId, bookingId, fieldId, mediaId) =>
    api.delete(
      `${fieldPath(tenantId, bookingId, fieldId)}/${encodeURIComponent(mediaId)}`,
      opts,
    );

  /**
   * Every chosen proof of a booking at once, the button „Nachweise
   * einreichen“: new files and replacements, all
   * stored or none.
   */
  const submitAll = (tenantId, bookingId, drafts) =>
    api.post(
      link
        ? "/api/proof-link"
        : `/api/bookings/${encodeURIComponent(tenantId)}/${encodeURIComponent(
            bookingId,
          )}/customer-uploads`,
      submissionFormOf(drafts),
      opts,
    );

  return { read, upload, replace, remove, submitAll };
}
