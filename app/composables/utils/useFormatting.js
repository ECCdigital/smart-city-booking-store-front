/**
 * Dates, times and prices in the language the visitor is reading.
 *
 * Every format here used to be pinned to "de-DE", so an English page still
 * showed German dates and a German thousands separator. The locale now comes
 * from i18n; the mapping is explicit because `en` alone gives US ordering
 * (month first, 12-hour clock), which reads wrong next to a German original.
 *
 * `useI18n()` is called lazily inside each function: the composable is also
 * used from plain helpers that run outside a component's setup, where reading
 * it eagerly would throw.
 */
const LOCALE_TAGS = {
  de: "de-DE",
  en: "en-GB",
};

function currentTag() {
  try {
    const { locale } = useI18n();
    return LOCALE_TAGS[locale.value] ?? LOCALE_TAGS.de;
  } catch {
    return LOCALE_TAGS.de;
  }
}

export function useFormatting() {
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString(currentTag(), {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString(currentTag(), {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDateRange(from, to) {
    if (!from || !to) {
      return "";
    }
    return `${formatDate(from)} – ${formatDate(to)}`;
  }

  function formateDateToTimestamp(date, time = "00:00") {
    const isoString = `${date}T${time}:00`;
    const isoDate = new Date(isoString);
    return isoDate.getTime();
  }

  function formatPrice(price) {
    return new Intl.NumberFormat(currentTag(), {
      style: "currency",
      currency: "EUR",
    }).format(price);
  }

  /**
   * Month and weekday names, from the platform rather than a translated list:
   * `Intl` already carries every language's names, so a hand-kept array would
   * only be a second, staler copy.
   *
   * @param style - "long" (Januar) or "short" (Jan)
   */
  function monthNames(style = "long") {
    const format = new Intl.DateTimeFormat(currentTag(), { month: style });
    return Array.from({ length: 12 }, (_, m) =>
      format.format(new Date(Date.UTC(2021, m, 1))),
    );
  }

  /** Weekday names starting at Sunday, matching `Date.prototype.getDay()`. */
  function weekdayNames(style = "long") {
    const format = new Intl.DateTimeFormat(currentTag(), { weekday: style });
    // 2021-08-01 was a Sunday.
    return Array.from({ length: 7 }, (_, d) =>
      format.format(new Date(Date.UTC(2021, 7, 1 + d))),
    );
  }

  return {
    formatDate,
    formatTime,
    formatDateRange,
    formatPrice,
    formateDateToTimestamp,
    monthNames,
    weekdayNames,
  };
}
