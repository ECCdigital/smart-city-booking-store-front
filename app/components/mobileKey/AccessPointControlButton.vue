<template>
  <div class="relative flex items-center justify-center mb-12">
    <div
      class="absolute w-28 h-28 rounded-full border-[12px] animate-ping [animation-duration:2.5s]"
      :class="buttonColor"
    />
    <div
      class="controlButton rounded-full flex flex-col items-center justify-center shadow-lg"
      :class="buttonClass"
      @click="onAction"
    >
      <UIcon :name="icon" class="!text-[20px] text-white" />
      <span class="text-sm font-medium text-white mt-2">{{ label }}</span>
    </div>

  </div>
  <div class="text-center text-sm">
  <p v-if="title" class="mb-1">{{ title }}</p>
  {{ subtitle }}
  <span class="font-semibold"> {{ accessPointLabel }} </span>
</div>
</template>
<script setup>
const props = defineProps({
  variant: {
    type: String,
    required: true,
  },
  accessPointLabel: {
    type: String,
    default: "",
  },
  /**
   * The line above the caption. A prop rather than a switch because the
   * wording now lives in `de.json` - and because the flow, not the button,
   * knows whether evidence was collected in this very session.
   */
  title: {
    type: String,
    default: "",
  },
});
const emit = defineEmits(["open", "lock"]);

const label = computed(() => {
  switch (props.variant) {
    case "open":
      return "Öffnen";
    case "close":
      return "Abschließen";
    default:
      return "";
  }
});
const icon = computed(() => {
  switch (props.variant) {
    case "open":
      return "i-lucide-unlock";
    case "close":
      return "i-lucide-lock";
    default:
      return "";
  }
});


const subtitle = computed(() => {
  switch (props.variant) {
    case "open":
      return `Tippen Sie zum Öffnen von`;
    case "close":
      return `Tippen Sie zum Abschließen von`;
    default:
      return "";
  }
});

const buttonColor = computed(() => {
  switch (props.variant) {
    case "open":
      return "border-primary/30";
    case "close":
      return "border-error/30";
    default:
      return "";
  }
});
const buttonClass = computed(() => {
  switch (props.variant) {
    case "open":
      return "openColor";
    case "close":
      return "closeColor";
    default:
      return "";
  }
});

function onAction() {
  switch (props.variant) {
    case "open":
      emit("open");
      break;
    case "close":
      emit("lock");
      break;
  }
}
</script>
<style scoped>
.controlButton {
  position: relative;
  width: 120px;
  height: 120px;
  z-index: 10;
  cursor: pointer;

}
.openColor {background: linear-gradient(
    180deg,
    var(--color-primary),
    color-mix(in srgb, var(--color-primary) 85%, black)
);}
.closeColor {background: linear-gradient(
    180deg,
    #f15d5d,
    color-mix(in srgb, #f15d5d 85%, black)
);}
</style>
