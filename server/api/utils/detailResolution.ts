/**
 * Resolution of one bookable or event for a direct link, independent of the
 * catalog list. The storefront asks the backend for the offer in every
 * tenant that can hold it; a 404 there is "not available".
 *
 * Two backend routes answer per tenant. The catalog interface (`/json/…`)
 * delivers what the public reaches, in the shape the detail page reads. The
 * direct-link route (`/api/:tenant/bookables/public/:id`,
 * `/api/:tenant/events/:id`) delivers the same offers as stored, with their
 * wish to be listed (`isPublic`); its answer is brought into that shape
 * where the catalog interface refuses the tenant.
 *
 * One rule is the storefront's own: the detail page shows an offer only
 * when it asks to be listed. An `unlisted` offer (`isPublic` false) is
 * reached by the direct link to its checkout alone (ECCdigital/tickets#225).
 */

export type DetailKind = "bookable" | "event";

export type DetailFetchFailure = {
  status: number;
  message: string;
  data?: unknown;
};

export type DetailFetchResult =
  | { data: unknown; error: null }
  | { data: null; error: DetailFetchFailure };

export type DetailFetch = (path: string) => Promise<DetailFetchResult>;

export type DetailHit = { tenantId: string; item: Record<string, unknown> };

type CandidateParams = {
  /** The tenant of a single-tenant catalog. */
  catalogTenantId?: string | null;
  /**
   * The tenants the catalog bundle lists; on a `/t/:tenantID/…` URL the
   * tenant of the URL alone, listed or not.
   */
  listedTenantIds?: string[];
  /** The tenant a link names explicitly (`?tenantId=`). */
  tenantHint?: string | null;
};

/**
 * The tenants a direct link is asked in. The tenant of a single-tenant
 * catalog is asked alone. Otherwise every given tenant is asked, plus the tenant the link names — a hint only
 * ever adds a candidate, the backend still answers for it.
 */
export function detailCandidateTenants({
  catalogTenantId = null,
  listedTenantIds = [],
  tenantHint = null,
}: CandidateParams): string[] {
  if (catalogTenantId) return [catalogTenantId];

  return [...new Set([...listedTenantIds, tenantHint].filter(Boolean))] as string[];
}

/**
 * Whether the tenant page answers "Tenant Not Found" for a tenant the
 * catalog bundle does not list. Lists do; a direct link to one bookable or
 * event does not — a tenant without catalog participation can still hold a
 * reachable offer, and the backend answers 404 where it does not.
 */
export function tenantMustBeListed({
  bookableId = null,
  eventId = null,
}: {
  bookableId?: unknown;
  eventId?: unknown;
}): boolean {
  return !bookableId && !eventId;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A media site as the address the detail page reads: a string, else "". */
function mediaAddress(value: unknown): string {
  if (typeof value === "string") return value;
  if (isRecord(value) && typeof value.url === "string") return value.url;
  return "";
}

function fromDirectLinkBookable(data: Record<string, unknown>) {
  const { _populated, ...bookable } = data;
  const related = isRecord(_populated) ? _populated.relatedBookables : null;
  return {
    ...bookable,
    relatedBookables: Array.isArray(related) ? related : [],
  };
}

function fromDirectLinkEvent(data: Record<string, unknown>) {
  const information = isRecord(data.information) ? data.information : {};
  const organizer = isRecord(data.eventOrganizer) ? data.eventOrganizer : {};
  const speakers = Array.isArray(organizer.speakers) ? organizer.speakers : [];

  return {
    ...data,
    information: {
      ...information,
      teaserImage: mediaAddress(information.teaserImage),
    },
    images: (Array.isArray(data.images) ? data.images : []).map(mediaAddress),
    eventOrganizer: {
      ...organizer,
      contactPersonImage: mediaAddress(organizer.contactPersonImage),
      speakers: speakers.map((speaker) =>
        isRecord(speaker)
          ? { ...speaker, image: mediaAddress(speaker.image) }
          : speaker,
      ),
    },
    // The direct-link route carries no tickets.
    tickets: Array.isArray(data.tickets) ? data.tickets : [],
  };
}

const routes = {
  bookable: {
    listed: (tenantId: string, id: string) => `/json/${tenantId}/bookables/${id}`,
    directLink: (tenantId: string, id: string) =>
      `/api/${tenantId}/bookables/public/${id}?populate=true`,
    fromDirectLink: fromDirectLinkBookable,
  },
  event: {
    listed: (tenantId: string, id: string) => `/json/${tenantId}/events/${id}`,
    directLink: (tenantId: string, id: string) => `/api/${tenantId}/events/${id}`,
    fromDirectLink: fromDirectLinkEvent,
  },
};

/**
 * The backend failed to answer for an offer: anything but a 404. It is an
 * error of its own and never "not available".
 */
export class DetailResolutionError extends Error {
  upstream: DetailFetchFailure;

  constructor(upstream: DetailFetchFailure) {
    super(`Detail resolution failed: ${upstream.status} ${upstream.message}`);
    this.name = "DetailResolutionError";
    this.upstream = upstream;
  }
}

type TenantAnswer = { hit: DetailHit | null; failure: DetailFetchFailure | null };

/** A 404 is the backend saying "not available"; every other error is a failure. */
function failureOf(result: DetailFetchResult): DetailFetchFailure | null {
  return result.error && result.error.status !== 404 ? result.error : null;
}

async function resolveInTenant(
  kind: DetailKind,
  id: string,
  tenantId: string,
  fetch: DetailFetch,
): Promise<TenantAnswer> {
  const route = routes[kind];

  const [listed, direct] = await Promise.all([
    fetch(route.listed(tenantId, id)),
    fetch(route.directLink(tenantId, id)),
  ]);

  // Only the direct-link route tells whether the offer asks to be listed;
  // without its answer the offer is not shown.
  if (direct.error || !isRecord(direct.data) || !direct.data.id) {
    return { hit: null, failure: failureOf(direct) ?? failureOf(listed) };
  }
  if (direct.data.isPublic !== true) {
    return { hit: null, failure: null };
  }

  const item =
    !listed.error && isRecord(listed.data) && listed.data.id
      ? listed.data
      : route.fromDirectLink(direct.data);
  return { hit: { tenantId, item }, failure: null };
}

/**
 * Finds the offer in the first candidate tenant the backend delivers it
 * for; null when it delivers it for none (404 everywhere).
 *
 * @throws {DetailResolutionError} when no tenant delivers it and the backend
 *   failed for at least one: the offer may well exist.
 */
export async function resolveDetail({
  kind,
  id,
  tenantIds,
  fetch,
}: {
  kind: DetailKind;
  id: string;
  tenantIds: string[];
  fetch: DetailFetch;
}): Promise<DetailHit | null> {
  const answers = await Promise.all(
    tenantIds.map((tenantId) => resolveInTenant(kind, id, tenantId, fetch)),
  );

  const hit = answers.find((answer) => answer.hit)?.hit;
  if (hit) return hit;

  const failure = answers.find((answer) => answer.failure)?.failure;
  if (failure) throw new DetailResolutionError(failure);

  return null;
}
