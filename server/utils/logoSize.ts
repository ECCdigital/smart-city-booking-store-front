import { LOGO_SIZES, type LogoSize } from "~~/shared/types/hero";

/**
 * The S/M/L step of a logo the instance sizes. A value off the list reads as
 * the given default without a report, because a default filled in is no
 * failure.
 */
export function readLogoSize(value: unknown, fallback: LogoSize): LogoSize {
  return (LOGO_SIZES as readonly unknown[]).includes(value)
    ? (value as LogoSize)
    : fallback;
}
