<template>
  <div class="grid gap-3 justify-items-center text-center pb-2">
    <ThemeLogo
      v-if="logo"
      :image="logo"
      :image-dark="logoDark"
      :alt="title"
      :max-height="logoSize"
      invert-in-dark-mode
      :class="logoSize === 'lg' ? PHONE_CAP_CLASSES : undefined"
    />
    <p class="font-bold text-xl text-gray-900 dark:text-white">
      {{ title }}
    </p>
  </div>
</template>
<script setup>
/**
 * The title at the top of the auth cards: the logo and the Portal Name, both
 * from the Theme View the page already holds — nothing is fetched here.
 * Inside the card they read on any Background, which is why they have no
 * ground of their own and the name is neutral rather than primary. Without a
 * logo the Portal Name stands alone.
 *
 * The logo takes the size the instance chose, S unless set. On a phone it is
 * at most M: the cap is added on top of the L step, so it holds for a
 * measured logo (capped height) and an unmeasured one (fixed height) alike.
 */
const PHONE_CAP_CLASSES = "max-sm:h-24 max-sm:max-h-24";

const { data: theme } = await useThemeBundle();
const logo = computed(() => theme.value?.logo ?? null);
// Its variant for the dark mode; without one the logo is inverted there.
// A Live Preview Draft carries none.
const logoDark = computed(() => theme.value?.logoDark ?? null);
// A Live Preview Draft carries no size; the Theme View always does.
const logoSize = computed(() => theme.value?.authLogoSize ?? "sm");
const title = useSiteName();
</script>
