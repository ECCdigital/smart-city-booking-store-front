import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);

    const { data, error } = await serverFetch(
        event,
        `/api/user`,
        {
            method: "PUT",
            body: body,
        }
    );

    if (error) {
        throw createError({
            statusCode: error.status || 500,
            statusMessage: "Failed to update user",
            data: error.message,
        });
    }

    return data;
});