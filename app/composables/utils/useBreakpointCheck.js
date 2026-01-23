import { computed } from "vue";
import { useWindowSize } from "@vueuse/core";

export function useBreakpointCheck() {
  const { width } = useWindowSize();

  const isGreaterThanSm = computed(() => width.value >= 640);
  const isGreaterThanMd = computed(() => width.value >= 768);
  const isGreaterThanLg = computed(() => width.value >= 1024);

  return { isGreaterThanSm, isGreaterThanMd, isGreaterThanLg };
}
