<template>
  <UCard
      class="mainCategoryCard h-full bg-white dark:bg-gray-700 text-black dark:text-gray-200 shadow-lg  hover:scale-125 hover:border-3 hover:-m-3 hover:border-primary"
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

const contrastToPrimary = computed(() => {
      return useContrastColor().contrastToPrimary()
    }
);

const router = useRouter()

function goToCategory() {
  console.log("Navigating to bookables with category:", props.category.value)
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