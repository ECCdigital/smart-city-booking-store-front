import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useTenantStore } from "~~/stores/tenant.js";
import { useSanitizeHtml } from "~/composables/utils/useSanitizeHtml.js";

export function useExportBookings() {
  const tenantsStore = useTenantStore();
  const { sanitizeHtml } = useSanitizeHtml();

  async function bookingsToExcel(bookings) {
    console.log("Exportiere Buchungen nach Excel:", bookings);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Buchungen");

    // Spalten definieren
    worksheet.columns = [
      { header: "ID der Buchung", key: "ID", width: 15 },
      { header: "Tenant ID", key: "TenantID", width: 15 },

      { header: "Startzeit", key: "Startzeit", width: 20 },
      { header: "Endzeit", key: "Endzeit", width: 20 },

      { header: "Gebuchtes Objekt", key: "BookableTitle", width: 25 },
      { header: "Typ", key: "BookableType", width: 15 },
      { header: "Beschreibung", key: "BookableDescription", width: 30 },

      { header: "Preis (EUR)", key: "Preis", width: 15 },
      { header: "MwSt (EUR)", key: "MwSt", width: 15 },

      { header: "Bestätigt", key: "Bestätigt", width: 12 },

      { header: "Bezahlt", key: "Bezahlt", width: 12 },
      { header: "Zahlungsmethode", key: "Payment", width: 15 },

      { header: "Abgelehnt", key: "Abgelehnt", width: 12 },
      { header: "Ablehnungsgrund", key: "AblehnungsGrund", width: 25 },

      { header: "Erstellt am", key: "Erstellt", width: 20 },
      { header: "Kommentar", key: "Kommentar", width: 30 },
    ];

    // Währung formatieren
    worksheet.getColumn("Preis").numFmt = "#,##0.00 €";
    worksheet.getColumn("MwSt").numFmt = "#,##0.00 €";

    //Datum formatieren
      worksheet.getColumn('Startzeit').numFmt = 'dd.mm.yy hh:mm'
      worksheet.getColumn('Endzeit').numFmt = 'dd.mm.yy hh:mm'
      worksheet.getColumn('Erstellt').numFmt = 'dd.mm.yy hh:mm'

    // Header stylen
    worksheet.getRow(1).font = { bold: true };

    // Daten hinzufügen
    bookings.forEach((booking) => {
      const firstBookable = booking.bookableItems?.[0]?._bookableUsed || {};

      worksheet.addRow({
        ID: booking.id || "",
        TenantID: getTenantName(booking.tenantId) || "",

          Startzeit: booking.timeBegin ? new Date(booking.timeBegin) : "",
          Endzeit: booking.timeEnd ? new Date(booking.timeEnd) : "",

        BookableTitle: firstBookable.title || "",
        BookableType: getBookableType(firstBookable.type) || "",
        BookableDescription: getDescription(firstBookable.description) || "",

        Preis: booking.priceEur || 0,
        MwSt: booking.vatIncludedEur || 0,

        Bestätigt: booking.isCommitted ? "Ja" : "Nein",

        Bezahlt: booking.isPayed ? "Ja" : "Nein",
        Payment:
          getPaymentInfo(
            booking.isPayed,
            booking.paymentProvider,
            booking.paymentMethod,
          ) || "",

        Abgelehnt: booking.isRejected ? "Ja" : "Nein",
        AblehnungsGrund: booking.rejectionReason || "-",

          Erstellt: booking.timeCreated ? new Date(booking.timeCreated) : "",
        Kommentar: booking.comment || "-",
      });
    });

    // AutoFilter aktivieren
    worksheet.autoFilter = {
      from: "A1",
      to: "AA1",
    };

    // Datei erzeugen
    const buffer = await workbook.xlsx.writeBuffer();

    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `buchungen-${formatDate(Date.now()).split(",")[0]}.xlsx`,
    );
  }

  function formatDate(timestamp) {
    if (!timestamp) return "";

    return new Date(timestamp).toLocaleString("de-DE");
  }
  function getTenantName(tenantId) {
    const tenant = tenantsStore.getTenantById(tenantId);
    if (tenant) {
      return tenant.name;
    }
    return "Unbekannt";
  }
  function formatPrice(price) {}

  function getBookableType(type) {
    //toDo - read dynamically from categories
    switch (type) {
      case "room":
        return "Raum";
      case "event-location":
        return "Veranstaltungsort";
      case "resource":
        return "Gerät";
      case "event":
        return "Veranstaltung";
      case "ticket":
        return "Ticket";
      default:
        return "";
    }
  }
  function getDescription(description) {
    if (!description) return "";
    return description.replace(/<[^>]*>/g, "");
  }
  function getPaymentInfo(isPayed, provider, method) {
    if (!isPayed) {
      switch (provider) {
        case "invoice": {
          return "Rechnung";
        }
        default: {
          return "–";
        }
      }
    } else {
      switch (method) {
        case "CASH":
          return "Bar";
        case "TRANSFER":
          return "Überweisung";
        case "CREDIT_CARD":
          return "Kreditkarte";
        case "DEBIT_CARD":
          return "EC-Karte";
        case "PAYPAL":
          return "PayPal";
        case "OTHER":
          return "Sonstiges";
        case "GIROPAY":
          return "Giropay";
        case "APPLE_PAY":
          return "Apple Pay";
        case "GOOGLE_PAY":
          return "Google Pay";
        case "EPS":
          return "EPS";
        case "IDEAL":
          return "iDEAL";
        case "MAESTRO":
          return "Maestro";
        case "PAYDIRECT":
          return "paydirekt";
        case "SOFORT":
          return "SOFORT-Überweisung";
        case "BLUECODE":
          return "Bluecode";
      }
    }
    return "Nicht angegeben";
  }

  return {
    bookingsToExcel,
  };
}
