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
  branding: Branding;
}

export interface ThemeBundle {
  theme?: Theme;
  visibility?: "public" | "private" | "unlisted";
  logoUrl?: string;
  faviconUrl?: string;
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

/** One input of a card auth method, as the backend labels it. */
export interface CardField {
  label?: string;
  placeholder?: string;
  helpText?: string;
}

/** A card auth method offered by the instance, from `/auth/card-methods`. */
export interface CardMethod {
  id: string;
  label?: string;
  description?: string;
  publicIdField: CardField;
  secretField: CardField;
}

/** What the backend returns for a signed-in session. */
export interface SsoSigninResponse {
  user?: unknown;
  permissions?: unknown;
}
