<script setup>
/**
 * A page opened by a signed link, without an account:
 * the slim navigation bar of the login page and the footer, no menu, so the
 * guest sees nothing but what the link opens.
 */
</script>

<template>
  <!-- Column layout so the footer sticks to the bottom of short pages -->
  <div class="flex min-h-screen flex-col bg-neutral-50 dark:bg-gray-950">
    <NavigationBar variant="auth" />
    <main class="container px-4 pt-4 md:pt-7 pb-10 flex justify-center">
      <slot />
    </main>
    <AppFooter class="mt-auto" />
  </div>
</template>
