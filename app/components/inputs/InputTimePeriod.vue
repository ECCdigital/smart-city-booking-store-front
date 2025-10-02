<template>
  <UPopover v-model:open="open" :content="{ side: 'bottom' }">
    <UButton
      size="lg"
      color="neutral"
      variant="ghost"
      icon="i-lucide-calendar-clock"
      class="w-full text-gray-400 font-normal bg-white dark:bg-white/10 py-2 px-3"
      :ui="{
        leadingIcon: 'text-[16px] mr-1',
      }"
    >
      <template v-if="model.start">
        <template v-if="model.end">
          <div class="px-1 text-re">
            <NuxtTime
              :datetime="model.start"
              year="numeric"
              month="numeric"
              day="numeric"
              hour="2-digit"
              minute="2-digit"
            />
            -
            <NuxtTime
              :datetime="model.end"
              year="numeric"
              month="numeric"
              day="numeric"
              hour="2-digit"
              minute="2-digit"
            />
          </div>
        </template>
        <template v-else>
          <NuxtTime
            :datetime="model.start"
            year="numeric"
            month="numeric"
            day="numeric"
            hour="2-digit"
            minute="2-digit"
          />
        </template>
      </template>
      <template v-else> Zeitraum </template>
    </UButton>
    <template #content>
      <UCard style="max-width: 90vw">
        <p class="text-lg font-bold">Zeitraum auswählen</p>

        <div class="flex flex-col md:flex-row gap-2">
          <div class="py-3 w-full">
            <p class="px-1">Startzeitpunkt</p>
            <DatePicker v-model="model.start" />
          </div>
          <div class="py-3 w-full">
            <p class="px-1">Endzeitpunkt</p>
            <DatePicker v-model="model.end" />
          </div>
        </div>
        <div class="flex justify-end">
          <UButton label="OK" variant="ghost" @click="open = false" />
        </div>
      </UCard>
    </template>
  </UPopover>
</template>
<script setup>
import DatePicker from "./DatePicker.vue";

const model = defineModel();
const open = ref(false);
</script>
<style scoped></style>
