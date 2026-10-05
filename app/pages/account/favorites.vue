<template>
  <div>
    <PageHeader :title="$t('account.favoritesTitle')" />
    <div class="flex flex-col items-center justify-center py-24 text-center">
      <div class="text-4xl mb-4">⭐</div>
      <h1 class="text-xl font-semibold mb-2">{{ $t("account.favoritesSoon") }}</h1>
      <p class="text-gray-500 max-w-md">
        {{ $t("account.favoritesEmpty") }}
      </p>
    </div>
  </div>
</template>
<script setup>
definePageMeta({
  layout: "panel",
  navigation: "user",
  requiresAuth: true,
});

const { t } = useI18n();
usePageTitle(() => t("meta.pages.accountFavorites"));
</script>

<style scoped></style>
