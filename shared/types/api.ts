export interface ThemeBundle {
  theme?: {
    active?: boolean;
    colors?: {
      primary?: string;
      secondary?: string;
    };
  };
  visibility?: "public" | "private";
  logoUrl?: string;
  hero?: {
    title?: string;
    subtitle?: string;
  };
}

export interface CatalogBundle {
  catalog: {
    name: string;
    slug: string;
    active: boolean;
    visibility: "public" | "private";
    theme: { colors: { primary: string; secondary: string }; active: boolean };
    type: "instance" | "single";
    tenantId: string;
    tenantIds: string[];
  };
  tenants: Array<{ id: string; name: string }>;
  bookables?: Array<unknown>;
  bookable?: unknown;
  events?: Array<unknown>;
  event?: unknown;
}
