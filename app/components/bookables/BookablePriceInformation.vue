<template>
  <div>
    <div
        v-for="(priceCategory, i) in relevantPriceCategories"
        :key="i"
        class="p-3 flex content-center w-full"
    >
      <div v-if="hasPriceConditions(priceCategory)" class="basis-2/5">
        <div
            v-if="priceCategory.interval.end || priceCategory.interval.start"
            class="content-center text-right"
        >
          {{
            getInterval(
                priceCategory.interval.start,
                priceCategory.interval.end,
                item.priceType
            )
          }}
        </div>
        <div v-else-if="priceCategory.weekdays.length > 0" class="text-right">
          <p v-for="(day, i) in priceCategory.weekdays" :key="i">
            {{getWeekdayName(day)}}
          </p>
        </div>
        <div v-else-if="priceCategory.fixedPrice" class="flex justify-end">
          <UTooltip :text="fixedPriceHint">
            <UBadge
                class="ml-2"
                color="secondary"
                variant="outline"
            >
              Pauschalpreis
            </UBadge>
          </UTooltip>
        </div>
      </div>

      <div v-if="hasPriceConditions(priceCategory)" class="basis-1/5" />

      <div
          class="content-center"
          :class="hasPriceConditions(priceCategory) ? 'basis-2/5 ': 'text-center w-full'"
      >
         <span class="font-bold">
        {{ getGrossPrice(priceCategory.priceEur) }} €
        </span>
        <span v-if="!priceCategory.fixedPrice" >
        / {{ getUnit() }}
        </span>
      </div>
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
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  isEventWithMultipleCategories: {
    type: Boolean,
    default: false,
  },
})

const relevantPriceCategories = computed(() => {
  if(forFreeHint.value){
    return []
  }
  return props.item.priceCategories.filter(category => category.holidays.length === 0);
});

const forFreeHint = computed(() => {
  if(
      props.item.priceCategories.length === 1 &&
      (props.item.priceCategories[0].priceEur === 0 || !props.item.priceCategories[0].priceEur)
  ){
    return "Das Objekt ist kostenlos."
  }
  return ""
})

const fixedPriceHint = computed(() => {
  const unit = (props.item.priceType === 'per-hour' || props.item.priceType === 'per-day') ? 'Dauer' : 'Menge'
      return "Dieser Preis gilt unabhängig von der gebuchten " + unit + "."
    }
);
const holidayHint = computed(() => {
  if(props.item.priceCategories.some(category => category.holidays.length > 0)){
    return "(An Feiertagen können abweichende Preise gelten.)"
  }
  return ""
})

function hasPriceConditions(priceCategory) {
  if(props.isEventWithMultipleCategories){
    return true
  } else if(priceCategory.weekdays.length > 0 ||
      priceCategory.interval.start ||
      priceCategory.interval.end ||
          priceCategory.fixedPrice
  ){
    return true
  }
    return false
}
function getGrossPrice(price){
  if(props.item.priceValueAddedTax){
    const gross = price + (price * props.item.priceValueAddedTax) / 100;
    return gross.toFixed(2).toString().replace(/\./g, ",");
  }
  return price
}
function getUnit() {
  const type = props.item.priceType;
  if (type === "per-hour") {
    return "Std.";
  } else if (type === "per-day") {
    return "Tag(e)";
  } else if (type === "per-square-meter")
    return "m²";
  else {
    return "Stück";
  }
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
  const days = [
    "Sonntag",
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
  ];
  return days[dayNumber];
}

</script>


<style scoped>

</style>