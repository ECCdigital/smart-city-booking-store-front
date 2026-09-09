<script setup>
import {
  HERO_PREVIEW_PROTOCOL_VERSION,
  HERO_PREVIEW_READY,
  HERO_PREVIEW_REPORT,
} from "~~/shared/types/hero";
import { HERO_RICHTEXT_ALLOWLIST } from "~~/shared/utils/heroRichtextAllowlist";
import { adminOrigin } from "~~/shared/utils/adminOrigin";
import {
  useHeroPreviewOverride,
  useThemeBundle,
} from "~/composables/useThemeBundle";
import {
  buildHeroPreviewSnapshot,
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
 * Messages are accepted from the configured admin origin and from nowhere
 * else. The component is client-only: there is no listener to own on the
 * server, and no parent to announce to.
 */
const config = useRuntimeConfig();
const origin = adminOrigin(config.public.adminBaseUrl);

const override = useHeroPreviewOverride();
// The stored Theme View, for the one field a Draft does not carry: the logo.
// Once a Draft is showing, `theme` is that Draft — which carried the logo on.
const { data: theme } = useThemeBundle();
const colorMode = useColorMode();

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
    post({
      type: HERO_PREVIEW_REPORT,
      draftId: draft.draftId,
      viewport: viewport(),
      warnings: [],
      error: "invalid-draft",
    });
    return;
  }

  override.value = snapshot.view;
  // Sets the `html` class through the colour-mode module without touching
  // the visitor's stored preference: the frame shows what the editor chose.
  // `forced` is the module's own "this page decides" flag; without it the
  // frame, which has no preference cookie, would follow the next change of
  // the OS colour scheme instead.
  colorMode.forced = true;
  colorMode.value = snapshot.colorMode;
}

onMounted(() => {
  window.addEventListener("message", onMessage);
  loadSanitizer();
  post({ type: HERO_PREVIEW_READY });
});

onBeforeUnmount(() => {
  window.removeEventListener("message", onMessage);
});
</script>

<template>
  <!--
    Nothing to paint yet: the Zone overlay and the Block highlight for the
    Draft's selected Block follow in the next ticket.
  -->
  <div hidden />
</template>
