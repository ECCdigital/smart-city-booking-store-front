export function useApi() {
  const requestFetch = useRequestFetch();

  const apiFetch = (url, opts, key) => {
    return requestFetch(url, {
      ...opts,
      credentials: "include",
    });
  };

  return { apiFetch };
}
