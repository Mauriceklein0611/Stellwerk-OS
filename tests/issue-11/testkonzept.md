# Testkonzept – Issue #11: Contract-Pipeline (OpenAPI → packages/contracts)

Workspace: Root (npm) + `services/core` (Export). Verifikation lokal +
Drift-Check in CI.

## Entscheidungen
- **Deterministischer Export:** `app.export_openapi` dumpt mit `sort_keys` +
  festem Indent → stabile Bytes, damit der Drift-Check nur bei echten
  Vertragsänderungen anschlägt.
- **Eigener CI-Job `contracts`** (statt Inline-Schritt im core-Job), weil er die
  Node-Toolchain braucht; getriggert über den `contracts`-Pfadfilter
  (`packages/contracts/**` **oder** `services/core/app/**`).
- **Eingecheckt:** `openapi.json` + `src/` (generiert). `dist/` (tsc) ist
  gitignored.

## Lokale Verifikation (belegt)
```bash
npm install
make contracts
# -> openapi.json, src/schema.ts neu; dist/ gebaut (ignoriert)

# Determinismus/Drift: erneut generieren, dann darf nichts abweichen
make contracts
git diff --exit-code -- packages/contracts   # Exit 0
```
Ergebnis: `make contracts` grün; erneuter Lauf → `git diff --exit-code` Exit 0.
`schema.ts` deckt alle v1-Endpoints ab: `/healthz`, `/readyz`, `/metrics`,
`/api/v1/me`, `/api/v1/gateway/chat`, `/api/v1/telemetry/summary`.

## CI-Checkliste
- [ ] Job `contracts` läuft, wenn `services/core/app/**` oder
      `packages/contracts/**` geändert werden.
- [ ] `@stellwerk/contracts` baut (`npm run build -w @stellwerk/contracts`).

## AK1 – Drift bricht CI verständlich
- [ ] API absichtlich ändern (z. B. Endpoint/Feld) **ohne** `make contracts` →
      Job `contracts` rot mit Meldung „make contracts ausführen".
- [ ] `make contracts` + commit → wieder grün.

## Definition of Done
- [ ] Export deterministisch; `make contracts` erzeugt eincheckbare Artefakte
- [ ] `@stellwerk/contracts` baut und exportiert Typen für alle v1-Endpoints
- [ ] Drift-Check in CI bricht bei Abweichung (verständliche Meldung)
- [ ] `ci-ok` grün · docs/core/api.md
