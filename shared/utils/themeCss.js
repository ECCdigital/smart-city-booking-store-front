/**
 * Softens a hex color for dark mode (less glare on dark backgrounds).
 */
export function softenHex(hex, factor = 0.88) {
  if (!hex?.startsWith("#") || hex.length < 7) {
    return hex;
  }

  const rgb = Number.parseInt(hex.slice(1, 7), 16);
  const r = Math.round(((rgb >> 16) & 0xff) * factor);
  const g = Math.round(((rgb >> 8) & 0xff) * factor);
  const b = Math.round((rgb & 0xff) * factor);

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function buildThemeCss(theme) {
  const primaryDark =
    theme.primaryDark ?? softenHex(theme.primary, 0.88);
  const secondaryDark =
    theme.secondaryDark ?? softenHex(theme.secondary, 0.92);

  return `
    :root {
      --ui-primary: ${theme.primary};
      --ui-secondary: ${theme.secondary};
    }
    .dark {
      --ui-primary: ${primaryDark};
      --ui-secondary: ${secondaryDark};
    }
  `;
}
