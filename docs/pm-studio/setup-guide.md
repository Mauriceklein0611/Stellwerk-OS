---
module: pm-studio
type: doc
status: frozen
imported: 2026-07-08
source: projectmind-os
---

# Setup-Guide: Repository & GitHub einrichten

Einmalige Einrichtung, Schritt für Schritt. Danach läuft alles über den Workflow in `CLAUDE.md`.

## 0. Voraussetzungen

- Node.js ≥ 20 (`node -v`), Git, VS Code
- GitHub CLI installieren und anmelden:
  ```bash
  winget install GitHub.cli   # Windows
  gh auth login               # GitHub.com → HTTPS → Browser-Login
  ```

## 1. Lokales Repo aus diesem Starter-Paket

```bash
# Zip entpacken, dann im Ordner:
cd agentic-pm-studio
git init -b main
git add .
git commit -m "chore: initial project documentation and task structure"
```

## 2. Privates GitHub-Repo erstellen und verbinden

```bash
gh repo create agentic-pm-studio --private --source=. --remote=origin --push
```

Das erstellt das private Repo, verbindet es als `origin` und pusht `main`.

## 3. dev-Branch anlegen

```bash
git checkout -b dev
git push -u origin dev
```

Auf GitHub: **Settings → General → Default branch → `dev`** setzen (PRs zielen dann automatisch auf dev).

## 4. Branch-Schutz einrichten

GitHub → Settings → Branches → „Add branch ruleset" (oder classic protection rule), je einmal für `main` und `dev`:

- ✅ Require a pull request before merging
- ✅ Block force pushes
- Für `main` zusätzlich: ✅ Require status checks to pass (sobald CI existiert, siehe Schritt 7)

Hinweis: In privaten Repos im Free-Plan sind manche Schutzregeln eingeschränkt. Falls nicht verfügbar: Die Regeln gelten trotzdem per Disziplin/CLAUDE.md – Claude Code hält sich daran.

## 5. .gitignore

Liegt nach TASK-001 automatisch bei (create-next-app). Vorab/ergänzend sicherstellen:

```gitignore
node_modules/
.next/
out/
coverage/
.env
.env.*
!.env.example
backend/.venv/
backend/__pycache__/
*.sqlite
*.sqlite3
.DS_Store
playwright-report/
test-results/
```

## 6. Ziel-Ordnerstruktur (Soll-Zustand nach TASK-001)

```
agentic-pm-studio/
├── CLAUDE.md              ← Arbeitsregeln für Claude Code (Repo-Root!)
├── README.md
├── CHANGELOG.md           ← ab erstem Release (v0.1.0)
├── docs/                  ← Projektdokumentation (11 Dateien)
├── tasks/                 ← TASK-001 … TASK-010
├── src/                   ← Next.js App (entsteht in TASK-001)
│   ├── app/(dashboard)/…
│   ├── components/{ui,layout,dashboard,agents,board,workflow}/
│   ├── lib/  store/  types/  data/
├── e2e/                   ← Playwright (ab TASK-006)
├── backend/               ← FastAPI (ab TASK-010)
└── .github/
    └── workflows/ci.yml   ← optional, siehe unten
```

Wichtig: `CLAUDE.md` muss im Repo-Root liegen – Claude Code liest sie dort automatisch beim Start.

## 7. Optional: CI mit GitHub Actions (kostenlos)

`.github/workflows/ci.yml` – läuft bei jedem PR auf dev/main:

```yaml
name: CI
on:
  pull_request:
    branches: [dev, main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run test --if-present
      - run: npm run build
```

Erst nach TASK-001 hinzufügen (vorher gibt es kein package.json).

## 8. Claude Code starten

```bash
cd agentic-pm-studio
claude
```

Erste Anweisung an Claude Code (Beispiel):

> Lies CLAUDE.md und docs/architecture.md. Setze dann tasks/TASK-001-project-setup.md exakt nach dem Workflow in CLAUDE.md um. Erstelle zuerst den Branch, erkläre mir deine Schritte, und erstelle am Ende den PR nach dev.

## 9. Täglicher Ablauf (Kurzfassung)

```
dev pullen → feat/task-00X-Branch → umsetzen → Gate (lint/tsc/test/build)
→ Doku + task-index.md → manuelle Freigabe (testkonzept.md) → push → PR nach dev → Selbst-Review → merge
…am Meilenstein-Ende: PR dev → main → Tag v0.X.0 → CHANGELOG → GitHub Release (gh release create)
```

Details: `CLAUDE.md` und `docs/git-strategy.md`.
