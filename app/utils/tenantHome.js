import { isNotAvailableError } from "~/utils/catalogDetail.js";

/**
 * Whether a failed load of a `/t/:tenantID` page means "this tenant is not
 * available": the bundle answered 404 ("Tenant Not Found"). A tenant that is
 * missing, declined or pending approval reads the same; a failing backend
 * stays a load error.
 */
export function isTenantNotAvailable({ tenantID, error }) {
  return Boolean(tenantID) && isNotAvailableError(error);
}
