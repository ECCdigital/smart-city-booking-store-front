# Hero Layout fixtures

The JSON examples from the "Shared contract (schema v1)" section of
`.scratch/hero-layout/spec.md`, copied in verbatim so the guards can be tested
against the exact payloads the backend promises to export. Where the contract
writes a placeholder — `<catalog.name>`, `<wappen.mediaId>` — these carry a
concrete value of the same shape instead.

**Cross-reference:** the backend keeps its own copy at
`smart-city-booking-backend/tests/fixtures/hero-layout/`, where the same
payloads drive the normaliser and validator tests. It holds them as CommonJS
modules rather than JSON — `default-layout.js`, `layouts.js`,
`acceptance-layout.js`, `backgrounds.js` — and the two sets agree field for
field; only the media ids differ, each repository writing them in the form its
own tests use. The contract is identical in all three repositories, so a change
to one set is a change to the other, and to all three specs.

| File | What it is |
|------|------------|
| `default-hero-layout.json` | The Default Hero Layout the backend derives when a Catalog stores none |
| `crowded-hero-layout.json` | The crowded rich-text Block from the contract, in a layout that exercises every Block type and a Panel |
| `acceptance-hero-layout.json` | The Bad Belzig Hero, the Block-styling amendment's own acceptance case: every field it adds appears at least once |
| `background-variant.json` | The `variant` Background — also the default Background |
| `background-color.json` | The `color` Background |
| `background-image.json` | The `image` Background with focal point and per-mode overlay |
| `invalid-inputs.json` | Rejected inputs with the JSON path and error code the guards are expected to report |

The three layouts are in the shape the contract carries **after** the
Block-styling amendment: a `panel` that is `null` or an object, an `align`, an
`offset` and a `layer` on every Block, and a `size` on rich text. The two
legacy words `"none"` and `"translucent"` no longer appear here, and the
rollout guarantee they used to stand for — a backend that has not shipped its
half still exports them — is pinned instead by
`tests/heroLayoutGuards.test.ts`, which strips these layouts back to their
legacy shape and parses both.
