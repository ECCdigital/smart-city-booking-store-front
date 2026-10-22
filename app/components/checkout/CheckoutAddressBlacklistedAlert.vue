<template>
  <UAlert
    color="error"
    variant="soft"
    icon="i-lucide-circle-x"
    :title="t('checkout.address_blacklisted_title')"
  >
    <template #description>
      <i18n-t keypath="checkout.address_blacklisted" scope="global" tag="p">
        <template #contact>
          <span v-if="mailAddress" class="inline-flex items-center gap-1">
            <a
              :href="`mailto:${mailAddress}`"
              class="font-bold underline select-all break-all"
            >
              {{ mailAddress }}
            </a>
            <UButton
              icon="i-lucide-copy"
              size="xs"
              color="neutral"
              variant="ghost"
              :aria-label="t('checkout.address_blacklisted_copy')"
              @click="copyMailAddress"
            />
          </span>
          <template v-else>
            {{ t("checkout.address_blacklisted_operator") }}
          </template>
        </template>
      </i18n-t>
    </template>
  </UAlert>
</template>

<script setup>
/**
 * The refusal of an address on the blacklist (ECCdigital/tickets#627): it
 * stays where the booking is sent, and the instance's mail address in it
 * opens a mail or is copied. Without one it names the operator of the
 * offer.
 */
import { useNotification } from "~/composables/useNotification.js";

const props = defineProps({
  /** The instance's mail address from the refusal, trimmed; empty without one. */
  mailAddress: { type: String, default: "" },
});

const { t } = useI18n();
const notification = useNotification();

async function copyMailAddress() {
  try {
    await navigator.clipboard.writeText(props.mailAddress);
    notification.success(t("checkout.address_blacklisted_copied"));
  } catch {
    notification.error(t("checkout.address_blacklisted_copy_failed"));
  }
}
</script>
