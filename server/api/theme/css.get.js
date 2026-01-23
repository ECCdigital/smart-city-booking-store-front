import { logger } from "~~/server/api/utils/logger.js";
import { apiFetch } from "~~/server/api/utils/apiFetch.js";

export default defineEventHandler(async (event) => {
  const log = logger.child({ caller: "server/api/theme/[..slug].get" });

  let theme = defaultTheme;

  try {
    const fetchedThemeBundle = await apiFetch(event, `/api/catalog/themes`, {
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
});
