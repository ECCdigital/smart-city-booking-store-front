<template>
  <div class="w-full" style="max-width: 800px">
    <div class="mt-5 md:mt-0">
      <UButton
        variant="link"
        color="neutral"
        icon="i-lucide-arrow-left"
        :label="$t('meta.pages.accountBookings')"
        to="/account/bookings"
        class="px-0"
      />
    </div>
    <PageHeader :title="$t('meta.pages.accountProofs')" class="mt-2 mb-1" />
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
      {{ $t("customerUploads.pageIntro") }}
    </p>

    <!-- count, search and filter as on the other account pages -->
    <div
      v-if="groups.length"
      class="md:flex justify-between items-center w-full mb-5 gap-4"
    >
      <p class="text-gray-600 dark:text-gray-300 whitespace-nowrap">
        {{ $t("customerUploads.count", shownCount, { count: shownCount }) }}
      </p>
      <div class="w-full md:w-[60%] flex mt-2 md:mt-0">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          size="md"
          variant="outline"
          :placeholder="$t('customerUploads.searchPlaceholder')"
          :aria-label="$t('customerUploads.searchPlaceholder')"
          class="w-full"
          :ui="{ trailing: 'pe-0' }"
        >
          <template #trailing>
            <ClearButton
              :show-clear-button="!!searchQuery"
              @clear="searchQuery = ''"
            />
          </template>
        </UInput>
        <ListFilter
          :tenants="tenants"
          :groups="filterGroups"
          class="ml-1"
          @set-filter="setFilter"
        />
      </div>
    </div>

    <BookingsSkeleton
      v-if="pending && groups.length === 0"
      :skeleton-count="2"
    />
    <p v-else-if="groups.length === 0" class="text-gray-600 dark:text-gray-400">
      {{ $t("customerUploads.nothingMissing") }}
    </p>
    <div
      v-else-if="shownGroups.length === 0"
      class="flex flex-col items-center justify-center py-16 text-center"
    >
      <UIcon name="i-lucide-filter-x" class="text-6xl text-gray-400 mb-4" />
      <p class="text-gray-500">{{ $t("customerUploads.noMatches") }}</p>
    </div>

    <!-- A booking whose last proof is handed in collapses and slides to
         its new place; so does a provider. -->
    <TransitionGroup name="proof-move" tag="div" class="relative">
      <div v-for="group in orderedGroups" :key="group.tenant.id" class="mb-6">
        <div class="flex flex-wrap items-baseline gap-2 mb-2">
          <span class="text-xs text-gray-500">
            {{ $t("customerUploads.provider") }}
          </span>
          <span class="font-semibold">{{ group.tenant.name }}</span>
          <span class="text-xs text-gray-500">
            · {{ $t("customerUploads.providerReviews") }}
          </span>
        </div>

        <TransitionGroup name="proof-move" tag="div" class="relative">
          <section
            v-for="entry in group.bookings"
            :id="proofAnchorId(entry.booking.id)"
            :key="entry.booking.id"
            class="border-2 rounded-xl mb-5 overflow-hidden scroll-mt-24 transition-colors duration-700"
            :class="
              isBookingTarget(entry.booking.id)
                ? 'border-primary'
                : justCompleted.has(entry.booking.id)
                  ? 'border-info'
                  : 'border-gray-200 dark:border-gray-700'
            "
          >
            <div
              class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-wrap justify-between gap-2 items-start"
            >
              <div>
                <UBadge
                  color="neutral"
                  variant="subtle"
                  class="mb-1"
                  :label="
                    $t('customerUploads.bookingNumber', {
                      id: entry.booking.id,
                    })
                  "
                />
                <h2 class="font-bold text-lg leading-tight">
                  {{ titleOf(entry.booking) }}
                </h2>
                <p
                  v-if="entry.booking.timeBegin"
                  class="text-sm text-primary font-semibold"
                >
                  {{
                    formatDateRange(
                      entry.booking.timeBegin,
                      entry.booking.timeEnd,
                    )
                  }}
                </p>
              </div>
              <UButton
                variant="outline"
                color="neutral"
                size="sm"
                :label="$t('customerUploads.toBooking')"
                :to="`/account/bookings/${entry.booking.id}`"
              />
            </div>
            <!-- Every proof handed in: collapsed to one line until opened to
             see, replace or delete them. -->
            <button
              v-if="entry.complete"
              type="button"
              class="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60"
              :class="{
                'border-b border-gray-200 dark:border-gray-700': isOpen(entry),
              }"
              :aria-expanded="isOpen(entry)"
              :aria-controls="`${proofAnchorId(entry.booking.id)}-fields`"
              @click="toggle(entry.booking.id)"
            >
              <span
                class="flex items-center gap-2 text-sm text-info font-medium"
              >
                <UIcon name="i-lucide-file-check" class="w-4 h-4 shrink-0" />
                {{
                  $t("customerUploads.allSubmitted", entry.fields.length, {
                    count: entry.fields.length,
                  })
                }}
              </span>
              <span
                class="flex items-center gap-1 text-sm text-gray-500 shrink-0"
              >
                <span class="hidden sm:inline">
                  {{
                    isOpen(entry)
                      ? $t("customerUploads.hideProofs")
                      : $t("customerUploads.showProofs")
                  }}
                </span>
                <UIcon
                  name="i-lucide-chevron-down"
                  class="w-4 h-4 transition-transform"
                  :class="{ 'rotate-180': isOpen(entry) }"
                />
              </span>
            </button>
            <!-- Collapses by its height: the rows of a grid go from 1fr to
             0fr; `inert` keeps a collapsed field out of the tab order. -->
            <div
              :id="`${proofAnchorId(entry.booking.id)}-fields`"
              class="grid transition-[grid-template-rows] duration-500 ease-in-out motion-reduce:transition-none"
              :class="isOpen(entry) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
              :inert="!isOpen(entry)"
            >
              <div class="min-h-0 overflow-hidden">
                <div class="p-4 space-y-3">
                  <CustomerUploadFieldCard
                    v-for="field in entry.fields"
                    :id="proofAnchorId(entry.booking.id, field.fieldId)"
                    :key="field.fieldId"
                    class="scroll-mt-24"
                    :class="{
                      'ring-2 ring-primary': isTarget(
                        entry.booking.id,
                        field.fieldId,
                      ),
                    }"
                    :booking="entry.booking"
                    :field="field"
                    :tenant-name="group.tenant.name"
                  />
                </div>
                <ProofSubmitBar
                  :booking="entry.booking"
                  :tenant-name="group.tenant.name"
                />
              </div>
            </div>
          </section>
        </TransitionGroup>
      </div>
    </TransitionGroup>
  </div>
</template>
<script setup>
import { useBookingStore } from "~~/stores/bookings.js";
import BookingsSkeleton from "~/components/user/bookings/BookingsSkeleton.vue";
import CustomerUploadFieldCard from "~/components/user/proofs/CustomerUploadFieldCard.vue";
import ProofSubmitBar from "~/components/user/proofs/ProofSubmitBar.vue";
import {
  PROOF_DRAFTS_KEY,
  createProofDrafts,
  useUnsavedProofsGuard,
} from "~/composables/useProofDrafts.js";
import ClearButton from "~/components/inputs/ClearButton.vue";
import ListFilter from "~/components/user/ListFilter.vue";
import {
  PROOF_STATUS_FILTER,
  filterProofGroups,
  pendingProofGroups,
  proofAnchorId,
  proofTargetOf,
} from "~/utils/customerUploads.js";
import { useFormatting } from "~/composables/utils/useFormatting.js";

/**
 * The page „Nachweise einreichen“: under the account, no menu entry, reached from the booking
 * details. The upload fields that are not checked yet, by booking in the
 * order of their urgency, grouped by tenant; a booking whose proofs are all
 * handed in shows collapsed until it is opened. Opened from the mail on a
 * rejection or „Erneut anfordern“, it scrolls to the field the mail names
 * and marks it. Chosen files wait per booking
 * for its button „Nachweise einreichen“; leaving the page with some asks
 * first.
 */
definePageMeta({
  layout: "panel",
  navigation: "user",
  requiresAuth: true,
});

const { t } = useI18n();
usePageTitle(() => t("meta.pages.accountProofs"));

const bookingStore = useBookingStore();
const { formatDateRange } = useFormatting();

const drafts = createProofDrafts();
provide(PROOF_DRAFTS_KEY, drafts);
useUnsavedProofsGuard(drafts);

// Afresh: the state of the uploads may have moved since the list was loaded.
const { pending } = useAsyncData(
  "proofs-bookings",
  async () => (await bookingStore.fetchBookings({ force: true })) ?? [],
);

const groups = computed(() => pendingProofGroups(bookingStore.getBookings));

// Search and filter, as on the other account pages: providers, the status
// of a field and „besonders schutzwürdig“.
const searchQuery = ref("");
const filter = ref({ tenantIds: [], statuses: [], category: [] });

function setFilter(newFilter) {
  filter.value = newFilter;
}

const tenants = computed(() => groups.value.map((group) => group.tenant));

const filterGroups = computed(() => [
  {
    key: "statuses",
    label: t("customerUploads.filter.status"),
    options: [
      [PROOF_STATUS_FILTER.OUTSTANDING, "i-lucide-hourglass"],
      [PROOF_STATUS_FILTER.OVERDUE, "i-lucide-calendar-x"],
      [PROOF_STATUS_FILTER.SUBMITTED, "i-lucide-file-check"],
      [PROOF_STATUS_FILTER.REJECTED, "i-lucide-file-x"],
    ].map(([value, icon]) => ({
      value,
      icon,
      label: t(`customerUploads.filter.statuses.${value}`),
    })),
  },
  {
    key: "category",
    label: t("customerUploads.filter.category"),
    options: [
      {
        value: "sensitive",
        icon: "i-lucide-shield-alert",
        label: t("customerUploads.sensitive"),
      },
    ],
  },
]);

/** The proofs shown, the number before the search. */
const shownCount = computed(() =>
  shownGroups.value.reduce(
    (sum, group) =>
      sum + group.bookings.reduce((n, entry) => n + entry.fields.length, 0),
    0,
  ),
);

const shownGroups = computed(() =>
  filterProofGroups(groups.value, {
    query: searchQuery.value,
    tenantIds: filter.value.tenantIds ?? [],
    statuses: filter.value.statuses ?? [],
    sensitiveOnly: (filter.value.category ?? []).includes("sensitive"),
  }),
);

// The bookings whose proofs are all handed in that the customer opened.
// One with something still to hand in is always open.
const expanded = ref(new Set());

function isOpen(entry) {
  return !entry.complete || expanded.value.has(entry.booking.id);
}

function toggle(bookingId) {
  const next = new Set(expanded.value);
  if (next.has(bookingId)) next.delete(bookingId);
  else next.add(bookingId);
  expanded.value = next;
}

// A booking whose last proof was just handed in: its frame lights up, it
// collapses where it stands, and only then slides to its new place - moving
// it in the DOM would cut its collapse short. So the order shown is held
// for the length of the collapse.
const COLLAPSE_MS = 500;
const HIGHLIGHT_MS = 2500;

const justCompleted = ref(new Set());
const heldOrder = ref(null);
let completeBefore = null;
let releaseOrder = null;

/** The positions of the providers and bookings as they stand. */
function orderOf(list) {
  return new Map(
    list.flatMap((group, groupIndex) => [
      [`tenant:${group.tenant.id}`, groupIndex],
      ...group.bookings.map((entry, index) => [entry.booking.id, index]),
    ]),
  );
}

function highlight(id) {
  justCompleted.value = new Set(justCompleted.value).add(id);
  setTimeout(() => {
    const next = new Set(justCompleted.value);
    next.delete(id);
    justCompleted.value = next;
  }, HIGHLIGHT_MS);
}

watch(
  groups,
  (current, previous) => {
    const now = new Map(
      current.flatMap((group) =>
        group.bookings.map((entry) => [entry.booking.id, entry.complete]),
      ),
    );
    const completed = completeBefore
      ? [...now].filter(
          ([id, complete]) => complete && completeBefore.get(id) === false,
        )
      : [];
    completeBefore = now;
    if (!import.meta.client || completed.length === 0) return;

    completed.forEach(([id]) => highlight(id));
    if (!heldOrder.value && previous) heldOrder.value = orderOf(previous);
    clearTimeout(releaseOrder);
    releaseOrder = setTimeout(() => {
      heldOrder.value = null;
    }, COLLAPSE_MS);
  },
  { immediate: true },
);

/** {@link shownGroups} in the order held while a booking collapses. */
const orderedGroups = computed(() => {
  const held = heldOrder.value;
  if (!held) return shownGroups.value;
  const at = (key) => held.get(key) ?? Infinity;
  return [...shownGroups.value]
    .sort((a, b) => at(`tenant:${a.tenant.id}`) - at(`tenant:${b.tenant.id}`))
    .map((group) => ({
      ...group,
      bookings: [...group.bookings].sort(
        (a, b) => at(a.booking.id) - at(b.booking.id),
      ),
    }));
});

// The proof the mail's button names (`?booking=…&field=…`): scrolled into view once the list is there, and
// marked.
const route = useRoute();
const target = computed(() => proofTargetOf(route.query));

function isTarget(bookingId, fieldId) {
  return (
    target.value?.bookingId === bookingId && target.value?.fieldId === fieldId
  );
}

const scrolledToTarget = ref(false);

/** The booking itself is the target: no field named, as from the card. */
function isBookingTarget(bookingId) {
  return target.value?.bookingId === bookingId && !target.value.fieldId;
}

function scrollToTarget() {
  if (!import.meta.client || scrolledToTarget.value || !target.value) return;
  const { bookingId, fieldId } = target.value;
  // A collapsed booking named, or one of its fields: open it first.
  if (!expanded.value.has(bookingId)) {
    toggle(bookingId);
    nextTick(scrollToTarget);
    return;
  }
  const element =
    (fieldId && document.getElementById(proofAnchorId(bookingId, fieldId))) ||
    document.getElementById(proofAnchorId(bookingId));
  if (element) {
    scrolledToTarget.value = true;
    // A field into the middle, a whole booking from its top.
    element.scrollIntoView({
      behavior: "smooth",
      block: fieldId ? "center" : "start",
    });
  }
}

// Once the list is there; then once more after the page change, since the
// router scrolls a new page to the top after it has rendered.
watch(
  [shownGroups, target],
  async () => {
    await nextTick();
    scrollToTarget();
  },
  { immediate: true },
);
if (import.meta.client) {
  useNuxtApp().hooks.hookOnce("page:finish", () => {
    setTimeout(() => {
      scrolledToTarget.value = false;
      scrollToTarget();
    }, 0);
  });
}

function titleOf(booking) {
  return (
    booking.bookableItems?.[0]?._bookableUsed?.title ??
    t("booking.unknownBookable")
  );
}
</script>

<style scoped>
/* A booking or provider moving to its new place (`TransitionGroup`). */
.proof-move-move {
  transition: transform 600ms ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  .proof-move-move {
    transition: none;
  }
}
</style>
