import { useMobileKey } from "~/composables/api/useMobileKey.js";

export function useEmergencyHelp(tenantId, bookingId, lockerInfo) {
    const { customerService } = useMobileKey();
    const serviceInfo = ref(null);

    const ifbsLockerInfo = computed(() =>
        lockerInfo.value?.find((info) => info.lockerSystem === "ifbs"),
    );

    async function fetchCustomerServiceInfo() {
        if (!ifbsLockerInfo.value) return;
        try {
            const data = await customerService(
                unref(tenantId),
                unref(bookingId),
                ifbsLockerInfo.value.lockerSystem,
            );
            serviceInfo.value = data;
        } catch (e) {
            console.error("Error fetching customer service info:", e);
        }
    }

    return { serviceInfo, ifbsLockerInfo, fetchCustomerServiceInfo };
}