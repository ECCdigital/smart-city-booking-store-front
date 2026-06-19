<script setup>
import { useCheckout } from "~/composables/api/useCheckout.js";
import { useTenants } from "~/composables/api/useTenants.js";
import AdditionalBookablesSelector from "~/components/checkout/AdditionalBookablesSelector.vue";
import InputTimePeriodSlots from "~/components/checkout/InputTimePeriodSlots.vue";
import InputFreeTimeSelection from "~/components/checkout/InputFreeTimeSelection.vue";
import InputRecurringTimeSelection from "~/components/checkout/InputRecurringTimeSelection.vue";
import InputWeekSelection from "~/components/checkout/InputWeekSelection.vue";
import InputMonthSelection from "../../components/checkout/InputMonthSelection.vue";
import InputBlockPeriodSelection from "~/components/checkout/InputBlockPeriodSelection.vue";
import PriceSummaryBar from "~/components/checkout/PriceSummaryBar.vue";
import CheckoutContactStep from "~/components/checkout/CheckoutContactStep.vue";
import CheckoutCustomFields from "~/components/checkout/CheckoutCustomFields.vue";
import CheckoutPaymentStep from "~/components/checkout/CheckoutPaymentStep.vue";
import CheckoutReviewStep from "~/components/checkout/CheckoutReviewStep.vue";
import { useAuthStore } from "~~/stores/auth.js";
import { useNotification } from "~/composables/useNotification.js";
import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";

definePageMeta({
  layout: "checkout",
});

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
      const isRequired =
        value === true || value === "true" || value === 1 || value === "1";
      return (
        isRequired && (normalized === "comment" || normalized === "kommentar")
      );
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

const route = useRoute();
const router = useRouter();
const bookableID = route.params.bookableID;
const tenantID = route.query.tenantId;

const { fetchBookable, fetchCheckoutPermissions } = useCheckout();
const { fetchTenant, fetchTenantPaymentProviders, fetchTenantUserRoles } =
  useTenants();

const isLoading = ref(true);

const { data, error } = await useAsyncData(
  `checkout-${bookableID}-${tenantID}`,
  async () => {
    if (!bookableID || !tenantID) return null;

    try {
      const [leadBookable, tenant, paymentProviders, permissions] =
        await Promise.all([
          fetchBookable(bookableID, tenantID),
          fetchTenant(tenantID),
          fetchTenantPaymentProviders(tenantID),
          fetchCheckoutPermissions(tenantID, bookableID),
        ]);

      const additionalIds = leadBookable?.checkoutBookableIds || [];
      const additionalBookables = await Promise.all(
        additionalIds.map(async ({ bookableId, mandatory }) => ({
          item: await fetchBookable(bookableId, tenantID),
          mandatory,
        })),
      );

      return {
        leadBookable,
        tenant,
        additionalBookables,
        paymentProviders: Array.isArray(paymentProviders)
          ? paymentProviders
          : [],
        permissionCheck: permissions ?? null,
      };
    } finally {
      isLoading.value = false;
    }
  },
  { server: false, lazy: true },
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
const permissionCheck = computed(() => data.value?.permissionCheck || null);

function isLoginRequiredPermissionError(result) {
  if (result?.success !== false || result?.error?.checkType !== "permissions") {
    return false;
  }
  const reason = result?.error?.reason;
  return reason === "checkout.login_required" || reason === "login_required";
}

const requiresLoginForCheckout = computed(() =>
  isLoginRequiredPermissionError(permissionCheck.value),
);

const hasBlockingPermissionError = computed(() => {
  const result = permissionCheck.value;
  if (result?.success !== false || result?.error?.checkType !== "permissions") {
    return false;
  }
  return !isLoginRequiredPermissionError(result);
});
const isResolvingPermissionGuard = computed(
  () =>
    !isLoading.value &&
    hasBlockingPermissionError.value &&
    !authStore.authChecked,
);
const showPermissionGuard = computed(
  () => hasBlockingPermissionError.value && authStore.authChecked,
);
const permissionGuardMessage = computed(() => {
  if (!showPermissionGuard.value) return "";
  return messageForStructuredCheckoutError(permissionCheck.value?.error);
});
const permissionGuardTitle = computed(() =>
  isLoggedIn.value
    ? t("checkout.permissionGuard.loggedInTitle")
    : t("checkout.permissionGuard.loggedOutTitle"),
);
const permissionGuardDescription = computed(() =>
  isLoggedIn.value
    ? t("checkout.permissionGuard.loggedInDescription")
    : t("checkout.permissionGuard.loggedOutDescription"),
);
const couponsEnabled = computed(() => {
  const b = leadBookable.value;
  return (
    b?.enableCoupons === true ||
    b?.enableCoupons === "true" ||
    b?.enableCoupons === 1
  );
});

const requiresManualApproval = computed(() => {
  const v = leadBookable.value?.autoCommitBooking;
  return v === false || v === "false" || v === 0 || v === "0";
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

    const route = useRoute();
    const bookableID = route.params.bookableID;
    const tenantID = route.query.tenantId;

    const label = TYPE_LABELS[type] || type || "";
    const url = `/checkout/${bookableID}?tenantId=${tenantID}`;
    checkoutNavTab.value = { label, url };
  },
  { immediate: true },
);

onUnmounted(() => {
  checkoutNavTab.value = "";
});
const additionalBookables = computed(
  () => data.value?.additionalBookables || [],
);

const mandatoryBookableIds = computed(() =>
  additionalBookables.value
    .filter((entry) => entry.mandatory)
    .map((entry) => entry.item.id),
);

const checkoutID = ref(null);
const checkoutSubmitting = ref(false);
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
  { immediate: true },
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
  { deep: true },
);

const { t, te } = useI18n();
usePageTitle(() =>
  leadBookable.value?.title
    ? t("meta.pages.checkoutDetail", { title: leadBookable.value.title })
    : t("meta.pages.checkout"),
);
const { error: notifyError } = useNotification();
const authStore = useAuthStore();
const isLoggedIn = computed(() => authStore.isLoggedIn);
const isLoggingOut = ref(false);
const lastAutofilledUserKey = ref(null);
const loginUrl = computed(
  () => `/login?redirect=${encodeURIComponent(route.fullPath)}`,
);
const checkoutStateStorageKey = computed(
  () => `checkout-state:${String(tenantID ?? "")}:${String(bookableID ?? "")}`,
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
  bookablesInCheckout.value.some((b) => hasRequiredCommentField(b)),
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
        raw === true
          ? t("checkout.review.boolYes")
          : t("checkout.review.boolNo");
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
const appliedCouponDetails = ref(null);
const bookWithPricePreference = ref(null);
const freeBookingEligibility = ref({});

const hasResolvedFreeCheckout = computed(() => {
  const total = Number(summary.value?.total ?? 0);
  return (
    summary.value?.items?.length > 0 &&
    Object.keys(validationErrors.value).length === 0 &&
    !isValidating.value &&
    total <= 0.005
  );
});

const needsPaymentSelectionStep = computed(
  () => paymentProviders.value.length > 1 && !hasResolvedFreeCheckout.value,
);

function applyUserToContactForm(user, force = false) {
  if (!user) return;

  const userKey = String(user.id || user.email || "");
  const shouldForce =
    force || (userKey && userKey !== lastAutofilledUserKey.value);

  if ((shouldForce || !contactForm.firstName) && user.firstName)
    contactForm.firstName = user.firstName;
  if ((shouldForce || !contactForm.lastName) && user.lastName)
    contactForm.lastName = user.lastName;
  if ((shouldForce || !contactForm.email) && user.id)
    contactForm.email = user.id;
  if ((shouldForce || !contactForm.phone) && user.phone)
    contactForm.phone = user.phone;
  if ((shouldForce || !contactForm.company) && user.company)
    contactForm.company = user.company;
  if ((shouldForce || !contactForm.address) && user.address)
    contactForm.address = user.address;
  if ((shouldForce || !contactForm.zipCode) && user.zipCode)
    contactForm.zipCode = user.zipCode;
  if ((shouldForce || !contactForm.city) && user.city)
    contactForm.city = user.city;

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
      list.filter((a) => a.required === true).map((a) => a.id),
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
  { deep: true, immediate: true },
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
  { immediate: true },
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
  { immediate: true },
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
  { deep: true, immediate: true },
);

function isNonEmptyContactValue(v) {
  return v != null && String(v).trim().length > 0;
}

function isValidContactEmail(v) {
  if (!isNonEmptyContactValue(v)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
}

const isDataStepComplete = computed(() => {
  if (requiresLoginForCheckout.value && !isLoggedIn.value) {
    return false;
  }
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
  if (
    isCommentRequired.value &&
    !isNonEmptyContactValue(customerComment.value)
  ) {
    return false;
  }
  for (const field of checkoutVisibleCustomFields.value) {
    if (field?.usageOptions?.requiredInCheckout !== true) continue;
    const value = customFieldValues.value?.[field.id];
    if (field.inputType === "boolean") {
      if (value !== true) return false;
    } else if (field.inputType === "numeric") {
      if (value === null || value === undefined || Number.isNaN(value))
        return false;
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
  scheduleValidation();
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
  { immediate: true },
);

async function continueAsGuest() {
  if (requiresLoginForCheckout.value || !isLoggedIn.value || isLoggingOut.value)
    return;
  isLoggingOut.value = true;
  try {
    await authStore.logout();
  } finally {
    isLoggingOut.value = false;
  }
}

async function signOutAndLogin() {
  if (isLoggingOut.value) return;
  isLoggingOut.value = true;
  try {
    if (isLoggedIn.value) {
      await authStore.logout();
    }
  } finally {
    isLoggingOut.value = false;
  }
  await navigateTo(loginUrl.value);
}

function handleAmountUpdate({ id, amount }) {
  const isMandatory = mandatoryBookableIds.value.includes(id);
  const minAllowed = id === bookableID || isMandatory ? 1 : 0;

  if (amount <= 0 && id !== bookableID && !isMandatory) {
    selectedAdditionalBookables.value =
      selectedAdditionalBookables.value.filter((bid) => bid !== id);
    amounts.value = Object.fromEntries(
      Object.entries(amounts.value).filter(([k]) => k !== id),
    );
  } else {
    amounts.value[id] = Math.max(amount, minAllowed);
  }
}

const { validateBookable, completeCheckout, completeGroupCheckout } =
  useCheckout();

const groupBookingEnabled = computed(() => {
  const b = leadBookable.value;
  return b?.groupBooking?.enabled === true;
});

function normalizeRoleIdentifier(value) {
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number") {
    const s = String(value).trim();
    return s || null;
  }
  if (typeof value === "object") {
    const candidates = [
      value.id,
      value.roleId,
      value.name,
      value.code,
      value.slug,
    ];
    for (const c of candidates) {
      if (c != null) {
        const s = String(c).trim();
        if (s) return s;
      }
    }
  }
  return null;
}

const groupBookingPermittedRoles = computed(() => {
  const raw = leadBookable.value?.groupBooking?.permittedRoles;
  if (!Array.isArray(raw)) return [];
  const ids = raw.map(normalizeRoleIdentifier).filter(Boolean);
  return [...new Set(ids)];
});

const groupBookingHasRoleRestriction = computed(
  () => groupBookingPermittedRoles.value.length > 0,
);

const userTenantRoles = ref([]);
const isLoadingUserTenantRoles = ref(false);
const hasResolvedUserTenantRoles = ref(false);

const userTenantRoleIds = computed(() => {
  const ids = userTenantRoles.value
    .map(normalizeRoleIdentifier)
    .filter(Boolean);
  return [...new Set(ids)];
});

async function loadUserTenantRoles() {
  if (!tenantID || !isLoggedIn.value) {
    userTenantRoles.value = [];
    hasResolvedUserTenantRoles.value = true;
    return;
  }
  isLoadingUserTenantRoles.value = true;
  try {
    const roles = await fetchTenantUserRoles(tenantID, { publicRoles: true });
    userTenantRoles.value = Array.isArray(roles) ? roles : [];
  } catch (err) {
    console.warn("Failed to load user roles for tenant", err);
    userTenantRoles.value = [];
  } finally {
    isLoadingUserTenantRoles.value = false;
    hasResolvedUserTenantRoles.value = true;
  }
}

const canCreateGroupBooking = computed(() => {
  if (!groupBookingEnabled.value) return false;
  if (!groupBookingHasRoleRestriction.value) return true;
  if (!isLoggedIn.value) return false;
  const permitted = new Set(groupBookingPermittedRoles.value);
  return userTenantRoleIds.value.some((id) => permitted.has(id));
});

const isCheckingGroupBookingPermission = computed(() => {
  if (!groupBookingHasRoleRestriction.value) return false;
  if (!isLoggedIn.value) return false;
  return isLoadingUserTenantRoles.value || !hasResolvedUserTenantRoles.value;
});

const groupBookingPermissionReason = computed(() => {
  if (!groupBookingHasRoleRestriction.value) return null;
  if (!isLoggedIn.value) return "loginRequired";
  if (isCheckingGroupBookingPermission.value) return "loading";
  if (!canCreateGroupBooking.value) return "missingRole";
  return null;
});

watch(
  [groupBookingHasRoleRestriction, isLoggedIn, () => tenantID],
  ([hasRestriction, loggedIn]) => {
    if (!hasRestriction) {
      userTenantRoles.value = [];
      hasResolvedUserTenantRoles.value = true;
      return;
    }
    if (loggedIn) {
      loadUserTenantRoles();
    } else {
      userTenantRoles.value = [];
      hasResolvedUserTenantRoles.value = true;
    }
  },
  { immediate: true },
);

const useGroupBooking = ref(false);
const groupBookingRule = ref({
  seedStart: null,
  seedEnd: null,
  until: null,
  interval: 1,
  frequency: "weekly",
  byWeekday: null,
  monthlyMode: "day-of-month",
  monthlyDayOfMonth: null,
  monthlyWeekday: null,
  monthlyWeekdayOrdinal: 1,
});
const groupBookingAttempts = ref([]);
const groupBookingAttemptStatuses = ref({});

const isGroupBookingActive = computed(
  () => groupBookingEnabled.value && useGroupBooking.value,
);

watch(groupBookingEnabled, (enabled) => {
  if (!enabled) {
    useGroupBooking.value = false;
  }
});

watch(canCreateGroupBooking, (allowed) => {
  if (!allowed && useGroupBooking.value) {
    useGroupBooking.value = false;
  }
});

watch(useGroupBooking, (enabled) => {
  groupBookingAttemptStatuses.value = {};
  if (!enabled) return;

  const start = normalizePeriodTimestamp(selectedTimePeriod.value?.start);
  const end = normalizePeriodTimestamp(selectedTimePeriod.value?.end);
  if (start == null || end == null || end <= start) return;

  groupBookingRule.value = {
    ...groupBookingRule.value,
    seedStart: start,
    seedEnd: end,
  };
});

watch(
  groupBookingAttempts,
  () => {
    if (!isGroupBookingActive.value) return;
    const currentStarts = new Set(
      groupBookingAttempts.value.map((a) => a.start),
    );
    const next = {};
    for (const [key, value] of Object.entries(
      groupBookingAttemptStatuses.value,
    )) {
      if (currentStarts.has(Number(key))) next[key] = value;
    }
    groupBookingAttemptStatuses.value = next;
    scheduleValidation();
  },
  { deep: true },
);

const couponForValidation = computed(() => {
  if (!couponsEnabled.value) return null;
  const c = appliedCouponCode.value;
  if (c == null) return null;
  const s = String(c).trim();
  return s || null;
});

const hasFreeBookingOption = computed(() =>
  Object.values(freeBookingEligibility.value).some((value) => value === true),
);

const isBookingWithPrice = computed(() => {
  if (!hasFreeBookingOption.value) return true;
  if (typeof bookWithPricePreference.value === "boolean") {
    return bookWithPricePreference.value;
  }
  return false;
});

const selectedBookWithPrice = computed({
  get: () => isBookingWithPrice.value,
  set: (value) => {
    bookWithPricePreference.value = value === true;
  },
});

let validationToken = 0;

const COUPON_SUMMARY_ROW_ID = "__coupon__";

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

function toFiniteAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function toNullableAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

async function validateAll() {
  if (!leadBookable.value || !tenantID || !bookableID) {
    summary.value = { items: [], taxAmount: 0, total: 0, errors: [] };
    validationErrors.value = {};
    checkoutID.value = null;
    freeBookingEligibility.value = {};
    return;
  }

  if (isGroupBookingActive.value) {
    return validateGroupBookingAttempts();
  }

  const start = normalizePeriodTimestamp(selectedTimePeriod.value?.start);
  const end = normalizePeriodTimestamp(selectedTimePeriod.value?.end);

  if (
    requiresTimeSelection.value &&
    (start == null || end == null || end <= start)
  ) {
    summary.value = { items: [], taxAmount: 0, total: 0, errors: [] };
    validationErrors.value = {};
    checkoutID.value = null;
    freeBookingEligibility.value = {};
    return;
  }

  const myToken = ++validationToken;
  isValidating.value = true;

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
          start: requiresTimeSelection.value ? start : undefined,
          end: requiresTimeSelection.value ? end : undefined,
          couponCode: couponForValidation.value,
          couponId: appliedCouponDetails.value?.id ?? null,
          bookWithPrice: isBookingWithPrice.value,
        })
          .then((res) => ({ id, isLead, res }))
          .catch((err) => ({ id, isLead, error: err })),
      ),
    );

    if (myToken !== validationToken) return;

    const items = [];
    let taxAmount = 0;
    let total = 0;
    let newCheckoutId = null;
    const errors = [];
    const errorMap = {};
    const eligibilityMap = {};

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

      const validationData =
        row.res?.data && typeof row.res.data === "object" ? row.res.data : {};
      const freeBookingAllowed = validationData.freeBookingAllowed === true;
      const freeBookingActive = freeBookingAllowed && !isBookingWithPrice.value;
      const userPriceEur = toFiniteAmount(validationData.userPriceEur);
      const userGrossPriceEur = toFiniteAmount(
        validationData.userGrossPriceEur,
      );
      const regularPriceEur =
        toNullableAmount(validationData.regularPriceEur) ??
        toNullableAmount(validationData.userPriceEur);

      eligibilityMap[id] = freeBookingAllowed;

      if (isLead || newCheckoutId == null) {
        newCheckoutId = row.res.checkoutId;
      }

      const lineNetAmount = freeBookingActive ? 0 : userPriceEur;
      const lineGrossAmount = freeBookingActive ? 0 : userGrossPriceEur;

      items.push({
        id,
        label,
        amountEur: lineNetAmount,
        priceDisplayEur: freeBookingActive ? 0 : null,
        originalAmountEur: freeBookingActive ? regularPriceEur : null,
        freeBookingAllowed,
        freeBookingActive,
      });
      taxAmount += lineGrossAmount - lineNetAmount;
      total += lineGrossAmount;
    }

    freeBookingEligibility.value = eligibilityMap;

    if (
      couponForValidation.value &&
      appliedCouponDetails.value &&
      errors.length === 0 &&
      items.length === targets.length &&
      total > 0
    ) {
      const rawDiscount = computeCouponGrossDiscount(
        appliedCouponDetails.value,
        total,
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

async function validateGroupBookingAttempts() {
  const attempts = Array.isArray(groupBookingAttempts.value)
    ? groupBookingAttempts.value
    : [];

  const myToken = ++validationToken;
  isValidating.value = true;
  validationErrors.value = {};
  freeBookingEligibility.value = {};

  if (attempts.length === 0) {
    summary.value = { items: [], taxAmount: 0, total: 0, errors: [] };
    checkoutID.value = null;
    groupBookingAttemptStatuses.value = {};
    if (myToken === validationToken) isValidating.value = false;
    return;
  }

  try {
    const targets = [
      {
        id: bookableID,
        isLead: true,
        amount: amounts.value[bookableID] || 1,
        title: leadBookable.value?.title || t("checkout.review.bookingLabel"),
      },
      ...selectedAdditionalBookables.value.map((id) => ({
        id,
        isLead: false,
        amount: amounts.value[id] || 1,
        title:
          additionalBookables.value.find((entry) => entry.item.id === id)?.item
            .title || t("checkout.additionalObjects"),
      })),
    ];

    const requests = [];
    for (const attempt of attempts) {
      for (const target of targets) {
        requests.push({ attempt, target });
      }
    }

    const results = await Promise.all(
      requests.map(({ attempt, target }) =>
        validateBookable({
          bookableID: target.id,
          tenantID,
          amount: target.amount,
          start: attempt.start,
          end: attempt.end,
          couponCode: couponForValidation.value,
          couponId: appliedCouponDetails.value?.id ?? null,
          bookWithPrice: isBookingWithPrice.value,
        })
          .then((res) => ({ attempt, target, res }))
          .catch((err) => ({ attempt, target, error: err })),
      ),
    );

    if (myToken !== validationToken) return;

    const perAttempt = new Map();
    for (const attempt of attempts) {
      perAttempt.set(attempt.start, {
        valid: true,
        net: 0,
        gross: 0,
        firstError: null,
      });
    }

    const perBookable = new Map();
    for (const target of targets) {
      perBookable.set(target.id, {
        target,
        netTotal: 0,
        grossTotal: 0,
        freeBookingAllowedAll: true,
        failedAttempts: 0,
      });
    }

    let firstCheckoutId = null;

    for (const row of results) {
      const attemptAcc = perAttempt.get(row.attempt.start);
      const bookableAcc = perBookable.get(row.target.id);
      if (!attemptAcc || !bookableAcc) continue;

      if (row.error) {
        attemptAcc.valid = false;
        if (!attemptAcc.firstError) {
          attemptAcc.firstError = {
            reason: "checkout.unknown_error",
            target: row.target,
          };
        }
        bookableAcc.failedAttempts += 1;
        bookableAcc.freeBookingAllowedAll = false;
        continue;
      }

      if (!row.res?.success) {
        const reason = row.res?.error?.reason || "checkout.unknown_error";
        const params = row.res?.error?.params || {};
        attemptAcc.valid = false;
        if (!attemptAcc.firstError) {
          attemptAcc.firstError = { reason, params, target: row.target };
        }
        bookableAcc.failedAttempts += 1;
        bookableAcc.freeBookingAllowedAll = false;
        continue;
      }

      if (firstCheckoutId == null && row.res.checkoutId) {
        firstCheckoutId = row.res.checkoutId;
      }

      const validationData =
        row.res?.data && typeof row.res.data === "object" ? row.res.data : {};
      const freeBookingAllowed = validationData.freeBookingAllowed === true;
      const freeBookingActive = freeBookingAllowed && !isBookingWithPrice.value;
      const userPriceEur = toFiniteAmount(validationData.userPriceEur);
      const userGrossPriceEur = toFiniteAmount(
        validationData.userGrossPriceEur,
      );

      const lineNet = freeBookingActive ? 0 : userPriceEur;
      const lineGross = freeBookingActive ? 0 : userGrossPriceEur;

      attemptAcc.net += lineNet;
      attemptAcc.gross += lineGross;

      bookableAcc.netTotal += lineNet;
      bookableAcc.grossTotal += lineGross;
      if (!freeBookingAllowed) bookableAcc.freeBookingAllowedAll = false;
    }

    const statuses = {};
    const errors = [];
    let total = 0;
    let taxAmount = 0;

    for (const attempt of attempts) {
      const startKey = attempt.start;
      const acc = perAttempt.get(startKey);
      if (!acc) continue;
      if (!acc.valid) {
        const reason = acc.firstError?.reason || "checkout.unknown_error";
        const params = acc.firstError?.params;
        statuses[startKey] = { valid: false, reason, params };
        const failedTarget = acc.firstError?.target;
        errors.push({
          id: `${failedTarget?.id || bookableID}@${startKey}`,
          isLead: failedTarget?.isLead ?? true,
          label:
            failedTarget?.title ||
            leadBookable.value?.title ||
            t("checkout.review.bookingLabel"),
          reason,
          params,
          attemptStart: attempt.start,
        });
        continue;
      }
      statuses[startKey] = {
        valid: true,
        userPriceEur: acc.net,
        userGrossPriceEur: acc.gross,
      };
      total += acc.gross;
      taxAmount += Math.max(0, acc.gross - acc.net);
    }

    groupBookingAttemptStatuses.value = statuses;

    const eligibilityMap = {};
    for (const [id, acc] of perBookable.entries()) {
      eligibilityMap[id] = acc.freeBookingAllowedAll;
    }
    freeBookingEligibility.value = eligibilityMap;

    const attemptCount = attempts.length;
    const items = [];

    if (errors.length === 0) {
      for (const target of targets) {
        const acc = perBookable.get(target.id);
        if (!acc) continue;
        items.push({
          id: target.id,
          label: t("groupBooking.summary.line", {
            title: target.title,
            count: attemptCount,
          }),
          amountEur: acc.netTotal,
          priceDisplayEur: null,
          skipQuantity: true,
        });
      }
    }

    if (
      couponForValidation.value &&
      appliedCouponDetails.value &&
      errors.length === 0 &&
      total > 0
    ) {
      const rawDiscount = computeCouponGrossDiscount(
        appliedCouponDetails.value,
        total,
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

    const errorMap = {};
    if (errors.length > 0) {
      errorMap[bookableID] = {
        reason: "checkout.group_booking_partial_failure",
        isLead: true,
        params: { invalidCount: errors.length, totalCount: attempts.length },
      };
      for (const target of targets) {
        if (target.isLead) continue;
        const acc = perBookable.get(target.id);
        if (acc && acc.failedAttempts === attempts.length) {
          errorMap[target.id] = {
            reason: "checkout.bookable_unavailable",
            isLead: false,
          };
        }
      }
    }
    validationErrors.value = errorMap;
    summary.value = {
      items,
      taxAmount,
      total,
      errors,
    };
    checkoutID.value = firstCheckoutId;
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
  [
    selectedTimePeriod,
    selectedAdditionalBookables,
    amounts,
    appliedCouponCode,
    appliedCouponDetails,
    isBookingWithPrice,
    useGroupBooking,
  ],
  scheduleValidation,
  {
    deep: true,
  },
);

const isScheduleRelated = computed(
  () => leadBookable.value?.isScheduleRelated === true,
);

const isTimePeriodRelated = computed(
  () => leadBookable.value?.isTimePeriodRelated === true,
);

const isLongRangeWeek = computed(() => {
  const b = leadBookable.value;
  return b?.isLongRange === true && b?.longRangeOptions?.type === "week";
});

const isLongRangeMonth = computed(() => {
  const b = leadBookable.value;
  return b?.isLongRange === true && b?.longRangeOptions?.type === "month";
});

const isBlockPeriodRelated = computed(
  () => leadBookable.value?.isBlockPeriodRelated === true,
);

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

const bookableTimePeriods = computed(
  () => leadBookable.value?.timePeriods || [],
);

const hasValidTimePeriod = computed(
  () =>
    !!selectedTimePeriod.value?.start &&
    !!selectedTimePeriod.value?.end &&
    selectedTimePeriod.value.end > selectedTimePeriod.value.start,
);

const hasValidGroupBookingSelection = computed(() => {
  if (!isGroupBookingActive.value) return false;
  if (
    !Array.isArray(groupBookingAttempts.value) ||
    groupBookingAttempts.value.length === 0
  ) {
    return false;
  }
  for (const attempt of groupBookingAttempts.value) {
    const status = groupBookingAttemptStatuses.value[attempt.start];
    if (!status || status.valid !== true) return false;
  }
  return true;
});

const requiresTimeSelection = computed(
  () =>
    isScheduleRelated.value ||
    isTimePeriodRelated.value ||
    isLongRangeWeek.value ||
    isLongRangeMonth.value ||
    isBlockPeriodRelated.value,
);

const hasAdditionalBookables = computed(
  () => additionalBookables.value.length > 0,
);

const needsStandaloneObjectsStep = computed(
  () => !requiresTimeSelection.value && hasAdditionalBookables.value,
);

const showAdditionalBookablesInPeriodStep = computed(
  () => requiresTimeSelection.value && hasAdditionalBookables.value,
);

const needsTimePeriodSelection = computed(() => {
  if (isGroupBookingActive.value) {
    return groupBookingAttempts.value.length === 0;
  }
  const noPeriodSelected =
    !selectedTimePeriod.value?.start || !selectedTimePeriod.value?.end;
  return requiresTimeSelection.value && noPeriodSelected;
});

const MIN_STEP = 1;
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

const hasRestoredCheckoutState = ref(false);

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
    bookWithPricePreference: bookWithPricePreference.value,
    useGroupBooking: useGroupBooking.value,
    groupBookingRule: groupBookingRule.value,
  };
  sessionStorage.setItem(
    checkoutStateStorageKey.value,
    JSON.stringify(payload),
  );
}

function restoreCheckoutState() {
  if (!import.meta.client) return;
  const raw = sessionStorage.getItem(checkoutStateStorageKey.value);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      if (
        parsed.selectedTimePeriod &&
        typeof parsed.selectedTimePeriod === "object"
      ) {
        const restoredStart = normalizePeriodTimestamp(
          parsed.selectedTimePeriod.start,
        );
        const restoredEnd = normalizePeriodTimestamp(
          parsed.selectedTimePeriod.end,
        );
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
      if (
        parsed.attachmentAccepted &&
        typeof parsed.attachmentAccepted === "object"
      ) {
        restoredAttachmentAccepted.value = parsed.attachmentAccepted;
        attachmentAccepted.value = parsed.attachmentAccepted;
      }
      if (
        parsed.customFieldValues &&
        typeof parsed.customFieldValues === "object"
      ) {
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
      if (
        typeof parsed.appliedCouponCode === "string" &&
        parsed.appliedCouponCode.trim()
      ) {
        appliedCouponCode.value = parsed.appliedCouponCode.trim();
      }
      if (
        parsed.appliedCouponDetails &&
        typeof parsed.appliedCouponDetails === "object"
      ) {
        appliedCouponDetails.value = parsed.appliedCouponDetails;
      }
      if (typeof parsed.bookWithPricePreference === "boolean") {
        bookWithPricePreference.value = parsed.bookWithPricePreference;
      }
      if (typeof parsed.useGroupBooking === "boolean") {
        useGroupBooking.value = parsed.useGroupBooking;
      }
      if (
        parsed.groupBookingRule &&
        typeof parsed.groupBookingRule === "object"
      ) {
        groupBookingRule.value = {
          ...groupBookingRule.value,
          ...parsed.groupBookingRule,
        };
      }
    }
  } catch (err) {
    console.warn("Failed to restore checkout state", err);
  }
}

const steps = computed(() => {
  const withPayment = needsPaymentSelectionStep.value;
  const out = [];

  if (requiresTimeSelection.value) {
    out.push({
      key: "period",
      title: t("checkout.steps.periodTitle"),
      nextLabel: t("checkout.steps.nextToData"),
    });
  } else if (needsStandaloneObjectsStep.value) {
    out.push({
      key: "objects",
      title: t("checkout.additionalObjects"),
      nextLabel: t("checkout.steps.nextToData"),
    });
  }

  out.push({
    key: "data",
    title: t("checkout.steps.dataTitle"),
    nextLabel: withPayment
      ? t("checkout.steps.nextToPayment")
      : t("checkout.steps.nextToConfirm"),
  });

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

const maxStep = computed(() => steps.value.length);

function normalizeStep(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(maxStep.value, Math.max(MIN_STEP, parsed));
}

const currentStep = ref(1);

watch(currentStep, (step) => {
  if (step === maxStep.value) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

watch(maxStep, (max) => {
  if (currentStep.value > max) {
    currentStep.value = max;
  }
});

const hasValidationErrors = computed(
  () => Object.keys(validationErrors.value).length > 0,
);

const hasConfirmableSummary = computed(() => {
  if (isGroupBookingActive.value) {
    return (
      hasValidGroupBookingSelection.value &&
      !hasValidationErrors.value &&
      !isValidating.value
    );
  }
  return (
    summary.value?.items?.length > 0 &&
    !hasValidationErrors.value &&
    !isValidating.value
  );
});

const leadBookableError = computed(
  () => validationErrors.value[bookableID] || null,
);

const currentStepKey = computed(() => {
  const idx = (Number(currentStep.value) || 1) - 1;
  return steps.value[idx]?.key ?? null;
});

const canGoNext = computed(() => {
  const key = currentStepKey.value;
  if (key === "period") {
    if (isGroupBookingActive.value) {
      if (!hasValidGroupBookingSelection.value) return false;
      if (isValidating.value) return false;
      return true;
    }
    if (!hasValidTimePeriod.value) return false;
    if (hasValidationErrors.value) return false;
    if (isValidating.value) return false;
    return true;
  }
  if (key === "objects") {
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

watch([() => route.query.step, maxStep], ([step]) => {
  const nextStep = normalizeStep(step);
  if (nextStep != null && nextStep !== currentStep.value) {
    currentStep.value = nextStep;
  }
});

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
  { immediate: true },
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
    bookWithPricePreference,
    useGroupBooking,
    groupBookingRule,
    () => ({ ...contactForm }),
  ],
  () => {
    if (!hasRestoredCheckoutState.value) return;
    persistCheckoutState();
  },
  { deep: true, immediate: true },
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
  { deep: true },
);

function buildCustomFieldValuesPayload() {
  const fields = checkoutVisibleCustomFields.value;
  if (!fields.length) return null;

  const raw = customFieldValues.value || {};
  return fields
    .filter((field) => field?.id != null)
    .map((field) => ({
      fieldId: field.id,
      value:
        field.inputType === "boolean"
          ? raw[field.id] === true
          : (raw[field.id] ?? null),
    }));
}

function buildCheckoutPayload() {
  const bookableItems = [
    { bookableId: bookableID, amount: amounts.value[bookableID] || 1 },
    ...selectedAdditionalBookables.value.map((id) => ({
      bookableId: id,
      amount: amounts.value[id] || 1,
    })),
  ];

  const payload = {
    tenantID,
    checkoutId: checkoutID.value || undefined,
    bookableItems,
    bookWithPrice: isBookingWithPrice.value,
    name: `${contactForm.firstName} ${contactForm.lastName}`.trim(),
    mail: String(contactForm.email || "").trim(),
  };

  if (contactForm.phone?.trim()) payload.phone = contactForm.phone.trim();
  if (contactForm.company?.trim()) payload.company = contactForm.company.trim();
  if (contactForm.address?.trim()) payload.street = contactForm.address.trim();
  if (contactForm.zipCode?.trim()) payload.zipCode = contactForm.zipCode.trim();
  if (contactForm.city?.trim()) payload.location = contactForm.city.trim();
  if (customerComment.value?.trim())
    payload.comment = customerComment.value.trim();

  const start = normalizePeriodTimestamp(selectedTimePeriod.value?.start);
  const end = normalizePeriodTimestamp(selectedTimePeriod.value?.end);
  if (start != null && end != null && end > start) {
    payload.timeBegin = start;
    payload.timeEnd = end;
  }

  const code = couponForValidation.value;
  if (code) payload.couponCode = code;

  const total = summary.value?.total ?? 0;
  if (total > 0.005 && selectedPaymentProviderId.value) {
    payload.paymentProvider = String(selectedPaymentProviderId.value);
  }

  const customFields = buildCustomFieldValuesPayload();
  if (customFields?.length) {
    payload.customFieldValues = customFields;
  }

  return payload;
}

function buildGroupCheckoutPayload() {
  const attempts = Array.isArray(groupBookingAttempts.value)
    ? groupBookingAttempts.value
    : [];

  const bookableItems = [
    { bookableId: bookableID, amount: amounts.value[bookableID] || 1 },
    ...selectedAdditionalBookables.value.map((id) => ({
      bookableId: id,
      amount: amounts.value[id] || 1,
    })),
  ];

  const payload = {
    tenantID,
    simulate: false,
    bookableItems,
    bookingAttempts: attempts.map((a) => ({
      timeBegin: a.start,
      timeEnd: a.end,
    })),
    bookWithPrice: isBookingWithPrice.value,
    name: `${contactForm.firstName} ${contactForm.lastName}`.trim(),
    mail: String(contactForm.email || "").trim(),
  };

  if (contactForm.phone?.trim()) payload.phone = contactForm.phone.trim();
  if (contactForm.company?.trim()) payload.company = contactForm.company.trim();
  if (contactForm.address?.trim()) payload.street = contactForm.address.trim();
  if (contactForm.zipCode?.trim()) payload.zipCode = contactForm.zipCode.trim();
  if (contactForm.city?.trim()) payload.location = contactForm.city.trim();
  if (customerComment.value?.trim())
    payload.comment = customerComment.value.trim();

  const code = couponForValidation.value;
  if (code) payload.couponCode = code;

  const total = summary.value?.total ?? 0;
  if (total > 0.005 && selectedPaymentProviderId.value) {
    payload.paymentProvider = String(selectedPaymentProviderId.value);
  }

  const customFields = buildCustomFieldValuesPayload();
  if (customFields?.length) {
    payload.customFieldValues = customFields;
  }

  return payload;
}

function isExternalPaymentLinkProvider(provider) {
  if (provider == null) return false;
  const s = String(provider).trim();
  if (!s) return false;
  const lower = s.toLowerCase();
  if (lower === "pmpayment") return true;
  if (lower === "girocockpit") return true;
  if (lower === "epaybl" || lower.includes("epaybl")) return true;
  return false;
}

function firstPaymentContinueUrl(payment) {
  if (!payment?.data) return null;
  const d = payment.data;
  if (!Array.isArray(d)) return null;
  const row = d.find((x) => {
    if (!x || typeof x !== "object") return false;
    const u = x.url ?? x.paymentUrl ?? x.payment_link;
    return typeof u === "string" && u.trim().length > 0;
  });
  if (!row) return null;
  const u = row.url ?? row.paymentUrl ?? row.payment_link;
  const trimmed = String(u).trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:")
      return trimmed;
  } catch {
    return null;
  }
  return null;
}

function messageForStructuredCheckoutError(apiError) {
  if (!apiError || typeof apiError !== "object") {
    return t("checkout.unknown_error");
  }
  const reason = apiError.reason;
  const params =
    apiError.params && typeof apiError.params === "object"
      ? apiError.params
      : {};
  let core = null;
  if (typeof reason === "string" && reason) {
    if (te(reason)) {
      core = t(reason, params);
    } else {
      const tail = reason.startsWith("checkout.")
        ? reason.slice("checkout.".length)
        : reason;
      const nestedKey = `checkout.${tail}`;
      if (te(nestedKey)) {
        core = t(nestedKey, params);
      }
    }
  }
  if (!core) {
    const msg = apiError.message;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
    return t("checkout.unknown_error");
  }
  const title =
    params.title != null && String(params.title).trim() !== ""
      ? String(params.title).trim()
      : null;
  return title ? `${title}: ${core}` : core;
}

function messageForStructuredCheckoutErrorNotify(apiError) {
  const main = messageForStructuredCheckoutError(apiError);
  const params =
    apiError?.params && typeof apiError.params === "object"
      ? apiError.params
      : {};
  const parts = [main];
  if (params.remaining !== undefined && params.totalCapacity !== undefined) {
    parts.push(
      t("checkout.errors.capacityInfo", {
        remaining: params.remaining,
        total: params.totalCapacity,
      }),
    );
  }
  const checkType = apiError?.checkType ?? params.checkType;
  if (checkType === "availability") {
    parts.push(t("checkout.errors.unavailableHint"));
  }
  return parts.join("\n");
}

function messageForCheckoutApiError(errPayload) {
  if (!errPayload || typeof errPayload !== "object") {
    return t("checkout.unknown_error");
  }
  if (errPayload.success === false && errPayload.error) {
    return messageForStructuredCheckoutErrorNotify(errPayload.error);
  }
  const code = errPayload.code;
  if (typeof code === "string") {
    if (te(code)) return t(code);
    const tail = code.startsWith("checkout.")
      ? code.slice("checkout.".length)
      : code;
    const nestedKey = `checkout.${tail}`;
    if (te(nestedKey)) return t(nestedKey);
  }
  const msg = errPayload.message || errPayload.error;
  if (typeof msg === "string" && msg.trim()) return msg.trim();
  return t("checkout.unknown_error");
}

async function handleFinish() {
  if (!canGoNext.value || checkoutSubmitting.value) return;

  checkoutSubmitting.value = true;
  try {
    const payload = isGroupBookingActive.value
      ? buildGroupCheckoutPayload()
      : buildCheckoutPayload();

    const { data, error } = isGroupBookingActive.value
      ? await completeGroupCheckout(payload)
      : await completeCheckout(payload);

    if (error) {
      const body = error.data;
      const apiErr =
        body && typeof body === "object" && !Array.isArray(body) ? body : null;
      notifyError(messageForCheckoutApiError(apiErr || {}));
      return;
    }

    if (data?.success === false && data?.error) {
      notifyError(messageForStructuredCheckoutErrorNotify(data.error));
      return;
    }

    if (!data?.success) {
      notifyError(t("checkout.unknown_error"));
      return;
    }

    console.log("Checkout successful", JSON.stringify(data, null, 2));

    const bookings = Array.isArray(data?.data?.groupBooking?.bookings)
      ? data.data.groupBooking.bookings
      : [];
    const booking = data?.data?.booking || bookings[0] || null;
    const payment = data?.data?.payment || null;
    const bookingIds =
      data?.data?.groupBooking?.bookingIds ||
      (booking ? [booking.id] : []) ||
      [];

    if (!booking) {
      notifyError(t("checkout.unknown_error"));
      return;
    }

    const goPayment =
      booking?.isCommitted === true &&
      payment &&
      typeof payment === "object" &&
      isExternalPaymentLinkProvider(payment.provider);

    const paymentUrl = goPayment ? firstPaymentContinueUrl(payment) : null;

    if (paymentUrl && typeof window !== "undefined") {
      sessionStorage.removeItem(checkoutStateStorageKey.value);
      window.location.href = paymentUrl;
      return;
    }

    if (typeof window !== "undefined") {
      sessionStorage.removeItem(checkoutStateStorageKey.value);
    }

    const statusQuery = {
      tenantId: String(tenantID ?? ""),
      bookableId: String(bookableID ?? ""),
      bookingId: bookingIds,
    };
    if (booking?.isCommitted === false) {
      statusQuery.pending = "1";
    }
    await router.push({ path: "/checkout/status", query: statusQuery });
  } catch (e) {
    console.error(e);
    notifyError(t("checkout.unknown_error"));
  } finally {
    checkoutSubmitting.value = false;
  }
}

function onReviewBack() {
  currentStep.value = Math.max(MIN_STEP, steps.value.length - 1);
}

function stepNumberByKey(key) {
  const idx = steps.value.findIndex((step) => step.key === key);
  return idx === -1 ? null : idx + 1;
}

function onReviewEdit(section) {
  if (section === "period") {
    currentStep.value =
      stepNumberByKey("period") ??
      stepNumberByKey("objects") ??
      stepNumberByKey("data") ??
      MIN_STEP;
  } else if (section === "data") {
    currentStep.value = stepNumberByKey("data") ?? MIN_STEP;
  } else if (section === "payment") {
    currentStep.value = stepNumberByKey("payment") ?? MIN_STEP;
  }
}
</script>

<template>
  <div class="bg-neutral-50 dark:bg-gray-950 w-full min-h-screen">
    <!-- Loading / Empty State -->
    <div
      v-if="isLoading || isResolvingPermissionGuard"
      class="flex items-center justify-center min-h-screen"
    >
      <div class="text-center">
        <UIcon
          size="48"
          name="i-lucide-loader-2"
          class="text-gray-400 mb-4 animate-spin"
        />
        <p class="text-gray-500">{{ $t("common.loading") }}</p>
      </div>
    </div>

    <!-- No Bookable -->
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

    <!-- Permissions -->
    <div
      v-else-if="showPermissionGuard"
      class="flex items-center justify-center min-h-screen p-6"
    >
      <div class="w-full max-w-2xl">
        <UCard class="rounded-2xl border border-red-200 dark:border-red-800">
          <div class="flex flex-col gap-5">
            <div class="flex items-start gap-3">
              <UIcon
                size="24"
                name="i-lucide-shield-alert"
                class="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
              />
              <div>
                <p class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ permissionGuardTitle }}
                </p>
                <p
                  v-if="leadBookable?.title"
                  class="text-sm text-gray-500 dark:text-gray-400 mt-1"
                >
                  {{ leadBookable.title }}
                </p>
              </div>
            </div>

            <p class="text-sm text-red-700 dark:text-red-300">
              {{ permissionGuardMessage }}
            </p>

            <p class="text-sm text-gray-600 dark:text-gray-300">
              {{ permissionGuardDescription }}
            </p>

            <div class="flex flex-col sm:flex-row gap-3">
              <UButton
                v-if="isLoggedIn"
                color="primary"
                icon="i-lucide-user-round-cog"
                :loading="isLoggingOut"
                @click="signOutAndLogin"
              >
                {{ $t("checkout.permissionGuard.switchAccountAction") }}
              </UButton>
              <UButton
                v-else
                color="primary"
                icon="i-lucide-log-in"
                :to="loginUrl"
              >
                {{ $t("checkout.permissionGuard.loginAction") }}
              </UButton>
            </div>
          </div>
        </UCard>
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
          <PriceSummaryBar
            v-if="currentStepKey !== 'confirm'"
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
        <CheckoutBookingNotes
          :bookables="bookablesInCheckout"
          class="mb-6"
        />

        <UAlert
          v-if="requiresManualApproval"
          class="mb-6"
          icon="i-lucide-clock"
          color="info"
          variant="soft"
          :title="$t('checkout.manualApproval.bannerTitle')"
          :description="$t('checkout.manualApproval.bannerDescription')"
        />

        <AppStepper
          v-model="currentStep"
          :steps="steps"
          :can-go-next="canGoNext"
          :hide-footer="currentStepKey === 'confirm'"
          @finish="handleFinish"
        >
          <template #step-objects>
            <div class="max-w-3xl">
              <AdditionalBookablesSelector
                v-model="selectedAdditionalBookables"
                :items="additionalBookables"
                :validation-errors="validationErrors"
              />
            </div>
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

              <div
                v-if="groupBookingEnabled && isScheduleRelated"
                class="flex flex-col gap-3 p-4 rounded-xl border sm:flex-row sm:items-center sm:justify-between"
                :class="
                  canCreateGroupBooking
                    ? 'border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/30'
                    : 'border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30'
                "
              >
                <div class="flex items-start gap-3">
                  <UIcon
                    :name="
                      canCreateGroupBooking
                        ? 'i-lucide-repeat'
                        : 'i-lucide-lock'
                    "
                    class="mt-0.5"
                    :class="
                      canCreateGroupBooking
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-amber-600 dark:text-amber-400'
                    "
                    size="20"
                  />
                  <div>
                    <p class="font-semibold text-gray-900 dark:text-white">
                      {{ $t("groupBooking.toggleTitle") }}
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-300">
                      {{ $t("groupBooking.toggleDescription") }}
                    </p>
                    <p
                      v-if="groupBookingPermissionReason === 'loginRequired'"
                      class="text-xs mt-1.5 text-amber-700 dark:text-amber-300"
                    >
                      {{ $t("groupBooking.permission.loginRequired") }}
                      <NuxtLink
                        :to="loginUrl"
                        class="underline font-medium hover:no-underline"
                      >
                        {{ $t("groupBooking.permission.loginCta") }}
                      </NuxtLink>
                    </p>
                    <p
                      v-else-if="groupBookingPermissionReason === 'missingRole'"
                      class="text-xs mt-1.5 text-amber-700 dark:text-amber-300"
                    >
                      {{ $t("groupBooking.permission.missingRole") }}
                    </p>
                    <p
                      v-else-if="groupBookingPermissionReason === 'loading'"
                      class="text-xs mt-1.5 text-gray-500 dark:text-gray-400 inline-flex items-center gap-1.5"
                    >
                      <UIcon
                        name="i-lucide-loader-2"
                        class="animate-spin"
                        size="14"
                      />
                      {{ $t("groupBooking.permission.checking") }}
                    </p>
                  </div>
                </div>
                <USwitch
                  v-model="useGroupBooking"
                  :label="$t('groupBooking.toggleLabel')"
                  :disabled="
                    !canCreateGroupBooking || isCheckingGroupBookingPermission
                  "
                />
              </div>

              <Splitpanes class="checkout-splitpanes">
                <Pane :size="65" :min-size="35">
                  <div class="pr-0 lg:pr-4">
                    <InputRecurringTimeSelection
                      v-if="isGroupBookingActive"
                      v-model="groupBookingRule"
                      :tenant-id="tenantID"
                      :bookable-id="bookableID"
                      :attempt-statuses="groupBookingAttemptStatuses"
                      :is-validating="isValidating"
                      @update:attempts="groupBookingAttempts = $event"
                    />

                    <InputFreeTimeSelection
                      v-else-if="isScheduleRelated"
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

                    <InputBlockPeriodSelection
                      v-else-if="isBlockPeriodRelated"
                      v-model="selectedTimePeriod"
                      :tenant-id="tenantID"
                      :bookable-id="bookableID"
                      :amount="amounts[bookableID] || 1"
                    />

                    <p v-else class="text-gray-500 dark:text-gray-400">
                      Hier kommen Datum, Uhrzeit &amp; Zusatzobjekte rein.
                    </p>
                  </div>
                </Pane>

                <Pane
                  v-if="showAdditionalBookablesInPeriodStep"
                  :size="35"
                  :min-size="20"
                  class="overflow-hidden mt-5 sm:mt-0"
                >
                  <div class="pl-0 lg:pl-4">
                    <AdditionalBookablesSelector
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
              class="rounded-xl mb-6 border"
              :class="
                requiresLoginForCheckout && !isLoggedIn
                  ? 'border-amber-300 dark:border-amber-700'
                  : 'border-primary-200 dark:border-primary-800'
              "
            >
              <div
                class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{
                      requiresLoginForCheckout
                        ? isLoggedIn
                          ? $t("checkout.data.loggedInTitle")
                          : $t("checkout.data.loginRequiredTitle")
                        : isLoggedIn
                          ? $t("checkout.data.loggedInTitle")
                          : $t("checkout.data.guestTitle")
                    }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-300">
                    {{
                      requiresLoginForCheckout
                        ? isLoggedIn
                          ? $t("checkout.data.loggedInDescription")
                          : $t("checkout.data.loginRequiredDescription")
                        : isLoggedIn
                          ? $t("checkout.data.loggedInDescription")
                          : $t("checkout.data.guestDescription")
                    }}
                  </p>
                </div>
                <UButton
                  v-if="!isLoggedIn"
                  color="primary"
                  :variant="requiresLoginForCheckout ? 'solid' : 'soft'"
                  icon="i-lucide-log-in"
                  :to="loginUrl"
                >
                  {{ $t("checkout.data.loginAction") }}
                </UButton>
                <UButton
                  v-else-if="!requiresLoginForCheckout"
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
              v-model:book-with-price="selectedBookWithPrice"
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
              :has-free-booking-option="hasFreeBookingOption"
              :tenant-id="tenantID"
              :custom-field-rows="reviewCustomFieldRows"
              :is-validating="isValidating"
              :show-period-summary="requiresTimeSelection"
              :selection-section-title="
                requiresTimeSelection
                  ? $t('checkout.review.sectionPeriod')
                  : $t('checkout.review.bookingLabel')
              "
              :show-selection-edit="
                steps.some(
                  (step) => step.key === 'period' || step.key === 'objects',
                )
              "
              :step-current="currentStep"
              :step-total="steps.length"
              :can-submit="canGoNext && !checkoutSubmitting"
              :is-submitting="checkoutSubmitting"
              :has-payment-step="needsPaymentSelectionStep"
              :requires-manual-approval="requiresManualApproval"
              :group-booking-attempts="
                isGroupBookingActive ? groupBookingAttempts : []
              "
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
  content: "";
  position: absolute;
  top: 0%;
  bottom: 0%;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background-color: #d1d5db;
  border-radius: 9999px;
  transition:
    background-color 0.2s ease,
    width 0.2s ease;
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
