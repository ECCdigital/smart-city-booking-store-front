/**
 * Same-origin session sync with Admin UI.
 * Channel / storage keys must match Admin `src/services/auth/sessionSync.js`.
 *
 * Uses BroadcastChannel + localStorage `storage` events (other tabs only).
 * localStorage is the reliable fallback when BroadcastChannel is flaky.
 */

export const SHARED_AUTH_CHANNEL = "scb-shared-auth";
export const MSG_SESSION_ENDED = "session-ended";
export const STORAGE_SESSION_ENDED_KEY = "scb-shared-auth-ended";

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (import.meta.server || typeof BroadcastChannel === "undefined") {
    return null;
  }
  if (!channel) {
    channel = new BroadcastChannel(SHARED_AUTH_CHANNEL);
  }
  return channel;
}

export function broadcastSessionEnded() {
  try {
    getChannel()?.postMessage({ type: MSG_SESSION_ENDED });
  } catch {
    // ignore
  }
  try {
    // Triggers `storage` in other same-origin tabs (Admin / other Storefront tabs)
    localStorage.setItem(STORAGE_SESSION_ENDED_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function subscribeSessionEnded(onEnded: () => void): () => void {
  const cleanups: Array<() => void> = [];

  const ch = getChannel();
  if (ch) {
    const onMessage = (event: MessageEvent) => {
      if (event?.data?.type === MSG_SESSION_ENDED) {
        onEnded();
      }
    };
    ch.addEventListener("message", onMessage);
    cleanups.push(() => ch.removeEventListener("message", onMessage));
  }

  if (import.meta.client) {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_SESSION_ENDED_KEY && event.newValue) {
        onEnded();
      }
    };
    window.addEventListener("storage", onStorage);
    cleanups.push(() => window.removeEventListener("storage", onStorage));
  }

  return () => cleanups.forEach((fn) => fn());
}

export function isAccountPath(path: string): boolean {
  return path === "/account" || path.startsWith("/account/");
}
