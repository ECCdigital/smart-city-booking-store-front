/**
 * A keyboard focus that stays visible at 3:1 against the page in both colour
 * modes (WCAG 2.4.7, 1.4.11): a dark, in dark mode white, outline with a gap.
 * `outline-solid` because Nuxt UI's buttons set `focus:outline-none`, whose
 * style would otherwise carry over into the width set here.
 */
export const FOCUS_OUTLINE =
  "focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:focus-visible:outline-white";
