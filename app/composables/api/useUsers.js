export function useUsers() {
  const updateUser = async (user) => {
    const api = useApiClient();
    const { data, error } = await api.put(`/api/user`, user);

    if (error) {
      console.error("Error updating user:", error);
      throw error;
    }

    return data;
  };
  return {
    updateUser,
  };
}
