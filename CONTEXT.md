# Smart City Booking Storefront

The public booking UI of a multi-tenant booking platform. This glossary holds the terms the storefront shares with the backend and the admin UI; German admin labels are noted where they differ.

## Language

### Hero

**Hero** (admin label: „Kopfbereich“):
The full-width surface at the top of the catalog layout, above the page content.
_Avoid_: Header, banner, page hero

**Hero Layout**:
The complete, admin-editable configuration of the Hero: its Background, its height and its Blocks. Lives on the Catalog, not on the Instance.
_Avoid_: Hero config, hero settings, hero template

**Block** (admin label: „Block“):
One placed piece of content inside the Hero: a content type, its content, a Zone and spacing.
_Avoid_: Box, element, widget, component

**Zone**:
One of the nine anchor positions of the Hero (top/middle/bottom × left/centre/right) a Block is placed in. Blocks sharing a Zone stack in a defined order.
_Avoid_: Slot, cell, position, area

**Background**:
What the Hero paints behind its Blocks: one of a built-in Variant, a solid colour, or an image from the Media Library.
_Avoid_: Backdrop, theme background

**Variant**:
One of the built-in generated backgrounds (`mesh`, `aurora`, `poly`, `grid`, `minimal`).
_Avoid_: Pattern, preset, style

### Branding

**Instance**:
The whole deployment; owns the Branding (colours, logo, favicon) that every Catalog and Tenant inherits.

**Catalog**:
A public listing of bookables and events. The instance-wide Catalog carries the Hero Layout.

**Media Library**:
The backend's managed store of uploaded files; the only source of images a Block or Background may reference.
_Avoid_: Uploads, assets, attachments

**Compact Hero**:
The reduced form of the Hero shown on the catalog sub-pages (bookables, events): same Background, its own height, Blocks flagged "home only" hidden. The panel pages, Mobile Key among them, show no Hero.
_Avoid_: Small hero, sub-page header

**Default Hero Layout**:
The Hero Layout the backend derives when a Catalog has none stored: the Catalog's name, a slogan and the Instance logo, reproducing the pre-editor look. Also what "reset to default" restores.
_Avoid_: Empty layout

**Fallback Hero Layout**:
The Hero Layout built into the storefront and shown only when no Theme Bundle can be read or the delivered Hero Layout is invalid: a generic name, a slogan and the logo if one is known. Never stored, never edited.
_Avoid_: Default layout, emergency hero

**Portal Name** (admin label: „Portalname“):
The name of the instance-wide Catalog. Appears in the browser title, as the title of the Default Hero Layout and above the login and registration forms.
_Avoid_: Site name, hero title, Überschrift

**Theme Bundle**:
Everything the storefront needs to paint the Instance's look, delivered by the backend as one unit: Branding, Background, Hero Layout and Portal Name. Changing any part of it changes the whole bundle.
_Avoid_: Theme, theme config, branding bundle

**Localised Text**:
Block content that carries one value per storefront language, German mandatory, English optional and falling back to German.
_Avoid_: Translation, i18n string

### Editing

**Hero Editor** (admin label: „Kopfbereich bearbeiten“):
The admin dialog in which an instance admin edits the Hero Layout and the Background as one Draft, with the Live Preview beside the form.
_Avoid_: Hero settings, layout builder, page builder

**Live Preview** (admin label: „Live-Vorschau“):
The storefront rendering of a Draft, embedded in the admin editor, that mirrors every change before it is saved. Shows the Hero on the start page and as Compact Hero; not the auth pages.
_Avoid_: Preview mode, iframe, mock

**Draft** (admin label: „Entwurf“):
The unsaved Hero Layout, Background and Portal Name as currently edited in the admin. Exists only in the editor session; the storefront never stores it.
_Avoid_: Working copy, pending state, snapshot

**Preview Report**:
What the Live Preview sends back to the editor after rendering a Draft: the Blocks that fall outside the Hero's content area and the Blocks that overlap, per viewport.
_Avoid_: Warnings, validation result, feedback
