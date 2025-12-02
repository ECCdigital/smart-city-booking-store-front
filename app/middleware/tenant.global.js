export default defineNuxtRouteMiddleware(async (to) => {
  const tenant = useState("tenantID", () => null);
  tenant.value = to.params.tenantID ?? null;
});
