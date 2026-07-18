# Testkonzept – Issue #10: PM Studio als Workspace-App einziehen

Reiner Umzug von **projectmind-os** nach `apps/pm-studio` – null Feature-Änderung,
nur Pfade/Configs. Bestandstests (Vitest) und E2E (Playwright) laufen aus dem
Workspace.

## Entscheidungen
- **Fresh-Import** statt git-subtree: hält die Monorepo-Historie und die
  Root-Configs sauber. Die vollständige Commit-/PR-Historie bleibt im
  (zu archivierenden) Alt-Repo `projectmind-os` erhalten und ist von beiden
  Seiten verlinkt (README hier ↔ Alt-Repo).
- **Kein Code-Eingriff.** Angepasst wurden nur: `package.json`-Name
  (`@stellwerk/pm-studio`), `next.config.ts` (`output: "standalone"` fürs Image),
  `.gitignore`, und `vitest.config.ts` (`retry: 2`).
- **`retry: 2` (Config, kein Code):** einige RTL/user-event-Dropdown-Tests
  (`@base-ui/react`-Portale) sind im jsdom-Timing gelegentlich flaky (der
  fehlschlagende Test rotierte über Läufe). Retry stabilisiert – analog zu den
  CI-Retries in `playwright.config.ts`.
- **Alt-Doku** unter `docs/pm-studio/` mit Frontmatter `status: frozen`;
  `task-index.md`/`tasks-archive.md` zusätzlich mit Kopf-Hinweis.

## Lokale Verifikation (belegt)
```bash
npm install                                   # Workspace-Lock inkl. pm-studio
npm run lint  -w @stellwerk/pm-studio         # 0 errors (3 nicht-blockierende Warnungen)
npx tsc --noEmit -p apps/pm-studio            # Exit 0
npm run test  -w @stellwerk/pm-studio         # 671 passed (132 Dateien)
npm run build -w @stellwerk/pm-studio         # standalone-Build Exit 0
```
Ergebnis: alle vier Gates grün. Standalone-Output unter
`apps/pm-studio/.next/standalone/apps/pm-studio/server.js` (Dockerfile-CMD).

## E2E (Playwright)
```bash
npm run test:e2e -w @stellwerk/pm-studio   # startet dev-Server, e2e/ läuft
```
Config unverändert aus dem Alt-Repo übernommen; `testDir: ./e2e`,
`webServer: npm run dev`.

## Container / Compose
```bash
docker compose --profile pms config   # valide
docker compose --profile pms up       # baut apps/pm-studio/Dockerfile, Port 3000
```

## CI (Job `pms`, aktiviert durch diesen Import)
`changes`-Filter `apps/pm-studio/**` triggert den `pms`-Job aus #8:
`npm ci` → lint → `tsc --noEmit` → vitest → build. CodeQL scannt jetzt zusätzlich
`javascript-typescript`.

## Definition of Done
- [ ] `npm run dev -w @stellwerk/pm-studio` und `make up` (Profil pms) starten die App
- [ ] Alle Bestandstests grün im Monorepo-CI (pms-Job)
- [ ] Playwright-E2E laufen im Workspace
- [ ] Alt-Repo archiviert, Verweise in beide Richtungen gesetzt
- [ ] Offene Alt-Tasks als [PMS]-Triage-Issue nachgezogen
