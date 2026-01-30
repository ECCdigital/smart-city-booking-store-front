import { logger } from "~~/server/api/utils/logger.js";
import { serverFetch } from "~~/server/api/utils/serverFetch.ts";
import { createConditionalCachedHandler } from "~~/server/utils/conditionalCache";

const defaultTheme = {
  primary: "#3b82f6",
  secondary: "#10b981",
};

export default createConditionalCachedHandler(
  async (event) => {
    const log = logger.child({ caller: "server/api/theme/[..slug].get" });

    let theme = defaultTheme;

    const { data, error } = await serverFetch(event, `/api/catalog/themes`, {
      method: "GET",
    });

    if (!error) {
      if (data.theme?.colors?.primary && data.theme?.colors?.secondary) {
        theme = data.theme.colors;
      } else {
        log.warn(
          `Theme does not have primary or secondary colors, using default theme.`
        );
      }
    }

    setHeader(event, "Content-Type", "text/css");
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
  { maxAge: 300 }
);
