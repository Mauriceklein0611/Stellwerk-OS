---
module: pm-studio
type: doc
status: frozen
imported: 2026-07-08
source: projectmind-os
---

# Git-Strategie

## Branching (main / dev / feature)

- `main` = stabile, versionierte Releases. Nur per PR von `dev`, nur am Meilenstein-Ende.
- `dev` = Integrationsbranch, immer lauffähig. Default-Branch auf GitHub. Nur per PR von Feature-Branches.
- Pro Task ein Branch von `dev`: `feat/task-003-dashboard-ui`, `fix/...`, `docs/...`
- Jeder Merge per Pull Request – auch solo: PR-Beschreibung = Selbst-Review anhand der Akzeptanzkriterien
- Release: PR `dev` → `main`, danach Tag `v0.1.0` (M1) … `v0.5.0` (MVP), `v0.6.0` (erster echter Agent), dann `CHANGELOG.md` und GitHub Release (`gh release create v0.X.0 --title "v0.X.0 – <Name>" --generate-notes`)
- Verbindlicher Ablauf für Claude Code: siehe `CLAUDE.md` im Repo-Root

## Conventional Commits

```
feat(dashboard): add metric cards with dummy data
fix(board): persist column state after reload
docs(tasks): mark TASK-003 as done
test(store): add unit tests for project store
chore: update dependencies
refactor(agents): extract StatusBadge component
```

Regeln: Imperativ, klein, ein Thema pro Commit, Task-ID in Body oder Branch-Namen.

## Workflow pro Task

```bash
git checkout dev && git pull
git checkout -b feat/task-00X-name
# umsetzen, testen, dokumentieren
npm run lint && npx tsc --noEmit && npm run build
git add -p          # bewusst stagen
git commit -m "feat(scope): ..."
# STOPP: manuelle Freigabe des Nutzers einholen (tests/<task-id>/testkonzept.md)
git push -u origin feat/task-00X-name   # erst nach OK des Nutzers
# PR nach dev erstellen (gh pr create --base dev), Selbst-Review, mergen, Branch löschen
```

## Repository

Privat auf GitHub. `.gitignore`: node_modules, .next, .env*, backend/.venv, *.sqlite. Keine Secrets committen (auch nicht „nur lokal").
