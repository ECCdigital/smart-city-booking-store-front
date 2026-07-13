# Changelog

Notable changes for the Smart City Booking Storefront.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Releases are tagged `v1.x.x` from branch `version/1.x`.

## [Unreleased]

### Added

- Catalog auth reload: bookables and events refresh automatically when the user logs in or out while browsing the catalog (`useCatalogAuthReload`, catalog layout)
- Direct detail fetch for bookable and event detail pages (`loadDetail`) with auth-scoped cache tracking via `loadedDetailsFor`

### Fixed

- **DEV-803:** Catalog bookables and events now reload after login so permission-dependent content (e.g. restricted bookables, group booking) is visible without a manual page refresh
- Bookable and event detail pages reload with the authenticated API response after login redirect instead of showing stale anonymous data
- Login and register links in the catalog navigation preserve the current page via `?redirect=`
- Search result lists update when catalog source data changes after an auth state change
- Logout keeps the user on the current page instead of redirecting to `/login`

### Changed

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

[1.1.2]: https://github.com/ECCdigital/smart-city-booking-store-front/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/ECCdigital/smart-city-booking-store-front/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/ECCdigital/smart-city-booking-store-front/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/ECCdigital/smart-city-booking-store-front/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/ECCdigital/smart-city-booking-store-front/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/ECCdigital/smart-city-booking-store-front/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/ECCdigital/smart-city-booking-store-front/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/ECCdigital/smart-city-booking-store-front/releases/tag/v1.0.0
