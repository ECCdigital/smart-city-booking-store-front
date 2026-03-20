import { useInstanceStore } from "~~/stores/instance.js";

export function useFeatures() {
  const instanceStore = useInstanceStore();

  const catalogEnabled = computed(() => instanceStore.catalogEnabled);

  return { catalogEnabled };
}
