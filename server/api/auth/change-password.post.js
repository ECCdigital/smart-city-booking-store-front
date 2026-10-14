import { serverFetch } from "~~/server/api/utils/serverFetch.ts";
import { proxyErrorOf } from "~~/server/utils/proxyError";

/**
 * The password change of the signed-in account: the backend takes it only
 * with the session and the current password, and names no other account.
 */
export default defineEventHandler(async (event) => {
    const { currentPassword, password } = await readBody(event);

    if (!currentPassword || !password) {
        throw createError({
            statusCode: 400,
            statusMessage: "Current password and password are required",
        });
    }

    const { data, error } = await serverFetch(event, "/auth/resetpassword", {
        method: "POST",
        body: {
            currentPassword: String(currentPassword),
            password: String(password).trim(),
        },
    });

    if (error) {
        throw createError(proxyErrorOf(error, "Password change failed"));
    }

    return {
        success: true,
        data,
    };
});
