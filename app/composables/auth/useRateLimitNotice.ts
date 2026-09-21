import { rateLimitWait, retryAfterWait } from "~~/shared/utils/retryAfter";

/**
 * The "try again in X" notice for a backend `429` with `Retry-After`. The
 * wording is the same for every address, so it discloses nothing about an
 * account.
 */
export function useRateLimitNotice() {
  const { t } = useI18n();
  const notification = useNotification();

  /** The wait hint for `seconds`; a plain "later" when no wait is named. */
  const waitMessage = (seconds: number | null) => {
    if (seconds === null) {
      return t("rateLimit.later");
    }
    const { unit, count } = retryAfterWait(seconds);
    return t(`rateLimit.${unit}`, { count }, count);
  };

  const notifyWait = (seconds: number | null) => {
    notification.error(waitMessage(seconds), t("rateLimit.title"));
  };

  /** Shows the notice when `error` is a rate limit and tells whether it was. */
  const notifyRateLimited = (error: unknown): boolean => {
    const wait = rateLimitWait(error);
    if (!wait) {
      return false;
    }
    notifyWait(wait.seconds);
    return true;
  };

  return { waitMessage, notifyWait, notifyRateLimited };
}
