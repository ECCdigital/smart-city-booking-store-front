# Smart City Booking Store Front

Kundenorientiertes Web-Interface für das **Smart City Booking**-Ökosystem. Die Anwendung stellt Buchungsangebote dar, ermöglicht den Checkout und bietet eingeloggten Nutzern eine Übersicht über ihre Buchungen.

Alle Geschäftsdaten (Angebote, Verfügbarkeiten, Buchungen, Zahlungen, Authentifizierung) werden vom Backend bereitgestellt:

**[smart-city-booking-backend](https://github.com/ECCdigital/smart-city-booking-backend/pkgs/container/smart-city-booking-backend)**

Dieses Repository enthält ausschließlich das Store-Front (Nuxt 4 / Vue 3). Server-Routen unter `/api/*` fungieren als BFF-Proxy zum Backend und halten Tokens in HTTP-only Cookies.

---

## Inhaltsverzeichnis

- [Funktionen](#funktionen)
- [Architektur](#architektur)
- [Voraussetzungen](#voraussetzungen)
- [Lokales Setup](#lokales-setup)
- [Umgebungsvariablen](#umgebungsvariablen)
- [Entwicklung](#entwicklung)
- [Produktions-Build](#produktions-build)
- [Docker](#docker)
- [Betrieb](#betrieb)
- [Server-Side Cache](#server-side-cache)

---

## Funktionen

| Bereich | Beschreibung |
| --- | --- |
| **Katalog** | Durchsuchen von Buchungsangeboten (Bookables, Events), Suche nach Ort/Zeitraum, mandantenspezifische Kataloge |
| **Checkout** | Mehrstufiger Buchungsprozess inkl. Zeitauswahl, Kontaktdaten, Zahlung und Bestätigung |
| **Mein Konto** | Buchungsübersicht, Rechnungen, Favoriten, Mobile Keys, Einstellungen |
| **Authentifizierung** | E-Mail/Passwort, SSO (Keycloak), Karten-Login, Silent SSO |
| **Theming** | Mandantenspezifisches CSS, Logo und Hero-Bilder über Backend-Konfiguration |
| **Internationalisierung** | Deutsch (Standard) und Englisch |

---

## Architektur

```
Browser  →  Store Front (Nuxt SSR / Nitro)  →  smart-city-booking-backend
              /api/*  (BFF-Proxy)                REST API
```

- **Frontend**: Nuxt 4 mit SSR, Pinia-State, Nuxt UI
- **Server**: Nitro (`node-server` Preset) – alle sensiblen API-Aufrufe laufen serverseitig
- **Backend**: Separater Container/Dienst – muss erreichbar sein unter `NUXT_API_BASE_URL`
- **Multi-Tenant**: Routen unter `/t/:tenantID/...` werden automatisch aus den Standard-Routen abgeleitet

---

## Voraussetzungen

| Komponente | Version |
| --- | --- |
| Node.js | 20.x (empfohlen; CI testet 18.x und 20.x) |
| npm | 9+ |
| Backend | [smart-city-booking-backend](https://github.com/ECCdigital/smart-city-booking-backend/pkgs/container/smart-city-booking-backend) läuft und ist erreichbar |

---

## Lokales Setup

### 1. Repository klonen

```bash
git clone https://github.com/ECCdigital/smart-city-booking-store-front.git
cd smart-city-booking-store-front
```

### 2. Abhängigkeiten installieren

```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
```

Mindestens folgende Werte anpassen:

```bash
NUXT_API_BASE_URL=http://localhost:8080        # URL des Backends
NUXT_USER_BASE_URL=http://localhost:3000        # URL dieses Store Fronts
NUXT_PUBLIC_USER_BASE_URL=http://localhost:3000
NUXT_CACHE_ENABLED=false                        # Cache in der Entwicklung deaktivieren
```

> **Hinweis:** Nuxt lädt `.env` automatisch (`dotenv/config` in `nuxt.config.js`). Runtime-Config-Werte werden zur Build-Zeit bzw. beim Serverstart eingebunden.

### 4. Backend starten

Das Backend muss vor dem Store Front laufen und unter der konfigurierten `NUXT_API_BASE_URL` erreichbar sein. Siehe die Backend-Dokumentation im verlinkten Repository.

### 5. Entwicklungsserver starten

```bash
npm run dev
```

Die Anwendung ist unter **http://localhost:3000** erreichbar.

---

## Umgebungsvariablen

Nuxt mappt `runtimeConfig`-Felder automatisch auf `NUXT_*`-Variablen. Öffentliche Werte (für den Browser) benötigen das Präfix `NUXT_PUBLIC_`.

| Variable | Pflicht | Standard | Beschreibung |
| --- | --- | --- | --- |
| `NUXT_API_BASE_URL` | **Ja** | `""` | Basis-URL des Backends (z. B. `https://api.booking.example.com`). Wird serverseitig für alle API-Aufrufe verwendet. |
| `NUXT_PUBLIC_API_BASE_URL` | Nein | `""` | Öffentliche Backend-URL, falls vom Client benötigt. |
| `NUXT_USER_BASE_URL` | **Ja** | `""` | Öffentliche URL des Store Fronts. Wird serverseitig für Verify-/Reset-Links in Auth-E-Mails gebaut. |
| `NUXT_PUBLIC_USER_BASE_URL` | **Ja** | `""` | Gleiche URL, für clientseitige Redirects (z. B. Passwort-Reset). |
| `NUXT_ADMIN_BASE_URL` | Nein | `""` | URL des Admin-Portals (serverseitig). |
| `NUXT_PUBLIC_ADMIN_BASE_URL` | Nein | `""` | Admin-Portal-Link in der Navigation (nur für Nutzer mit Mitgliedschaften). |
| `NUXT_PUBLIC_SILENT_SSO_ENABLED` | Nein | `false` | `true` aktiviert automatischen SSO-Check beim Seitenaufruf (Keycloak Silent Check). |
| `NUXT_CACHE_ENABLED` | Nein | aktiv | `false` deaktiviert den serverseitigen SWR-Cache für Katalog- und Theme-Routen. |
| `LOG_LEVEL` | Nein | `info` | Pino Log-Level: `trace`, `debug`, `info`, `warn`, `error`, `fatal`. |
| `PORT` | Nein | `3000` | HTTP-Port im Docker-/Produktionsbetrieb. |
| `NODE_ENV` | – | – | `development` oder `production`. Steuert u. a. `secure`-Flag bei Cookies. |

Eine vollständige Vorlage mit Kommentaren liegt in [`.env.example`](.env.example).

### Beispiel: Produktion

```bash
NUXT_API_BASE_URL=https://api.booking.example.com
NUXT_USER_BASE_URL=https://booking.example.com
NUXT_PUBLIC_USER_BASE_URL=https://booking.example.com
NUXT_PUBLIC_ADMIN_BASE_URL=https://admin.booking.example.com
NUXT_PUBLIC_SILENT_SSO_ENABLED=true
NUXT_CACHE_ENABLED=true
LOG_LEVEL=info
PORT=3000
NODE_ENV=production
```

---

## Entwicklung

```bash
# Entwicklungsserver mit Hot-Reload
npm run dev

# ESLint
npm run lint:check
```

Weitere Paketmanager (pnpm, yarn, bun) funktionieren analog:

```bash
pnpm install && pnpm dev
yarn install && yarn dev
bun install && bun run dev
```

---

## Produktions-Build

```bash
# Build erstellen
npm run build

# Lokalen Produktions-Server starten (zum Testen)
npm run preview
```

Der Build erzeugt ein Nitro-Bundle unter `.output/`, das mit `node .output/server/index.mjs` gestartet werden kann.

---

## Docker

### Image bauen

```bash
docker build -t smart-city-booking-store-front .
```

### Container starten

```bash
docker run -d \
  --name store-front \
  -p 3000:3000 \
  -e NUXT_API_BASE_URL=https://api.booking.example.com \
  -e NUXT_USER_BASE_URL=https://booking.example.com \
  -e NUXT_PUBLIC_USER_BASE_URL=https://booking.example.com \
  -e NUXT_PUBLIC_ADMIN_BASE_URL=https://admin.booking.example.com \
  -e NUXT_CACHE_ENABLED=true \
  -e LOG_LEVEL=info \
  smart-city-booking-store-front
```

### Typisches Deployment mit Backend

```
┌─────────────────────┐     ┌──────────────────────────────┐
│  Reverse Proxy      │     │  smart-city-booking-backend  │
│  (nginx / Traefik)  │────▶│  ghcr.io/.../backend         │
│                     │     └──────────────────────────────┘
│  booking.example.com│              ▲
│        │            │              │ NUXT_API_BASE_URL
│        ▼            │     ┌────────┴─────────────────────┐
│  store-front :3000  │────▶│  ghcr.io/.../store-front     │
└─────────────────────┘     └──────────────────────────────┘
```

Beide Container sollten im selben Netzwerk liegen; der Reverse Proxy terminiert TLS und leitet an Port `3000` weiter.

---

## Betrieb

### Health & Verfügbarkeit

- Die App lauscht auf `PORT` (Standard `3000`).
- Stelle sicher, dass das Backend unter `NUXT_API_BASE_URL` erreichbar ist – ohne Backend funktionieren Katalog, Checkout und Auth nicht.
- Setze `NUXT_USER_BASE_URL` / `NUXT_PUBLIC_USER_BASE_URL` auf die öffentlich erreichbare URL (inkl. Schema und ohne trailing slash), damit Auth-Links in E-Mails korrekt sind.

### Logging

Server-Logs werden über **Pino** geschrieben. Log-Level über `LOG_LEVEL` steuern:

```bash
LOG_LEVEL=debug   # Entwicklung / Fehlersuche
LOG_LEVEL=warn    # Produktion mit wenig Rauschen
```

### Cookies & HTTPS

In `NODE_ENV=production` werden Auth-Cookies mit dem `Secure`-Flag gesetzt. Der Store Front muss daher hinter HTTPS betrieben werden.

### SSO / Keycloak

- SSO-Endpunkte: `/api/auth/sso/*`
- Silent SSO (`NUXT_PUBLIC_SILENT_SSO_ENABLED=true`) prüft beim ersten Seitenaufruf, ob eine Keycloak-Session besteht.
- Keycloak-Konfiguration erfolgt im Backend/Instance-Setup, nicht im Store Front.

### Skalierung

- Stateless Nitro-Server – horizontal skalierbar hinter einem Load Balancer.
- Der serverseitige SWR-Cache (`NUXT_CACHE_ENABLED`) ist pro Instanz lokal (LRU). Bei mehreren Replicas kann kurzzeitig leicht unterschiedlicher Cache-Stand entstehen – für Katalog-Daten in der Regel akzeptabel.

### Release-Versionierung

```bash
npm run release:patch    # Patch-Release
npm run release:minor    # Minor-Release
npm run release:major    # Major-Release
npm run release:rc       # Release Candidate
```

Veröffentlichte GitHub-Releases triggern den Docker-Build-Workflow (`.github/workflows/docker-publish.yml`).

---

## Server-Side Cache

Die Nitro-Server-Proxy-Routen (`/api/catalog/...`, `/api/theme/...`) nutzen
`createConditionalCachedHandler`, um Antworten optional in einem SWR-Cache zu halten.
Das Verhalten wird über die Umgebungsvariable gesteuert:

```bash
NUXT_CACHE_ENABLED=true   # SWR-Cache aktiv (Standard, wenn nicht gesetzt)
NUXT_CACHE_ENABLED=false  # Cache deaktivieren (empfohlen für lokale Entwicklung)
```

> Der Cache ist **standardmäßig aktiv**, solange `NUXT_CACHE_ENABLED` nicht explizit auf `false` gesetzt wird.

### Empfohlene `maxAge`-Werte

| Route | maxAge | swr | Hinweise |
| --- | --- | --- | --- |
| `/api/catalog/bundle` | 300s | ja | Auth-scoped Key (anon vs. auth Cookie) |
| `/api/catalog/[t]/bundle` | 300s | ja | Enthält tenantID + Slug im Cache-Key |
| `/api/catalog/mode` | 300s | ja | Öffentlich |
| `/api/theme/css` | 300s | n/a | Öffentlich, anon-scoped |
| `/api/theme/[slug].css` | 300s | n/a | Enthält Slug im Key |
| `/api/theme/hero` | 300s | n/a | Nutzt `themeBundle` pro Request |
| `/api/theme/logo` | 300s | n/a | Nutzt `themeBundle` pro Request |

Die Bundle-Endpunkte teilen den Cache-Key in `auth` vs. `anon` anhand des `access-token`-Cookies.
Anonyme Anfragen teilen sich eine gecachte Antwort, authentifizierte Anfragen fallen in den
`auth`-Scope (weiter aufgeschlüsselt nach Slug / Tenant / Bookable / Event / Include).

---

## Lizenz

This project is licensed under the
[GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html). See the
[LICENSE.md](LICENSE.md) file for details.
