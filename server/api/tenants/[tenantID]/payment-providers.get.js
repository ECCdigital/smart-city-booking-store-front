import { serverFetch } from "~~/server/api/utils/serverFetch.ts";
import { proxyErrorOf } from "~~/server/utils/proxyError";


export default defineEventHandler(async (event) => {
    const tenantID = getRouterParam(event, "tenantID");



    const { data, error } = await serverFetch(event, `/api/tenants/${tenantID}/payment-apps`, {
        method: "GET",
    });

    if (error) {
        console.log(error);
        throw createError(proxyErrorOf(error, "Failed to fetch Payment Apps"));
    }

    return data;

})