# Testkonzept – Issue #2: GitHub-Arbeitssystem verifizieren

## Automatisiert / prüfbar ohne Board

| # | Schritt | Erwartetes Ergebnis |
|---|---|---|
| 1 | `.github/ISSUE_TEMPLATE/task.yml` + `config.yml` im Repo | „New issue" zeigt nur das Task-Formular; Blank-Issues deaktiviert |
| 2 | YAML-Lint der Workflows (`.github/workflows/label-guard.yml`) | Gültige Action-Syntax; `permissions: issues: write` gesetzt |
| 3 | **Label-Wächter, negativ:** neues Issue ohne `module:*`-Label anlegen | Action setzt automatisch `triage` + Hinweis-Kommentar (einmalig) |
| 4 | **Label-Wächter, positiv:** `module:*`-Label vergeben | `triage` wird automatisch wieder entfernt; kein doppelter Kommentar |

### Manuelle Klick-Checkliste Label-Wächter

```bash
# Test-Issue ohne Modul-Label anlegen (umgeht das Formular bewusst):
gh issue create --title "[TEST] label-guard" --body "kein Modul-Label"
# Erwartung: nach Action-Lauf hat das Issue 'triage' + Hinweis-Kommentar.
gh issue edit <N> --add-label "module:platform"
# Erwartung: 'triage' verschwindet automatisch.
gh issue close <N>
```

## Board-abhängig (manuelle UI-Verifikation, nach Board-Erstellung)

| # | Schritt | Erwartetes Ergebnis |
|---|---|---|
| 5 | Test-Issue über das Formular anlegen | Landet mit korrekten Labels auf dem Board in **Backlog** |
| 6 | PR mit `Closes #<Test>` öffnen | Test-Issue wandert nach **In Review** |
| 7 | PR mergen | Test-Issue schließt und landet in **Done** |

## Definition of Done

- [ ] Issue-Templates aktiv (Blank-Issues aus)
- [ ] Label-Wächter-Action greift (Checks 3 + 4 grün)
- [ ] `docs/platform/arbeitssystem.md` Abschnitt „So sieht es live aus" vorhanden
- [ ] Board-Checks 5–7 durch Nutzer verifiziert (nach Board-Setup)
