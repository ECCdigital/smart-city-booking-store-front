import { getThemeBundle } from "~~/server/api/utils/themeBundle.ts";
import { createConditionalCachedHandler } from "~~/server/utils/conditionalCache";

const defaultTheme = {
  primary: "#FF8B00",
  secondary: "#1D9ECC",
};

export default createConditionalCachedHandler(
  async (event) => {
    const bundle = await getThemeBundle(event);
    const colors = bundle?.theme?.colors;
    const theme =
      colors?.primary && colors?.secondary ? colors : defaultTheme;

    setHeader(event, "Content-Type", "text/css");
    setHeader(event, "Cache-Control", "public, max-age=300, s-maxage=300");
    return `
      :root {
        --ui-primary: ${theme.primary};
        --ui-secondary: ${theme.secondary};
      }
      .dark {
        --ui-primary: ${theme.primary};
        --ui-secondary: ${theme.secondary};
      }
    `;
  },
  { maxAge: 300, authScoped: false }
);
