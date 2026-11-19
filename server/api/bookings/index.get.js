import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

/**
 * The series (group bookings) of the user's bookings, by `tenantId:id`: one
 * `{ id, bookingCount }` per booking of a series.
 * The backend answers a signed-in user their own groups per tenant; a tenant
 * whose groups fail to load leaves its bookings without a series.
 */
async function seriesByBookingId(event, bookings) {
  const tenantIds = [
    ...new Set(bookings.map((booking) => booking.tenantId).filter(Boolean)),
  ];

  const answers = await Promise.all(
    tenantIds.map((tenantId) =>
      serverFetch(event, `/api/${tenantId}/group-bookings`, { method: "GET" }),
    ),
  );

  const series = new Map();
  answers.forEach(({ data }, index) => {
    if (!Array.isArray(data)) return;
    for (const group of data) {
      const bookingIds = group?.bookingIds ?? [];
      for (const bookingId of bookingIds) {
        series.set(`${tenantIds[index]}:${bookingId}`, {
          id: group.id,
          bookingCount: bookingIds.length,
        });
      }
    }
  });
  return series;
}

export default defineEventHandler(async (event) => {
    const start = performance.now();

    const { data, error } = await serverFetch(
        event,
        `/api/bookings/assigned`,
        {
            method: "GET",
        }
    );
    console.log(
        `[bookings] Backend fetch took ${(performance.now() - start).toFixed(0)}ms, count: ${data?.length ?? 0}`,
    );

    if (error) {
        throw createError({
            statusCode: error.status || 500,
            statusMessage: "Failed to fetch bookings",
            data: error.message,
        });
    }

    if (!Array.isArray(data) || data.length === 0) {
        return data;
    }

    const series = await seriesByBookingId(event, data);
    return data.map((booking) => {
        const bookingSeries = series.get(`${booking.tenantId}:${booking.id}`);
        return bookingSeries ? { ...booking, series: bookingSeries } : booking;
    });
});
