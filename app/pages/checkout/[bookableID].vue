<script setup>
import { useCheckout } from "~/composables/api/useCheckout.js";
import { useTenants } from "~/composables/api/useTenants.js";
import AdditionalBookablesSelector from "~/components/checkout/AdditionalBookablesSelector.vue";
import InputTimePeriodSlots from "~/components/checkout/InputTimePeriodSlots.vue";
import InputFreeTimeSelection from "~/components/checkout/InputFreeTimeSelection.vue";
import InputWeekSelection from "~/components/checkout/InputWeekSelection.vue";
import InputMonthSelection from "../../components/checkout/InputMonthSelection.vue";
import PriceSummaryBar from "~/components/checkout/PriceSummaryBar.vue";
import CheckoutContactStep from "~/components/checkout/CheckoutContactStep.vue";
import CheckoutCustomFields from "~/components/checkout/CheckoutCustomFields.vue";
import CheckoutPaymentStep from "~/components/checkout/CheckoutPaymentStep.vue";
import CheckoutReviewStep from "~/components/checkout/CheckoutReviewStep.vue";
import { useAuthStore } from "~~/stores/auth.js";
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

const CONTACT_FIELD_KEYS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "company",
  "address",
  "zipCode",
  "city",
];
const ALWAYS_REQUIRED_CONTACT_FIELDS = ["firstName", "lastName", "email"];

function toCanonicalContactFieldKey(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const norm = s.toLowerCase().replace(/[-_]/g, "");
  const aliases = {
    firstname: "firstName",
    lastname: "lastName",
    email: "email",
    mail: "email",
    id: "email",
    phone: "phone",
    telefon: "phone",
    mobil: "phone",
    company: "company",
    firma: "company",
    organisation: "company",
    organization: "company",
    address: "address",
    street: "address",
    strasse: "address",
    zipcode: "zipCode",
    zip: "zipCode",
    plz: "zipCode",
    postalcode: "zipCode",
    city: "city",
    stadt: "city",
    ort: "city",
  };
  if (aliases[norm]) return aliases[norm];
  if (CONTACT_FIELD_KEYS.includes(s)) return s;
  const camel =
    s.charAt(0).toLowerCase() +
    s.slice(1).replace(/[-_](.)/g, (_, c) => (c ? c.toUpperCase() : ""));
  if (CONTACT_FIELD_KEYS.includes(camel)) return camel;
  return null;
}

function parseRequiredFieldsFromBookable(bookable) {
  const rf = bookable?.requiredFields;
  if (!rf) return [];
  if (Array.isArray(rf)) {
    return rf.map((x) => toCanonicalContactFieldKey(x)).filter(Boolean);
  }
  if (typeof rf === "object") {
    return Object.entries(rf)
      .filter(([, v]) => v === true || v === "true" || v === 1 || v === "1")
      .map(([k]) => toCanonicalContactFieldKey(k))
      .filter(Boolean);
  }
  return [];
}

function hasRequiredCommentField(bookable) {
  const rf = bookable?.requiredFields;
  if (!rf) return false;

  if (Array.isArray(rf)) {
    return rf.some((entry) => {
      const normalized = String(entry || "")
        .trim()
        .toLowerCase()
        .replace(/[-_]/g, "");
      return normalized === "comment" || normalized === "kommentar";
    });
  }

  if (typeof rf === "object") {
    return Object.entries(rf).some(([key, value]) => {
      const normalized = String(key || "")
        .trim()
        .toLowerCase()
        .replace(/[-_]/g, "");
      const isRequired = value === true || value === "true" || value === 1 || value === "1";
      return isRequired && (normalized === "comment" || normalized === "kommentar");
    });
  }

  return false;
}

function visibleCheckoutAttachmentsFromBookable(bookable) {
  const list = bookable?.attachments;
  if (!Array.isArray(list)) return [];
  return list.filter((a) => a && a.show === true);
}

function checkoutCustomFieldsFromBookable(bookable) {
  const list = bookable?.customFields;
  if (!Array.isArray(list)) return [];
  return list.filter((f) => f?.usageOptions?.context === "checkout");
}

definePageMeta({
  layout: "checkout",
});

const route = useRoute();
const router = useRouter();
const bookableID = route.params.bookableID;
const tenantID = route.query.tenantId;

const { fetchBookable } = useCheckout();
const { fetchTenant, fetchTenantPaymentProviders } = useTenants();

const isLoading = ref(true);

const { data, error } = await useAsyncData(
  `checkout-${bookableID}-${tenantID}`,
  async () => {
    if (!bookableID || !tenantID) return null;
    try {
      const [leadBookable, tenant, paymentProviders] = await Promise.all([
        fetchBookable(bookableID, tenantID),
        fetchTenant(tenantID),
        fetchTenantPaymentProviders(tenantID),
      ]);

      const additionalIds = leadBookable?.checkoutBookableIds || [];
      const additionalBookables = await Promise.all(
        additionalIds.map(async ({ bookableId, mandatory }) => ({
          item: await fetchBookable(bookableId, tenantID),
          mandatory,
        }))
      );

      return {
        leadBookable,
        tenant,
        additionalBookables,
        paymentProviders: Array.isArray(paymentProviders) ? paymentProviders : [],
      };
    } finally {
      isLoading.value = false;
    }
  },
  { server: false, lazy: true }
);

if (error.value) {
  console.error("Error loading checkout data:", error.value);
}

const leadBookable = computed(() => data.value?.leadBookable || null);
const tenant = computed(() => data.value?.tenant || null);
const paymentProviders = computed(() => {
  const list = data.value?.paymentProviders;
  return Array.isArray(list) ? list : [];
});
const needsPaymentSelectionStep = computed(
  () => paymentProviders.value.length > 1
);

const couponsEnabled = computed(() => {
  const b = leadBookable.value;
  return b?.enableCoupons === true || b?.enableCoupons === "true" || b?.enableCoupons === 1;
});

const TYPE_LABELS = {
  room: "Raumbuchung",
  resource: "Ressourcen-Buchung",
  ticket: "Ticketbuchung",
  event: "Eventbuchung",
};

const checkoutNavTab = useState("checkoutNavTab", () => {});

watch(
  leadBookable,
  (b) => {
    const type = b?.type;
    checkoutNavTab.value = TYPE_LABELS[type] || type || "";

    const route = useRoute();
    const bookableID = route.params.bookableID;
    const tenantID = route.query.tenantId;

    const label = TYPE_LABELS[type] || type || "";
    const url = `/checkout/${bookableID}?tenantId=${tenantID}`;
    checkoutNavTab.value = { label, url };
  },
  { immediate: true }
);

onUnmounted(() => {
  checkoutNavTab.value = "";
});
const additionalBookables = computed(
  () => data.value?.additionalBookables || []
);

const mandatoryBookableIds = computed(() =>
  additionalBookables.value
    .filter((entry) => entry.mandatory)
    .map((entry) => entry.item.id)
);

const checkoutID = ref(null);
const summary = ref({ items: [], taxAmount: 0, total: 0, errors: [] });
const isValidating = ref(false);
const validationErrors = ref({});

const selectedTimePeriod = ref({ start: null, end: null });
const selectedAdditionalBookables = ref([]);

const amounts = ref({});

watch(
  leadBookable,
  (b) => {
    if (b?.id && !amounts.value[b.id]) {
      amounts.value[b.id] = 1;
    }
  },
  { immediate: true }
);

watch(
  selectedAdditionalBookables,
  (ids) => {
    for (const id of ids) {
      if (!amounts.value[id]) {
        amounts.value[id] = 1;
      }
    }
  },
  { deep: true }
);

const { t } = useI18n();
const authStore = useAuthStore();
const isLoggedIn = computed(() => authStore.isLoggedIn);
const isLoggingOut = ref(false);
const lastAutofilledUserKey = ref(null);
const loginUrl = computed(
  () => `/login?redirect=${encodeURIComponent(route.fullPath)}`
);
const checkoutStateStorageKey = computed(
  () => `checkout-state:${String(tenantID ?? "")}:${String(bookableID ?? "")}`
);

const bookablesInCheckout = computed(() => {
  const out = [];
  if (leadBookable.value) out.push(leadBookable.value);
  for (const bid of selectedAdditionalBookables.value) {
    const entry = additionalBookables.value.find((e) => e.item.id === bid);
    if (entry?.item) out.push(entry.item);
  }
  return out;
});

const mergedRequiredContactFields = computed(() => {
  const set = new Set(ALWAYS_REQUIRED_CONTACT_FIELDS);
  for (const b of bookablesInCheckout.value) {
    for (const f of parseRequiredFieldsFromBookable(b)) {
      set.add(f);
    }
  }
  return [...set];
});

const isCommentRequired = computed(() =>
  bookablesInCheckout.value.some((b) => hasRequiredCommentField(b))
);

const checkoutVisibleAttachments = computed(() => {
  const byId = new Map();
  for (const b of bookablesInCheckout.value) {
    for (const a of visibleCheckoutAttachmentsFromBookable(b)) {
      if (a?.id != null && !byId.has(a.id)) byId.set(a.id, a);
    }
  }
  return [...byId.values()];
});

const checkoutVisibleCustomFields = computed(() => {
  const byId = new Map();
  for (const b of bookablesInCheckout.value) {
    for (const f of checkoutCustomFieldsFromBookable(b)) {
      if (f?.id != null && !byId.has(f.id)) byId.set(f.id, f);
    }
  }
  return [...byId.values()];
});

const reviewCustomFieldRows = computed(() => {
  const rows = [];
  for (const field of checkoutVisibleCustomFields.value) {
    const id = field.id;
    const raw = customFieldValues.value?.[id];
    let display = "–";
    if (field.inputType === "boolean") {
      display =
        raw === true ? t("checkout.review.boolYes") : t("checkout.review.boolNo");
    } else if (field.inputType === "numeric") {
      if (raw != null && raw !== "" && !Number.isNaN(Number(raw))) {
        display = String(raw);
      }
    } else if (field.inputType === "select") {
      const opts = field.options || [];
      const match = opts.find((o) => o.value === raw);
      display =
        match?.caption ??
        (raw != null && String(raw).trim() !== "" ? String(raw).trim() : "–");
    } else if (raw != null && String(raw).trim() !== "") {
      display = String(raw).trim();
    }
    rows.push({
      label: field.caption || String(id),
      value: display,
    });
  }
  return rows;
});

const contactForm = reactive({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  zipCode: "",
  city: "",
});

const customerComment = ref("");
const attachmentAccepted = ref({});
const restoredAttachmentAccepted = ref({});
const customFieldValues = ref({});
const restoredCustomFieldValues = ref({});
const selectedPaymentProviderId = ref(null);
const appliedCouponCode = ref(null);
/** Payload von redeemCoupon (id, description, discount, type) – für validate nur am Lead-Bookable */
const appliedCouponDetails = ref(null);

function applyUserToContactForm(user, force = false) {
  if (!user) return;

  const userKey = String(user.id || user.email || "");
  const shouldForce = force || (userKey && userKey !== lastAutofilledUserKey.value);

  if ((shouldForce || !contactForm.firstName) && user.firstName) contactForm.firstName = user.firstName;
  if ((shouldForce || !contactForm.lastName) && user.lastName) contactForm.lastName = user.lastName;
  if ((shouldForce || !contactForm.email) && user.id) contactForm.email = user.id;
  if ((shouldForce || !contactForm.phone) && user.phone) contactForm.phone = user.phone;
  if ((shouldForce || !contactForm.company) && user.company) contactForm.company = user.company;
  if ((shouldForce || !contactForm.address) && user.address) contactForm.address = user.address;
  if ((shouldForce || !contactForm.zipCode) && user.zipCode) contactForm.zipCode = user.zipCode;
  if ((shouldForce || !contactForm.city) && user.city) contactForm.city = user.city;

  if (userKey) {
    lastAutofilledUserKey.value = userKey;
  }
}

watch(
  checkoutVisibleAttachments,
  (list) => {
    const prev = attachmentAccepted.value;
    const restored = restoredAttachmentAccepted.value || {};
    const requiredIds = new Set(
      list.filter((a) => a.required === true).map((a) => a.id)
    );
    const next = {};
    for (const id of requiredIds) {
      if (id in prev) {
        next[id] = prev[id];
      } else if (id in restored) {
        next[id] = restored[id];
      } else {
        next[id] = false;
      }
    }
    attachmentAccepted.value = next;
  },
  { deep: true, immediate: true }
);

watch(
  leadBookable,
  (b) => {
    if (!b) return;
    const enabled =
      b.enableCoupons === true ||
      b.enableCoupons === "true" ||
      b.enableCoupons === 1;
    if (!enabled && appliedCouponCode.value) {
      appliedCouponCode.value = null;
      appliedCouponDetails.value = null;
    }
  },
  { immediate: true }
);

watch(
  paymentProviders,
  (list) => {
    if (!Array.isArray(list) || list.length === 0) {
      selectedPaymentProviderId.value = null;
      return;
    }
    if (list.length === 1) {
      selectedPaymentProviderId.value = list[0].id;
      return;
    }
    const current = selectedPaymentProviderId.value;
    if (current && list.some((p) => p.id === current)) return;
    selectedPaymentProviderId.value = null;
  },
  { immediate: true }
);

watch(
  checkoutVisibleCustomFields,
  (list) => {
    const prev = customFieldValues.value || {};
    const restored = restoredCustomFieldValues.value || {};
    const next = {};
    for (const field of list) {
      const id = field?.id;
      if (id == null) continue;
      if (id in prev) {
        next[id] = prev[id];
      } else if (id in restored) {
        next[id] = restored[id];
      } else {
        next[id] = field.inputType === "boolean" ? false : null;
      }
    }
    customFieldValues.value = next;
  },
  { deep: true, immediate: true }
);

function isNonEmptyContactValue(v) {
  return v != null && String(v).trim().length > 0;
}

function isValidContactEmail(v) {
  if (!isNonEmptyContactValue(v)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
}

const isDataStepComplete = computed(() => {
  for (const key of mergedRequiredContactFields.value) {
    const v = contactForm[key];
    if (key === "email") {
      if (!isValidContactEmail(v)) return false;
    } else if (!isNonEmptyContactValue(v)) {
      return false;
    }
  }
  for (const a of checkoutVisibleAttachments.value) {
    if (a.required === true && !attachmentAccepted.value[a.id]) {
      return false;
    }
  }
  if (isCommentRequired.value && !isNonEmptyContactValue(customerComment.value)) {
    return false;
  }
  for (const field of checkoutVisibleCustomFields.value) {
    if (field?.usageOptions?.requiredInCheckout !== true) continue;
    const value = customFieldValues.value?.[field.id];
    if (field.inputType === "boolean") {
      if (value !== true) return false;
    } else if (field.inputType === "numeric") {
      if (value === null || value === undefined || Number.isNaN(value)) return false;
    } else {
      if (!isNonEmptyContactValue(value)) return false;
    }
  }
  return true;
});

onMounted(() => {
  restoreCheckoutState();
  const queryStep = normalizeStep(route.query.step);
  if (queryStep != null) {
    currentStep.value = queryStep;
  }
  const queryStart = normalizePeriodTimestamp(route.query.start);
  const queryEnd = normalizePeriodTimestamp(route.query.end);
  if (queryStart != null && queryEnd != null && queryEnd > queryStart) {
    selectedTimePeriod.value = {
      start: queryStart,
      end: queryEnd,
    };
  }
  applyUserToContactForm(authStore.user, true);
  hasRestoredCheckoutState.value = true;
  authStore.validateAuth();
});

watch(
  () => authStore.user,
  (u) => {
    if (!u) {
      lastAutofilledUserKey.value = null;
      return;
    }
    applyUserToContactForm(u);
  },
  { immediate: true }
);

async function continueAsGuest() {
  if (!isLoggedIn.value || isLoggingOut.value) return;
  isLoggingOut.value = true;
  try {
    await authStore.logout();
  } finally {
    isLoggingOut.value = false;
  }
}

function handleAmountUpdate({ id, amount }) {
  const isMandatory = mandatoryBookableIds.value.includes(id);
  const minAllowed = id === bookableID || isMandatory ? 1 : 0;

  if (amount <= 0 && id !== bookableID && !isMandatory) {
    selectedAdditionalBookables.value = selectedAdditionalBookables.value.filter(
      (bid) => bid !== id
    );
    amounts.value = Object.fromEntries(
      Object.entries(amounts.value).filter(([k]) => k !== id)
    );
  } else {
    amounts.value[id] = Math.max(amount, minAllowed);
  }
}

const { validateBookable } = useCheckout();

const couponForValidation = computed(() => {
  if (!couponsEnabled.value) return null;
  const c = appliedCouponCode.value;
  if (c == null) return null;
  const s = String(c).trim();
  return s || null;
});

let validationToken = 0;

const COUPON_SUMMARY_ROW_ID = "__coupon__";

// Gutschein-Rabatt wird im Frontend als Bruttowert auf die Gesamt-Bruttosumme
// angewendet. "fixed" = EUR brutto, "percent"|"percentage" = Prozentsatz auf die Bruttosumme.
function computeCouponGrossDiscount(details, baseGross) {
  if (!details || !(baseGross > 0)) return 0;
  const discount = Number(details.discount);
  if (!Number.isFinite(discount) || discount <= 0) return 0;
  const type = String(details.type || "").toLowerCase();
  if (type === "percentage") {
    return baseGross * (discount / 100);
  }
  if (type === "fixed") {
    return discount;
  }
  return 0;
}

async function validateAll() {
  const { start, end } = selectedTimePeriod.value;
  if (!start || !end || end <= start) {
    summary.value = { items: [], taxAmount: 0, total: 0, errors: [] };
    validationErrors.value = {};
    checkoutID.value = null;
    return;
  }

  const myToken = ++validationToken;
  isValidating.value = true;
  validationErrors.value = {};

  try {
    const targets = [
      { id: bookableID, isLead: true },
      ...selectedAdditionalBookables.value.map((id) => ({
        id,
        isLead: false,
      })),
    ];

    const results = await Promise.all(
      targets.map(({ id, isLead }) =>
        validateBookable({
          bookableID: id,
          tenantID,
          amount: amounts.value[id] || 1,
          start,
          end,
        })
          .then((res) => ({ id, isLead, res }))
          .catch((err) => ({ id, isLead, error: err }))
      )
    );

    if (myToken !== validationToken) return;

    const items = [];
    let taxAmount = 0;
    let total = 0;
    let newCheckoutId = null;
    const errors = [];
    const errorMap = {};

    for (let i = 0; i < targets.length; i++) {
      const { id, isLead } = targets[i];
      const label = isLead
        ? leadBookable.value?.title
        : additionalBookables.value.find((b) => b.item.id === id)?.item.title ||
          "Zusatzbuchung";

      const row = results[i];

      if (row.error) {
        const reason = "checkout.unknown_error";
        errorMap[id] = { reason, error: row.error, isLead };
        errors.push({ id, isLead, label, reason, error: row.error });
        continue;
      }

      if (!row.res?.success) {
        const errorReason = row.res?.error?.reason || "checkout.unknown_error";
        const errorDetails = row.res?.error?.params || {};
        errorMap[id] = { reason: errorReason, params: errorDetails, isLead };
        errors.push({
          id,
          isLead,
          label,
          reason: errorReason,
          params: errorDetails,
        });
        continue;
      }

      const { userPriceEur, userGrossPriceEur } = row.res.data;

      if (isLead || newCheckoutId == null) {
        newCheckoutId = row.res.checkoutId;
      }

      items.push({ id, label, amountEur: userPriceEur });
      taxAmount += userGrossPriceEur - userPriceEur;
      total += userGrossPriceEur;
    }

    if (
      couponForValidation.value &&
      appliedCouponDetails.value &&
      errors.length === 0 &&
      items.length === targets.length &&
      total > 0
    ) {
      const rawDiscount = computeCouponGrossDiscount(
        appliedCouponDetails.value,
        total
      );
      const discountGross = Math.min(rawDiscount, total);
      if (discountGross > 0.005) {
        const remainingFactor = (total - discountGross) / total;
        taxAmount = Math.max(0, taxAmount * remainingFactor);
        total = total - discountGross;

        items.push({
          id: COUPON_SUMMARY_ROW_ID,
          label: t("checkout.coupon.summaryLine", {
            code: String(appliedCouponCode.value || "").trim(),
          }),
          amountEur: 0,
          priceDisplayEur: -discountGross,
          skipQuantity: true,
        });
      }
    }

    validationErrors.value = errorMap;
    summary.value = { items, taxAmount, total, errors };
    checkoutID.value = newCheckoutId;
  } finally {
    if (myToken === validationToken) isValidating.value = false;
  }
}

let debounceTimer = null;
function scheduleValidation() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(validateAll, 200);
}

watch(
  [selectedTimePeriod, selectedAdditionalBookables, amounts, appliedCouponCode, appliedCouponDetails],
  scheduleValidation,
  {
    deep: true,
  }
);

const isScheduleRelated = computed(
  () => leadBookable.value?.isScheduleRelated === true
);

const isTimePeriodRelated = computed(
  () => leadBookable.value?.isTimePeriodRelated === true
);

const isLongRangeWeek = computed(() => {
  const b = leadBookable.value;
  return (
    b?.isLongRange === true && b?.longRangeOptions?.type === "week"
  );
});

const isLongRangeMonth = computed(() => {
  const b = leadBookable.value;
  return (
    b?.isLongRange === true && b?.longRangeOptions?.type === "month"
  );
});

const longRangeMonthPrice = computed(() => {
  const categories = leadBookable.value?.priceCategories || [];
  if (categories.length === 0) return null;

  const internal = categories.filter(
    (c) => !c.external || (c.external && c.unit !== "service-fee"),
  );
  const withoutHolidays = internal.filter(
    (c) => !c.holidays || c.holidays.length === 0,
  );
  const prices = withoutHolidays
    .map((c) => c.priceEur)
    .filter((p) => p !== null && p !== undefined);

  if (prices.length === 0) return null;
  return Math.min(...prices);
});

const longRangeWeekPrice = computed(() => {
  const categories = leadBookable.value?.priceCategories || [];
  if (categories.length === 0) return null;

  const internal = categories.filter(
    (c) => !c.external || (c.external && c.unit !== "service-fee")
  );
  const withoutHolidays = internal.filter(
    (c) => !c.holidays || c.holidays.length === 0
  );
  const prices = withoutHolidays
    .map((c) => c.priceEur)
    .filter((p) => p !== null && p !== undefined);

  if (prices.length === 0) return null;
  return Math.min(...prices);
});

const bookableTimePeriods = computed(
  () => leadBookable.value?.timePeriods || []
);

const hasValidTimePeriod = computed(
  () =>
    !!selectedTimePeriod.value?.start &&
    !!selectedTimePeriod.value?.end &&
    selectedTimePeriod.value.end > selectedTimePeriod.value.start
);

const needsTimePeriodSelection = computed(() => {
  const b = leadBookable.value;
  if (!b) return false;
  const requiresPeriod =
    b.isScheduleRelated === true ||
    b.isTimePeriodRelated === true ||
    b.isLongRange === true;
  const noPeriodSelected =
    !selectedTimePeriod.value?.start || !selectedTimePeriod.value?.end;
  return requiresPeriod && noPeriodSelected;
});

const MIN_STEP = 1;
const maxStep = computed(() => (needsPaymentSelectionStep.value ? 4 : 3));
const hasRestoredCheckoutState = ref(false);

function normalizeStep(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(maxStep.value, Math.max(MIN_STEP, parsed));
}

const currentStep = ref(normalizeStep(route.query.step) ?? 1);

watch(maxStep, (max) => {
  if (currentStep.value > max) {
    currentStep.value = max;
  }
});

function normalizePeriodTimestamp(value) {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const str = String(value).trim();
  if (!str) return null;
  if (/^\d+$/.test(str)) {
    const asNumber = Number(str);
    return Number.isFinite(asNumber) ? asNumber : null;
  }
  const parsed = Date.parse(str);
  return Number.isNaN(parsed) ? null : parsed;
}

function withSyncedStepAndPeriod(querySource, stepValue) {
  const nextQuery = { ...querySource, step: String(stepValue) };
  const start = normalizePeriodTimestamp(selectedTimePeriod.value?.start);
  const end = normalizePeriodTimestamp(selectedTimePeriod.value?.end);
  if (start != null && end != null && end > start) {
    nextQuery.start = String(start);
    nextQuery.end = String(end);
  } else {
    delete nextQuery.start;
    delete nextQuery.end;
  }
  return nextQuery;
}

function persistCheckoutState() {
  if (!import.meta.client) return;
  const payload = {
    currentStep: currentStep.value,
    selectedTimePeriod: selectedTimePeriod.value,
    selectedAdditionalBookables: selectedAdditionalBookables.value,
    amounts: amounts.value,
    contactForm: { ...contactForm },
    customerComment: customerComment.value,
    attachmentAccepted: attachmentAccepted.value,
    customFieldValues: customFieldValues.value,
    selectedPaymentProviderId: selectedPaymentProviderId.value,
    appliedCouponCode: appliedCouponCode.value,
    appliedCouponDetails: appliedCouponDetails.value,
  };
  sessionStorage.setItem(checkoutStateStorageKey.value, JSON.stringify(payload));
}

function restoreCheckoutState() {
  if (!import.meta.client) return;
  const raw = sessionStorage.getItem(checkoutStateStorageKey.value);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      if (parsed.selectedTimePeriod && typeof parsed.selectedTimePeriod === "object") {
        const restoredStart = normalizePeriodTimestamp(parsed.selectedTimePeriod.start);
        const restoredEnd = normalizePeriodTimestamp(parsed.selectedTimePeriod.end);
        selectedTimePeriod.value = {
          start: restoredStart,
          end: restoredEnd,
        };
      }
      if (Array.isArray(parsed.selectedAdditionalBookables)) {
        selectedAdditionalBookables.value = parsed.selectedAdditionalBookables;
      }
      if (parsed.amounts && typeof parsed.amounts === "object") {
        amounts.value = parsed.amounts;
      }
      if (parsed.contactForm && typeof parsed.contactForm === "object") {
        for (const key of CONTACT_FIELD_KEYS) {
          if (key in parsed.contactForm) {
            contactForm[key] = parsed.contactForm[key] || "";
          }
        }
      }
      if (typeof parsed.customerComment === "string") {
        customerComment.value = parsed.customerComment;
      }
      if (parsed.attachmentAccepted && typeof parsed.attachmentAccepted === "object") {
        restoredAttachmentAccepted.value = parsed.attachmentAccepted;
        attachmentAccepted.value = parsed.attachmentAccepted;
      }
      if (parsed.customFieldValues && typeof parsed.customFieldValues === "object") {
        restoredCustomFieldValues.value = parsed.customFieldValues;
        customFieldValues.value = parsed.customFieldValues;
      }
      const restoredStep = normalizeStep(parsed.currentStep);
      if (restoredStep != null) {
        currentStep.value = restoredStep;
      }
      if (typeof parsed.selectedPaymentProviderId === "string") {
        selectedPaymentProviderId.value = parsed.selectedPaymentProviderId;
      }
      if (typeof parsed.appliedCouponCode === "string" && parsed.appliedCouponCode.trim()) {
        appliedCouponCode.value = parsed.appliedCouponCode.trim();
      }
      if (parsed.appliedCouponDetails && typeof parsed.appliedCouponDetails === "object") {
        appliedCouponDetails.value = parsed.appliedCouponDetails;
      }
    }
  } catch (err) {
    console.warn("Failed to restore checkout state", err);
  }
}

const steps = computed(() => {
  const withPayment = needsPaymentSelectionStep.value;
  const out = [
    {
      key: "period",
      title: t("checkout.steps.periodTitle"),
      nextLabel: t("checkout.steps.nextToData"),
    },
    {
      key: "data",
      title: t("checkout.steps.dataTitle"),
      nextLabel: withPayment
        ? t("checkout.steps.nextToPayment")
        : t("checkout.steps.nextToConfirm"),
    },
  ];
  if (withPayment) {
    out.push({
      key: "payment",
      title: t("checkout.steps.paymentTitle"),
      nextLabel: t("checkout.steps.nextToConfirm"),
    });
  }
  out.push({
    key: "confirm",
    title: t("checkout.steps.confirmTitle"),
    nextLabel: t("checkout.steps.finishBooking"),
  });
  return out;
});

const hasValidationErrors = computed(
  () => Object.keys(validationErrors.value).length > 0
);

const hasConfirmableSummary = computed(
  () =>
    summary.value?.items?.length > 0 &&
    !hasValidationErrors.value &&
    !isValidating.value
);

const leadBookableError = computed(
  () => validationErrors.value[bookableID] || null
);

const currentStepKey = computed(() => {
  const idx = (Number(currentStep.value) || 1) - 1;
  return steps.value[idx]?.key ?? null;
});

const canGoNext = computed(() => {
  const key = currentStepKey.value;
  if (key === "period") {
    if (
      !isTimePeriodRelated.value &&
      !isScheduleRelated.value &&
      !isLongRangeWeek.value &&
      !isLongRangeMonth.value
    )
      return true;
    if (!hasValidTimePeriod.value) return false;
    if (hasValidationErrors.value) return false;
    if (isValidating.value) return false;
    return true;
  }
  if (key === "data") {
    return isDataStepComplete.value;
  }
  if (key === "payment") {
    const id = selectedPaymentProviderId.value;
    return !!id && paymentProviders.value.some((p) => p.id === id);
  }
  if (key === "confirm") {
    return hasConfirmableSummary.value;
  }
  return true;
});

watch(
  () => route.query.step,
  (step) => {
    const nextStep = normalizeStep(step);
    if (nextStep != null && nextStep !== currentStep.value) {
      currentStep.value = nextStep;
    }
  }
);

watch(
  currentStep,
  async (step) => {
    if (!hasRestoredCheckoutState.value) return;
    persistCheckoutState();
    const normalized = normalizeStep(step);
    if (normalized == null) return;
    const nextQuery = withSyncedStepAndPeriod(route.query, normalized);
    if (JSON.stringify(route.query) === JSON.stringify(nextQuery)) return;
    await router.replace({
      query: nextQuery,
    });
  },
  { immediate: true }
);

watch(
  [
    selectedTimePeriod,
    selectedAdditionalBookables,
    amounts,
    customerComment,
    attachmentAccepted,
    customFieldValues,
    selectedPaymentProviderId,
    appliedCouponCode,
    appliedCouponDetails,
    () => ({ ...contactForm }),
  ],
  () => {
    if (!hasRestoredCheckoutState.value) return;
    persistCheckoutState();
  },
  { deep: true, immediate: true }
);

watch(
  selectedTimePeriod,
  async () => {
    if (!hasRestoredCheckoutState.value) return;
    const normalizedStep = normalizeStep(currentStep.value) ?? MIN_STEP;
    const nextQuery = withSyncedStepAndPeriod(route.query, normalizedStep);
    if (JSON.stringify(route.query) === JSON.stringify(nextQuery)) return;
    await router.replace({ query: nextQuery });
  },
  { deep: true }
);

function handleFinish() {
  console.log("Buchung abschließen", {
    timePeriod: selectedTimePeriod.value,
    contact: { ...contactForm },
    comment: customerComment.value,
    attachmentAccepted: { ...attachmentAccepted.value },
    customFieldValues: { ...customFieldValues.value },
    checkoutId: checkoutID.value,
    paymentProviderId: selectedPaymentProviderId.value,
    couponCode: couponForValidation.value,
    couponId: appliedCouponDetails.value?.id ?? null,
    couponDetails: appliedCouponDetails.value,
  });
}

function onReviewBack() {
  if (needsPaymentSelectionStep.value) {
    currentStep.value = 3;
  } else {
    currentStep.value = 2;
  }
}

function onReviewEdit(section) {
  if (section === "period") {
    currentStep.value = 1;
  } else if (section === "data") {
    currentStep.value = 2;
  } else if (section === "payment") {
    currentStep.value = 3;
  }
}
</script>

<template>
  <div class="bg-neutral-50 dark:bg-gray-950 w-full min-h-screen">
    <!-- Loading / Empty State -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <UIcon
          size="48"
          name="i-lucide-loader-2"
          class="text-gray-400 mb-4 animate-spin"
        />
        <p class="text-gray-500">{{ $t("common.loading") }}</p>
      </div>
    </div>

    <div
      v-else-if="!leadBookable"
      class="flex items-center justify-center min-h-screen"
    >
      <div class="text-center">
        <UIcon
          size="48"
          name="i-lucide-shopping-cart"
          class="text-gray-400 mb-4"
        />
        <p class="text-gray-500">{{ $t("checkout.noBookable") }}</p>
      </div>
    </div>

    <!-- Main Layout -->
    <div v-else class="flex flex-col lg:flex-row min-h-screen">
      <!-- LEFT: Bookable Overview + Prices -->
      <div class="flex-1 p-4 md:p-6 lg:p-10 lg:shrink-0 flex flex-col">
        <CheckoutBookableSidebar
          :lead-bookable="leadBookable"
          :tenant="tenant"
        />

        <!-- Spacer -->
        <div class="flex-1" />

        <!-- Price Summary  -->
        <div class="sticky bottom-4 md:bottom-6 mt-6 z-10">
          <PriceSummaryBar v-if="currentStepKey !== 'confirm'"
            :summary="summary"
            :selected-time-period="selectedTimePeriod"
            :needs-time-period-selection="needsTimePeriodSelection"
            :is-validating="isValidating"
            :amounts="amounts"
            :lead-bookable-id="bookableID"
            :mandatory-ids="mandatoryBookableIds"
            @update:amount="handleAmountUpdate"
          />
        </div>
      </div>
      <!-- RIGHT: Checkout Flow -->
      <main class="flex-3 min-w-0 bg-white dark:bg-gray-900 p-6 md:p-8 lg:p-10">
        <AppStepper
          v-model="currentStep"
          :steps="steps"
          :can-go-next="canGoNext"
          :hide-footer="currentStepKey === 'confirm'"
          @finish="handleFinish"
        >
          <template #step-objects>
            <p class="text-gray-500 dark:text-gray-400">
              Hier kommt die Objektauswahl rein.
            </p>
          </template>

          <template #step-period>
            <div class="space-y-8">
              <!-- Lead bookable error -->
              <div
                v-if="leadBookableError"
                class="flex items-start gap-3 p-4 rounded-xl border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950"
              >
                <UIcon
                  name="i-lucide-alert-triangle"
                  class="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                  size="20"
                />
                <div class="flex-1">
                  <p class="font-semibold text-red-800 dark:text-red-200">
                    {{ leadBookable?.title }}
                  </p>
                  <p class="text-sm text-red-700 dark:text-red-300 mt-1">
                    {{ $t(leadBookableError.reason) }}
                  </p>
                  <p
                    v-if="leadBookableError.params?.remaining !== undefined"
                    class="text-xs text-red-600 dark:text-red-400 mt-1"
                  >
                    {{
                      $t("checkout.errors.capacityInfo", {
                        remaining: leadBookableError.params.remaining,
                        total: leadBookableError.params.totalCapacity,
                      })
                    }}
                  </p>
                </div>
              </div>

              <Splitpanes class="checkout-splitpanes">
                <Pane :size="65" :min-size="35">
                  <div class="pr-0 lg:pr-4">
                    <InputFreeTimeSelection
                      v-if="isScheduleRelated"
                      v-model="selectedTimePeriod"
                      :tenant-id="tenantID"
                      :bookable-id="bookableID"
                    />

                    <InputTimePeriodSlots
                      v-else-if="isTimePeriodRelated"
                      v-model="selectedTimePeriod"
                      :time-periods="bookableTimePeriods"
                      :tenant-id="tenantID"
                      :bookable-id="bookableID"
                    />

                    <InputWeekSelection
                      v-else-if="isLongRangeWeek"
                      v-model="selectedTimePeriod"
                      :tenant-id="tenantID"
                      :bookable-id="bookableID"
                      :price-eur="longRangeWeekPrice"
                    />

                    <InputMonthSelection
                      v-else-if="isLongRangeMonth"
                      v-model="selectedTimePeriod"
                      :tenant-id="tenantID"
                      :bookable-id="bookableID"
                      :price-eur="longRangeMonthPrice"
                    />

                    <p v-else class="text-gray-500 dark:text-gray-400">
                      Hier kommen Datum, Uhrzeit &amp; Zusatzobjekte rein.
                    </p>
                  </div>
                </Pane>

                <Pane v-if="additionalBookables.length > 0" :size="35" :min-size="20" class="overflow-hidden">
                  <div class="pl-0 lg:pl-4">
                    <AdditionalBookablesSelector
                      v-if="additionalBookables.length > 0"
                      v-model="selectedAdditionalBookables"
                      :items="additionalBookables"
                      :validation-errors="validationErrors"
                    />
                  </div>
                </Pane>
              </Splitpanes>
            </div>
          </template>

          <template #step-data>
            <UCard
              variant="subtle"
              class="rounded-xl mb-6 border border-primary-200 dark:border-primary-800"
            >
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{
                      isLoggedIn
                        ? $t("checkout.data.loggedInTitle")
                        : $t("checkout.data.guestTitle")
                    }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-300">
                    {{
                      isLoggedIn
                        ? $t("checkout.data.loggedInDescription")
                        : $t("checkout.data.guestDescription")
                    }}
                  </p>
                </div>
                <UButton
                  v-if="!isLoggedIn"
                  color="primary"
                  variant="soft"
                  icon="i-lucide-log-in"
                  :to="loginUrl"
                >
                  {{ $t("checkout.data.loginAction") }}
                </UButton>
                <UButton
                  v-else
                  color="neutral"
                  variant="soft"
                  icon="i-lucide-log-out"
                  :loading="isLoggingOut"
                  @click="continueAsGuest"
                >
                  {{ $t("checkout.data.logoutGuestAction") }}
                </UButton>
              </div>
            </UCard>
            <Splitpanes
              v-if="checkoutVisibleCustomFields.length > 0"
              class="checkout-splitpanes"
            >
              <Pane :size="65" :min-size="35">
                <div class="pr-0 lg:pr-4">
                  <CheckoutContactStep
                    v-model:contact="contactForm"
                    v-model:comment="customerComment"
                    v-model:attachment-accepted="attachmentAccepted"
                    :required-field-keys="mergedRequiredContactFields"
                    :comment-required="isCommentRequired"
                    :attachments="checkoutVisibleAttachments"
                  />
                </div>
              </Pane>

              <Pane :size="35" :min-size="20" class="overflow-hidden">
                <div class="pl-0 lg:pl-4">
                  <CheckoutCustomFields
                    v-model:values="customFieldValues"
                    :fields="checkoutVisibleCustomFields"
                  />
                </div>
              </Pane>
            </Splitpanes>

            <CheckoutContactStep
              v-else
              v-model:contact="contactForm"
              v-model:comment="customerComment"
              v-model:attachment-accepted="attachmentAccepted"
              :required-field-keys="mergedRequiredContactFields"
              :comment-required="isCommentRequired"
              :attachments="checkoutVisibleAttachments"
            />
          </template>

          <template #step-payment>
            <CheckoutPaymentStep
              v-model="selectedPaymentProviderId"
              :providers="paymentProviders"
            />
          </template>

          <template #step-confirm>
            <CheckoutReviewStep
              v-model:applied-coupon="appliedCouponCode"
              v-model:applied-coupon-details="appliedCouponDetails"
              :summary="summary"
              :selected-time-period="selectedTimePeriod"
              :contact="contactForm"
              :contact-field-keys="CONTACT_FIELD_KEYS"
              :customer-comment="customerComment"
              :show-comment="!!String(customerComment || '').trim()"
              :payment-providers="paymentProviders"
              :selected-payment-provider-id="selectedPaymentProviderId"
              :show-payment-summary="needsPaymentSelectionStep"
              :amounts="amounts"
              :lead-bookable-id="bookableID"
              :enable-coupons="couponsEnabled"
              :tenant-id="tenantID"
              :custom-field-rows="reviewCustomFieldRows"
              :is-validating="isValidating"
              :step-current="currentStep"
              :step-total="steps.length"
              :can-submit="canGoNext"
              :has-payment-step="needsPaymentSelectionStep"
              @finish="handleFinish"
              @back="onReviewBack"
              @edit="onReviewEdit"
            />
          </template>
        </AppStepper>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ── Splitpanes: Splitter Styling ── */
.checkout-splitpanes :deep(.splitpanes__splitter) {
  width: 9px;
  border: none;
  background-color: transparent;
  position: relative;
  cursor: col-resize;
  transition: background-color 0.2s ease;
}

/* Visible drag indicator line */
.checkout-splitpanes :deep(.splitpanes__splitter::before) {
  content: '';
  position: absolute;
  top: 0%;
  bottom: 0%;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background-color: #d1d5db;
  border-radius: 9999px;
  transition: background-color 0.2s ease, width 0.2s ease;
}

.checkout-splitpanes :deep(.splitpanes__splitter:hover::before) {
  background-color: var(--color-primary-500, #6366f1);
  width: 3px;
}

/* Dark mode splitter */
:root.dark .checkout-splitpanes :deep(.splitpanes__splitter::before) {
  background-color: #4b5563;
}

:root.dark .checkout-splitpanes :deep(.splitpanes__splitter:hover::before) {
  background-color: var(--color-primary-400, #818cf8);
}

/* ── Responsive: stack vertically on small screens ── */
@media (max-width: 1023px) {
  .checkout-splitpanes {
    flex-direction: column !important;
  }

  .checkout-splitpanes :deep(.splitpanes__splitter) {
    display: none !important;
  }

  .checkout-splitpanes :deep(.splitpanes__pane) {
    width: 100% !important;
    max-width: 100% !important;
    flex: none !important;
    padding-top: 1rem;
  }

  .checkout-splitpanes :deep(.splitpanes__pane:first-child) {
    padding-top: 0;
  }
}
</style>
