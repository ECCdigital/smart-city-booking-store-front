<template>
  <UDropdownMenu
    arrow
    :items="sortItems()"
    :ui="{
      itemLeadingIcon: 'mt-1',
      item: 'hover:bg-primary/10',
    }"
  >
    <UButton
      :icon="
        sortOption ? getSortIconByValue(sortOption) : 'i-lucide-arrow-down-up'
      "
      size="md"
      variant="outline"
      color="neutral"
      class="mt-2 md:mt-0 ml-1"
    />
  </UDropdownMenu>
  <UDropdownMenu
    arrow
    :items="filterItems()"
    :content="{ align: 'start' }"
    checked-icon="i-lucide-check"
    :ui="{
      itemLeadingIcon: 'mt-1',
      itemTrailingIcon: 'mt-1 mr-1 text-primary',
      item: 'hover:bg-primary/10',
      content: 'w-48',
    }"
  >
    <UChip :show="hasFiltersApplied" inset class="mt-2 md:mt-0">
      <UButton
        icon="i-lucide-list-filter"
        size="md"
        variant="outline"
        color="neutral"
        class="md:mt-0 ml-1 h-full"
      />
    </UChip>
  </UDropdownMenu>
</template>
<script setup>
const emit = defineEmits(["setFilter"]);

const sortOption = ref(null);
const showActiveBookings = ref(false);
const showStatusConfirmed = ref(false);
const showStatusRejected = ref(false);
const showStatusPending = ref(false);
const showPaymentsConfirmed = ref(false);
const showPaymentsUnconfirmed = ref(false);
const hasFiltersApplied = computed(() => {
  return (
    showActiveBookings.value ||
    showStatusConfirmed.value ||
    showStatusRejected.value ||
    showStatusPending.value ||
    showPaymentsConfirmed.value ||
    showPaymentsUnconfirmed.value
  );
});

const sortItems = () => [
  {
    label: "Sortieren nach:",
    class: "cursor-default font-bold opacity-50 hover:bg-transparent",
    disabled: true,
  },
  {
    label: "Titel (aufsteigend)",
    icon: "i-lucide-arrow-down-a-z",
    value: "title-asc",
    class: sortOption.value === "title-asc" ? "bg-primary/20" : "",
    onSelect() {
      sortOption.value = "title-asc";
      onSetFilter();
    },
  },
  {
    label: "Titel (absteigend)",
    icon: "i-lucide-arrow-down-z-a",
    value: "title-desc",
    class: sortOption.value === "title-desc" ? "bg-primary/20 mb-1" : "mb-1",
    onSelect() {
      sortOption.value = "title-desc";
      onSetFilter();
    },
  },
  {
    label: "Zeitraum (frühste zuerst)",
    icon: "i-lucide-calendar-arrow-up",
    value: "date-asc",
    class: sortOption.value === "date-asc" ? "bg-primary/20 mb-1" : "mb-1",
    onSelect() {
      sortOption.value = "date-asc";
      onSetFilter();
    },
  },
  {
    label: "Zeitraum (späteste zuerst)",
    icon: "i-lucide-calendar-arrow-down",
    value: "date-desc",
    class: sortOption.value === "date-desc" ? "bg-primary/20" : "",
    onSelect() {
      sortOption.value = "date-desc";
      onSetFilter();
    },
  },
  {
    label: "Preis (aufsteigend)",
    icon: "i-lucide-banknote-arrow-up",
    value: "price-asc",
    class: sortOption.value === "price-asc" ? "bg-primary/20" : "",
    onSelect() {
      sortOption.value = "price-asc";
      onSetFilter();
    },
  },
  {
    label: "Preis (absteigend)",
    icon: "i-lucide-banknote-arrow-down",
    value: "price-desc",
    class: sortOption.value === "price-desc" ? "bg-primary/20 mb-1" : "mb-1",
    onSelect() {
      sortOption.value = "price-desc";
      onSetFilter();
    },
  },
  {
    label: "Buchungsdatum (neueste zuerst)",
    icon: "i-lucide-clock-arrow-down",
    value: "bookingDate-desc",
    class: sortOption.value === "bookingDate-desc" ? "bg-primary/20" : "",
    onSelect() {
      sortOption.value = "bookingDate-desc";
      onSetFilter();
    },
  },
  {
    label: "Buchungsdatum (älteste zuerst)",
    icon: "i-lucide-clock-arrow-up",
    value: "bookingDate-asc",
    class:
      sortOption.value === "bookingDate-asc" ? "bg-primary/20 mb-1" : "mb-1",
    onSelect() {
      sortOption.value = "bookingDate-asc";
      onSetFilter();
    },
  },
];

const filterItems = () => [
  {
    label: "Filtern nach:",
    class: "cursor-default font-bold opacity-50 hover:bg-transparent mb-1",
    disabled: true,
  },
  {
    label: "Aktive Buchungen",
    icon: "i-lucide-tv-minimal-play",
    type: "checkbox",
    checked: showActiveBookings.value,
    class: showActiveBookings.value ? "bg-primary/20" : "",
    onUpdateChecked(checked) {
      showActiveBookings.value = checked;
      onSetFilter();
    },
  },
  {
    label: "Status:",
    class: "cursor-default opacity-50 hover:bg-transparent",
    disabled: true,
  },
  {
    label: "Bestätigt",
    icon: "i-lucide-check",
    type: "checkbox",
    checked: showStatusConfirmed.value,
    class: showStatusConfirmed.value ? "bg-primary/20" : "",
    onUpdateChecked(checked) {
      showStatusConfirmed.value = checked;
      onSetFilter();
    },
    onSelect(e) {
      e.preventDefault();
    },
  },
  {
    label: "Storniert",
    icon: "i-lucide-x",
    type: "checkbox",
    checked: showStatusRejected.value,
    class: showStatusRejected.value ? "bg-primary/20" : "",
    onUpdateChecked(checked) {
      showStatusRejected.value = checked;
      onSetFilter();
    },
    onSelect(e) {
      e.preventDefault();
    },
  },
  {
    label: "Ausstehend",
    icon: "i-lucide-hourglass",
    type: "checkbox",
    checked: showStatusPending.value,
    class: showStatusPending.value ? "bg-primary/20 mb-1" : "mb-1",
    onUpdateChecked(checked) {
      showStatusPending.value = checked;
      onSetFilter();
    },
    onSelect(e) {
      e.preventDefault();
    },
  },
  {
    label: "Zahlungsstatus:",
    class: "cursor-default opacity-50 hover:bg-transparent",
    disabled: true,
  },
  {
    label: "Bezahlt",
    icon: "i-lucide-check",
    type: "checkbox",
    checked: showPaymentsConfirmed.value,
    class: showPaymentsConfirmed.value ? "bg-primary/20" : "",
    onUpdateChecked(checked) {
      showPaymentsConfirmed.value = checked;
      onSetFilter();
    },
    onSelect(e) {
      e.preventDefault();
    },
  },
  {
    label: "Nicht bezahlt",
    icon: "i-lucide-hourglass",
    type: "checkbox",
    checked: showPaymentsUnconfirmed.value,
    class: showPaymentsUnconfirmed.value ? "bg-primary/20" : "",
    onUpdateChecked(checked) {
      showPaymentsUnconfirmed.value = checked;
      onSetFilter();
    },
    onSelect(e) {
      e.preventDefault();
    },
  },
];

function getSortIconByValue(value) {
  const item = sortItems().find((item) => item.value === value);
  return item?.icon;
}

function onSetFilter() {
  emit("setFilter", {
    sortOption: sortOption.value,
    activeBookings: showActiveBookings.value,
    statusConfirmed: showStatusConfirmed.value,
    statusRejected: showStatusRejected.value,
    statusPending: showStatusPending.value,
    paymentsConfirmed: showPaymentsConfirmed.value,
    paymentsUnconfirmed: showPaymentsUnconfirmed.value,
  });
}
</script>

<style scoped></style>
