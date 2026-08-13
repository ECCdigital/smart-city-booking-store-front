import { describe, expect, it } from "vitest";

import de from "~~/i18n/locales/de.json";
import {
  ACCESS_ERROR_SCREENS,
  BLOCKING_REASONS,
  buildErrorScreen,
  formatBlockingReasonMessage,
} from "~/utils/accessErrorScreens.js";
import { ACCESS_ERRORS } from "~/utils/accessOpenFlow.js";

/**
 * A stand-in for vue-i18n's `t` that reads the real `de.json`. The point of
 * these tests is that the three places - the ids, the table, the wording -
 * still line up, so the wording has to be the shipped one.
 */
const t = (key, params = {}) => {
  const value = key.split(".").reduce((node, part) => node?.[part], de);

  if (typeof value !== "string") {
    return key;
  }

  return value.replace(/\{(\w+)\}/g, (_, name) =>
    params[name] === undefined ? `{${name}}` : String(params[name]),
  );
};

const KINDS = Object.values(ACCESS_ERRORS);
const ROWS = Object.entries(ACCESS_ERROR_SCREENS);

const LABEL = "Haupteingang";

describe("die Tabelle deckt sich mit ACCESS_ERRORS", () => {
  it.each(KINDS)("hat für %s genau eine Zeile", (kind) => {
    expect(ACCESS_ERROR_SCREENS[kind]).toBeDefined();
  });

  it("kennt keine Zeile ohne Fall-Id", () => {
    expect(Object.keys(ACCESS_ERROR_SCREENS).sort()).toEqual([...KINDS].sort());
  });

  it.each(ROWS)("zeigt für %s ein Icon und einen Ton", (_kind, row) => {
    expect(row.icon).toMatch(/^i-lucide-/);
    expect(["success", "warning", "error", "neutral"]).toContain(row.color);
  });
});

describe("de.json trägt den Wortlaut jeder Zeile", () => {
  it.each(KINDS)("hat Titel und Beschreibung für %s", (kind) => {
    const wording = de.mobileKey.errors[kind];

    expect(wording?.title).toBeTruthy();
    expect(wording?.description).toBeTruthy();
  });

  it("kennt keinen Fehlertext ohne Zeile in der Tabelle", () => {
    expect(Object.keys(de.mobileKey.errors).sort()).toEqual([...KINDS].sort());
  });
});

describe("die Blockgründe stehen an beiden Orten", () => {
  it("kennt in JS genau die Gründe, für die de.json einen Satz hat", () => {
    expect([...BLOCKING_REASONS].sort()).toEqual(
      Object.keys(de.mobileKey.blocking_reasons).sort(),
    );
  });

  it.each(Object.keys(de.mobileKey.blocking_reasons))(
    "nennt %s, statt auf den Fallback zu fallen",
    (reason) => {
      expect(formatBlockingReasonMessage([reason], t, "Fallback")).toBe(
        de.mobileKey.blocking_reasons[reason],
      );
    },
  );
});

describe("der Ausweg eines Falls", () => {
  it.each(ROWS)("bleibt bei %s bei höchstens einem", (_kind, row) => {
    expect(Boolean(row.retry) && Boolean(row.to)).toBe(false);
  });

  it.each(ROWS)("ist bei %s über mobileKey.actions beschriftet", (_kind, row) => {
    if (!row.retry && !row.to) {
      expect(row.action).toBeUndefined();
      return;
    }

    expect(de.mobileKey.actions[row.action]).toBeTruthy();
  });

  it("prüft bei open_unconfirmed den Status, statt ein zweites Mal zu öffnen", () => {
    // Ein zweiter Öffnen-Befehl kann eine offene Tür wieder verriegeln.
    expect(ACCESS_ERROR_SCREENS[ACCESS_ERRORS.OPEN_UNCONFIRMED].retry).toBe(
      "status",
    );
  });
});

describe("buildErrorScreen", () => {
  it("nennt bei too_early das Datum, sobald die Buchung eines trägt", () => {
    const screen = buildErrorScreen(ACCESS_ERRORS.TOO_EARLY, {
      t,
      label: LABEL,
      date: "01.09.2026, 09:00",
    });

    expect(screen.description).toContain("01.09.2026, 09:00");
    expect(screen.description).toContain(LABEL);
  });

  it("weicht bei too_early ohne Datum auf den zweiten Schlüssel aus", () => {
    const screen = buildErrorScreen(ACCESS_ERRORS.TOO_EARLY, { t, label: LABEL });

    expect(screen.description).toBe(de.mobileKey.errors.too_early.description_undated);
  });

  it("lässt den Knopf weg, wenn dem Ausweg sein Ziel fehlt", () => {
    const unpaid = buildErrorScreen(ACCESS_ERRORS.PAYMENT_REQUIRED, {
      t,
      label: LABEL,
      tenantId: "rostock",
      booking: {},
    });
    const expired = buildErrorScreen(ACCESS_ERRORS.TOO_LATE, {
      t,
      label: LABEL,
      tenantId: "rostock",
      booking: { id: 42 },
    });

    expect(unpaid.exit).toBeNull();
    expect(expired.exit).toBeNull();
  });

  it("führt den Ausweg an sein Ziel, sobald es eines gibt", () => {
    const screen = buildErrorScreen(ACCESS_ERRORS.PAYMENT_REQUIRED, {
      t,
      label: LABEL,
      tenantId: "rostock",
      booking: { id: 42 },
    });

    expect(screen.exit).toEqual({
      label: de.mobileKey.actions.pay_now,
      to: "/account/bookings/42",
      retry: null,
    });
  });

  it("lässt „Erneut versuchen“ wissen, was zu wiederholen ist", () => {
    const screen = buildErrorScreen(ACCESS_ERRORS.DOOR_UNREACHABLE, {
      t,
      label: LABEL,
    });

    expect(screen.exit).toEqual({
      label: de.mobileKey.actions.retry,
      to: null,
      retry: "action",
    });
  });

  it("benennt beim generischen Bildschirm den Grund, den der Server nennt", () => {
    const screen = buildErrorScreen(ACCESS_ERRORS.GENERIC, {
      t,
      label: LABEL,
      blockingReason: "rejected",
    });

    expect(screen.description).toBe(de.mobileKey.blocking_reasons.rejected);
  });

  it("fällt beim generischen Bildschirm ohne Grund auf den eigenen Text zurück", () => {
    const screen = buildErrorScreen(ACCESS_ERRORS.GENERIC, { t, label: LABEL });

    expect(screen.description).toBe(
      de.mobileKey.errors.generic.description.replace("{label}", LABEL),
    );
  });

  it("zeigt einen unbekannten Fall als generischen Bildschirm", () => {
    const screen = buildErrorScreen("was_auch_immer", { t, label: LABEL });

    expect(screen.title).toBe(de.mobileKey.errors.generic.title);
  });
});

describe("formatBlockingReasonMessage", () => {
  it("nimmt den ersten Grund, den das Backend nennt", () => {
    expect(
      formatBlockingReasonMessage(["not_committed", "rejected"], t, "Fallback"),
    ).toBe(de.mobileKey.blocking_reasons.not_committed);
  });

  it("nimmt auch einen einzelnen Grund entgegen", () => {
    expect(formatBlockingReasonMessage("rejected", t, "Fallback")).toBe(
      de.mobileKey.blocking_reasons.rejected,
    );
  });

  it("erfindet für einen unbekannten Grund keinen Satz", () => {
    expect(formatBlockingReasonMessage(["ganz_neu"], t, "Fallback")).toBe(
      "Fallback",
    );
  });

  it("fällt ohne Grund auf den mitgegebenen Satz zurück", () => {
    expect(formatBlockingReasonMessage([], t, "Fallback")).toBe("Fallback");
    expect(formatBlockingReasonMessage(null, t, "Fallback")).toBe("Fallback");
  });
});
