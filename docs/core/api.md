---
module: core
type: guide
status: current
updated: 2026-07-07
---

# Kern-API & Contract-Pipeline

Der Kern-Vertrag ist maschinell: TypeScript-Typen entstehen aus dem
OpenAPI-Schema, das direkt aus dem Code exportiert wird (Issue #11).

## Ablauf (`make contracts`)

1. **Export:** `uv run python -m app.export_openapi > packages/contracts/openapi.json`
   (deterministisch sortiert).
2. **Generieren:** `openapi-typescript` erzeugt `packages/contracts/src/schema.ts`.
3. **Bauen:** `tsc` baut `@stellwerk/contracts` (nach `dist/`, nicht eingecheckt).
4. **Einchecken:** `openapi.json` und `src/` werden committet.
5. **CI-Drift-Check:** Job `contracts` generiert neu und `git diff --exit-code
   packages/contracts` – weicht der eingecheckte Stand ab, bricht die CI mit der
   Meldung „make contracts ausführen".

Erster Konsument wird PM Studio (v0.2). Import: `import type { paths } from
"@stellwerk/contracts"`.
