/**
 * Dates, times and prices in the language the visitor is reading.
 *
 * Every format here used to be pinned to "de-DE", so an English page still
 * showed German dates and a German thousands separator. The locale now comes
 * from i18n; the mapping is explicit because `en` alone gives US ordering
 * (month first, 12-hour clock), which reads wrong next to a German original.
 *
 * Called in a component's setup, the composable keeps that component's locale,
 * so a handler or watcher that formats later still gets the page's language.
 * Called from a plain helper outside setup, where `useI18n()` throws, it reads
 * the locale lazily inside each function instead.
 */
const LOCALE_TAGS = {
  de: "de-DE",
  en: "en-GB",
};

function tagFor(code) {
  return LOCALE_TAGS[code] ?? LOCALE_TAGS.de;
}

function setupLocale() {
  try {
    return useI18n().locale;
  } catch {
    return null;
  }
}

export function useFormatting() {
  const locale = setupLocale();

  function currentTag() {
    if (locale) {
      return tagFor(locale.value);
    }
    const lazy = setupLocale();
    return lazy ? tagFor(lazy.value) : LOCALE_TAGS.de;
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString(currentTag(), {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * A day without its time: 20.10.2026 or 20/10/2026.
   *
   * @param options - Intl options that replace or add to the default parts
   */
  function formatDay(dateString, options = {}) {
    return new Date(dateString).toLocaleDateString(currentTag(), {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      ...options,
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

  /** A plain number, such as a distance, with the language's separators. */
  function formatNumber(value, options = {}) {
    return new Intl.NumberFormat(currentTag(), options).format(value);
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

  /**
   * The BCP-47 tag behind an i18n locale code, for the places that hand a
   * locale to someone else's formatter — the date picker, for one. This is the
   * only copy of the mapping; pass the code to keep the caller's own reactivity
   * intact, leave it out to read the current locale.
   *
   * @param code - an i18n locale code ("de", "en"), or nothing
   */
  function localeTag(code) {
    return code === undefined ? currentTag() : tagFor(code);
  }

  return {
    localeTag,
    formatDate,
    formatDay,
    formatTime,
    formatDateRange,
    formatPrice,
    formatNumber,
    formateDateToTimestamp,
    monthNames,
    weekdayNames,
  };
}
