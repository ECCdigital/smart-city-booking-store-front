export function useCatalog() {
    const fetchCatalog = async (slug) => {
        try {
            const response = await $fetch(`/api/catalog/${slug}`, {
                method: "GET",
                credentials: "include",
            });
            return response;
        } catch (error) {
            console.error("Error fetching catalog:", error);
            throw new Error("Failed to fetch catalog");
        }
    };
    return {
        fetchCatalog,
    };
}
