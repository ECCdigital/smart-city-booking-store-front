import { useTenantStore } from "~~/stores/tenant.js";
import { bookingTenantOf } from "~/utils/bookingTenant.js";
import { customerServiceOf, supportContactOf } from "~/utils/emergencyHelp.js";

/**
 * The provider's emergency contact for the tenant of a booking, read from
 * the booking's tenant snapshot (`booking.tenant` →
 * `accessApps[].customerService`, backend ticket 18), which every
 * booking-bound customer route sends whatever the tenant's standing. Only
 * where there is no snapshot - no booking yet, or a backend before it - the
 * tenant store (`GET /api/tenants/public`) answers, and
 * `fetchCustomerServiceInfo` makes sure it carries the access apps; with a
 * snapshot there is nothing to load.
 *
 * `tenant` is the tenant the booking speaks for (`bookingTenantOf`);
 * `serviceInfo` is the provider's contact alone (the locker accordion);
 * `supportContact` is the Provider Support Contact at the Control Button,
 * with the fallback to the tenant's general contact.
 */
export function useEmergencyHelp(tenantId, providerId, booking = null) {
    const tenantStore = useTenantStore();

    const tenant = computed(() =>
        bookingTenantOf(
            unref(booking),
            tenantStore.getTenantById(unref(tenantId)),
        ),
    );

    const serviceInfo = computed(() =>
        customerServiceOf(tenant.value, unref(providerId)),
    );

    const supportContact = computed(() =>
        supportContactOf(tenant.value, unref(providerId)),
    );

    async function fetchCustomerServiceInfo() {
        // A booking that names its tenant itself needs no public list.
        if (bookingTenantOf(unref(booking))) return;
        // The catalog bundle may have filled the store without the access
        // apps; this brings them in without replacing the list.
        await tenantStore.fetchAccessApps();
    }

    return { tenant, serviceInfo, supportContact, fetchCustomerServiceInfo };
}
