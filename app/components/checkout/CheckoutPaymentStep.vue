<script setup>
const KNOWN_PROVIDER_IDS = ["giroCockpit", "pmPayment", "ePayBL", "invoice"];

const PROVIDER_ICONS = {
  giroCockpit: "i-lucide-landmark",
  pmPayment: "i-lucide-credit-card",
  ePayBL: "i-lucide-shield-check",
  invoice: "i-lucide-file-text",
};

const props = defineProps({
  providers: {
    type: Array,
    required: true,
  },
});

const selectedId = defineModel({
  type: String,
  default: null,
});

const { t } = useI18n();

function isOnlineProvider(id) {
  return id !== "invoice";
}

function isKnownProvider(id) {
  return KNOWN_PROVIDER_IDS.includes(id);
}

const enrichedItems = computed(() =>
  props.providers.map((p) => {
    const id = String(p.id ?? "").trim() || "unknown";
    const online = isOnlineProvider(id);
    const label = isKnownProvider(id)
      ? t(`checkout.payment.providers.${id}.title`)
      : p.title?.trim() || id;
    const hint = isKnownProvider(id)
      ? t(`checkout.payment.providers.${id}.description`)
      : online
        ? t("checkout.payment.fallbackOnlineDescription")
        : t("checkout.payment.fallbackInvoiceDescription");
    const apiTitle = (p.title && String(p.title).trim()) || "";
    return {
      value: id,
      label,
      apiTitle,
      hint,
      icon: PROVIDER_ICONS[id] || "i-lucide-wallet",
      online,
    };
  })
);

function selectProvider(id) {
  selectedId.value = id;
}

function isSelected(id) {
  return selectedId.value === id;
}
</script>

<template>
  <div class="payment-provider-step space-y-8">

    <UCard
        variant="subtle"
        class="rounded-xl mb-6 border border-primary-200 dark:border-primary-800"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="font-medium text-gray-900 dark:text-white">
            {{ $t("checkout.payment.lead") }}
          </p>
        </div>
      </div>
    </UCard>

    <div class="space-y-3" role="radiogroup" :aria-label="$t('checkout.steps.paymentTitle')">
      <div v-for="item in enrichedItems" :key="item.value">
        <button
          type="button"
          :aria-checked="isSelected(item.value)"
          class="w-full flex items-start gap-3 p-3 rounded-xl border-2 transition-all duration-150 text-left cursor-pointer overflow-hidden"
          :class="
            isSelected(item.value)
              ? 'border-primary bg-primary/5 dark:bg-primary/10'
              : 'border-surface-border bg-surface-raised hover:border-gray-300 dark:hover:border-gray-600'
          "
          @click="selectProvider(item.value)"
        >


          <div
            class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
            :class="
              isSelected(item.value)
                ? 'bg-primary/10 dark:bg-primary/20'
                : 'bg-surface-muted'
            "
          >
            <UIcon
              :name="item.icon"
              size="20"
              :class="
                isSelected(item.value)
                  ? 'text-primary'
                  : 'text-gray-400 dark:text-gray-500'
              "
            />
          </div>

          <div class="flex-1 min-w-0 overflow-hidden space-y-1.5">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-semibold text-gray-900 dark:text-white truncate">
                {{ item.label }}
              </span>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0"
                :class="
                  item.online
                    ? 'bg-primary/10 text-primary'
                    : 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200'
                "
              >
                {{
                  item.online
                    ? $t('checkout.payment.kindOnline')
                    : $t('checkout.payment.kindInvoice')
                }}
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {{ item.hint }}
            </p>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
