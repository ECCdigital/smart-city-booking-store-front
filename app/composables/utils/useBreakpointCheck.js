import { useWindowSize } from "@vueuse/core";

export function useBreakpointCheck() {
  const isGreaterThanSm = () => {
    const { width } = useWindowSize();
    return width.value >= 640;
  };

  const isGreaterThanMd = () => {
    const { width } = useWindowSize();
    return width.value >= 768;
  };

  const isGreaterThanLg = () => {
    const { width } = useWindowSize();
    return width.value >= 1024;
  }

  return { isGreaterThanSm, isGreaterThanMd, isGreaterThanLg };
}
