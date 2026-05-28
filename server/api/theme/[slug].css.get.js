import { logger } from "../utils/logger";
import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

const defaultTheme = {
  primary: "#3b82f6",
  secondary: "#10b981",
};

export default defineEventHandler(async (event) => {
  const log = logger.child({ caller: "server/api/theme/[slug].css.get" });

  const url = event.node.req.url || "";
  const slug = url.split("/").pop()?.replace(".css", "") || "";

  let theme = defaultTheme;

  const { data, error } = await serverFetch(event, `/api/catalog/themes/${slug}`, {
    method: "GET",
  });

  if (error) {
    log.error(`Error fetching theme for slug "${slug}": ${error.message}`);
  } else if (data?.theme?.colors?.primary && data?.theme?.colors?.secondary) {
    theme = data.theme.colors;
  } else {
    log.warn(
      `Theme for slug "${slug}" missing primary or secondary colors, using default theme.`
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
