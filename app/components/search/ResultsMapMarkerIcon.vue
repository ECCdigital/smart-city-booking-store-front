<template>
  <LIcon :icon-anchor="[20, 40]">
    <div class="relative">
      <UIcon
        :name="iconMapPin"
        :class="
          group.bookables.some((b) => b.item.id === currentBookable?.item.id)
            ? 'activeIconPin size-11'
            : group.bookables.some((b) => b.matchStatus === 'match')
              ? 'matchingIconPin size-10'
              : 'nonMatchingIconPin size-10'
        "
      />

      <div
        v-if="group.bookables.length > 1"
        class="absolute -top-1 left-6 w-5 h-5 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center"
      >
        {{ group.bookables.length }}
      </div>
    </div>
  </LIcon>
</template>
<script setup>
const { iconMapPin } = useBookableMap();

const props = defineProps({
  group: {
    type: Object,
    required: true,
  },
  currentBookable: {
    type: Object,
    required: false,
    default: () => {},
  },
});
</script>

<style scoped>
.activeIconPin,
.matchingIconPin,
.nonMatchingIconPin {
  transition:
    color 0.5s ease,
    opacity 0.5s ease,
    transform 0.5s ease;
}

.activeIconPin {
  color: var(--color-secondary);
  z-index: 999;
  transform: scale(1.08);
  animation: pinBounce 1.2s ease-in-out infinite;
}

.matchingIconPin {
  color: var(--color-primary);
  z-index: 500;
  opacity: 1;
}

.nonMatchingIconPin {
  color: #cccdcf;
  opacity: 0.7;
  z-index: 50;
}

@keyframes pinBounce {
  0%,
  100% {
    transform: scale(1.08) translateY(0);
  }
  50% {
    transform: scale(1.08) translateY(-4px);
  }
}

.leaflet-div-icon {
  background: transparent;
  border: transparent;
}
</style>
