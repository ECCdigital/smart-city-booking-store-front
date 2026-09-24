import {useTenantStore} from "~~/stores/tenant.js";
import {bookingTenantOf} from "~/utils/bookingTenant.js";

/** A booking as a booking-bound customer route sends it; `tenant` is its snapshot. */
type BookingWithTenantSnapshot = { tenantId: string; tenant?: unknown };

export function useTenant() {
  const route = useRoute();

  const tenantID = computed(() => (route.params.tenantID as string) || null);

  const isTenantContext = computed(() => !!tenantID.value);

    const tenantsStore = useTenantStore();

  /**
   * The tenant a booking page speaks for (`bookingTenantOf`): the booking's
   * own snapshot, the store only for an answer that carries none. `null`
   * when neither knows it (a deleted tenant); the page names it with
   * `account.unknownTenant`.
   */
  function getBookingTenant(booking: BookingWithTenantSnapshot) {
      return bookingTenantOf(
          booking,
          tenantsStore.getTenantById(booking.tenantId),
      );
  }

  function getTenantName(tenantId: string) {

          const tenant = tenantsStore.getTenantById(tenantId);
          if (tenant) {
              return tenant.name;
          }
          return "Unbekannt";

  }

  return { tenantID, isTenantContext, getBookingTenant, getTenantName };
}
