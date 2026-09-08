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
import {
  canReportStatus,
  readStatus,
  remoteOperable,
} from "~/utils/accessOpenFlow.js";
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

/**
 * The server-side eligibility is the authority (#18). A second, hand-rolled
 * sum in the client can only ever disagree with it - so where the server
 * names no remote-operable access point, none gets the button: a code door is
 * operable and still refuses the open (backend 4.3), and its badge says why.
 */
const canOperate = computed(() =>
  remoteOperable(props.booking, props.accessPoint.id),
);

function onStatus(next) {
  status.value = next;
}

/**
 * Asks only the doors that can answer, as the flow does (`refreshStatus`): a
 * locker at rest declares no `getStatus` and would return four nulls for the
 * request. One door's refusal is its own affair - this row keeps the answer it
 * has (or none) rather than letting the rejection escape the watcher.
 */
async function loadLockStatus() {
  if (!canReportStatus(props.accessPoint)) {
    return;
  }

  try {
    status.value = readStatus(
      await getStatus(
        props.booking.tenantId,
        props.accessPoint.id,
        props.booking.id,
      ),
    );
  } catch {
    // A door that refuses to answer stays "not asked" in the lock symbol.
  }
}

watch(
  () => [props.booking.tenantId, props.accessPoint.id, props.booking.id],
  loadLockStatus,
  { immediate: true },
);
</script>

<style scoped></style>
