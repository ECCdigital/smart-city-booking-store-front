export const ACCESS_BLOCKING_REASON_LABELS = Object.freeze({
  rejected: "Abgelehnt",
  not_committed: "Noch nicht bestätigt",
  payment_required: "Zahlung ausstehend",
  authorization_revoked: "Berechtigung widerrufen",
  outside_access_window: "Außerhalb des Zeitfensters",
  not_provisioned: "Noch nicht freigegeben",
  locker_not_ready: "Schließfach nicht bereit",
  no_remote_access: "Keine Fernsteuerung",
  evidence_missing: "Nachweis fehlt – bitte vor Ort den QR-Code scannen",
  evidence_invalid: "Nachweis ungültig – bitte den Aufkleber an der Tür prüfen",
  evidence_rule_unavailable:
    "Zugang zurzeit nicht prüfbar – bitte die Verwaltung kontaktieren",
});

export function formatBlockingReasonMessage(
  blockingReasons,
  fallbackMessage = "Die Tür konnte nicht geöffnet werden.",
) {
  const primary = Array.isArray(blockingReasons) ? blockingReasons[0] : null;
  if (!primary) {
    return fallbackMessage;
  }

  return ACCESS_BLOCKING_REASON_LABELS[primary] || fallbackMessage;
}
