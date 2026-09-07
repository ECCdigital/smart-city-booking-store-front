import { useTenantStore } from "~~/stores/tenant.js";
import { customerServiceOf } from "~/utils/emergencyHelp.js";

/**
 * The provider's emergency contact for one tenant, read from the tenant store
 * (`GET /api/tenants/public` → `accessApps[].customerService`, backend 4.3).
 * There is no request of its own any more - the locker route this used to
 * proxy is gone - so `fetchCustomerServiceInfo` only makes sure the tenants
 * are loaded; `serviceInfo` follows the store from then on.
 */
export function useEmergencyHelp(tenantId, providerId) {
    const tenantStore = useTenantStore();

    const serviceInfo = computed(() =>
        customerServiceOf(
            tenantStore.getTenantById(unref(tenantId)),
            unref(providerId),
        ),
    );

    async function fetchCustomerServiceInfo() {
        await tenantStore.fetchTenants();
    }

    return { serviceInfo, fetchCustomerServiceInfo };
}
