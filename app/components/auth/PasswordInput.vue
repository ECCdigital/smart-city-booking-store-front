<template>
  <UFormField :label="label" :required="isRequired">
    <UInput
      v-model="password"
      :type="showPassword ? 'text' : 'password'"
      :ui="{ trailing: 'pe-1' }"
      placeholder="••••••••"
      variant="outline"
      class=""
      :class="inputStyleClasses"
      :required="isRequired"
    >
      <template #trailing>
        <UButton
          color="neutral"
          variant="link"
          size="sm"
          :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
          :aria-label="showPassword ? 'Hide password' : 'Show password'"
          :aria-pressed="showPassword"
          aria-controls="password"
          @click="showPassword = !showPassword"
        />
      </template>
    </UInput>
  </UFormField>
</template>
<script setup>
const password = defineModel({
  type: String,
  required: true,
});
defineProps({
  label: {
    type: String,
    required: true,
  },
  isRequired: {
    type: Boolean,
    default: false,
  },
  inputStyleClasses: {
    type: String,
    default: "",
  },
});

const showPassword = ref(false);
</script>
<style scoped></style>
