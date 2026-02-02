export function useBookings(){
    const fetchBookings = async () => {
        const api = useApiClient();

        const { data, error } = await api.get(`/api/bookings/`);

        if (error) {
            return [];
        }

        return data;
    }

    return {
        fetchBookings,
    };
}