import { useMobileKey } from "~/composables/api/useMobileKey.js";

export function useEmergencyHelp(tenantId, bookingId, providerId) {
    const { customerService } = useMobileKey();
    const serviceInfo = ref(null);

    async function fetchCustomerServiceInfo() {
        if (!providerId) return;
        try {
            const data = await customerService(
                unref(tenantId),
                unref(bookingId),
                providerId,
            );
            serviceInfo.value = data;
        } catch (e) {
            console.error("Error fetching customer service info:", e);
        }
    }

    return { serviceInfo, fetchCustomerServiceInfo };
}