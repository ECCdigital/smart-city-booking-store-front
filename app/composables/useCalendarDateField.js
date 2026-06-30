import {
  calendarDateToJsDate,
  jsDateToCalendarDate,
  readCalendarDateFromDateFieldRoot,
} from "~/utils/localDate.js";

function isCompleteCalendarDate(val) {
  return !!(val?.year && val?.month && val?.day && val.year >= 1000);
}

function sameDateTime(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  const dateA = a instanceof Date ? a : new Date(a);
  const dateB = b instanceof Date ? b : new Date(b);
  return (
    !Number.isNaN(dateA.getTime()) &&
    !Number.isNaN(dateB.getTime()) &&
    dateA.getTime() === dateB.getTime()
  );
}

/**
 * Keeps UInputDate on an internal CalendarDate while the field is focused so
 * partial years (e.g. "2" while typing "2026") are not committed upstream.
 * Tab navigation only updates visible segments in reka-ui, so we read the DOM
 * on blur/focus-out before committing.
 */
export function useCalendarDateField(model, { getFieldRoot } = {}) {
  const internalCalendarDate = shallowRef(null);
  const isFocused = ref(false);

  function commitModelValue(val = internalCalendarDate.value) {
    const next = val ? calendarDateToJsDate(val) : null;
    if (sameDateTime(model.value, next)) return;
    model.value = next;
  }

  function syncFromDom() {
    const root = getFieldRoot?.();
    const fromDom = readCalendarDateFromDateFieldRoot(root);
    if (fromDom) {
      internalCalendarDate.value = fromDom;
      return true;
    }
    return false;
  }

  watch(
    model,
    (value) => {
      if (isFocused.value) return;
      internalCalendarDate.value = jsDateToCalendarDate(value);
    },
    { immediate: true },
  );

  watch(internalCalendarDate, (val) => {
    if (!isFocused.value || !isCompleteCalendarDate(val)) return;
    commitModelValue(val);
  });

  function onDateFieldFocus() {
    isFocused.value = true;
  }

  function commitCalendarDate() {
    isFocused.value = false;
    syncFromDom();
    if (
      internalCalendarDate.value &&
      !isCompleteCalendarDate(internalCalendarDate.value)
    ) {
      internalCalendarDate.value = jsDateToCalendarDate(model.value);
      return;
    }
    commitModelValue();
  }

  function onFieldFocusOut(event) {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    commitCalendarDate();
  }

  function setCalendarDateFromPicker(date) {
    const cal = jsDateToCalendarDate(date);
    internalCalendarDate.value = cal;
    isFocused.value = false;
    commitModelValue(cal);
  }

  function clearCalendarDate() {
    internalCalendarDate.value = null;
    isFocused.value = false;
    model.value = null;
  }

  return {
    internalCalendarDate,
    onDateFieldFocus,
    commitCalendarDate,
    onFieldFocusOut,
    setCalendarDateFromPicker,
    clearCalendarDate,
  };
}
