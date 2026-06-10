<script setup>
const props = defineProps({
  requiredFieldKeys: {
    type: Array,
    default: () => [],
  },
  attachments: {
    type: Array,
    default: () => [],
  },
  commentRequired: {
    type: Boolean,
    default: false,
  },
});

const contact = defineModel("contact", {
  type: Object,
  required: true,
});

const comment = defineModel("comment", {
  type: String,
  default: "",
});

const isAddressMenuOpen = ref(false)
const isCityMenuOpen = ref(false)

const attachmentAccepted = defineModel("attachmentAccepted", {
  type: Object,
  default: () => ({}),
});

const { t, locale } = useI18n();

const emailChanged = ref(false);
const isValidEmail = computed(() => {
  const email = contact.value.email;
  if (!email) {
    return true;
  }
  if (typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
});

const requiredAttachmentCount = computed(
  () => props.attachments.filter((att) => att?.required === true).length,
);

const selectedAddressSuggestion = ref(null);
const addressLookupQuery = ref("");
const cityLookupQuery = ref("");
const addressSuggestions = ref([]);
const isAddressLookupLoading = ref(false);
let addressLookupDebounce = null;
let cityLookupDebounce = null;

function isRequired(key) {
  return props.requiredFieldKeys.includes(key);
}

function setAttachmentChecked(id, value) {
  attachmentAccepted.value = {
    ...attachmentAccepted.value,
    [id]: value,
  };
}

function attachmentTypeLabel(type) {
  const key = `checkout.attachmentTypes.${type}`;
  const translated = t(key);
  return translated === key ? type : translated;
}

function normalizeStreet(address = {}) {
  return [address.road, address.house_number].filter(Boolean).join(" ").trim();
}

function normalizeCity(address = {}) {
  return (
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    ""
  );
}

function toAddressSuggestion(item) {
  const address = item?.address || {};
  const street = normalizeStreet(address);
  const city = normalizeCity(address);
  const zipCode = address.postcode || "";

  return {
    label:
      item.display_name || [street, zipCode, city].filter(Boolean).join(", "),
    street,
    zipCode,
    city,
  };
}

async function searchAddressSuggestions(query) {
  const trimmed = query?.trim();
  if (!trimmed || trimmed.length < 3) {
    addressSuggestions.value = [];
    return;
  }

  isAddressLookupLoading.value = true;
  try {
    const isGerman = locale.value?.startsWith("de");

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", trimmed);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "20");
    url.searchParams.set("dedupe", "0");
    url.searchParams.set("accept-language", isGerman ? "de" : "en");

    const data = await $fetch(url.toString(), {
      headers: {
        "Accept-Language": isGerman ? "de" : "en",
      },
    });

    if (!Array.isArray(data) || data.length === 0) {
      addressSuggestions.value = [];
      return;
    }

    //toDo - weiter einschränken??!? Weniger Detailliert!
    const filtered = data.filter((item) => {
      const a = item.address || {};
      return (
        a.road ||
        a.house_number ||
        a.city ||
        a.town ||
        a.village ||
        a.hamlet ||
        a.suburb ||
        a.postcode ||
        item.class === "place" ||
        item.class === "highway" ||
        item.class === "building"
      );
    });

    filtered.sort(
      (a, b) => (Number(b.importance) || 0) - (Number(a.importance) || 0),
    );

    addressSuggestions.value = filtered
      .slice(0, 8)
      .map((item) => toAddressSuggestion(item));
  } catch {
    addressSuggestions.value = [];
  } finally {
    isAddressLookupLoading.value = false;
  }
}

watch([addressLookupQuery, cityLookupQuery], ([addressQuery, cityQuery]) => {
  clearTimeout(addressLookupDebounce);
  clearTimeout(cityLookupDebounce);

  const query = (addressQuery || cityQuery || "").trim();

  if (query.length < 3) {
    addressSuggestions.value = [];
    return;
  }

  if (addressQuery?.trim()) {
    addressLookupDebounce = setTimeout(() => {
      searchAddressSuggestions(addressQuery);
    }, 300);
  }

  if (cityQuery?.trim()) {
    cityLookupDebounce = setTimeout(() => {
      searchAddressSuggestions(cityQuery);
    }, 300);
  }
});

onBeforeUnmount(() => {
  clearTimeout(addressLookupDebounce);
  clearTimeout(cityLookupDebounce);
});

function resolveAddressSuggestion(suggestion) {
  if (suggestion == null) return null;
  if (typeof suggestion === "string") {
    return (
      addressSuggestions.value.find((item) => item.label === suggestion) || null
    );
  }
  return typeof suggestion === "object" ? suggestion : null;
}

function onAddressSuggestionSelect(suggestion) {
  console.log("*S*", suggestion)
  const resolved = resolveAddressSuggestion(suggestion);
  console.log("*A*", resolved)

  if (!resolved) return ;

  selectedAddressSuggestion.value = resolved;

  if(resolved.street){
    contact.value.address = resolved.street || "";
  }
  if(resolved.zipCode){
    contact.value.zipCode = resolved.zipCode || "";
  }
  if(resolved.city){
    contact.value.city = resolved.city || "";
  }
}
</script>

<template>
  <div class="space-y-6">
    <UCard variant="soft" class="rounded-lg">
      <template #header>
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          {{ $t("checkout.data.contactSectionTitle") }}
        </h3>
      </template>

      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField :label="$t('common.firstName')" :required="true">
          <UInput
            v-model="contact.firstName"
            type="text"
            autocomplete="given-name"
            icon="i-lucide-user"
            class="w-full"
          />
        </UFormField>
        <UFormField :label="$t('common.lastName')" :required="true">
          <UInput
            v-model="contact.lastName"
            type="text"
            autocomplete="family-name"
            icon="i-lucide-user"
            class="w-full"
          />
        </UFormField>
        <UFormField
          class="sm:col-span-2"
          :label="$t('common.email')"
          :required="true"
          :error="
            emailChanged && !isValidEmail ? $t('checkout.data.invalidEmailHint') : undefined
          "
        >
          <UInput
            v-model="contact.email"
            type="email"
            autocomplete="email"
            icon="i-lucide-mail"
            size="xl"
            class="w-full"
            @blur="emailChanged = true"
          />
        </UFormField>
        <UFormField :label="$t('common.phone')" :required="isRequired('phone')">
          <UInput
            v-model="contact.phone"
            type="tel"
            autocomplete="tel"
            icon="i-lucide-phone"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="$t('common.company')"
          :required="isRequired('company')"
        >
          <UInput
            v-model="contact.company"
            type="text"
            autocomplete="organization"
            icon="i-lucide-building-2"
            class="w-full"
          />
        </UFormField>

        <UFormField
          class="sm:col-span-2"
          :label="$t('common.address')"
          :required="isRequired('address')"
        >
          <UInputMenu
            v-model="contact.address"
            v-model:open="isAddressMenuOpen"
            v-model:search-term="addressLookupQuery"
            :items="addressSuggestions"
            icon="i-lucide-map-pin"
            label-key="label"
            class="w-full"
            :loading="isAddressLookupLoading"
            ignore-filter
            @update:model-value="onAddressSuggestionSelect"
            @blur="
              () => {
                isAddressMenuOpen = false
                if (!selectedAddressSuggestion || addressLookupQuery){
                  contact.address = addressLookupQuery;
                }
              }
            "
          />
        </UFormField>
        <div class="bg-red-300 sm:col-span-2 text-sm">
          selectedAddressSuggestion: {{selectedAddressSuggestion}}
          <hr>
          addressLookupQuery: {{addressLookupQuery}}
        </div>
        <UFormField
          :label="$t('common.zipCode')"
          :required="isRequired('zipCode')"
        >
          <UInput
            v-model="contact.zipCode"
            type="text"
            autocomplete="postal-code"
            icon="i-lucide-mailbox"
            class="w-full"
          />
        </UFormField>
        <UFormField :label="$t('common.city')" :required="isRequired('city')">
          <UInputMenu
            v-model="contact.city"
            v-model:open="isCityMenuOpen"
            v-model:search-term="cityLookupQuery"
            :items="addressSuggestions"
            icon="i-lucide-building"
            label-key="label"
            class="w-full"
            :loading="isAddressLookupLoading"
            ignore-filter
            @update:model-value="onAddressSuggestionSelect"
            @blur="
              () => {
                isCityMenuOpen = false
                if (!selectedAddressSuggestion || cityLookupQuery)
                  contact.city = cityLookupQuery;
              }
            "
          />
        </UFormField>
      </div>
    </UCard>

    <UCard variant="soft" class="rounded-lg">
      <UFormField
        :label="$t('checkout.data.commentLabel')"
        :required="commentRequired"
      >
        <UTextarea
          v-model="comment"
          :rows="4"
          autoresize
          :placeholder="$t('checkout.data.commentPlaceholder')"
          :required="commentRequired"
          class="w-full"
        />
        <p
          v-if="commentRequired"
          class="mt-1 text-xs text-red-600 dark:text-red-400"
        >
          {{ $t("checkout.data.commentRequiredHint") }}
        </p>
      </UFormField>
    </UCard>

    <UCard
      v-if="attachments.length > 0"
      variant="soft"
      class="rounded-md"
      :ui="{
        header: 'px-3 py-2 sm:px-4 sm:py-2.5',
        body: 'px-3 py-2 sm:px-4 sm:py-3',
      }"
    >
      <template #header>
        <div class="space-y-0">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ $t("checkout.data.documentsTitle") }}
          </h3>
          <p
            v-if="requiredAttachmentCount > 0"
            class="text-[11px] text-amber-700 dark:text-amber-400"
          >
            {{
              $t("checkout.data.requiredAttachmentsHint", {
                count: requiredAttachmentCount,
              })
            }}
          </p>
        </div>
      </template>

      <ul class="space-y-1">
        <li
          v-for="att in attachments"
          :key="att.id"
          class="rounded-md border border-gray-200 dark:border-gray-700 p-2 bg-white/60 dark:bg-gray-900/40"
        >
          <div
            class="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2"
          >
            <div class="min-w-0 flex-1">
              <p
                class="text-sm font-medium leading-tight text-gray-900 dark:text-white"
              >
                {{ att.title }}
              </p>
              <p class="text-[11px] text-gray-500 dark:text-gray-400">
                {{ attachmentTypeLabel(att.type) }}
              </p>
              <span
                v-if="att.required"
                class="inline-flex mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
              >
                {{ $t("checkout.data.requiredConfirmationBadge") }}
              </span>
              <p
                v-if="att.caption"
                class="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5"
              >
                {{ att.caption }}
              </p>
            </div>
            <UButton
              v-if="att.url"
              variant="soft"
              color="primary"
              size="xs"
              icon="i-lucide-external-link"
              class="shrink-0 self-start"
              :href="att.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ $t("checkout.data.openDocument") }}
            </UButton>
          </div>

          <div
            v-if="att.required"
            class="mt-1.5 pt-1.5 border-t border-gray-200 dark:border-gray-700"
          >
            <UCheckbox
              :model-value="!!attachmentAccepted[att.id]"
              :label="
                $t('checkout.data.attachmentConfirm', {
                  title: att.title,
                })
              "
              @update:model-value="setAttachmentChecked(att.id, $event)"
            />
          </div>
        </li>
      </ul>
    </UCard>
  </div>
</template>
