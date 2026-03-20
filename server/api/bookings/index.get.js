import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

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

    return data;
});