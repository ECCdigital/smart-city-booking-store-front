const cleanQuery = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );

const unwrapResult = ({ data, error }, fallbackMessage) => {
  if (error) {
    const requestError = new Error(error.statusMessage || fallbackMessage);
    requestError.statusCode = error.statusCode;
    throw requestError;
  }

  return data;
};

const pathPart = (value) => encodeURIComponent(value);

export function useAccessPoints() {
  const api = useApiClient();

  const getAccessBookings = async (params = {}) => {
    const result = await api.get("/api/access/bookings", {
      query: cleanQuery(params),
    });

    return unwrapResult(
      result,
      "Buchungen mit Schließberechtigung konnten nicht geladen werden.",
    );
  };

  const getBookingsForAccessPoint = async (accessPointId, params = {}) => {
    const result = await api.get(
      `/api/access/access-points/${pathPart(accessPointId)}/bookings`,
      { query: cleanQuery(params) },
    );

    return unwrapResult(
      result,
      "Buchungen für den Access-Point konnten nicht geladen werden.",
    );
  };

  const getAccessPoints = async (tenant, bookingId) => {
    const result = await api.get(`/api/access/${pathPart(tenant)}/points`, {
      query: cleanQuery({ bookingId }),
    });

    return unwrapResult(result, "Access-Points konnten nicht geladen werden.");
  };

  const open = async (tenant, accessPointId, bookingId) => {
    const result = await api.post(
      `/api/access/${pathPart(tenant)}/${pathPart(accessPointId)}/open`,
      null,
      { query: cleanQuery({ bookingId }) },
    );

    return unwrapResult(result, "Access-Point konnte nicht geöffnet werden.");
  };

  const unlatch = async (tenant, accessPointId, bookingId) => {
    const result = await api.post(
      `/api/access/${pathPart(tenant)}/${pathPart(accessPointId)}/unlatch`,
      null,
      { query: cleanQuery({ bookingId }) },
    );

    return unwrapResult(result, "Access-Point konnte nicht entriegelt werden.");
  };

  const close = async (tenant, accessPointId, bookingId) => {
    const result = await api.post(
      `/api/access/${pathPart(tenant)}/${pathPart(accessPointId)}/close`,
      null,
      { query: cleanQuery({ bookingId }) },
    );

    return unwrapResult(
      result,
      "Access-Point konnte nicht geschlossen werden.",
    );
  };

  const getStatus = async (tenant, accessPointId, bookingId) => {
    const result = await api.get(
      `/api/access/${pathPart(tenant)}/${pathPart(accessPointId)}/status`,
      { query: cleanQuery({ bookingId }) },
    );

    return unwrapResult(result, "Status konnte nicht geladen werden.");
  };

  const getOpenStatus = async (
    tenant,
    accessPointId,
    bookingId,
    openProcessId,
  ) => {
    const result = await api.get(
      `/api/access/${pathPart(tenant)}/${pathPart(accessPointId)}/open-status`,
      { query: cleanQuery({ bookingId, openProcessId }) },
    );

    return unwrapResult(result, "Öffnungsstatus konnte nicht geladen werden.");
  };

  const pollOpenStatus = async (
    tenant,
    accessPointId,
    bookingId,
    openProcessId,
    { attempts = 15, intervalMs = 1500 } = {},
  ) => {
    let lastResponse = null;

    for (let attempt = 0; attempt < attempts; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }

      lastResponse = await getOpenStatus(
        tenant,
        accessPointId,
        bookingId,
        openProcessId,
      );

      const status = lastResponse?.data ?? lastResponse;
      if (status?.confirmed || status?.errorCode || status?.errorMessage) {
        return lastResponse;
      }
    }

    return lastResponse;
  };

  return {
    getAccessBookings,
    getBookingsForAccessPoint,
    getAccessPoints,
    open,
    unlatch,
    close,
    getStatus,
    getOpenStatus,
    pollOpenStatus,
  };
}
