<template>
  <UDropdownMenu :items="viewOptions">
    <UButton
        :label="currentViewLabel"
        icon="i-lucide-chevron-down"
        color="neutral"
        variant="soft"
        class="rounded-full py-2 px-3"
        :content="{
              align: 'start',
              side: 'bottom',
              sideOffset: 8,
            }"
        :ui="{
              itemLeadingIcon: 'mt-1',
              itemTrailingIcon: 'mt-1 mr-1',
              item: 'hover:bg-primary/10 bg-pink-500',
              content: 'w-48',
            }"
    />
  </UDropdownMenu>
</template>
<script setup >
const view = defineModel({
  type: String,
  required: true,
});

const emit = defineEmits(["setView"]);

const viewOptions = [
  {
    value: "list",
    label: "Listenansicht",
    icon: "i-lucide-list",
    onSelect() {
      view.value = "list";
      emit("setView", "list");
    },
  },
  {
    value: "map",
    label: "Kartenansicht",
    icon: "i-lucide-map-pin",
    onSelect() {
      view.value = "map";
      emit("setView", "map");
    },
  },
];

const currentViewLabel = computed(() => {
  const option = viewOptions.find((opt) => opt.value === view.value);
  return option ? option.label : "";
});

onMounted(() => {
  if(!viewOptions.some(opt => opt.value === view.value)) {
    console.log("Invalid view detected, defaulting to 'list'. Current value:", view.value);
    view.value = 'list';
    emit("setView", "list");
  }
})
</script>



<style scoped>

</style>