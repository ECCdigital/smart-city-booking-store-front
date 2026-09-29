/**
 * An Offer is one entry of the Catalog: a Bookable or an Event. The two come
 * from different backend exports with different shapes, so everything that
 * reads them together (the search, the filter facets, the map) goes through
 * these accessors instead of branching on the shape at every call site. The
 * presentational components keep receiving the raw entity; they already
 * branch on `type === "event"` themselves.
 */

export type OfferKind =
  | "room"
  | "event-location"
  | "resource"
  | "ticket"
  | "event";

/** The Kinds the Result Page can narrow by, in the order the facet lists them. */
export const OFFER_KINDS: readonly OfferKind[] = [
  "room",
  "event-location",
  "resource",
  "ticket",
  "event",
];

/** A price category as both bookables and tickets carry it. */
export interface OfferPriceCategory {
  priceEur: number | null;
  external?: boolean;
  unit?: string;
  holidays?: unknown[];
}

/** A ticket: a bookable export that belongs to an event. */
export interface OfferTicket {
  id: string;
  eventId?: string;
  priceCategories: OfferPriceCategory[];
  priceValueAddedTax?: number;
}

/** Where an Offer is; the same shape on both entities. */
export interface OfferLocation {
  display_address?: string;
  coordinates?: { points?: [number | null, number | null] };
  address?: { city?: string; post_code?: string; street?: string };
}

/**
 * The union of what a bookable and an event export, as far as the Result
 * Page reads it. Everything kind-specific is optional; the accessors below
 * know which side carries what.
 */
export interface OfferItem {
  id: string;
  tenantId: string;
  type?: OfferKind | string;
  // bookable
  title?: string;
  description?: string;
  tags?: string[];
  flags?: string[];
  isBookable?: boolean;
  eventId?: string;
  priceCategories?: OfferPriceCategory[];
  priceValueAddedTax?: number;
  customFields?: unknown[];
  // event
  information?: {
    name?: string;
    description?: string;
    teaserText?: string;
    tags?: string[];
    flags?: string[];
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
  };
  attendees?: {
    publicEvent?: boolean;
    needsRegistration?: boolean;
    free?: boolean;
  };
  tickets?: OfferTicket[];
  externalBookingUrl?: string;
  eventOrganizer?: { name?: string };
  eventLocation?: { name?: string };
  // shared
  location?: OfferLocation | string;
  distanceMeter?: number;
}

export function isEventItem(
  item: Pick<OfferItem, "type"> | null | undefined,
): boolean {
  return item?.type === "event";
}

export function kindOf(item: OfferItem): OfferKind | undefined {
  return item.type as OfferKind | undefined;
}

/**
 * One identity for the merged list. Bookable and event ids come from different
 * collections, so the id alone is not enough.
 */
export function offerKey(item: OfferItem): string {
  return `${item.type ?? "bookable"}:${item.tenantId}:${item.id}`;
}

export function titleOf(item: OfferItem): string {
  return (isEventItem(item) ? item.information?.name : item.title) ?? "";
}

export function descriptionOf(item: OfferItem): string {
  if (isEventItem(item)) {
    return item.information?.description || item.information?.teaserText || "";
  }
  return item.description ?? "";
}

export function tagsOf(item: OfferItem): string[] {
  return (isEventItem(item) ? item.information?.tags : item.tags) ?? [];
}

export function flagsOf(item: OfferItem): string[] {
  return (isEventItem(item) ? item.information?.flags : item.flags) ?? [];
}

/**
 * Whether the Offer can be booked from the list: a bookable when the backend
 * says so, an event when it is public. Tickets, registration and external
 * booking are the event card's own concern.
 */
export function isBookableOffer(item: OfferItem): boolean {
  if (isEventItem(item)) {
    return item.attendees?.publicEvent === true;
  }
  return item.isBookable !== false;
}

/**
 * The merged source of the Result Page. A ticket (a bookable with an
 * `eventId`) is reached through its event, not listed on its own; orphan
 * tickets without an event stay. Events already carry `type: "event"` from the
 * bundle loader.
 */
export function mergeOffers<T extends OfferItem>(
  bookables: readonly T[] | null | undefined,
  events: readonly T[] | null | undefined,
): T[] {
  const standalone = (bookables ?? []).filter((b) => !b.eventId);
  return [...standalone, ...(events ?? [])];
}

function withVat(price: number, vatPercent: number | undefined): number {
  return vatPercent ? price + (price * vatPercent) / 100 : price;
}

/** The cheapest price of a ticket, gross. */
export function ticketMinPrice(ticket: OfferTicket): number {
  const prices = ticket.priceCategories
    .map((c) => c.priceEur)
    .filter((p): p is number => typeof p === "number");
  if (prices.length === 0) return 0;
  return withVat(Math.min(...prices), ticket.priceValueAddedTax);
}

/**
 * The "from" price the list shows and sorts by, gross, in euro.
 *
 * Bookable: the cheapest regular price category, leaving out holiday
 * categories and external service fees; `0` when every category is free;
 * `null` when there are no categories at all.
 * Event: the cheapest ticket; `0` for a free event or one without tickets.
 */
export function fromPriceOf(item: OfferItem): number | null {
  if (isEventItem(item)) {
    if (item.attendees?.free || !item.tickets?.length) return 0;
    return Math.min(...item.tickets.map(ticketMinPrice));
  }

  const categories = item.priceCategories ?? [];
  if (categories.length === 0) return null;

  if (categories.every((c) => c.priceEur === 0 || c.priceEur === null)) {
    return 0;
  }

  const regular = categories
    .filter((c) => !c.external || c.unit !== "service-fee")
    .filter((c) => !c.holidays || c.holidays.length === 0)
    .map((c) => c.priceEur)
    .filter((p): p is number => typeof p === "number");

  if (regular.length === 0) return null;
  return withVat(Math.min(...regular), item.priceValueAddedTax);
}

/** An event's start and end as epoch milliseconds, or null without a date. */
export function eventPeriodOf(
  item: OfferItem,
): { start: number; end: number } | null {
  const info = item.information;
  if (!info?.startDate) return null;
  const start = new Date(
    `${info.startDate}T${info.startTime || "00:00"}:00`,
  ).getTime();
  const endDate = info.endDate || info.startDate;
  const end = new Date(`${endDate}T${info.endTime || "23:59"}:00`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return { start, end };
}

/**
 * Whether an event is on during the searched period: it overlaps the period,
 * it does not have to lie inside it. A festival running Friday to Sunday is a
 * match for a Saturday morning search.
 */
export function eventOverlapsPeriod(
  item: OfferItem,
  period: { start: number | null; end: number | null },
): boolean {
  const own = eventPeriodOf(item);
  if (!own || period.start === null || period.end === null) return false;
  return own.start < period.end && own.end > period.start;
}
