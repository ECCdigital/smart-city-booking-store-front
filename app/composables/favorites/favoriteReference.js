/**
 * The framework-free part of the favorites: how an Offer in the catalog maps
 * onto the reference the backend keeps (`tenantId`, `targetType`,
 * `targetId`), the key that tells references apart, and the backend error
 * code behind a failed write.
 */

export function targetTypeOf(item, isEvent = false) {
  return isEvent || item?.type === "event" ? "event" : "bookable";
}

export function referenceOf(item, isEvent = false) {
  return {
    tenantId: item?.tenantId,
    targetType: targetTypeOf(item, isEvent),
    targetId: item?.id,
  };
}

export function favoriteKey({ tenantId, targetType, targetId } = {}) {
  return `${targetType}:${tenantId}:${targetId}`;
}

export const FAVORITE_LIMIT_REACHED = "favorite.limit_reached";

/**
 * The backend's error code of a failed favorite write. The BFF rethrows the
 * backend body as the H3 error's `data`, which ofetch hands over nested one
 * level deeper; a bare body is read as well.
 */
export function favoriteErrorCodeOf(error) {
  return error?.data?.data?.code ?? error?.data?.code ?? null;
}

export function favoriteErrorParamsOf(error) {
  return error?.data?.data?.params ?? error?.data?.params ?? {};
}
