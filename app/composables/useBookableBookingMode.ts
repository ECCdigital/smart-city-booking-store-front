export type BookableBookingMode =
  | "schedule"
  | "timePeriod"
  | "longRangeWeek"
  | "longRangeMonth"
  | "blockPeriod"
  | "none";

type BookableLike = {
  isScheduleRelated?: boolean;
  isTimePeriodRelated?: boolean;
  isLongRange?: boolean;
  isBlockPeriodRelated?: boolean;
  longRangeOptions?: { type?: string };
};

export function getBookableBookingMode(
  bookable: BookableLike | null | undefined,
): BookableBookingMode {
  if (!bookable) return "none";

  if (bookable.isBlockPeriodRelated === true) return "blockPeriod";
  if (bookable.isScheduleRelated === true) return "schedule";
  if (bookable.isTimePeriodRelated === true) return "timePeriod";
  if (bookable.isLongRange === true) {
    const type = bookable.longRangeOptions?.type;
    if (type === "week") return "longRangeWeek";
    if (type === "month") return "longRangeMonth";
  }

  return "none";
}

export function requiresExactBookingPeriod(mode: BookableBookingMode): boolean {
  return (
    mode === "longRangeWeek" ||
    mode === "longRangeMonth" ||
    mode === "blockPeriod"
  );
}

export function useBookableBookingMode(
  bookable: MaybeRef<BookableLike | null | undefined>,
) {
  const mode = computed(() => getBookableBookingMode(toValue(bookable)));

  const requiresTimeSelection = computed(() => mode.value !== "none");

  const requiresExactPeriod = computed(() =>
    requiresExactBookingPeriod(mode.value),
  );

  const isScheduleRelated = computed(() => mode.value === "schedule");
  const isTimePeriodRelated = computed(() => mode.value === "timePeriod");
  const isLongRangeWeek = computed(() => mode.value === "longRangeWeek");
  const isLongRangeMonth = computed(() => mode.value === "longRangeMonth");
  const isBlockPeriodRelated = computed(() => mode.value === "blockPeriod");

  return {
    mode,
    requiresTimeSelection,
    requiresExactPeriod,
    isScheduleRelated,
    isTimePeriodRelated,
    isLongRangeWeek,
    isLongRangeMonth,
    isBlockPeriodRelated,
  };
}
