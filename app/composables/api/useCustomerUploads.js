/**
 * The customer uploads of a booking through the BFF:
 * hand one in for an upload field, replace one, delete one while it is not
 * checked. Each call answers `{ data, error }` as `useApiClient` does; on
 * success `data.customerUploadState` is the booking's state afresh.
 */
export function useCustomerUploads() {
  const api = useApiClient();

  const fieldPath = (tenantId, bookingId, fieldId) =>
    `/api/bookings/${encodeURIComponent(tenantId)}/${encodeURIComponent(
      bookingId,
    )}/customer-uploads/${encodeURIComponent(fieldId)}`;

  const formOf = (file) => {
    const form = new FormData();
    form.append("file", file, file.name);
    return form;
  };

  const upload = (tenantId, bookingId, fieldId, file) =>
    api.post(fieldPath(tenantId, bookingId, fieldId), formOf(file));

  const replace = (tenantId, bookingId, fieldId, mediaId, file) =>
    api.put(
      `${fieldPath(tenantId, bookingId, fieldId)}/${encodeURIComponent(mediaId)}`,
      formOf(file),
    );

  const remove = (tenantId, bookingId, fieldId, mediaId) =>
    api.delete(
      `${fieldPath(tenantId, bookingId, fieldId)}/${encodeURIComponent(mediaId)}`,
    );

  return { upload, replace, remove };
}
