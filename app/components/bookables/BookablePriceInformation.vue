<template>
  <div>
    <div
      v-for="(priceCategory, i) in relevantPriceCategories"
      :key="i"
      class="p-3 flex content-center w-full"
    >
      <!-- External category -->
      <template v-if="isExternalCategory(priceCategory)">
        <div class="basis-2/5 content-center text-right">
          {{ getExternalUnitLabel(priceCategory.unit) }}
        </div>
        <div class="basis-1/5" />
        <div class="basis-2/5 content-center">
          <span class="font-bold">
            {{ getGrossPrice(priceCategory.priceEur) }} €
          </span>
        </div>
      </template>

      <!-- Internal category -->
      <template v-else>
        <div v-if="hasPriceConditions(priceCategory)" class="basis-2/5">
          <div
            v-if="priceCategory.interval.end || priceCategory.interval.start"
            class="content-center text-right"
          >
            {{
              getInterval(
                priceCategory.interval.start,
                priceCategory.interval.end,
                item.priceType,
              )
            }}
          </div>
          <div v-else-if="priceCategory.weekdays.length > 0" class="text-right">
            <p v-for="(day, idx) in priceCategory.weekdays" :key="idx">
              {{ getWeekdayName(day) }}
            </p>
          </div>
          <div v-else-if="priceCategory.fixedPrice" class="flex justify-end">
            <UTooltip :text="fixedPriceHint">
              <UBadge class="ml-2" color="secondary" variant="outline">
                {{ $t("price.flatRate") }}
              </UBadge>
            </UTooltip>
          </div>
        </div>

        <div v-if="hasPriceConditions(priceCategory)" class="basis-1/5" />

        <div
          class="content-center"
          :class="
            hasPriceConditions(priceCategory)
              ? 'basis-2/5 '
              : 'text-center w-full'
          "
        >
          <span class="font-bold">
            {{ getGrossPrice(priceCategory.priceEur) }} €
          </span>
          <span v-if="!priceCategory.fixedPrice"> / {{ getUnit() }} </span>
        </div>
      </template>
    </div>

    <div v-if="holidayHint" class="text-center italic w-full">
      {{ holidayHint }}
    </div>
    <div v-if="forFreeHint" class="text-center w-full">
      {{ forFreeHint }}
    </div>
  </div>
</template>

<script setup>
import { useFormatting } from "~/composables/utils/useFormatting.js";

const { t } = useI18n();


const { weekdayNames } = useFormatting();

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  isEventWithMultipleCategories: {
    type: Boolean,
    default: false,
  },
});

function isExternalCategory(category) {
  return category.external === true;
}

const relevantPriceCategories = computed(() => {
  if (forFreeHint.value || !props.item.priceCategories) {
    return [];
  }
  return props.item.priceCategories.filter(
    (category) =>
      isExternalCategory(category) || category.holidays.length === 0,
  );
});

const forFreeHint = computed(() => {
  if (!props.item.priceCategories) return "";
  const internal = props.item.priceCategories.filter(
    (c) => !isExternalCategory(c),
  );
  if (
    internal.length === 1 &&
    (internal[0].priceEur === 0 || !internal[0].priceEur)
  ) {
    return t("price.itemIsFree");
  }
  return "";
});

const fixedPriceHint = computed(() => {
  const unit =
    props.item.priceType === "per-hour" || props.item.priceType === "per-day"
      ? t("price.duration")
      : t("price.quantity");
  return t("price.independentOf", { unit });
});

const holidayHint = computed(() => {
  if (!props.item.priceCategories) return "";
  if (
    props.item.priceCategories.some(
      (category) =>
        !isExternalCategory(category) && category.holidays.length > 0,
    )
  ) {
    return t("price.holidayHint");
  }
  return "";
});

function hasPriceConditions(priceCategory) {
  if (props.isEventWithMultipleCategories) {
    return true;
  } else if (
    priceCategory.weekdays.length > 0 ||
    priceCategory.interval.start ||
    priceCategory.interval.end ||
    priceCategory.fixedPrice
  ) {
    return true;
  }
  return false;
}

function getGrossPrice(price) {
  if (props.item.priceValueAddedTax) {
    const gross = price + (price * props.item.priceValueAddedTax) / 100;
    return gross.toFixed(2).toString().replace(/\./g, ",");
  }
  return price.toFixed(2).toString().replace(/\./g, ",");
}

function getUnit() {
  const type = props.item.priceType;
  if (type === "per-hour") {
    return t("price.unitHour");
  } else if (type === "per-day") {
    return t("price.unitDay");
  } else if (type === "per-square-meter") return "m²";
  else {
    return t("price.unitItem");
  }
}

function getExternalUnitLabel(unit) {
  const labels = {
    hour: t("price.perHourCap"),
    day: t("price.perDayCap"),
    week: t("price.perWeekCap"),
    month: t("price.perMonthCap"),
    year: t("price.perYearCap"),
    "service-fee": t("price.serviceFee"),
  };
  return labels[unit] || unit;
}

function getInterval(start, end, priceType) {
  const suffix = getUnit(priceType);
  let interval = "";
  if (!start) {
    interval = `bis ${end}`;
  }
  if (!end) {
    interval = `ab ${start}`;
  }
  if (start && end) {
    interval = `${start} - ${end}`;
  }
  return `${interval} ${suffix}`;
}

function getWeekdayName(dayNumber) {
  // From `Intl`, indexed the way `Date.prototype.getDay()` counts.
  return weekdayNames("long")[dayNumber];
}
</script>

<style scoped></style>
