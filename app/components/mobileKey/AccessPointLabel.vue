<template>
  <div
    class="flex shrink-0 items-center justify-center rounded-lg w-8 h-8"
    :class="isOpen ? 'bg-green-600/10' : 'bg-primary/10'"
  >
    <UIcon
        :name="isOpen? 'i-lucide-unlock' : 'i-lucide-lock'"
        class="w-5 h-5 font-bold"
        :class="isOpen ? 'text-green-600' : 'text-primary'"
    />
  </div>

  <div v-if="accessPoint.provider === 'nuki'" class="basis-6/7">
    <div class="text-md font-semibold line-clamp-2">
      {{ accessPoint.label }}
    </div>
    <div v-if="showMode" class="text-sm text-neutral-500">
      <span
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
        :class="accessPointMode(accessPoint.mode).color"
      >
        <UIcon
          :name="accessPointMode(accessPoint.mode).icon"
          class="w-3.5 h-3.5"
        />
        {{ accessPointMode(accessPoint.mode).label }}
      </span>
    </div>
  </div>
  <div v-else-if="accessPoint.provider === 'ifbs'" class="basis-6/7">
    <div class="text-md font-semibold line-clamp-2">
      Fahrradbox #{{ accessPoint.externalBookingId }}
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  accessPoint: {
    type: Object,
    required: true,
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
  isLocked: {
    type: Boolean,
    default: true,
  },
  showMode: {
    type: Boolean,
    default: false,
  },
});

const accessPointMode = (modeValue) => {
  switch (modeValue) {
    case "remote":
      return {
        label: "Per Knopf",
        color:
          "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
        icon: "i-lucide-lock-open",
      };
    case "code": //toDo - Werte anpassen?!??!?!?!?!?!?!?!?
      return {
        label: "Code an der Tür",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
        icon: "i-lucide-key-round",
      };
    default:
      return {
        label: "Unbekannter Modus",
        color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
        icon: "i-lucide-alert-triangle",
      };
  }
};
</script>

<style scoped></style>
