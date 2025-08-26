export function useInstance() {
  const fetchInstance = async () => {

    const { error, data } = await useFetch("/api/instance", {
      method: "GET",
      server: true,
      credentials: "include",
    });

    if (error.value) {
      throw new Error("Failed to fetch instance");
    }

    return data.value;
  };

  return {
    fetchInstance,
  };
}
