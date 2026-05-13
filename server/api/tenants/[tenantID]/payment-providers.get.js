import { serverFetch } from "~~/server/api/utils/serverFetch.ts";


export default defineEventHandler(async (event) => {
    const tenantID = getRouterParam(event, "tenantID");



    const { data, error } = await serverFetch(event, `/api/tenants/${tenantID}/payment-apps`, {
        method: "GET",
    });

    if (error) {
        console.log(error);
        throw createError({
            statusCode: error.status || 500,
            statusMessage: "Failed to fetch Payment Apps",
            data: error.message,
        });
    }

    return data;

})