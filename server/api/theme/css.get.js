import { getThemeBundle } from "~~/server/api/utils/themeBundle.ts";
import { createConditionalCachedHandler } from "~~/server/utils/conditionalCache";
import { buildThemeCss } from "~~/shared/utils/themeCss.js";

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
    return buildThemeCss(theme);
  },
  { maxAge: 300, authScoped: false }
);
