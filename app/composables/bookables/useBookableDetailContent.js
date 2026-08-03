import { useTenantStore } from "~~/stores/tenant.js";
import { useCatalogQueryState } from "~/composables/search/useCatalogQueryState.js";
import { useBookableSearch } from "~/composables/search/useBookableSearch.js";
import { useBookableBookingMode } from "~/composables/useBookableBookingMode";
import { useCheckoutRedirect } from "~/composables/utils/useCheckoutRedirect.js";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";
import { useSanitizeHtml } from "~/composables/utils/useSanitizeHtml.js";

/**
 * Shared state and actions for bookable detail layout variants (A, E, …).
 * @param {import('vue').Ref|import('vue').ComputedRef|(() => object)|object} itemSource
 */
export function useBookableDetailContent(itemSource, isEvent) {
  const item = computed(() => {
    if (typeof itemSource === "function") return itemSource();
    if (itemSource && typeof itemSource === "object" && "value" in itemSource) {
      return itemSource.value;
    }
    return itemSource;
  });

  const { state: query } = useCatalogQueryState();
  const {
    updatedItems: items,
    runSearch,
    resetResults,
  } = useBookableSearch({
    isEvent: false,
    sourceItems: computed(() => (item.value ? [item.value] : [])),
  });

  const { sanitizeHtml } = useSanitizeHtml();
  const htmlDescription = computed(() => {
    if (isEvent && item.value.information.description) {
      return sanitizeHtml(item.value.information.description);
    } else if (isEvent) {
      return sanitizeHtml(item.value.information.teaserText || "");
    }
    return sanitizeHtml(item.value?.description || "");
  });
  const showFullDescription = ref(false);

  const detailFields = computed(() => {
    const fields = item.value?.customFields || [];
    return fields.filter((field) => {
      const position = field?.usageOptions?.detailDisplayPosition;
      if (!position || position === "none") return false;
      if (!field.hasValue) return false;
      if (field.inputType === "boolean") {
        return field.value === true || field.value === "true";
      }
      return (
        field.value !== null && field.value !== undefined && field.value !== ""
      );
    });
  });

  function fieldsByPosition(position) {
    return detailFields.value.filter(
      (field) => field.usageOptions.detailDisplayPosition === position,
    );
  }

  const badgeFields = computed(() => fieldsByPosition("badge"));
  const belowDescriptionFields = computed(() =>
    fieldsByPosition("belowDescription"),
  );
  const moreInfoFields = computed(() => fieldsByPosition("moreInfo"));

  function customFieldValueText(field) {
    if (field.inputType === "select") {
      const option = (field.options || []).find(
        (opt) => String(opt.value) === String(field.value),
      );
      return option?.caption ?? field.value;
    }
    return field.value;
  }

  function customFieldBadgeLabel(field) {
    if (field.inputType === "boolean") {
      return field.caption;
    }
    return `${field.caption}: ${customFieldValueText(field)}`;
  }

  const badgeFieldLabels = computed(() => {
    return badgeFields.value.map(customFieldBadgeLabel);
  });

  const timePeriod = ref({
    start: query.start,
    end: query.end,
  });

  const title = computed(() => {
    if (isEvent) {
      return item.value.information.name;
    }
    return item.value.title;
  });

  const tenantName = computed(() => {
    const tenantId = item.value?.tenantId;
    if (!tenantId) return "";
    return useTenantStore().getTenantById(tenantId)?.name || "";
  });

  const flags = computed(() => {
    if (isEvent) {
      return item.value.information.tags;
    }
    return item.value.flags;
  });

  const tickets = computed(() => {
    if (isEvent) {
      return item.value.tickets;
    }
    return [];
  });

  const { requiresTimeSelection } = useBookableBookingMode(() => item.value);

  const isBookable = computed(() => {
    const entry = items.value[0];
    if (!entry) return false;
    return entry.matchStatus === "match" && entry.isBookable !== false;
  });

  const hasValidTimePeriod = computed(() => {
    const start = timePeriod.value?.start;
    const end = timePeriod.value?.end;
    if (!start || !end) return false;
    return new Date(end).getTime() > new Date(start).getTime();
  });

  const showAvailabilityResult = computed(() => {
    if (!requiresTimeSelection.value) {
      return items.value.length > 0;
    }
    return hasValidTimePeriod.value;
  });

  const { contrastToPrimary } = useContrastColor();

  async function setSearchTimePeriod(tp) {
    timePeriod.value = tp;
    await runSearch({
      term: "",
      location: "",
      timeStart: timePeriod.value.start,
      timeEnd: timePeriod.value.end,
    });
  }

  function removeSearchTimePeriod() {
    timePeriod.value = { start: null, end: null };
    resetResults();
  }

  onMounted(async () => {
    if (!item.value) return;

    if (hasValidTimePeriod.value) {
      await runSearch({
        term: "",
        location: "",
        timeStart: timePeriod.value.start,
        timeEnd: timePeriod.value.end,
      });
      return;
    }

    if (!requiresTimeSelection.value) {
      await runSearch({
        term: "",
        location: "",
        timeStart: null,
        timeEnd: null,
      });
    }
  });

  function goToCheckout(checkoutData) {
    if (checkoutData) {
      useCheckoutRedirect().redirectToCheckout(checkoutData);
      return;
    }
    const route = useRoute();
    useCheckoutRedirect().redirectToCheckout({
      id: item.value.id,
      tenantId: item.value.tenantId,
      start: hasValidTimePeriod.value
        ? timePeriod.value.start
        : route.query.start,
      end: hasValidTimePeriod.value ? timePeriod.value.end : route.query.end,
      url: item.value.checkoutUrl,
    });
  }
  function goToExternalCheckout() {
    window.open(item.value.externalBookingUrl, "_blank");
  }
  function goToRelatedItems() {
    const el = document.getElementById("relatedBookables");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return {
    item,
    items,
    title,
    tenantName,
    flags,
    tickets,
    htmlDescription,
    showFullDescription,
    badgeFieldLabels,
    belowDescriptionFields,
    moreInfoFields,
    customFieldValueText,
    timePeriod,
    isBookable,
    showAvailabilityResult,
    contrastToPrimary,
    setSearchTimePeriod,
    removeSearchTimePeriod,
    goToCheckout,
    goToExternalCheckout,
    goToRelatedItems,
  };
}
