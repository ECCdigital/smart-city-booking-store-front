<template>
  <div>
    <div class="flex items-center gap-2 my-2">
      <div
        class="flex shrink-0 items-center justify-center rounded-lg w-8 h-8"
        :class="lock.background"
        :title="t(lock.labelKey)"
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
          <!-- the Access Window first, the code hint under it -->
          <AccessWindowLine :access-point="accessPoint" />
          <p v-if="needsCodeAtDoor(accessPoint)">
            {{ t("mobileKey.accessPoint.codeHint") }}
          </p>
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
import { useAccessNow } from "~/composables/useAccessClock.js";
import AccessPointPanel from "~/components/mobileKey/AccessPointPanel.vue";
import AccessWindowLine from "~/components/mobileKey/AccessWindowLine.vue";
import {
  canReportStatus,
  readStatus,
  remoteOperable,
} from "~/utils/accessOpenFlow.js";
import {
  accessPointLock,
  accessPointTitle,
  needsCodeAtDoor,
} from "~/utils/accessPointDisplay.js";

const { t } = useI18n();

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
const now = useAccessNow();
const status = ref(undefined);

const lock = computed(() => accessPointLock(status.value));

/**
 * The server-side eligibility is the authority (#18). A second, hand-rolled
 * sum in the client can only ever disagree with it - so where the server
 * names no remote-operable access point, none gets the button: a code door is
 * operable and still refuses the open (backend 4.3), and the code hint below
 * the title says what to do instead.
 *
 * Read against the page's clock as well: the list is a fact from the last
 * load, and a door whose window has ended since greys its button where it
 * stands - no request, nothing moves under the thumb.
 */
const canOperate = computed(() =>
  remoteOperable(props.booking, props.accessPoint.id, now.value),
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
