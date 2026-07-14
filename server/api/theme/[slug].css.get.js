import { getThemeBundle } from "~~/server/api/utils/themeBundle.ts";
import { createConditionalCachedHandler } from "~~/server/utils/conditionalCache";
import { buildThemeCss } from "~~/shared/utils/themeCss.js";

const defaultTheme = {
  primary: "#3b82f6",
  secondary: "#10b981",
};

export default createConditionalCachedHandler(
  async (event) => {
    const url = event.node.req.url || "";
    const slug = url.split("/").pop()?.replace(".css", "") || "";

    const bundle = await getThemeBundle(event, slug);
    const colors = bundle?.theme?.colors;
    const theme =
      colors?.primary && colors?.secondary ? colors : defaultTheme;

    setHeader(event, "Content-Type", "text/css");
    setHeader(event, "Cache-Control", "public, max-age=300, s-maxage=300");
    return buildThemeCss(theme);
  },
  {
    maxAge: 300,
    authScoped: false,
    getKey: (event) => {
      const url = event.node?.req?.url || "";
      const slug = url.split("/").pop()?.replace(".css", "") || "";
      return `theme-css::${slug}`;
    },
  }
);
