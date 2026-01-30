import { logger } from "../utils/logger";
import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const log = logger.child({ caller: "server/api/theme/[..slug].get" });

  const url = event.node.req.url || "";
  const slug = url.split("/").pop()?.replace(".css", "") || "";

  let theme = defaultTheme;

  const { data, error } = await serverFetch(event, `/api/catalog/themes/${slug}`, {
    method: "GET",
  });

  if (error) {
    log.error(`Error fetching theme for slug "${slug}": ${error}`);
  }

  if (data?.colors?.primary && data?.colors?.secondary) {
    theme = data.colors;
  } else {
    log.warn(
      `Theme for slug "${slug}" does not have primary or secondary colors, using default theme.`
    );
  }

  setHeader(event, "Content-Type", "text/css");
  return `
    :root {
      --ui-primary: ${theme.primary};
      --ui-secondary: ${theme.secondary};
    }
  `;
});
