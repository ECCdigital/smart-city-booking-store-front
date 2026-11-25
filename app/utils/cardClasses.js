/**
 * The one look of a card: the start page's areas and the result cards share
 * it, so they read as one set. Complete class literals, so Tailwind finds them.
 *
 * The hover is a shadow and a ring, both painted outside the layout, so a
 * hovered card never moves its neighbours. The ring is in the accent colour,
 * in secondary where the theme sets no accent.
 */
export const CARD_SURFACE =
  "rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800";

export const CARD_HOVER =
  "transition duration-200 ease-out hover:shadow-lg hover:ring-2 hover:ring-[color:var(--ui-accent,var(--ui-secondary))] motion-reduce:transition-none";

/**
 * Keyboard focus: the hover's ring plus a dark (in dark mode white) outline
 * around it. The ring's colour is the tenant's and may be as light as the
 * page, so the outline is what keeps the focus visible at 3:1 (WCAG 1.4.11).
 * For a card that is itself the focused link; `ResultCard` writes the same
 * for a focused link inside it.
 */
export const CARD_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:focus-visible:outline-white focus-visible:ring-2 focus-visible:ring-[color:var(--ui-accent,var(--ui-secondary))]";
