export type PortalMode = "offers" | "personal";

export interface ThemeColors {
  primary?: string;
  secondary?: string;
}

export interface Theme {
  active?: boolean;
  colors?: ThemeColors;
}

export interface Branding {
  theme?: Theme;
  logoUrl?: string;
}

export interface PortalModeResponse {
  mode: PortalMode;
  portalUrl?: string;
  branding: Branding;
}

export interface ThemeBundle {
  theme?: Theme;
  visibility?: "public" | "private" | "unlisted";
  logoUrl?: string;
  hero?: {
    title?: string;
    subtitle?: string;
  };
}

export interface CatalogData {
  name: string;
  slug: string;
  active: boolean;
  visibility: "public" | "private" | "unlisted";
  type: "instance" | "single";
  tenantId?: string;
  tenantIds?: string[];
  hero?: {
    title?: string;
    subtitle?: string;
  };
}

export interface OffersEnabledBundle {
  offersEnabled: true;
  branding: Branding;
  portalUrl?: string;
  catalog: CatalogData;
  tenants: Array<{ id: string; name: string }>;
  bookables?: Array<unknown>;
  bookable?: unknown;
  events?: Array<unknown>;
  event?: unknown;
}

export interface PersonalBundle {
  offersEnabled: false;
  branding: Branding;
  portalUrl?: string;
  catalog?: Partial<CatalogData>;
  tenants?: never[];
}

export type CatalogBundleResponse = OffersEnabledBundle | PersonalBundle;

export interface OffersEnabledCatalog {
  offersEnabled: true;
  catalog: CatalogData;
  branding?: Branding;
}

export interface PersonalCatalog {
  offersEnabled: false;
  slug: string;
  branding: Branding;
}

export type CatalogBySlugResponse = OffersEnabledCatalog | PersonalCatalog;
