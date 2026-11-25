<template>
  <!--
    The card wears the shared card look (`~/utils/cardClasses.js`): its hover
    is a shadow and a ring, both painted outside the layout, so the cards
    beside and below this one stay where they are. The card is a link, so it is
    reached and opened by keyboard as well; the keyboard focus is on the link,
    which has the card's shape.
  -->
  <NuxtLink
    :to="categoryTo"
    :class="CARD_FOCUS"
    class="block h-full rounded-2xl"
  >
    <UCard
      :class="[CARD_SURFACE, CARD_HOVER]"
      class="mainCategoryCard h-full cursor-pointer text-black dark:text-gray-200"
      variant="solid"
    >
      <template #header>
        <div class="w-full flex justify-center mt-5">
          <div class="bg-[color:var(--ui-accent,var(--ui-primary))] rounded-full p-3 pb-1 shadow-lg avatar-hover">
            <UIcon :name="category.icon" style="color: var(--ui-accent-contrast, var(--ui-primary-contrast))" class="avatar-hover" size="24"/>
          </div>
        </div>
      </template>
      <div class="text-center -mt-5 space-y-1">
        <p class="text-xl font-bold">{{ category.title }}</p>
        <p>{{ props.category.description }}</p>
      </div>
    </UCard>
  </NuxtLink>
</template>
<script setup>
import { CARD_FOCUS, CARD_HOVER, CARD_SURFACE } from "~/utils/cardClasses.js";

const props = defineProps({
  category: {
    type: Object,
    required: true,
  },
})

const {tenantTo} = useTenantRoute();



const categoryTo = computed(() =>
  tenantTo({ path: "/search", query: { cat: props.category.cat } }),
);
</script>
<style scoped>
:deep(.mainCategoryCard:hover .avatar-hover) {
  transform: scale(1.15);
  transition: transform 0.2s;
  rotate: 2deg;
}

@media (prefers-reduced-motion: reduce) {
  :deep(.mainCategoryCard:hover .avatar-hover) {
    transform: none;
    rotate: none;
  }
}
</style>