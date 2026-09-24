<template>
  <div>
    <div class="relative flex items-center justify-center mb-12">
      <div
        class="absolute w-24 h-24 rounded-full bg-primary/30 animate-[ping-soft_2.5s_cubic-bezier(0,0,0.2,1)_infinite]"
      />

      <div class="absolute w-28 h-28 rounded-full bg-white dark:bg-gray-900" />
      <div
        class="openButton relative z-10 rounded-full w-20 h-20 flex items-center justify-center"
      >
        <div
          class="w-14 h-14 rounded-full border-4 border-primary/30 border-t-primary animate-spin"
        />
      </div>
    </div>

    <div class="text-center text-sm">
      <p class="mb-1">Laden...</p>
    </div>
  </div>
</template>
<script setup></script>

<style scoped></style>
