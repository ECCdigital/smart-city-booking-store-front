export function useCheckout() {
    const fetchBookable = async (bookableID, tenantID) => {
        const api = useApiClient();

        const { data, error } = await api.get(`/api/checkout/${bookableID}/?tenantID=${tenantID}`);

        if (error) {
            console.error("Error fetching bookable:", error);
            throw error;
        }

        return data;
    }

    return { fetchBookable };
}