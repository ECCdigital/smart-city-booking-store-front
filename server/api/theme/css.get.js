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

    try {
      const fetchedThemeBundle = await serverFetch(event, `/api/catalog/themes`, {
        method: "GET",
      });

      if (
        fetchedThemeBundle.theme?.colors?.primary &&
        fetchedThemeBundle.theme?.colors?.secondary
      ) {
        theme = fetchedThemeBundle.theme.colors;
      } else {
        log.warn(
          `Theme does not have primary or secondary colors, using default theme.`
        );
      }
    } catch (error) {
      log.error(`Error fetching theme: ${error}`);
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
