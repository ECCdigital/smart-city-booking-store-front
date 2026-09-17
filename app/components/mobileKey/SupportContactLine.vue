<template>
  <!--
    The Provider Support Contact at the Control Button (glossary): one line
    under the button in every stage a person could need it, folded to the one
    field that helps fastest - phone, else email, else a name. On a failure the
    host presets `expanded`, and the whole contact stands open with the
    booking number the hotline will ask for.
  -->
  <div v-if="supportContact" class="text-sm">
    <div class="flex flex-wrap items-center justify-center gap-x-1">
      <button
        type="button"
        class="inline-flex items-center gap-1 text-neutral-500 cursor-pointer"
        :aria-expanded="open"
        @click="open = !open"
      >
        <span>{{ t("mobileKey.supportContact.collapsed") }}</span>
        <UIcon
          :name="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="shrink-0"
        />
      </button>
      <a
        v-if="!open && lead?.href"
        :href="lead.href"
        class="text-primary font-bold"
      >
        {{ lead.value }}
      </a>
      <span v-else-if="!open && lead" class="font-bold">{{ lead.value }}</span>
    </div>

    <div v-if="open" class="mt-3 space-y-2">
      <div v-if="supportContact.name" class="flex items-center gap-2">
        <UIcon name="i-lucide-user" size="16" class="text-primary shrink-0" />
        <div>
          <span>{{ t("mobileKey.supportContact.name") }}: </span>
          <br class="sm:hidden" >
          <span>{{ supportContact.name }}</span>
        </div>
      </div>
      <div v-if="supportContact.phone" class="flex items-center gap-2">
        <UIcon name="i-lucide-phone" size="16" class="text-primary shrink-0" />
        <div>
          <span>{{ t("mobileKey.supportContact.phone") }}: </span>
          <br class="sm:hidden" >
          <a :href="`tel:${supportContact.phone}`" class="text-primary font-bold">
            {{ supportContact.phone }}
          </a>
        </div>
      </div>
      <div v-if="supportContact.email" class="flex items-center gap-2">
        <UIcon name="i-lucide-mail" size="16" class="text-primary shrink-0" />
        <div>
          <span>{{ t("mobileKey.supportContact.email") }}: </span>
          <br class="sm:hidden" >
          <a
            :href="`mailto:${supportContact.email}`"
            class="text-primary font-bold"
          >
            {{ supportContact.email }}
          </a>
        </div>
      </div>
      <div v-if="bookingId" class="flex items-center gap-2">
        <UIcon name="i-lucide-hash" size="16" class="text-primary shrink-0" />
        <div>
          <span>{{ t("mobileKey.supportContact.booking_number") }}: </span>
          <br class="sm:hidden" >
          <span class="font-mono font-bold">{{ bookingId }}</span>
          <span class="text-neutral-500">
            ({{ t("mobileKey.supportContact.booking_hint") }})
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useEmergencyHelp } from "~/composables/useEmergencyHelp.js";

const props = defineProps({
  tenantId: { type: String, required: true },
  /** The provider key of the door; without one the tenant's contact applies. */
  providerId: { type: String, default: null },
  /** The booking to name to the hotline; nothing to name while none is known. */
  bookingId: { type: String, default: null },
  /** Preset open - the error stages do, the button stages do not. */
  expanded: { type: Boolean, default: false },
});

const { t } = useI18n();

const { supportContact, fetchCustomerServiceInfo } = useEmergencyHelp(
  toRef(props, "tenantId"),
  toRef(props, "providerId"),
);

const open = ref(props.expanded);
watch(
  () => props.expanded,
  (expanded) => {
    open.value = expanded;
  },
);

/** The one field the folded line shows: phone, else email, else the name. */
const lead = computed(() => {
  const contact = supportContact.value;
  if (!contact) return null;
  if (contact.phone) {
    return { value: contact.phone, href: `tel:${contact.phone}` };
  }
  if (contact.email) {
    return { value: contact.email, href: `mailto:${contact.email}` };
  }
  if (contact.name) {
    return { value: contact.name, href: null };
  }
  return null;
});

await fetchCustomerServiceInfo();
</script>
