<template>
  <div class="flex flex-col items-center text-center">
    <div
      class="flex items-center justify-center w-16 h-16 rounded-full mb-4"
      :class="tone.bubble"
    >
      <UIcon :name="icon" class="w-8 h-8" :class="tone.icon" />
    </div>

    <h2 class="text-xl font-semibold">{{ title }}</h2>
    <p v-if="description" class="text-neutral-500 mt-2 max-w-prose">
      {{ description }}
    </p>

    <slot />
  </div>
</template>

<script setup>
const TONES = {
  success: { bubble: "bg-green-600/10", icon: "text-green-600" },
  warning: { bubble: "bg-amber-500/10", icon: "text-amber-600" },
  error: { bubble: "bg-red-600/10", icon: "text-red-600" },
  neutral: { bubble: "bg-primary/10", icon: "text-primary" },
};

const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  color: {
    type: String,
    default: "neutral",
  },
});

const tone = computed(() => TONES[props.color] || TONES.neutral);
</script>
