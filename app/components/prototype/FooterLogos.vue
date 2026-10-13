<template>
  <!--
    PROTOTYPE #514: die Logos einer Variante. Das Layout der Liste setzt der
    Aufrufer per class, die Maße je Logo kommen aus der Größenregel.
  -->
  <ul class="[--s:0.8] sm:[--s:1]" data-proto-logos>
    <li v-for="logo in proto.logos.value" :key="logo.key" class="flex items-center justify-center">
      <component
        :is="proto.links.value ? 'a' : 'span'"
        v-bind="proto.links.value ? { href: '#', title: logo.label, onClick: (e) => e.preventDefault() } : {}"
        class="inline-flex rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :class="[
          proto.links.value ? 'transition-opacity hover:opacity-80' : '',
          wrapperDarkClass(logo),
        ]"
      >
        <img
          :src="logo.src"
          :width="logo.width"
          :height="logo.height"
          :alt="logo.label"
          :style="proto.logoStyle(logo)"
          :class="lightImgClass(logo)"
          :data-proto-logo="logo.key"
        >
        <img
          v-if="!alwaysLight && proto.darkSource(logo)"
          :src="proto.darkSource(logo)"
          :width="logo.width"
          :height="logo.height"
          :alt="logo.label"
          :style="proto.logoStyle(logo)"
          class="hidden dark:block"
          :data-proto-logo="logo.key"
        >
      </component>
    </li>
  </ul>
</template>

<script setup>
const props = defineProps({
  /** Variante D: Das Band ist immer hell, also keine Behandlung im Dunkelmodus. */
  alwaysLight: { type: Boolean, default: false },
});

const proto = useFooterLogosPrototype();

function hasDarkVariant(logo) {
  return !props.alwaysLight && !!proto.darkSource(logo);
}

function lightImgClass(logo) {
  if (hasDarkVariant(logo)) return "dark:hidden";
  if (props.alwaysLight) return "";
  return proto.dark.value === "invert" ? "dark:invert" : "";
}

function wrapperDarkClass(logo) {
  if (props.alwaysLight || hasDarkVariant(logo)) return "";
  return proto.dark.value === "platte" ? "dark:bg-white dark:p-1.5" : "";
}
</script>
