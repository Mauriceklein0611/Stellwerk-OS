# PM Studio (`@stellwerk/pm-studio`)

Agentisches Projektmanagement – die erste Fach-App auf dem Stellwerk-Kern.
Next.js 16 (App Router) + React 19, Tailwind v4/shadcn, Zustand, Vitest + Playwright.

## Herkunft (Issue #10)

Diese App wurde aus dem eigenständigen Vorgänger-Repo **projectmind-os**
(Arbeitstitel „agentic-pm-studio", Tags v0.1–v0.5) in dieses Monorepo eingezogen –
**reiner Umzug, keine Feature-Änderung**; nur Pfade/Configs wurden angepasst.

Die vollständige Entwicklungshistorie (Commits/PRs) liegt weiterhin im
archivierten Alt-Repo `Mauriceklein0611/projectmind-os`. Produkt-/Design-Doku:
[`docs/pm-studio/`](../../docs/pm-studio/) (Index dort); historische Snapshots
(Task-Index/-Archiv, Audit, alte Roadmap) unter
[`docs/pm-studio/archive/`](../../docs/pm-studio/archive/).

## Entwicklung

Aus dem Repo-Root (npm-Workspace):

```bash
npm install
npm run dev   -w @stellwerk/pm-studio   # Dev-Server auf http://localhost:3000
npm run build -w @stellwerk/pm-studio   # Produktions-Build (output: standalone)
npm run test  -w @stellwerk/pm-studio   # Vitest (tests/<task-id>/)
npm run test:e2e -w @stellwerk/pm-studio  # Playwright (e2e/)
```

Oder containerisiert über das Compose-Profil: `docker compose --profile pms up`.
