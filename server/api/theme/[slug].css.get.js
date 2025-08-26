import { logger } from "../utils/logger";
import {apiFetch} from "~~/server/api/utils/apiFetch.js";

export default defineEventHandler(async (event) => {
  const log = logger.child({ caller: "server/api/theme/[..slug].get" });

  const url = event.node.req.url || "";
  const slug = url.split("/").pop()?.replace(".css", "") || "";

  let theme = defaultTheme;

  try {
    const fetchedTheme = await apiFetch( event,
      `/api/catalog/themes/${slug}`,
      {
        method: "GET",
      }
    );

    if (fetchedTheme?.colors?.primary && fetchedTheme?.colors?.secondary) {
      theme = fetchedTheme.colors;
    } else {
      log.warn(
        `Theme for slug "${slug}" does not have primary or secondary colors, using default theme.`
      );
    }
  } catch (error) {
    log.error(`Error fetching theme for slug "${slug}": ${error}`);
  }

  setHeader(event, "Content-Type", "text/css");
  return `
    :root {
      --ui-primary: ${theme.primary};
      --ui-secondary: ${theme.secondary};
    }
  `;
});
