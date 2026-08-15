<template>
  <div class="space-y-5">
    <AccessPointStatusScreen
      :icon="screen.icon"
      :color="screen.color"
      :title="screen.title"
      :description="screen.description"
    />

    <UButton
      v-if="screen.exit?.retry"
      block
      icon="i-lucide-refresh-cw"
      class="py-3 shadow-lg cursor-pointer"
      @click="emit('retry', screen.exit.retry)"
    >
      {{ screen.exit.label }}
    </UButton>
    <UButton
      v-else-if="screen.exit"
      block
      :to="screen.exit.to"
      class="py-3 shadow-lg cursor-pointer"
    >
      {{ screen.exit.label }}
    </UButton>
  </div>
</template>

<script setup>
import AccessPointStatusScreen from "~/components/mobileKey/AccessPointStatusScreen.vue";
import { useFormatting } from "~/composables/utils/useFormatting.js";
import { buildErrorScreen } from "~/utils/accessErrorScreens.js";

const props = defineProps({
  /** An `ACCESS_ERRORS` value from `~/utils/accessOpenFlow.js`. */
  kind: {
    type: String,
    required: true,
  },
  /**
   * The access point by name. The wording never says "the door" - it says
   * which one, so the caller has to have a name ready even where the sticker
   * never resolved.
   */
  accessPointLabel: {
    type: String,
    required: true,
  },
  /** The booking the failure is about, where there is one. */
  booking: {
    type: Object,
    default: null,
  },
  /** Tenant from the scanned URL - the ways out stay inside it. */
  tenantId: {
    type: String,
    required: true,
  },
  /** The server's own reason, shown when no screen speaks for it. */
  blockingReason: {
    type: String,
    default: null,
  },
});

/**
 * Carries `"status"`: what the caller should re-read. The table's other value,
 * `"action"`, never travels this way - those rows show no button of their own,
 * because the control button under the screen is their repeat.
 */
const emit = defineEmits(["retry"]);

const { t } = useI18n();
const { formatDate } = useFormatting();

const screen = computed(() =>
  buildErrorScreen(props.kind, {
    t,
    label: props.accessPointLabel,
    booking: props.booking,
    tenantId: props.tenantId,
    blockingReason: props.blockingReason,
    date: props.booking?.timeBegin ? formatDate(props.booking.timeBegin) : null,
  }),
);
</script>
