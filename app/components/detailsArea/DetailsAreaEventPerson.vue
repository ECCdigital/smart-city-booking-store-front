<template>
  <!--
    One person of an event — the contact person or a speaker: photo, name and,
    where given, phone and mail. `framed` sets it on a card. The photo repeats
    the name beside it, so it is hidden from screen readers; the links are
    underlined so they do not rely on colour alone (WCAG 1.4.1).
  -->
  <div
    class="flex items-center gap-3 min-w-0"
    :class="{ 'bg-white dark:bg-gray-700 rounded-lg p-3': framed }"
  >
    <UAvatar
      :src="mounted ? imageSource(person.image, 'thumbnail')?.src : undefined"
      :alt="person.name"
      size="lg"
      class="shrink-0"
      aria-hidden="true"
    />
    <div class="min-w-0">
      <p class="font-semibold break-words">{{ person.name }}</p>
      <a
        v-if="person.phone"
        :href="`tel:${person.phone.replace(/\s+/g, '')}`"
        class="flex items-center gap-1 text-primary underline"
      >
        <UIcon name="i-lucide-phone" class="size-4 shrink-0" aria-hidden="true" />
        <span>{{ person.phone }}</span>
      </a>
      <a
        v-if="person.email"
        :href="`mailto:${person.email}`"
        class="flex items-center gap-1 text-primary underline break-all"
      >
        <UIcon name="i-lucide-mail" class="size-4 shrink-0" aria-hidden="true" />
        <span>{{ person.email }}</span>
      </a>
    </div>
  </div>
</template>
<script setup>
import { useMediaImage } from "~/composables/utils/useMediaImage";

defineProps({
  /** `{ name, image, phone?, email? }` as `~/utils/eventPeople.js` reads it. */
  person: {
    type: Object,
    required: true,
  },
  framed: {
    type: Boolean,
    default: false,
  },
});

const { imageSource } = useMediaImage();

// The photo is set only in the browser: a photo that fails to load during
// server rendering errors before hydration, so the avatar never hears of it
// and shows the broken image instead of the initials.
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});
</script>
<style scoped></style>
