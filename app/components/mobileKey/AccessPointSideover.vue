<template>
  <USlideover
    v-model:open="isOpen"
    side="bottom"
    inset
    :close="{
      color: 'primary',
      variant: 'ghost',
    }"
    :ui="{
      wrapper: 'bg-black/70',
      content: 'w-[90vw] mx-auto rounded-t-2xl',
    }"
  >
    <UButton
      label="Öffnen"
      trailing-icon="i-lucide-chevron-right"
      variant="ghost"
      color="primary"
      size="md"
    />
    <template #header>
      <div class="flex w-full items-center gap-2 justify-between">
        <AccessPointLabel :access-point="accessPoint" />
        <UButton
          trailing-icon="i-lucide-x"
          variant="ghost"
          color="primary"
          size="md"
          @click="() => isOpen = false"
        />
      </div>
    </template>
    <template #body>
      <div class="pb-5 h-[60vh]">
        <!-- for remote access -->
      <AccessPointSideoverRemoteContent
        v-if="accessPoint.mode === 'remote'"
        :access-point="accessPoint"
        :booking-id="bookingId"
        @close-sideover="() => isOpen = false"
      />
      <USkeleton v-else class="h-64 w-full rounded-lg" />

      <!-- toDo - add help information !!!!!!!!!!!!!!!!!!!!!!!!!! -->
      </div>
    </template>
  </USlideover>
</template>
<script setup>
import AccessPointLabel from "~/components/mobileKey/AccessPointLabel.vue";
import AccessPointSideoverRemoteContent from "~/components/mobileKey/AccessPointSideoverRemoteContent.vue";

const props = defineProps({
  accessPoint: {
    type: Object,
    required: true,
  },
  bookingId: {
    type: String,
    required: true,
  },
});

const isOpen = ref(false);
</script>

<style scoped></style>
