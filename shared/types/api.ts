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
  faviconUrl?: string;
}

export interface PortalModeResponse {
  mode: PortalMode;
  portalUrl?: string;
}

/**
 * The backend's Theme Bundle export. Everything that decides the look of the
 * site travels here and nowhere else (storefront ADR 0001), which is why the
 * catalog bundle and the portal mode carry no branding.
 *
 * The storefront never hands this to the client: `/api/theme/bundle` answers
 * with the validated, sanitised `ThemeView` built from it.
 */
export interface ThemeBundle {
  theme?: Theme;
  visibility?: "public" | "private" | "unlisted";
  logoUrl?: string;
  faviconUrl?: string;
  /** The Catalog's name — the Portal Name for the instance catalog. */
  name?: string;
  /** Validated by `parseHeroLayout`; shapes are in `shared/types/hero.ts`. */
  heroLayout?: unknown;
  background?: unknown;
  logo?: unknown;
}

export interface CatalogData {
  name: string;
  slug: string;
  active: boolean;
  visibility: "public" | "private" | "unlisted";
  type: "instance" | "single";
  tenantId?: string;
  tenantIds?: string[];
}

export interface OffersEnabledBundle {
  offersEnabled: true;
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

/** Recurring block-period definition on a bookable (admin configuration). */
export interface BlockPeriodDefinition {
  id: string;
  label: string;
  /** 0 = Sunday … 6 = Saturday (Date.getDay convention). */
  startWeekday: number;
  startTime: string;
  endWeekday: number;
  endTime: string;
}

export type BlockPeriodUnavailableReason =
  | "availability"
  | "permission"
  | "block-period-mismatch"
  | "max-booking-date"
  | "parent-availability"
  | "child-bookings"
  | "event-date"
  | "event-seats";

/** Concrete bookable block-period instance returned by GET /block-periods. */
export interface BlockPeriodInstance {
  blockPeriodId: string;
  label: string;
  timeBegin: number;
  timeEnd: number;
  available: boolean;
  priceEur?: number;
  reason?: BlockPeriodUnavailableReason;
}

export interface BlockPeriodsResponse {
  title: string;
  blockPeriods: BlockPeriodInstance[];
}
