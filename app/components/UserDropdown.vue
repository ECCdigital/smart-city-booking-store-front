<script setup>
import { useAuthStore } from "~~/stores/auth.js";

const authStore = useAuthStore();

const user = computed(() => authStore.getUser);

const userName = computed(() => {
  return user.value?.firstName + " " + user.value?.lastName;
});

const items = [
  [
    {
      label: "Profil",
      icon: "i-heroicons-user",
      to: "/profile",
    },
  ],
  [
    {
      label: "Logout",
      icon: "i-heroicons-arrow-right-on-rectangle",
      onSelect: () => logout(),
    },
  ],
];

async function logout() {
  await authStore.logout();
}
</script>

<template>
  <UDropdownMenu
    :items="items"
    :ui="{
      content:
        'ring-0 shadow-lg bg-white/30 dark:bg-gray-900/40 backdrop-blur-lg',
    }"
  >
    <UButton
      variant="ghost"
      class="flex items-center gap-2 outline-none cursor-pointer"
    >
      <UUser
        :name="userName"
        :avatar="{
          icon: 'i-lucide-user',
        }"
        :ui="{
          base: 'transition-none',
          avatar: {
            size: 'h-8 w-8',
          },
        }"
      />
    </UButton>
  </UDropdownMenu>
</template>

<style scoped></style>
