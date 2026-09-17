import { useTenantStore } from "~~/stores/tenant.js";
import { customerServiceOf, supportContactOf } from "~/utils/emergencyHelp.js";

/**
 * The provider's emergency contact for one tenant, read from the tenant store
 * (`GET /api/tenants/public` → `accessApps[].customerService`, backend 4.3).
 * There is no request of its own any more - the locker route this used to
 * proxy is gone - so `fetchCustomerServiceInfo` only makes sure the tenants
 * carry their access apps; `serviceInfo` follows the store from then on.
 *
 * `serviceInfo` is the provider's contact alone (the locker accordion);
 * `supportContact` is the Provider Support Contact at the Control Button,
 * with the fallback to the tenant's general contact.
 */
export function useEmergencyHelp(tenantId, providerId) {
    const tenantStore = useTenantStore();

    const serviceInfo = computed(() =>
        customerServiceOf(
            tenantStore.getTenantById(unref(tenantId)),
            unref(providerId),
        ),
    );

    const supportContact = computed(() =>
        supportContactOf(
            tenantStore.getTenantById(unref(tenantId)),
            unref(providerId),
        ),
    );

    async function fetchCustomerServiceInfo() {
        // The catalog bundle may have filled the store without the access
        // apps; this brings them in without replacing the list.
        await tenantStore.fetchAccessApps();
    }

    return { serviceInfo, supportContact, fetchCustomerServiceInfo };
}
