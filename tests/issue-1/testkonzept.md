# Testkonzept – Issue #1: Monorepo-Grundgerüst & Doku-Umzug

Dieses Issue liefert reine Struktur/Doku (kein ausführbarer Code). Das
Testkonzept ist daher eine **manuelle Struktur-Checkliste** mit erwartetem
Ergebnis. Automatisierte Tests entstehen ab Issue #3 (Kern).

## Manuelle Checks

| # | Schritt | Erwartetes Ergebnis |
|---|---|---|
| 1 | `npm install` im Repo-Root | Läuft fehlerfrei durch; leere Workspaces (`apps/*`, `packages/*`) sind ok; `package-lock.json` entsteht |
| 2 | `ls apps services/core packages/contracts docs/{platform,core,pm-studio,runbooks} monitoring scripts` | Alle Ordner existieren |
| 3 | `ls docs/platform` | Enthält `vision.md`, `arbeitssystem.md`, `build-spec.md`, `glossar.md` |
| 4 | Frontmatter-Check je Datei unter `docs/` | Jede `.md` beginnt mit `---`-Block und Feldern `module`, `type`, `status`, `updated` |
| 5 | README öffnen | Erklärt auf ≤1 Bildschirmseite, was Stellwerk ist; verlinkt `docs/platform/build-spec.md` und die Modul-Landkarte |
| 6 | `CHANGELOG.md` öffnen | Enthält `[Unreleased]`-Sektion mit Keep-a-Changelog-Kopf und Eintrag zu #1 |
| 7 | `.gitignore` prüfen | `.env` ignoriert, `.env.example` ausgenommen; Node- und Python-Artefakte ignoriert |

## Frontmatter-Verifikation (Kommando)

```bash
# Muss für jede Datei die 4 Felder zeigen:
for f in docs/**/*.md docs/*.md; do echo "== $f =="; sed -n '1,6p' "$f"; done
```

## Definition of Done

- [ ] Alle 7 manuellen Checks bestanden
- [ ] `npm install` grün
- [ ] Alle Dateien unter `docs/` haben gültiges Frontmatter
- [ ] PR mit `Closes #1` erstellt
