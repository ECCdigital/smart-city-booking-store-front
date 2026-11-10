import {
  forwardByLink,
  linkFieldPath,
} from "~~/server/utils/customerUploadLink";

/**
 * Deletes a customer upload not checked yet, with a guest's signed link:
 * `DELETE
 * /api/v2/:tenant/bookings/:id/customer-uploads-by-link/:fieldId/:mediaId`.
 * Answers `{ customerUploadState }`.
 */
export default defineEventHandler((event) =>
  forwardByLink(event, "DELETE", linkFieldPath(event, { withMedia: true })),
);
