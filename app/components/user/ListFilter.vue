<template>
  <!--
    The filter of the account lists (favorites, mobile keys, proofs): one
    button with a chip while a filter is on, a dropdown behind it, for
    provider and type. The groups are drawn from the entries themselves; a
    list without Kinds shows no type group. A list may add groups of its own
    (`groups`), each a set of checkboxes emitted under its key.
  -->
  <UDropdownMenu
    arrow
    :items="filterItems()"
    :content="{ align: 'end' }"
    checked-icon="i-lucide-check"
    :ui="{
      itemLeadingIcon: 'mt-1',
      itemTrailingIcon: 'mt-1 mr-1 text-primary',
      item: 'hover:bg-primary/10',
      content: 'w-56',
    }"
    :disabled="isDisabled"
  >
    <UChip :show="hasFiltersApplied" inset>
      <UButton
        icon="i-lucide-list-filter"
        size="md"
        variant="outline"
        color="neutral"
        :aria-label="$t('account.listFilter.filterBy')"
        class="h-full"
        :class="isDisabled ? 'opacity-80' : ''"
      />
    </UChip>
  </UDropdownMenu>
</template>
<script setup>
const { t } = useI18n();

const props = defineProps({
  tenants: {
    type: Array,
    default: () => [],
  },
  kinds: {
    type: Array,
    default: () => [],
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
  /**
   * Further groups of checkboxes after provider and type:
   * `[{ key, label, options: [{ value, label, icon }] }]`; the chosen values
   * of each go out as `{ [key]: [...] }` with the filter.
   */
  groups: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(["setFilter"]);

const KIND_ITEMS = {
  room: { labelKey: "bookableType.room", icon: "i-lucide-door-open" },
  "event-location": {
    labelKey: "bookableType.eventLocation",
    icon: "i-lucide-building-2",
  },
  resource: { labelKey: "bookableType.resource", icon: "i-lucide-wrench" },
  ticket: { labelKey: "bookableType.ticket", icon: "i-lucide-ticket" },
  event: { labelKey: "bookableType.event", icon: "i-lucide-calendar-check-2" },
};

const selectedTenantIds = ref([]);
const selectedKinds = ref([]);
const selectedGroups = ref({});

const selectedOf = (key) => selectedGroups.value[key] ?? [];

const hasFiltersApplied = computed(
  () =>
    selectedTenantIds.value.length > 0 ||
    selectedKinds.value.length > 0 ||
    Object.values(selectedGroups.value).some((values) => values.length > 0),
);

// A removed favorite can take the last entry of a provider or a Kind with
// it; the choice goes with the option, so the filter never holds something
// the list cannot show.
watch(
  () => props.tenants,
  (tenants) => {
    const offered = new Set(tenants.map((tenant) => tenant.id));
    const kept = selectedTenantIds.value.filter((id) => offered.has(id));
    if (kept.length !== selectedTenantIds.value.length) {
      selectedTenantIds.value = kept;
      onSetFilter();
    }
  },
);
watch(
  () => props.kinds,
  (kinds) => {
    const kept = selectedKinds.value.filter((kind) => kinds.includes(kind));
    if (kept.length !== selectedKinds.value.length) {
      selectedKinds.value = kept;
      onSetFilter();
    }
  },
);

const heading = (label, extraClass = "") => ({
  label,
  class: `cursor-default opacity-50 hover:bg-transparent ${extraClass}`.trim(),
  disabled: true,
});

const checkbox = ({ label, icon, checked, last, onChecked }) => ({
  label,
  icon,
  type: "checkbox",
  checked,
  class: [checked ? "bg-primary/20" : "", last ? "mb-1" : ""]
    .filter(Boolean)
    .join(" "),
  onUpdateChecked(value) {
    onChecked(value);
    onSetFilter();
  },
  onSelect(e) {
    e.preventDefault();
  },
});

const filterItems = () => [
  [heading(t("account.listFilter.filterBy"), "font-bold mb-1")],
  [
    heading(t("account.listFilter.tenant")),
    ...props.tenants.map((tenant, index) =>
      checkbox({
        label: tenant.name,
        icon: "i-lucide-building-2",
        checked: selectedTenantIds.value.includes(tenant.id),
        last: index === props.tenants.length - 1,
        onChecked: (checked) => {
          selectedTenantIds.value = toggled(
            selectedTenantIds.value,
            tenant.id,
            checked,
          );
        },
      }),
    ),
  ],
  ...(props.kinds.length
    ? [
        [
          heading(t("account.listFilter.kind")),
          ...props.kinds.map((kind) =>
            checkbox({
              label: t(KIND_ITEMS[kind]?.labelKey ?? "bookableType.unknown"),
              icon: KIND_ITEMS[kind]?.icon ?? "i-lucide-file-exclamation-point",
              checked: selectedKinds.value.includes(kind),
              onChecked: (checked) => {
                selectedKinds.value = toggled(
                  selectedKinds.value,
                  kind,
                  checked,
                );
              },
            }),
          ),
        ],
      ]
    : []),
  ...props.groups.map((group) => [
    heading(group.label),
    ...group.options.map((option, index) =>
      checkbox({
        label: option.label,
        icon: option.icon,
        checked: selectedOf(group.key).includes(option.value),
        last: index === group.options.length - 1,
        onChecked: (checked) => {
          selectedGroups.value = {
            ...selectedGroups.value,
            [group.key]: toggled(selectedOf(group.key), option.value, checked),
          };
        },
      }),
    ),
  ]),
  [
    {
      label: t("account.listFilter.clearAll"),
      icon: "i-lucide-filter-x",
      disabled: !hasFiltersApplied.value,
      onSelect() {
        selectedTenantIds.value = [];
        selectedKinds.value = [];
        selectedGroups.value = {};
        onSetFilter();
      },
    },
  ],
];

function toggled(list, value, on) {
  return on
    ? [...new Set([...list, value])]
    : list.filter((entry) => entry !== value);
}

function onSetFilter() {
  emit("setFilter", {
    tenantIds: selectedTenantIds.value,
    kinds: selectedKinds.value,
    ...Object.fromEntries(
      props.groups.map((group) => [group.key, selectedOf(group.key)]),
    ),
  });
}
</script>

<style scoped></style>
