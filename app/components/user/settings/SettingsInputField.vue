<template>
  <UFormField :label="label" class="">
    <UInput
      v-model="currentValue"
      :icon="icon"
      :variant="isDisabled? 'subtle' : 'outline'"
      :disabled="isDisabled"
      class="w-full md:w-[70%]"
      @change="onUpdate()"
    />
  </UFormField>
</template>
<script setup>
const props = defineProps({
  fieldId: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: "",
  },
  value: {
    type: String,
    default: "",
  },
  icon: {
    type: String,
    default: "",
  },
  isDisabled: {
    type: Boolean,
    default: true,
  },
});
const emit = defineEmits(["update"]);

const currentValue = ref(props.value);

function onUpdate() {
  emit("update", {
    updatedField: props.fieldId,
    updatedValue: currentValue.value,
  });
}
</script>
<style scoped></style>
