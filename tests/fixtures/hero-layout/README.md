# Hero Layout fixtures

The JSON examples from the "Shared contract (schema v1)" section of
`.scratch/hero-layout/spec.md`, copied in verbatim so the guards can be tested
against the exact payloads the backend promises to export.

**Cross-reference:** the backend keeps its own copy at
`smart-city-booking-backend/tests/fixtures/hero-layout/`, where the same
payloads drive the normaliser and validator tests. That copy does not exist
yet — the backend's half of the spec is unimplemented — so these were written
from the contract rather than copied from it, and the backend set is the sync
target, not the source. The contract is identical in all three repositories, so
a change to one set is a change to the other, and to all three specs.

| File | What it is |
|------|------------|
| `default-hero-layout.json` | The Default Hero Layout the backend derives when a Catalog stores none |
| `crowded-hero-layout.json` | The crowded rich-text Block from the contract, in a layout that exercises every Block type and a panel |
| `background-variant.json` | The `variant` Background — also the default Background |
| `background-color.json` | The `color` Background |
| `background-image.json` | The `image` Background with focal point and per-mode overlay |
| `invalid-inputs.json` | Rejected inputs with the JSON path and error code the guards are expected to report |
