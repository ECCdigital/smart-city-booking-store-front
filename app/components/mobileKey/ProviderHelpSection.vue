<template>
  <div v-if="serviceInfo" class="space-y-2">
    <div class="flex items-center gap-2">
      <div class="font-bold">Tür lässt sich nicht öffnen?</div>
    </div>
    <div v-if="serviceInfo.name" class="flex items-center gap-2">
      <UIcon name="i-lucide-wrench" size="16" class="text-primary" />
      <div>
        <span> Kontaktperson: </span>
        <br class="sm:hidden" >
        <span>{{ serviceInfo.name }}</span>
      </div>
    </div>
    <div v-if="serviceInfo.phone" class="flex items-center gap-2">
      <UIcon name="i-lucide-phone" size="16" class="text-primary" />
      <div>
        <span> Telefon-Support: </span>
        <br class="sm:hidden" >
        <a :href="`tel:${serviceInfo.phone}`" class="text-primary font-bold">
          {{ serviceInfo.phone }}
        </a>
      </div>
    </div>
    <div v-if="serviceInfo.email" class="flex items-center gap-2">
      <UIcon name="i-lucide-mail" size="16" class="text-primary" />
      <div>
        <span> E-Mail: </span>
        <br class="sm:hidden" >
        <a :href="`mailto:${serviceInfo.email}`" class="text-primary font-bold">
          {{ serviceInfo.email }}
        </a>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useEmergencyHelp } from "~/composables/useEmergencyHelp.js";

const props = defineProps({
  tenantId: { type: String, required: true },
  providerId: { type: String, required: true },
  bookingId: { type: String, required: true },
});

const { serviceInfo, fetchCustomerServiceInfo } = useEmergencyHelp(
  props.tenantId, props.providerId,
);

await fetchCustomerServiceInfo();
</script>

<style scoped></style>
