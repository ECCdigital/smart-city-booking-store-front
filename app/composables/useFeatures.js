import { useInstanceStore } from "~~/stores/instance.js";
import { usePortalStore } from "~~/stores/portal.js";

export function useFeatures() {
  const instanceStore = useInstanceStore();
  const portalStore = usePortalStore();

  const publicOffersEnabled = computed(
    () => instanceStore.publicOffersEnabled
  );
  const portalMode = computed(() => portalStore.mode);
  const isOffersMode = computed(() => portalStore.isOffersMode);
  const isPersonalMode = computed(() => portalStore.isPersonalMode);

  return { publicOffersEnabled, portalMode, isOffersMode, isPersonalMode };
}
