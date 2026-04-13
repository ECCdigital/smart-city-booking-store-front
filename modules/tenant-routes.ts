import { defineNuxtModule, extendPages } from "@nuxt/kit";
import type { NuxtPage } from "@nuxt/schema";

export default defineNuxtModule({
  meta: { name: "tenant-routes" },
  setup() {
    extendPages((pages) => {
      const excluded = ["/login", "/register", "/password"];

      function shouldInclude(path: string): boolean {
        return !excluded.some((ex) => path.startsWith(ex));
      }

      function deepClone(page: NuxtPage, prefix: string): NuxtPage {
        const newPath =
          page.path === "/"
            ? prefix
            : page.path.startsWith("/")
            ? `${prefix}${page.path}`
            : page.path;

        return {
          ...page,
          path: newPath,
          name: page.name ? `tenant-${page.name}` : undefined,
          children: page.children
            ? page.children
                .filter((child) => shouldInclude(child.path))
                .map((child) => deepClone(child, ""))
            : undefined,
        };
      }

      const tenantPages: NuxtPage[] = pages
        .filter((page) => shouldInclude(page.path))
        .map((page) => deepClone(page, "/t/:tenantID"));

      pages.push(...tenantPages);
    });
  },
});
