import { serverFetch } from "../../../../../utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
    const tenantID = getRouterParam(event, "tenantID");
    const providerID = getRouterParam(event, "providerID");

    const { data, error } = await serverFetch(event, `/api/${tenantID}/locker/${providerID}/customer-service-info`, {
        method: "GET",
    });

    if (error) {
        throw createError({
            statusCode: error.status || 500,
            statusMessage: "Failed to fetch customer service info",
            data: error.message,
        });
    }

    return data;
});