export function useFavorites() {
  const pathOf = ({ tenantId, targetType, targetId }) =>
    `/api/favorites/${encodeURIComponent(tenantId)}/${encodeURIComponent(
      targetType,
    )}/${encodeURIComponent(targetId)}`;

  const fetchFavorites = async () => {
    const api = useApiClient();
    const { data, error } = await api.get("/api/favorites");
    if (error) {
      throw error;
    }
    return Array.isArray(data) ? data : [];
  };

  // The hydrated list for the favorites page: every entry with its state.
  const fetchFavoriteOffers = async () => {
    const api = useApiClient();
    const { data, error } = await api.get("/api/favorites/offers");
    if (error) {
      throw error;
    }
    return Array.isArray(data) ? data : [];
  };

  const markFavorite = async (reference) => {
    const api = useApiClient();
    const { data, error } = await api.put(pathOf(reference));
    if (error) {
      throw error;
    }
    return data;
  };

  const removeFavorite = async (reference) => {
    const api = useApiClient();
    const { error } = await api.delete(pathOf(reference));
    if (error) {
      throw error;
    }
  };

  return { fetchFavorites, fetchFavoriteOffers, markFavorite, removeFavorite };
}
