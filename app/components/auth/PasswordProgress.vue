<template>
  <div>
    <UProgress
      :color="color"
      :indicator="text"
      :model-value="score"
      :max="4"
      size="sm"
    />

    <p id="password-strength" class="text-sm font-medium">
      {{ text }}. {{ $t("register.passwordStrengthCheck.description") }}:
    </p>

    <ul class="space-y-1" aria-label="Password requirements">
      <li
        v-for="(req, index) in strength"
        :key="index"
        class="flex items-center gap-0.5"
        :class="req.met ? 'text-success' : 'text-muted'"
      >
        <UIcon
          :name="req.met ? 'i-lucide-circle-check' : 'i-lucide-circle-x'"
          class="size-4 shrink-0"
        />

        <span class="text-xs font-light">
          {{ req.text }}
          <span class="sr-only">
            {{ req.met ? " - Requirement met" : " - Requirement not met" }}
          </span>
        </span>
      </li>
    </ul>
  </div>
</template>
<script setup>
import {computed} from "vue";

const props = defineProps({
  password: {
    type: String,
    default: "",
  },
});

const t = useI18n().t;


function checkStrength(str) {
  const requirements = [
    { regex: /.{8,}/, text: t("register.passwordStrengthCheck.minLength") },
    { regex: /\d/, text: t("register.passwordStrengthCheck.number") },
    { regex: /[a-z]/, text: t("register.passwordStrengthCheck.lowercase") },
    { regex: /[A-Z]/, text: t("register.passwordStrengthCheck.uppercase") },
  ];

  return requirements.map((req) => ({
    met: req.regex.test(str),
    text: req.text,
  }));
}

const strength = computed(() => checkStrength(props.password || ""));
const score = computed(() => strength.value.filter((req) => req.met).length);

const color = computed(() => {
  if (score.value === 0) return "neutral";
  if (score.value <= 1) return "error";
  if (score.value <= 2) return "warning";
  if (score.value === 3) return "warning";
  return "success";
});

const text = computed(() => {
  if (score.value === 0)
    return t("register.passwordStrengthCheck.nonePassword");
  if (score.value <= 2) return t("register.passwordStrengthCheck.weakPassword");
  if (score.value === 3)
    return t("register.passwordStrengthCheck.mediumPassword");
  return t("register.passwordStrengthCheck.strongPassword");
});
</script>

<style scoped></style>
