import {useTenantStore} from "~~/stores/tenant.js";
import {bookingTenantOf} from "~/utils/bookingTenant.js";

/** What a tenant nobody names is called: a deleted one, or one the store does not know. */
const UNKNOWN_TENANT_NAME = "Unbekannt";

/** A booking as a booking-bound customer route sends it; `tenant` is its snapshot. */
type BookingOfTenant = { tenantId: string; tenant?: unknown };

export function useTenant() {
  const route = useRoute();

  const tenantID = computed(() => (route.params.tenantID as string) || null);

  const isTenantContext = computed(() => !!tenantID.value);

    const tenantsStore = useTenantStore();

  /**
   * The tenant a booking page speaks for (`bookingTenantOf`): the booking's
   * own snapshot, the store only for an answer that carries none. `null`
   * when neither knows it.
   */
  function getBookingTenant(booking: BookingOfTenant) {
      return bookingTenantOf(
          booking,
          tenantsStore.getTenantById(booking.tenantId),
      );
  }

  function getBookingTenantName(booking: BookingOfTenant) {
      return getBookingTenant(booking)?.name || UNKNOWN_TENANT_NAME;
  }

  function getTenantName(tenantId: string) {

          const tenant = tenantsStore.getTenantById(tenantId);
          if (tenant) {
              return tenant.name;
          }
          return UNKNOWN_TENANT_NAME;

  }

  return { tenantID, isTenantContext, getBookingTenant, getBookingTenantName, getTenantName };
}
