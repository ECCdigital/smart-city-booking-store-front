# Changelog

Notable changes for the Smart City Booking Storefront.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Releases are tagged `v1.x.x` from branch `version/1.x`.

## [Unreleased]

### Added

- The Hero is admin-editable: the storefront renders the Hero Layout (schema v1) and the Background from the Theme Bundle and serves the admin's Live Preview at `/preview/hero`; the hero data route `/api/theme/hero` is gone. Two new environment variables, `NUXT_THEME_REVALIDATE_SECONDS` and `NUXT_THEME_REVALIDATE_TIMEOUT_MS`, set the Theme Bundle's freshness. Details in the entries below; the Lighthouse acceptance run (Hero CLS 0, LCP no worse than 1.1.7) is in the pull request
- Images are loaded at the size they are rendered at: `useMediaImage()` builds `src`/`srcset`/`sizes` from the backend's media presets (`thumb`, `sm`, `md`, `lg`) per display context — result cards, result strips, the detail hero, the checkout sidebar and the checkout add-on icons. It replaces the nine places that assembled a proxy URL by hand. External image references have no presets and go through the proxy unchanged. `thumb` is a square centre crop rather than a scaled-down original, so it is offered only where the box is a small square (checkout add-on icons, gallery thumbnails) and never mixed into a `srcset` with the other three — which means the smallest image a result strip can load is `sm`
- Detail page shows the bookable's full image list, cover image first, as a thumbnail row under the main image
- The event detail page shows the event's image gallery, teaser image first — the list was skipped as untyped legacy, but the backend exports it typed since the media library
- Checkout names a compartment shortage (`checkout.compartments_unavailable`, backend 4.3) instead of the generic error
- Hero Layout contract (schema v1) in the storefront: shared types for the layout, its Blocks and the Background, hand-written guards that answer with `null` and the failing JSON path instead of letting an invalid layout reach the renderer, and a server-side DOMPurify sanitiser for rich-text Blocks. Nothing renders from it yet
- `/api/theme/bundle` is the one route the storefront reads its look from: it answers with a Theme View — the Portal Name, a validated and server-sanitised Hero Layout, the Background and the logo reference — and nothing else, under the Theme Bundle's own strong `ETag` with a 304 on `If-None-Match`. `useThemeBundle()` reads it once per full page load and does not refetch on client-side navigation
- The Hero renders the Hero Layout from the Theme View instead of two strings: text Blocks in their nine Zones on desktop, grouped into centred rows on phones, both trees in the server-rendered HTML and switched by CSS alone, the height reserved per viewport. The Compact Hero has its own height, smaller text and hides home-only Blocks. Without a bundle, or with an invalid layout, the Fallback Hero Layout renders from translations at the full height. The home Hero on phones is now 24 rem, as the contract's default says. `/api/theme/hero` is gone. Image and rich-text Blocks, the logo among them, follow in the next tickets
- The image Background paints behind the Hero and the auth pages: a real `<img>` (`object-cover`, focal point as `object-position`, `fetchpriority="high"`, the medium's own dimensions) with `srcset` from the `sm`/`md`/`lg` presets through the new `banner` context of `useMediaImage()`, preloaded from the `<head>` with the byte-identical candidate list and `sizes` and no plain `href`. `sizes` is the larger of the viewport width and the box height times the image's aspect ratio — the Hero's height steps per breakpoint, the viewport height on the auth pages — and `100vw` for an unmeasured medium. The current mode's overlay colour at full opacity fills the box until the image arrives, so there is no white flash and no layout shift; the overlay is a layer above the image with its colour and opacity per mode from the `.dark` class
- The Hero's Live Preview route, `/preview/hero` (and `/en/preview/hero`), for the admin's Hero Editor to embed: the real catalog layout with the Hero on top and, beneath it, the start page arrangement (`?mode=home`) or a sub-page one (`?mode=compact`) built from the real components with anonymously loaded data, inert and click-through-proof; the navigation bar and footer are inert there too, so nothing leads out of the frame. It exists for the instance catalog only — no tenant copy, none of the catalog guards — and is anonymous by design: permission lives in the admin. Only the origin of `NUXT_PUBLIC_ADMIN_BASE_URL` may frame it, added at start-up, so the Docker image needs no rebuild; the route drops `X-Frame-Options` and is `noindex` in a header and a meta tag, every other route keeps its policy. Without the variable the route answers 404. `useThemeBundle()` now prefers a Theme View in shared state, which is how the next ticket renders a Draft without the Hero knowing
- The Live Preview talks to the admin's Hero Editor: `HeroPreviewBridge` (client-only, mounted by the preview page) announces `hero-preview:ready` after mount and accepts `hero-preview:draft` snapshots from the origin of `NUXT_PUBLIC_ADMIN_BASE_URL` and from nowhere else; another protocol version or message type is ignored silently. Every snapshot is complete — Hero Layout, Background, Portal Name, optional selected Block, colour mode — and is validated with the same guards the BFF runs on a bundle, its rich text sanitised in the browser with DOMPurify against the same frozen allowlist, which moved to `shared/utils/heroRichtextAllowlist.ts` so the two sanitisers share one copy; DOMPurify is imported lazily on the preview page alone. A valid Draft replaces the Theme View in shared state and sets the colour mode on the document root without touching the visitor's preference; an invalid one leaves the last valid render in place and is answered with a `hero-preview:report` carrying `error: "invalid-draft"`. The measured report, the Zone overlay and the Block highlight follow in the next ticket
- The Live Preview reports what it drew and takes the editor's clicks: after every rendered Draft, and again on resize, the bridge waits for the next frame, fonts and image decode, measures the rendered Blocks against the Hero's content area in the frame's own pixels and posts a `hero-preview:report` under the Draft's id — a Block whose box leaves the content area in any direction (`outside-content-area`), and two Blocks from different Zones whose boxes intersect (`overlap`); stacking inside one Zone is never reported, on mobile only the outside warning is, and Blocks the mode or the viewport hides are not measured. A click on a rendered Block posts `hero-preview:block-click` and goes no further, so a link in rich text cannot lead the frame away. With a Block selected, nine Zone boxes lie beneath the Blocks and a click on one posts `hero-preview:zone-click`; the selected Block is outlined. The Hero's trees let pointer events through, the Blocks take them back

### Fixed

- The emergency-help accordion on the booking detail page renders again — it had been calling `useEmergencyHelp` with a signature that no longer existed; it now reads the booking's compartments from `accessInfo` (backend 4.3) and shows the provider contact from the tenant projection together with the compartment's booking id. The page's `lockerSystem === "ifbs"` check moved into `decideEmergencyHelp`; `lockerInfo` is no longer read
- A media URL is recognized by its path no matter whether it arrives relative or absolute: the backend's embed interface (`/json/...`) exports absolute media URLs now, which fell through the relative-only check — those images silently loaded the full-size original without any `?size=` preset
- Form fields on phones (below the `sm` breakpoint) use at least 16px font-size so iOS Safari no longer zooms into a focused field and leaves the page zoomed in

### Changed

- The provider's emergency contact (`ProviderHelpSection`) comes from the public tenant projection (`GET /api/tenants/public` → `accessApps[].customerService`, backend 4.3) instead of the removed `/locker/:provider/customer-service-info`; the key list loads the tenants on its own, so tenant contacts are there on a direct visit too
- The open button is offered only at access points the backend names remote-operable (`accessEligibility.remoteOperableAccessPointIds`, backend 4.3); a door that only takes a code is refused in the client with `no_remote_access` before the tap, in the key list, the panel and on the scan page alike
- Access points in `authorization` and `both` mode carry a badge of their own ("Code an der Tür", "Per Knopf oder Code") instead of "Unbekannter Modus"
- A bike box is named by its box number (`compartment`, backend 4.3) and no longer by the provider's booking id; a box on hold reads "Fahrradbox" rather than "#null"
- The key list asks only doors that can report a status, and one door's failed status read no longer discards the others
- Booking state is read from `booking.status` (`requested | payment_due | confirmed | rejected | cancelled`, backend 4.3) through `bookingStatus.js` and `bookingPaymentStatus.js`; the derived flags `isCommitted`/`isPayed`/`isRejected` are only read where a payload carries no `status`. Display is unchanged
- Account bookings tell a rejected request (`rejected`) from a cancelled booking (`cancelled`) in the status chip, the search label and the reason heading; the status filter keeps one checkbox covering both
- Checkout hands the customer to the payment page when the booking lands in `payment_due` and to the status page otherwise, decided on `booking.status`; the status page reads the same state for polling and the confirmation copy
- The navigation bar sticks to the top of the screen on phones (below the `sm` breakpoint) so it stays reachable while scrolling; tablet and desktop are unchanged
- `/api/img` resolves relative media URLs against the configured backend and passes the backend's `Cache-Control`, `ETag` and `Last-Modified` on to the browser instead of overwriting them, so a media preset revalidates with a 304 instead of a full re-fetch. External images keep the proxy's own cache lifetime. The proxy still does no image work of its own
- The proxy's SSRF exception is now the configured backend host rather than any `localhost` address in development
- The Nuxt dev watcher and ESLint ignore `.claude/**`, so agent worktrees inside the project (with their own `node_modules`) no longer exhaust the file-descriptor limit (`EMFILE: too many open files`) or get linted a second time
- Theme freshness is one revalidation point rather than a cache lifetime per route: the storefront keeps the Theme Bundle per process and per catalog slug, revalidates it against the backend with a conditional GET at most every `NUXT_THEME_REVALIDATE_SECONDS` (default 5, `0` on every request, forced to `0` by `NUXT_CACHE_ENABLED=false`) with a `NUXT_THEME_REVALIDATE_TIMEOUT_MS` timeout (default 2000), and shares one in-flight revalidation between concurrent requests. A backend that times out or errors costs nothing: the stored copy is served for as long as the outage lasts and the failure is logged once per series, naming the catalog and the status. With nothing stored the site falls back to the default theme. `/api/theme/bundle`, the two stylesheet routes and the favicon left the shared SWR cache to read it. See `docs/adr/0001`
- The stylesheet and favicon links carry the Theme Bundle's etag as `?v=`, so a saved change arrives as a new URL rather than after a cache lifetime; with the version present those routes answer immutable and long-lived, without it they answer as before. The stylesheet routes render from the bundle with the CSS memoised per etag, and refuse a colour that is not a six-digit hex value instead of interpolating it into the stylesheet
- The site name reads the current Catalog's name, then the Portal Name from the Theme View, then the i18n fallback
- Image Blocks render in the Hero, the Default Hero Layout's logo among them, so the default Hero is whole again: logo on the right on desktop, above the title on phones. One element, `ThemeLogo`, serves the Hero's image Blocks and the logo above the auth forms: it resolves the reference through the media proxy (new `logo` context of `useMediaImage()`), reserves its box from the medium's dimensions before the image arrives, is capped at the Block's height step, and inverts in dark mode only when asked. The first image of each Hero tree fetches at high priority; nothing is preloaded. The auth title section reads logo and Portal Name from the Theme View instead of fetching. `/api/theme/logo` and the bundled placeholder logo are gone
- Rich-text Blocks render in the Hero: the server-sanitised markup goes into the page as it arrives from the Theme View, at the body-copy step of the text scale (one step down in the Compact Hero), with the Block's colour and shadow inherited into paragraphs, lists and links. Typography for the allowed tags is one stylesheet rule, `.hero-richtext`; a disallowed tag never reaches the page, and no sanitiser code is added to the client bundle. Hero links open in the same tab. The mobile Hero's grid column is `minmax(0, 1fr)`, so a Block with a fixed width wraps inside the phone instead of overflowing it
- One Background renderer, `BackgroundLayers`, paints the Hero and the auth pages from the Theme View's Background: a generated Variant with orbs, noise and intensity, or a flat colour with light and dark values. Its palette lives in custom properties under `:root` / `.dark`, so the server already paints the right colour mode and there is no light-mode flash; the error page forces dark with a class, and `prefers-reduced-motion` stops the animations. The page background lost its mounted-time theme detection and unused palettes
- No theme data travels outside the Theme Bundle any more: the portal store lost its branding state and its `logoUrl` / `faviconUrl` / `themeColors` getters, and branding and the old hero left the catalog bundle and portal mode responses
- Result cards, result strips, checkout add-on icons and gallery thumbnails load lazily — except the first card or strip of a list, which is above the fold and usually the largest paint
- `/api/img` validates every hop of a redirect chain against the same host check as the first request, not just the first one
- Removed `@nuxt/image`; the storefront never rendered a `<NuxtImg>`
- A page declares which Hero it wants — `definePageMeta({ hero: "home" })`, compact everywhere else — instead of the Hero's height and text classes; `useHeroConfig` becomes `useHeroMode()`. The Mobile Key pages, which never showed a Hero, get a browser title instead of their unrendered `staticSubtitle`. Every page renders as before

### Removed

- `locker_not_ready` from the mobile key's blocking reasons (sentence, badge and screen table): backend 4.3 never raises it, a compartment without a grant reads `not_provisioned`

## [1.1.7] — 2026-08-25

### Added

- Site footer (`AppFooter`) in the `catalog`, `panel` and `checkout` layouts: copyright line plus the legal documents configured on the instance (legal notice, data protection, terms), each hidden when unconfigured. The surface stays full-bleed while its content sits on the container edges, and it is pushed to the bottom of the window on short pages. Not shown on the `default` layout (login, SSO, card login)
- `useLegalDocuments()` reads the instance's legal documents in a fixed order; `useLegalAcceptance()` now builds on it with the two documents that need consent at registration
- Colour-mode icon button in the navigation bar (sun/moon, all breakpoints). It writes the same `colorMode.preference` as the existing appearance switch in account settings; the settings switch is unchanged. The right-hand cluster (tenant, colour mode, sign-in / bookings / user) uses a consistent gap so the extra control does not sit flush against its neighbours

### Fixed

- Colour mode no longer flashes light on the first paint after a visitor has chosen dark: the preference is stored in a cookie (migrated from `localStorage` on the next visit) so SSR can emit the matching `html` class and `colorMode.value`. Shared ISR for `/catalog/**` is dropped, because a cached page would otherwise serve one visitor's mode to the next
- Colour-mode toggle on the navigation bar no longer paints a light hover surface in light mode; the hover wash follows the icon colour so it stays readable on the tenant-coloured bar
- Checkout start/end time fields no longer clip out of the step column: the date/time row wraps once the container query column is too narrow for both groups
- Map view result list keeps a fixed 280px width instead of 25% of the (now narrower) container, so prices and addresses are no longer cut off
- Forgot-password page stacks the mobile title and the card instead of placing them side by side, matching login and register; the card was squeezed to ~130px at 375px
- Checkout summary and contact step no longer wrap the booking date, the object name, the discount-code row or the guest-checkout button onto a second line
- Back button is translated instead of hard-coded German: it uses the existing `common.back` key, so it now reads "Back" in English on the detail, booking and mobile-key pages
- Legal document links only follow `http:` and `https:` URLs; a `javascript:` or `data:` value configured on the instance is dropped instead of rendered as a footer link. Relative paths keep working
- Sort button on the bookable and event lists is no longer 8px lower than the view and filter controls next to it: the toolbar uses `gap-2` instead of `space-x-2 space-y-2`, whose vertical margin also applied once the row became a flex row at `md`

### Changed

- Content container stays at 1400px (`.container`); it was narrowed to 1200px while the container rule was rolled out and widened back after reviewing the checkout. `container-md` (900) and `container-sm` (600) are unchanged
- Panel layout uses the app's own `.container` instead of Tailwind's built-in `container` utility, which it hit accidentally via `md:container` (content ran up to 1536px); the never-generated `sm:container-md` variant is dropped
- Navigation bar content is held to the container edges while the coloured bar itself stays full-bleed; the `md:mr-5` stopgap on the right-hand group is replaced by the container's own padding
- Start page follows the same rule: the hero surface and the page background stay full-bleed while hero text, tenant logo, search bar, category tiles and the latest-events row all sit on the container edges. The hero's `px-10`, the search bar's `80vw`/`mx-5`, the events row's `90vw` and the category row's centring plus per-tile `p-5` are replaced by that one container
- Bookable and event lists, detail pages, the checkout and the booking status page follow the same rule: the page surface stays full-bleed while search bar, result header, filter column and results sit on the container edges. `SearchBar` no longer carries any width of its own (`70vw`/`80vw` dropped), the result map fills the container instead of `70vw`, and the horizontal margins inside `ResultsGrid`, `ResultsList`, `ResultsMap`, `ResultsMapList` and `DetailsArea` are dropped in favour of the container's padding
- Checkout keeps its two full-bleed panes but aligns their outer content with the container edge, via the new `.container-edge-left` / `.container-edge-right` helpers in `main.css`. They measure the containing block rather than the viewport, so a classic scrollbar is excluded and the line matches `.container` exactly
- Checkout object column narrowed from 480px to 360px so the step column keeps its working width once the container bounds the page: at 1920px it holds 920px instead of 800px, and the `lg`/`xl` steps are collapsed into one value so the column is no longer wider at 1024px than at 1920px
- Booking status page uses `.container` instead of its own `max-w-6xl`
- Result list keeps a 20px gap between the filter column and the result cards, which the container work had removed along with the per-strip margins
- Bookable and event detail pages lead with the tenant name and the object title; the back button moves below them onto one row with the booking actions (back on the left, *book* and *more* on the right). The row is part of the sticky title block, so the booking action stays reachable while scrolling, and it wraps to a second line when it does not fit. The booking button drops its full-width mobile styling accordingly

## [1.1.6] — 2026-08-10

### Fixed

- Time scroller hour change no longer writes a ComputedRef into minutes when the current time has no minutes set yet (`PeriodField`)
- Booking card actions tolerate missing `lockerInfo` / `bookableItems` without throwing
- Bookable/event detail content guards nullish item and `information` during render
- **DEV-845:** Series booking occurrences are sorted chronologically by start time so weekly multi-weekday series appear in date order in checkout preview and review
- **DEV-846:** Checkout quantity controls respect bookable max availability (`amount`); Plus/input are capped (and locked when max is 1) instead of failing only after validate
- **DEV-847:** After choosing "Log out and continue as guest" in checkout, pricing is recalculated in guest context so role-based free booking discounts from the previous authenticated session are no longer reused; guest reset also clears coupon/payment prefs and invalidates in-flight validation

## [1.1.5] — 2026-07-22

### Added

- Shared-session invalidation with Admin: BroadcastChannel + focus re-validation; on dead cookie session clear Pinia user and redirect to login only under `/account/*`
- **DEV-817:** Group-booking validation uses a single batch BFF call (`POST /api/checkout/group-validate` → backend `validate-group`) instead of parallel per-slot validates, avoiding 429 on large series

### Fixed

- Local logout also clears `auth-type` cookie (`path=/`) for Admin alignment
- `/api/auth/me` renews via refresh token when the access cookie is already gone

## [1.1.4] — 2026-07-17

### Changed

- User profile updates send `syncSelfBookingNames: false` so existing self-bookings keep their previous names

## [1.1.3] — 2026-07-17

### Added

- Catalog auth reload: bookables and events refresh automatically when the user logs in or out while browsing the catalog (`useCatalogAuthReload`, catalog layout)
- Direct detail fetch for bookable and event detail pages (`loadDetail`) with auth-scoped cache tracking via `loadedDetailsFor`

### Fixed

- Checkout booking notes are hidden when the configured HTML is effectively empty (e.g. `<p></p>` or whitespace-only markup)
- **DEV-805:** Checkout coupon discounts — percentage vouchers use per-line validate API prices; fixed-amount vouchers are applied once to the checkout total (or once per series-booking attempt), with the original price shown struck through when a voucher reduces the line total
- **DEV-803:** Catalog bookables and events now reload after login so permission-dependent content (e.g. restricted bookables, group booking) is visible without a manual page refresh
- Bookable and event detail pages reload with the authenticated API response after login redirect instead of showing stale anonymous data
- Login and register links in the catalog navigation preserve the current page via `?redirect=` (with safe redirect validation on login)
- Search result lists update when catalog source data changes after an auth state change
- Logout keeps the user on the current page instead of redirecting to `/login`
- Group booking notice is only shown when group booking is allowed

### Changed

- **DEV-781:** Checkout supports role-based booking discounts (`bookingDiscountPercent`) — partial discounts show a struck-through original price; `bookWithPrice` replaced by `bookWithoutDiscount` (inverted semantics, applies to all discount levels)
- Catalog bundle client cache keys now include auth scope (`anon` vs `auth`) to prevent cross-session data leakage
- `useBookableSearch` re-initializes or re-runs search when underlying bookable/event source items change

## [1.1.2] — 2026-07-03

### Added

- Map shows multiple bookables at the same location — browse them via a popup or mobile carousel
- Type icons on map results, including events
- Group booking notice in the availability section
- "Unknown" badge when a bookable's availability status cannot be determined

### Fixed

- Map loads correctly when a search returns no exact matches
- Back button only appears when there is a previous page to return to
- Broken or missing images in search results no longer break the layout
- Map result images display at the correct size
- Map uses the full width on large screens

### Changed

- Details button restyled for clearer visual hierarchy
- Availability check section layout improved
- Active and matching locations on the map are easier to spot
- Tapping a map result card opens its details directly

## [1.1.1] — 2026-07-01

### Fixed

- Free bookings (zero price) display as "Kostenfrei" in the storefront UI — account bookings, checkout status, and filters — aligned with the admin UI
- Payment status logic centralized; only explicit zero prices are treated as free

## [1.1.0] — 2026-06-30

### Added

- Checkout error handling for insufficient lead time (`insufficient-lead-time`), with dedicated i18n messages (DE/EN)
- Shared utilities for local date handling (`localDate.js`) and calendar date field behavior (`useCalendarDateField.js`)

### Fixed

- Checkout date and time fields: correct keyboard entry, Tab navigation, and commit on blur without losing partial input (e.g. while typing a year)
- Date/time selection in free-time, recurring, and time-period checkout flows aligned with the improved field handling

### Changed

- Refactored `InputDate`, `InputTime`, and checkout time-selection components to use the shared date utilities

## [1.0.4]

### Added

- "Back to bookings" button on checkout status

### Fixed

- Checkout permission handling for restricted bookables

## [1.0.3]

### Fixed

- Checkout permission guard for restricted bookables
- Disabled HSTS and CSP HTTPS upgrade in local development

## [1.0.2]

### Changed

- README aligned with backend and admin UI documentation

## [1.0.1]

### Added

- Block-period bookable mode and time-period selection on bookable details
- Page meta titles for bookable views

### Fixed

- Time period slots and DateJumper behavior
- Routing from result cards; conditional back button
- Include-non-suitable filter; map centering for suitable bookables
- Bookable list sorting by match status
- BookablePriceDisplay layout and alert styling

## [1.0.0]

- Initial stable release of the v1.x storefront (Nuxt 4 / Vue 3)
- Public booking flows, checkout, account area, and BFF proxy to the v4 backend API

## Earlier releases

See git tags `v1.0.0-rc.*` for release-candidate history.

[1.1.7]: https://github.com/ECCdigital/smart-city-booking-store-front/compare/v1.1.6...v1.1.7
[1.1.6]: https://github.com/ECCdigital/smart-city-booking-store-front/compare/v1.1.5...v1.1.6
[1.1.5]: https://github.com/ECCdigital/smart-city-booking-store-front/compare/v1.1.4...v1.1.5
[1.1.4]: https://github.com/ECCdigital/smart-city-booking-store-front/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/ECCdigital/smart-city-booking-store-front/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/ECCdigital/smart-city-booking-store-front/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/ECCdigital/smart-city-booking-store-front/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/ECCdigital/smart-city-booking-store-front/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/ECCdigital/smart-city-booking-store-front/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/ECCdigital/smart-city-booking-store-front/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/ECCdigital/smart-city-booking-store-front/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/ECCdigital/smart-city-booking-store-front/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/ECCdigital/smart-city-booking-store-front/releases/tag/v1.0.0
