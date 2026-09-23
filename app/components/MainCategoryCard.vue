<template>
  <!--
    The hover lift is a transform and a ring, and nothing else: both paint
    outside the layout, so the cards beside and below this one stay where they
    are. A negative margin or a border that only exists on hover would resize
    the card's box in the flow instead and push the whole row around.
    `relative` plus `hover:z-10` keeps the lifted card above its neighbours;
    the scale is dropped for visitors who ask for less motion, the ring stays.
  -->
  <UCard
      class="mainCategoryCard relative h-full cursor-pointer bg-white dark:bg-gray-700 text-black dark:text-gray-200 shadow-lg transition duration-200 ease-out hover:z-10 hover:scale-105 hover:shadow-xl hover:ring-2 hover:ring-primary motion-reduce:transition-none motion-reduce:hover:scale-100"
      variant="solid"
      @click="goToCategory"
  >
    <template #header>
      <div class="w-full flex justify-center mt-5">
        <div class="bg-primary rounded-full p-3 pb-1 shadow-lg avatar-hover">
          <UIcon :name="category.icon" :style="{color: contrastToPrimary}" class="avatar-hover" size="24"/>
        </div>
      </div>
    </template>
    <div class="text-center -mt-5 space-y-1">
      <p class="text-xl font-bold">{{ category.title }}</p>
      <p>{{ props.category.description }}</p>
    </div>
  </UCard>
</template>
<script setup>
import {useContrastColor} from "~/composables/utils/useContrastColor.js";

const props = defineProps({
  category: {
    type: Object,
    required: true,
  },
})

const {tenantTo} = useTenantRoute();

const { contrastToPrimary } = useContrastColor();


const router = useRouter()

function goToCategory() {
  const route = useRoute()
  route.query.cat = props.category.value

  router.push(tenantTo(props.category.to))
}
</script>
<style scoped>
:deep(.mainCategoryCard:hover .avatar-hover) {
  transform: scale(1.15);
  transition: transform 0.2s;
  rotate: 2deg;
}
</style>