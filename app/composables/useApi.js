export function useApi() {
  const requestFetch = useRequestFetch();

  const apiFetch = (url, opts) => {
    return requestFetch(url, {
      ...opts,
      credentials: "include",
    });
  };

  return { apiFetch };
}
