<script setup>
import { useAuth } from "~/composables/auth/useAuth.js";

const { login, user } = useAuth();

definePageMeta({
  name: "login",
});
const fields = ref([
  {
    name: "id",
    type: "text",
    label: "Email",
  },
  {
    name: "password",
    type: "password",
    label: "Password",
  },
]);

async function handleSubmit(values) {
  await login(values.data);
  const redirect = useRoute().query.redirect;
  if (redirect) {
    await navigateTo(redirect);
  } else {
    await navigateTo("/");
  }

}
</script>

<template>
  <div>
    <UAuthForm
      class="max-w-md"
      title="Login"
      :fields="fields"
      @submit="handleSubmit"
    />
    {{ user }}
  </div>
</template>

<style scoped></style>
