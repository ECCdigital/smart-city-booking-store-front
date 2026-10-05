import { adminOrigin } from "~~/shared/utils/adminOrigin";
import {
  appendReturnTarget,
  isExternalReturnTarget,
  parseReturnTarget,
  resolveReturnTarget,
  type ReturnTargetOptions,
} from "~~/shared/utils/returnTarget";

/**
 * The return target of the current page (`?redirect=`), validated, plus the
 * two things the auth pages do with it: hand it to the next page and follow
 * it once the user is signed in.
 */
export function useReturnTarget() {
  const route = useRoute();
  const config = useRuntimeConfig();
  const options: ReturnTargetOptions = {
    adminOrigin: adminOrigin(config.public.adminBaseUrl),
  };

  const target = computed(() =>
    parseReturnTarget(route.query.redirect, options),
  );

  /** `path` carrying the current (or the given, validated) target. */
  const withTarget = (path: string, raw?: unknown) =>
    appendReturnTarget(
      path,
      raw === undefined ? target.value : parseReturnTarget(raw, options),
    );

  /** Navigates to the current (or the given) target, `/` when refused. */
  const follow = (raw?: unknown) => {
    const destination = resolveReturnTarget(
      raw === undefined ? target.value : raw,
      options,
    );
    return navigateTo(destination, {
      external: isExternalReturnTarget(destination),
    });
  };

  return { options, target, withTarget, follow };
}
