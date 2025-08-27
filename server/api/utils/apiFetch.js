export async function apiFetch(event, path, options) {
  const token = getCookie(event, "access-token");
  const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();

  console.log("token", token);

  return await $fetch(`${API_BASE_URL}${path}`, {
    ...options,
    server: true,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
