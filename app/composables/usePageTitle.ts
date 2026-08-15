import type { MaybeRefOrGetter } from "vue";
import { toValue } from "vue";

export function usePageTitle(
  title?: MaybeRefOrGetter<string | undefined | null>,
) {
  useHead({
    title: computed(() => {
      if (title === undefined) {
        return undefined;
      }

      const value = toValue(title);
      return value || undefined;
    }),
  });
}
