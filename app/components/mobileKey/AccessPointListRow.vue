<template>
  <div>
    <div class="flex items-center gap-2 my-2">
      <div
        class="flex shrink-0 items-center justify-center rounded-lg w-8 h-8"
        :class="lock.background"
        :title="lock.label"
      >
        <UIcon
          :name="lock.icon"
          class="w-5 h-5 font-bold"
          :class="lock.color"
        />
      </div>

      <div class="lg:flex lg:gap-2 lg:items-center basis-6/7">
        <div class="text-md font-semibold line-clamp-2">
          {{ accessPointTitle(accessPoint) }}
        </div>
        <div class="text-sm text-neutral-500">
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            :class="accessPointMode(accessPoint).color"
          >
            <UIcon
              :name="accessPointMode(accessPoint).icon"
              class="w-3.5 h-3.5"
            />
            {{ accessPointMode(accessPoint).label }}
          </span>
        </div>
      </div>

      <div class="flex-1" />
      <!--
        The flow reports every status it learns; there is nothing left to
        ask the server for once the panel closes.
      -->
      <AccessPointPanel
        :tenant-id="String(booking.tenantId)"
        :access-point="accessPoint"
        :booking="booking"
        :deny-access="!canOperate"
        @status="onStatus"
      />
    </div>
    <USeparator
      v-if="showSeparator"
      color="primary"
      type="solid"
      size="xs"
      class="w-full my-1"
    />
  </div>
</template>
<script setup>
import { useAccessPoints } from "~/composables/api/useAccessPoints.js";
import AccessPointPanel from "~/components/mobileKey/AccessPointPanel.vue";
import { readStatus } from "~/utils/accessOpenFlow.js";
import {
  accessPointLock,
  accessPointMode,
  accessPointTitle,
} from "~/utils/accessPointDisplay.js";

const props = defineProps({
  accessPoint: {
    type: Object,
    required: true,
  },
  booking: {
    type: Object,
    required: true,
  },
  showSeparator: {
    type: Boolean,
    default: false,
  },
});

const { getStatus } = useAccessPoints();
const status = ref(undefined);

const lock = computed(() => accessPointLock(status.value));

const canOperate = computed(
  () =>
    props.booking.accessEligibility?.operableAccessPointIds?.includes(
      String(props.accessPoint.id),
    ) ?? false,
);

function onStatus(next) {
  status.value = next;
}

async function loadLockStatus() {
  status.value = readStatus(
    await getStatus(
      props.booking.tenantId,
      props.accessPoint.id,
      props.booking.id,
    ),
  );
}

watch(
  () => [props.booking.tenantId, props.accessPoint.id, props.booking.id],
  loadLockStatus,
  { immediate: true },
);
</script>

<style scoped></style>
