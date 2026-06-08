# Frontend-Implementierungshinweis: Datenschutz, Impressum & AGB

Das Instanz-Model speichert Datenschutzerklärung, Impressum und AGB jetzt als
strukturierte Felder, die **entweder einen externen Link oder eine über den
File-Manager hochgeladene Datei** referenzieren können.

> **Breaking Change:** Die alten flachen Felder `dataProtectionUrl` und
> `legalNoticeUrl` wurden entfernt. Bestehende Werte werden serverseitig per
> Migration in die neuen Felder übernommen. Das Frontend darf die alten Felder
> **nicht mehr lesen oder schreiben**.

---

## 1. Datenmodell

Drei neue Felder im Instanz-Objekt, jeweils mit identischer Struktur:

| Feld                 | Bedeutung               |
| -------------------- | ----------------------- |
| `dataProtection`     | Datenschutzerklärung    |
| `legalNotice`        | Impressum               |
| `termsAndConditions` | AGB                     |

Struktur jedes Feldes:

```jsonc
{
  "source": "url" | "file", // Herkunft: externer Link oder hochgeladene Datei
  "url": "https://…",        // in beiden Fällen die aufrufbare Adresse
  "fileName": "agb.pdf"      // nur bei source === "file", sonst ""
}
```

Beispiel (Ausschnitt aus dem Instanz-Objekt):

```jsonc
{
  // …
  "dataProtection": {
    "source": "url",
    "url": "https://example.com/privacy",
    "fileName": ""
  },
  "legalNotice": {
    "source": "url",
    "url": "https://example.com/impressum",
    "fileName": ""
  },
  "termsAndConditions": {
    "source": "file",
    "url": "https://backend.example.com/api/files/get?name=/public/legal/agb.pdf",
    "fileName": "agb.pdf"
  }
}
```

---

## 2. Relevante Endpunkte

| Methode | Pfad                     | Zweck                                            | Auth            |
| ------- | ------------------------ | ------------------------------------------------ | --------------- |
| `GET`   | `/api/instances`         | Vollständiges Instanz-Objekt (Admin/Owner)       | eingeloggt      |
| `GET`   | `/api/instances/public`  | Öffentliches Instanz-Objekt (inkl. Legal-Felder) | öffentlich      |
| `PUT`   | `/api/instances`         | Instanz speichern (Body = ganzes Instanz-Objekt) | eingeloggt      |
| `POST`  | `/api/files`             | Datei hochladen                                  | eingeloggt      |
| `GET`   | `/api/files/list`        | Dateien auflisten (liefert `link` pro Datei)     | öffentlich¹     |
| `GET`   | `/api/files/get?name=…`  | Datei ausliefern/anzeigen                         | öffentlich¹     |

¹ `public`-Dateien sind ohne Login abrufbar; `protected`-Dateien erfordern Auth.
Rechtsdokumente sollten als **`public`** hochgeladen werden.

Die Felder sind auch im `/api/instances/public`-Response enthalten (z. B. für den
Footer im Buchungsportal), da `removePrivateData()` sie nicht entfernt.

---

## 3. Variante A — Externer Link

Keine Datei nötig. Einfach das Feld setzen und die Instanz per `PUT` speichern:

```jsonc
// PUT /api/instances  (Body = komplettes Instanz-Objekt, hier nur Ausschnitt)
{
  "dataProtection": {
    "source": "url",
    "url": "https://example.com/privacy",
    "fileName": ""
  }
}
```

---

## 4. Variante B — Datei über den File-Manager

### Schritt 1: Datei hochladen

`POST /api/files` als `multipart/form-data`:

| Feld              | Wert                                                  |
| ----------------- | ----------------------------------------------------- |
| `file`            | die Datei (Feldname muss exakt `file` sein)           |
| `accessLevel`     | `"public"` (für Rechtsdokumente empfohlen)            |
| `customDirectory` | z. B. `"legal"` (Unterordner unterhalb von `public/`) |

```js
const form = new FormData();
form.append("file", fileInput.files[0]); // z. B. agb.pdf
form.append("accessLevel", "public");
form.append("customDirectory", "legal");

await fetch(`${BACKEND_URL}/api/files`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` }, // KEIN Content-Type setzen!
  body: form,
});
```

Die Datei landet unter `public/legal/<dateiname>`.

> **Wichtig:** Der Upload-Endpunkt antwortet mit dem Text
> `"File uploaded successfully."` und **liefert nicht den Link zurück**. Der Link
> muss vom Frontend ermittelt werden (siehe Schritt 2).

### Schritt 2: Link ermitteln

Zwei Möglichkeiten:

**(a) Link selbst bauen** (deterministisch, da der Pfad bekannt ist):

```js
const fileName = "agb.pdf";
const url = `${BACKEND_URL}/api/files/get?name=/public/legal/${encodeURIComponent(fileName)}`;
```

**(b) Über die Dateiliste holen** (robust, falls Pfade/Namen variieren):

```js
const res = await fetch(`${BACKEND_URL}/api/files/list`);
const files = await res.json();
// Jede Datei hat ein `filename` (relativ) und ein fertiges `link`-Feld.
const match = files.find((f) => f.filename.endsWith("/legal/agb.pdf"));
const url = match.link;
```

### Schritt 3: Feld setzen und Instanz speichern

```jsonc
// PUT /api/instances
{
  "termsAndConditions": {
    "source": "file",
    "url": "https://backend.example.com/api/files/get?name=/public/legal/agb.pdf",
    "fileName": "agb.pdf"
  }
}
```

---

## 5. Anzeige im Frontend

Da `url` in **beiden** Varianten die aufrufbare Adresse enthält, ist die Anzeige
einheitlich:

```jsx
{instance.termsAndConditions?.url && (
  <a href={instance.termsAndConditions.url} target="_blank" rel="noopener noreferrer">
    {instance.termsAndConditions.source === "file"
      ? instance.termsAndConditions.fileName // z. B. "agb.pdf"
      : "AGB"}
  </a>
)}
```

`source` dient nur der UI (z. B. um in der Verwaltung zwischen „Link"- und
„Datei"-Modus umzuschalten bzw. den Dateinamen anzuzeigen).

---

## 6. Hinweise zum Speichern

- `PUT /api/instances` erwartet das **komplette** Instanz-Objekt im Body. Am
  besten zuvor per `GET /api/instances` laden, die drei Felder anpassen und das
  gesamte Objekt zurücksenden.
- Für „nicht gesetzt" das Feld leeren statt löschen:
  `{ "source": "url", "url": "", "fileName": "" }`.
- Beim Wechsel von Datei → Link sollte `fileName` auf `""` zurückgesetzt werden
  (die alte Datei bleibt im File-Manager liegen und kann dort separat entfernt
  werden).
