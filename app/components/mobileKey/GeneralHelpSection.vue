<template>
  <div class="rounded-lg items-center border border-primary bg-primary/10 p-3">
    <div class="flex gap-3 rounded-lg items-center">
      <div class="">
        <UIcon
          name="i-lucide-circle-question-mark"
          size="28"
          class="text-primary"
        />
      </div>

      <div>
        <h3 class="text-md font-semibold">
          {{ $t("mobileKey.helpTitle") }}
        </h3>
        <p class="text-sm my-1">
          {{ $t("mobileKey.helpDescription") }}
        </p>

        <button
          type="button"
          class="mt-1 inline-flex items-center gap-2 text-sm font-medium text-primary underline"
          @click="showHelpContact = !showHelpContact"
        >
          {{ $t("mobileKey.helpShowContact") }}
        </button>
      </div>
    </div>

    <div v-if="showHelpContact" class="mt-3 mx-10 space-y-2 text-sm">
      <UAccordion
        :ui="{ trailingIcon: 'order-first me-2 ms-0' }"
        :items="
          tenants.map((tenant) => ({
            label: tenant.name,
            value: tenant.id,
          }))
        "
      >
        <template #content="{ item }">
          <div class="space-y-3 ml-6">
            <template
              v-for="tenant in tenants.filter((t) => t.id === item.value)"
              :key="tenant.id"
            >
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-phone" size="16" class="text-primary" />
                <div>
                  <span> {{ $t("mobileKey.phoneSupport") }} </span>
                  <br class="sm:hidden" />
                  <a
                    :href="`tel:${tenant.phone}`"
                    class="text-primary font-bold"
                  >
                    {{ tenant.phone }}
                  </a>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-mail" size="16" class="text-primary" />
                <div>
                  <span> {{ $t("mobileKey.emailLabel") }} </span>
                  <br class="sm:hidden" />
                  <a
                    :href="`mailto:${tenant.mail}`"
                    class="text-primary font-bold"
                  >
                    {{ tenant.mail }}
                  </a>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-wrench" size="16" class="text-primary" />
                <div>
                  <span> {{ $t("mobileKey.contactPersonLabel") }} </span>
                  <br class="sm:hidden" />
                  <span>{{ tenant.contactName }}</span>
                </div>
              </div>
            </template>
          </div>
        </template>
      </UAccordion>
    </div>
  </div>
</template>

<script setup>



const props = defineProps({
  tenantIds: {
    type: Array,
    required: true,
  },
});

const uniqueTenantIds = computed(() => [...new Set(props.tenantIds)]);

const showHelpContact = ref(false);

const { getTenant } = useTenant();
const tenants = computed(() => {
  return uniqueTenantIds.value.map((id) => getTenant(id));
});
</script>
<style scoped></style>
