<template>
  <!--
    The prominent form takes the control button's whole block, padding and all
    (`py-10` around it, `mb-12` under the circle), so the description lands
    where the button's caption stood and the stage does not jump as one gives
    way to the other.
  -->
  <div
    class="flex flex-col items-center text-center"
    :class="prominent ? 'py-10' : ''"
  >
    <!--
      Where a result stands in for the control button, it takes the button's
      shape: same circle, same weight, same place, so the moment reads as the
      button answering rather than as a screen replacing it. The caption inside
      says what the heading would have said, which is why there is no second
      line under it.
    -->
    <div
      v-if="prominent"
      class="statusCircle rounded-full flex flex-col items-center justify-center shadow-lg mb-12"
      :class="tone.solid"
    >
      <UIcon :name="icon" class="!text-[20px] text-white" />
      <span class="text-sm font-medium text-white mt-2">{{ title }}</span>
    </div>

    <div
      v-else
      class="flex items-center justify-center w-16 h-16 rounded-full mb-4"
      :class="tone.bubble"
    >
      <UIcon :name="icon" class="w-8 h-8" :class="tone.icon" />
    </div>

    <h2 v-if="!prominent" class="text-xl font-semibold">{{ title }}</h2>
    <p v-if="description" class="text-neutral-500 mt-2 max-w-prose">
      {{ description }}
    </p>

    <slot />
  </div>
</template>

<script setup>
const TONES = {
  success: {
    bubble: "bg-green-600/10",
    icon: "text-green-600",
    solid: "successSolid",
  },
  warning: {
    bubble: "bg-amber-500/10",
    icon: "text-amber-600",
    solid: "warningSolid",
  },
  error: { bubble: "bg-red-600/10", icon: "text-red-600", solid: "errorSolid" },
  neutral: {
    bubble: "bg-primary/10",
    icon: "text-primary",
    solid: "neutralSolid",
  },
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
  /**
   * Whether this screen stands where the control button stands. Only a result
   * that gives the button back does - a screen that keeps its own way out
   * stays the quieter bubble, so the big circle never competes with a real
   * button on the same stage.
   */
  prominent: {
    type: Boolean,
    default: false,
  },
});

const tone = computed(() => TONES[props.color] || TONES.neutral);
</script>

<style scoped>
/* The control button's geometry, kept in step with it by hand: 120px, the
   same downward gradient, the same shadow. */
.statusCircle {
  width: 120px;
  height: 120px;
}
.successSolid {
  background: linear-gradient(
    180deg,
    var(--color-green-600),
    color-mix(in srgb, var(--color-green-600) 85%, black)
  );
}
.warningSolid {
  background: linear-gradient(
    180deg,
    var(--color-amber-500),
    color-mix(in srgb, var(--color-amber-500) 85%, black)
  );
}
.errorSolid {
  background: linear-gradient(
    180deg,
    var(--color-red-600),
    color-mix(in srgb, var(--color-red-600) 85%, black)
  );
}
.neutralSolid {
  background: linear-gradient(
    180deg,
    var(--color-primary),
    color-mix(in srgb, var(--color-primary) 85%, black)
  );
}
</style>
