<template>
  <div>
    <div class="flex">
      <div class="grid place-content-center shrink-0">
        <UIcon name="i-lucide-map-pin" class="size-5" />
      </div>
      <div
        v-if="location.length"
        class="px-3 min-w-0 whitespace-normal break-words"
      >
        {{ location }}
      </div>
      <div v-else class="italic px-3 min-w-0 whitespace-normal">
        {{ $t("bookableDetail.noAddress") }}
      </div>
      <div class="flex-1" />
      <div
        v-if="location.length && enableCopyButton"
        class="grid place-content-center shrink-0"
      >
        <UIcon
          name="i-lucide-copy"
          class="size-5 cursor-pointer"
          @click="copyAddressToClipboard"
        />
      </div>
    </div>
    <p v-if="showDistance && hasLocationParam && location.length">
      <UIcon name="i-lucide-navigation" class="size-5" />
      <span v-if="distance != null" class="p-3">{{ distance }} km </span>
      <span v-else class="italic p-3">{{ $t("common.distanceUnknown") }} </span>
    </p>
  </div>
</template>
<script setup>
import { useRoute } from "#imports";
import { useFormatting } from "~/composables/utils/useFormatting.js";

const { t } = useI18n();
const { formatNumber } = useFormatting();

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  enableCopyButton: {
    type: Boolean,
    default: false,
  },
  showDistance: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const hasLocationParam = computed(() => {
  return route.query.loc !== undefined;
});

const location = computed(() => {
  if (typeof props.item.location === "string") {
    return props.item.location;
  } else if (props.item.location && typeof props.item.location === "object") {
    return props.item.location.display_address || "";
  } else {
    return "";
  }
});

const distance = computed(() => {
  if (props.item.distanceMeter == null) return null;
  // Two decimals, none for whole kilometres.
  const km = Math.round(props.item.distanceMeter / 10) / 100;
  const digits = Number.isInteger(km) ? 0 : 2;
  return formatNumber(km, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
});

const copyAddressToClipboard = async () => {
  if (location.value.length) {
    await navigator.clipboard.writeText(location.value);
    const notification = useNotification();
    notification.success(
      t("bookableDetail.addressCopiedMessage"),
      t("bookableDetail.addressCopiedTitle"),
    );
  }
};
</script>

<style scoped></style>
