<script setup>
import { useTenantStore } from "~~/stores/tenant.js";
import { useBookableStore } from "~~/stores/bookable.js";
import { useEventStore } from "~~/stores/event.js";

/**
 * The breadcrumb under the Hero.
 *
 *   Startseite › Angebote   › <Offer title>     instance catalog
 *   Startseite › <Provider> › <Offer title>     inside a tenant
 *
 * The middle crumb is always the Result Page. Inside a tenant it carries the
 * provider's name. Both the home and the Result Page link keep the current
 * query.
 */
const route = useRoute();
const { t } = useI18n();
const { tenantID, tenantTo } = useTenantRoute();
const tenantStore = useTenantStore();
const bookableStore = useBookableStore();
const eventStore = useEventStore();

const offer = computed(() => {
  const bookableID = route.params.bookableID;
  if (bookableID) {
    return {
      title: bookableStore.getBookableById(bookableID)?.title,
      fallback: t("breadcrumb.bookable"),
    };
  }
  const eventID = route.params.eventID;
  if (eventID) {
    return {
      title: eventStore.getEventById(eventID)?.title,
      fallback: t("breadcrumb.event"),
    };
  }
  return null;
});

const resultPageLabel = computed(() => {
  if (!tenantID.value) return t("breadcrumb.offers");
  return tenantStore.getTenantById(tenantID.value)?.name ?? tenantID.value;
});

const items = computed(() => {
  const crumbs = [
    { label: t("navigation.home"), icon: "i-lucide-home", to: tenantTo("/") },
    { label: resultPageLabel.value, to: tenantTo("/search") },
  ];

  if (offer.value) {
    crumbs.push({ label: offer.value.title || offer.value.fallback });
  }

  const current = crumbs[crumbs.length - 1];
  delete current.to;
  for (const crumb of crumbs) {
    if (crumb !== current) crumb.ui = { item: "shrink-0 max-w-[40%]" };
  }

  return crumbs;
});
</script>

<template>
  <UBreadcrumb
    :items="items"
    :ui="{
      link: 'text-sm',
      linkLeadingIcon: 'size-4',
      separatorIcon: 'size-4',
    }"
  />
</template>

<style scoped></style>
