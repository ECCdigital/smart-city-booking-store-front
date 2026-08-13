// PROTOTYP — Ticket 05 „Scanner-Oberfläche im Panel und ihre Rückfallwege".
// Wegwerfcode. Wird nicht die Umsetzung. Keine Tests, keine Fehlerbehandlung.
//
// Hier steht alles, was im echten Ablauf vom Server käme: der Access Point, den
// das Panel gerade offen hat, die Tür hinter einem fremden Aufkleber, und ein
// Ersatz für `resolveScan()`.

export const CURRENT_ACCESS_POINT = {
  id: "ap-haupteingang",
  label: "Haupteingang",
  type: "door",
  mode: "remote",
  capabilities: ["open", "close", "getStatus"],
  validationRuleTypes: ["qrScan"],
};

export const OTHER_ACCESS_POINT = {
  id: "ap-nebeneingang-ost",
  label: "Nebeneingang Ost",
  type: "door",
  mode: "remote",
  capabilities: ["open", "close", "getStatus"],
  validationRuleTypes: ["qrScan"],
};

export const TENANT_ID = "orka";

// Was auf den Aufklebern steht (Entscheidung #5).
export const STICKERS = {
  match: `https://buchen.orka-mv.de/mobile-key/${TENANT_ID}/SC-7F3K9Q`,
  wrongDoor: `https://buchen.orka-mv.de/mobile-key/${TENANT_ID}/SC-2M8XPT`,
  wrongTenant: "https://buchen.orka-mv.de/mobile-key/stadtwerke/SC-4B1LZR",
  garbage: "https://example.com/kein-aufkleber",
};

// Ersatz für `resolveScan()` + `decideScanMatch()` aus der reinen Schicht.
// Der Prototyp entscheidet nur, WIE das Ergebnis aussieht, nicht wie es zustande kommt.
export function resolveStickerStub(rawValue) {
  const match = /\/mobile-key\/([^/]+)\/([^/?#]+)/.exec(rawValue || "");

  if (!match) {
    return { kind: "unknown_code" };
  }

  const [, tenant, scanCode] = match;

  if (tenant !== TENANT_ID) {
    return { kind: "wrong_tenant", tenant };
  }

  if (scanCode === "SC-7F3K9Q") {
    return { kind: "match", accessPoint: CURRENT_ACCESS_POINT, scanCode };
  }

  if (scanCode === "SC-2M8XPT") {
    return { kind: "wrong_door", accessPoint: OTHER_ACCESS_POINT, scanCode };
  }

  return { kind: "unknown_code" };
}

// Die drei zur Laufzeit unterscheidbaren Kamera-Ausfälle aus Recherche 01, Abschnitt E.
export const CAMERA_FAILURES = {
  StreamApiNotSupportedError: {
    icon: "i-lucide-monitor-x",
    title: "Kamera hier nicht verfügbar",
    hint: "Kein Kamerazugriff in diesem Browser (kein sicherer Kontext oder In-App-Browser).",
  },
  NotAllowedError: {
    icon: "i-lucide-camera-off",
    title: "Kamerazugriff verweigert",
    hint: "Sie haben den Zugriff abgelehnt oder die App erlaubt ihn nicht.",
  },
  NotFoundError: {
    icon: "i-lucide-camera-off",
    title: "Keine Kamera gefunden",
    hint: "Dieses Gerät meldet keine nutzbare Kamera.",
  },
  NotReadableError: {
    icon: "i-lucide-camera-off",
    title: "Kamera belegt",
    hint: "Eine andere App benutzt die Kamera gerade.",
  },
};

// Entscheidung #22 — auf allen drei Varianten derselbe Wortlaut, nur unterschiedlich prominent.
export const FALLBACK_TITLE = "Mit der Kamera-App scannen";
export const FALLBACK_TEXT =
  "Öffnen Sie den QR-Code neben der Tür mit der Kamera-App Ihres Telefons. Der Aufkleber führt Sie direkt hierher zurück.";
