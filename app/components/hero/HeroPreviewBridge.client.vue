<script setup>
import {
  HERO_PREVIEW_BLOCK_CLICK,
  HERO_PREVIEW_PROTOCOL_VERSION,
  HERO_PREVIEW_READY,
  HERO_PREVIEW_REPORT,
  HERO_PREVIEW_ZONE_CLICK,
  HERO_ZONES,
} from "~~/shared/types/hero";
import { HERO_RICHTEXT_ALLOWLIST } from "~~/shared/utils/heroRichtextAllowlist";
import { adminOrigin } from "~~/shared/utils/adminOrigin";
import {
  useHeroPreviewOverride,
  useThemeBundle,
} from "~/composables/useThemeBundle";
import {
  buildHeroPreviewSnapshot,
  measureHeroPreview,
  parseHeroPreviewMessage,
} from "~/utils/heroPreview";

/**
 * The Live Preview's half of the conversation with the admin's Hero Editor.
 *
 * The frame announces itself once it has mounted; the admin answers with a
 * complete snapshot of the Draft and sends a new one after every edit. Each
 * snapshot is validated with the same guards the BFF runs on a bundle and its
 * rich text sanitised with DOMPurify's browser build against the same frozen
 * allowlist — loaded lazily, so it is bundled for this page alone. A valid
 * Draft replaces the Theme View in shared state, which is all the Hero ever
 * sees of the preview; an invalid one leaves the last valid render in place
 * and is answered with `invalid-draft`. The colour mode the editor shows is
 * applied to the document root directly, not remembered anywhere.
 *
 * After every rendered Draft, and again on resize, the frame measures what
 * it drew — after the next animation frame, once fonts are ready and images
 * have decoded — and reports the Blocks that leave the content area and the
 * Blocks from different Zones that overlap, in its own pixels. A click on a
 * rendered Block reports the Block; with a Block selected, nine Zone boxes
 * lie beneath the Blocks and a click on one reports the Zone. The frame
 * never moves a Block itself.
 *
 * Messages are accepted from the configured admin origin and from nowhere
 * else. The component is client-only: there is no listener to own on the
 * server, and no parent to announce to.
 */
const config = useRuntimeConfig();
const origin = adminOrigin(config.public.adminBaseUrl);

const { t } = useI18n();
const override = useHeroPreviewOverride();
// The stored Theme View, for the one field a Draft does not carry: the logo.
// Once a Draft is showing, `theme` is that Draft — which carried the logo on.
const { data: theme } = useThemeBundle();
const colorMode = useColorMode();

/** Where the Hero's content box is: the Teleport target and the measured area. */
const HERO_CONTENT_SELECTOR = "[data-hero-content]";

/** What marks the selected Block; the stylesheet paints the outline. */
const SELECTED_ATTRIBUTE = "data-hero-selected";

/** How long a resize may go on before the frame measures again. */
const RESIZE_SETTLE_MS = 150;

/**
 * How long the report waits for images at most. A measured image reserves
 * its box before it arrives, so a stalled one costs the report nothing but
 * an unbounded wait would cost the editor the report.
 */
const IMAGE_DECODE_TIMEOUT_MS = 5000;

// One load per frame, started at mount so the first Draft does not wait for
// it. A dynamic import keeps DOMPurify out of every other page's bundle.
let sanitizerLoad;
function loadSanitizer() {
  sanitizerLoad ??= import("dompurify").then(
    ({ default: DOMPurify }) =>
      (html) =>
        DOMPurify.sanitize(html, HERO_RICHTEXT_ALLOWLIST),
  );
  return sanitizerLoad;
}

// The Draft most recently received, so one that was superseded while the
// sanitiser was still loading is never rendered over its successor.
let latestDraftId = null;
// The Draft the Hero is showing — what a report is about. A measurement
// still under way when a newer Draft renders is abandoned, not reported.
let renderedDraftId = null;

const selectedBlockId = ref(null);
/** The content area: the inner layer of the overlay, always present. */
const contentArea = useTemplateRef("contentArea");

let resizeTimer = null;

function post(message) {
  if (!origin || window.parent === window) return;
  window.parent.postMessage(
    { protocol: HERO_PREVIEW_PROTOCOL_VERSION, ...message },
    origin,
  );
}

// The same breakpoint the Hero switches its trees at.
function viewport() {
  return window.matchMedia("(min-width: 768px)").matches ? "desktop" : "mobile";
}

function reportIssue(issue) {
  console.warn(`[preview/hero] invalid Draft: ${issue.path} (${issue.code})`);
}

/** The Preview Report for one Draft, under the viewport it was measured in. */
function postReport(draftId, shownViewport, warnings, error) {
  post({
    type: HERO_PREVIEW_REPORT,
    draftId,
    viewport: shownViewport,
    warnings,
    ...(error && { error }),
  });
}

/** The Hero's content box — where the Blocks are and the overlay goes. */
function heroContent() {
  return document.querySelector(HERO_CONTENT_SELECTOR);
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** Resolves once every image in the Hero has decoded, failed, or run out of time. */
function imagesDecoded(root) {
  const decodes = Array.from(root.querySelectorAll("img"), (img) =>
    img.decode().catch(() => {}),
  );
  return Promise.race([
    Promise.all(decodes),
    new Promise((resolve) => setTimeout(resolve, IMAGE_DECODE_TIMEOUT_MS)),
  ]);
}

/**
 * Marks the selected Block in both trees and clears every other. Done after
 * every render rather than on selection alone, because a Draft may recreate
 * the element the mark was on.
 */
function highlight(blockId) {
  const root = heroContent();
  if (!root) return;
  for (const element of root.querySelectorAll("[data-block]")) {
    if (blockId && element.dataset.block === blockId) {
      element.setAttribute(SELECTED_ATTRIBUTE, "");
    } else {
      element.removeAttribute(SELECTED_ATTRIBUTE);
    }
  }
}

/**
 * The rendered Blocks in array order with their boxes. Both trees carry
 * every Block, but the one the breakpoint hides answers an all-zero box,
 * so a Block's box comes from whichever tree is showing — and a Block the
 * mode or the viewport leaves out has no box at all and is not measured.
 */
function measuredBlocks(root, layout) {
  const boxes = new Map();
  for (const element of root.querySelectorAll("[data-block]")) {
    const box = element.getBoundingClientRect();
    if (box.width > 0 && box.height > 0) boxes.set(element.dataset.block, box);
  }
  return layout.blocks.flatMap((block) => {
    const box = boxes.get(block.id);
    return box ? [{ id: block.id, zone: block.zone, box }] : [];
  });
}

/**
 * Measures the Draft the Hero is showing and reports it — once Vue has
 * patched the DOM, the next animation frame has come, fonts are ready and
 * images have decoded, so the numbers describe the layout the editor sees.
 * Boxes are the frame's own CSS pixels; the admin scaling the frame with
 * CSS does not reach them.
 */
async function report(draftId) {
  await nextTick();
  highlight(selectedBlockId.value);

  await nextFrame();
  await document.fonts?.ready;
  const root = heroContent();
  if (root) await imagesDecoded(root);
  if (draftId !== renderedDraftId) return;

  const area = contentArea.value?.getBoundingClientRect();
  const layout = override.value?.heroLayout;
  const shownViewport = viewport();
  const warnings =
    root && area && layout
      ? measureHeroPreview(area, measuredBlocks(root, layout), shownViewport)
      : [];

  postReport(draftId, shownViewport, warnings);
}

async function onMessage(event) {
  if (!origin || event.origin !== origin) return;

  const draft = parseHeroPreviewMessage(event.data);
  if (!draft) return;

  latestDraftId = draft.draftId;
  const sanitize = await loadSanitizer();
  if (draft.draftId !== latestDraftId) return;

  const snapshot = buildHeroPreviewSnapshot(draft, {
    sanitize,
    logo: theme.value?.logo ?? null,
    onIssue: reportIssue,
  });

  if (!snapshot) {
    postReport(draft.draftId, viewport(), [], "invalid-draft");
    return;
  }

  override.value = snapshot.view;
  selectedBlockId.value = snapshot.selectedBlockId;
  // Sets the `html` class through the colour-mode module without touching
  // the visitor's stored preference: the frame shows what the editor chose.
  // `forced` is the module's own "this page decides" flag; without it the
  // frame, which has no preference cookie, would follow the next change of
  // the OS colour scheme instead.
  colorMode.forced = true;
  colorMode.value = snapshot.colorMode;

  renderedDraftId = draft.draftId;
  report(draft.draftId);
}

function onResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (renderedDraftId !== null) report(renderedDraftId);
  }, RESIZE_SETTLE_MS);
}

/**
 * A click anywhere on a rendered Block selects it in the admin. The click
 * goes no further: a link in a rich-text Block would otherwise take the
 * frame — and the Draft with it — away from the preview.
 */
function onClick(event) {
  if (!(event.target instanceof Element)) return;
  const block = event.target.closest("[data-block]");
  if (!block) return;

  event.preventDefault();
  post({ type: HERO_PREVIEW_BLOCK_CLICK, blockId: block.dataset.block });
}

function onZoneClick(zone) {
  post({ type: HERO_PREVIEW_ZONE_CLICK, zone });
}

onMounted(() => {
  window.addEventListener("message", onMessage);
  window.addEventListener("resize", onResize);
  document.addEventListener("click", onClick);
  loadSanitizer();
  post({ type: HERO_PREVIEW_READY });
});

onBeforeUnmount(() => {
  window.removeEventListener("message", onMessage);
  window.removeEventListener("resize", onResize);
  document.removeEventListener("click", onClick);
  clearTimeout(resizeTimer);
  // A measurement still waiting for fonts or images must not report after
  // the preview is gone.
  renderedDraftId = null;
  highlight(null);
});
</script>

<template>
  <!--
    A layer in the Hero's content box, beneath the Blocks: negative z-index
    inside the box's own stacking context puts it above the Background and
    below both trees, whose roots let pointer events through. So a click on a
    Block is a Block click, and the Zone boxes take what the Blocks leave.
    The layer inherits the box's padding; its inner element is the content
    area — the height step minus the reserved inset — and is measured even
    while nothing is selected.
  -->
  <Teleport :to="HERO_CONTENT_SELECTOR">
    <div class="pointer-events-none absolute inset-0 -z-10 [padding:inherit]">
      <div ref="contentArea" class="relative h-full w-full">
        <div
          v-if="selectedBlockId"
          class="grid h-full w-full grid-cols-3 grid-rows-3"
        >
          <button
            v-for="zone in HERO_ZONES"
            :key="zone"
            type="button"
            class="pointer-events-auto rounded-lg border-2 border-dashed border-primary/40 transition-colors hover:border-primary hover:bg-primary/10 focus-visible:border-primary focus-visible:outline-none"
            :aria-label="
              t('hero.preview.moveToZone', {
                zone: t(`hero.preview.zones.${zone}`),
              })
            "
            :title="t(`hero.preview.zones.${zone}`)"
            @click="onZoneClick(zone)"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>
