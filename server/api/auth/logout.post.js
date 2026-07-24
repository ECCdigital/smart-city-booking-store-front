import { clearAuthCookies } from "~~/server/utils/authCookies";

export default defineEventHandler(async (event) => {
  clearAuthCookies(event);
  return { success: true };
});
