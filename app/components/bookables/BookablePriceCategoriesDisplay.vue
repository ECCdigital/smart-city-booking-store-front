<template>
  <div
      v-for="(priceCategory, i) in props.item.priceCategories"
      :key="i"
      class="bg-gray-300 rounded-lg p-3 mb-2 flex content-center"
  >
    <span class="font-bold mr-1 content-center ">{{ item?.title }}</span>
    <span v-if="priceCategory.interval.end || priceCategory.interval.start" class="content-center ">
       / {{
        getPrice(
            priceCategory.interval.start,
            priceCategory.interval.end,
            item.priceType
        )
      }}
    </span>
    <UBadge
        v-if="priceCategory.fixedPrice"
        class="ml-2"
        color="secondary"
        variant="outline"
    >
      Pauschalpreis
    </UBadge>

    <div class="flex-1" />
    <span v-if="priceCategory.priceEur === 0" class="mx-2 font-bold content-center ">Kostenlos</span>
    <span v-else class="mx-2 font-bold content-center ">{{ priceCategory.priceEur }} €</span>
    <!-- toDo - add user price!!!! -->
    <UButton
        v-if="!isNotBookable"
        label="Buchen"
        class="justify-center px-5"
        :style="{ color: contrastToPrimary }"
        @click="onCheckout"
    />
  </div>
</template>
<script setup>
import {useContrastColor} from "~/composables/utils/useContrastColor.js";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  isNotBookable: {
    type: Boolean,
    required: false,
    default: false,
  },
})
const emit = defineEmits(["checkout"]);

const contrastToPrimary = computed(() =>
    useContrastColor().contrastToPrimary()
);

function getPrice(start, end, priceType) {
  const suffix = intervalSuffix(priceType);
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
function intervalSuffix(type) {
  if (type === "per-hour") {
    return "Std.";
  } else if (type === "per-day") {
    return "Tage";
  } else if (type === "per-square-meter")
    return "m²";
  else {
    return "Stück";
  }
}

function onCheckout() {
  const route = useRoute();
  emit("checkout",{
    id: props.item.id,
    tenantId: props.item.tenantId,
    start: route.query.start,
    end: route.query.end,
  });
}
</script>


<style scoped>

</style>