---
module: platform
type: policy
status: current
updated: 2026-07-19
owner: Maurice
related_issues: [61]
---

# Dokumentations-Policy (Docs-as-Code)

Verbindliche Regeln, **wo** welche Wahrheit lebt, **wie** Dokumente ausgezeichnet
werden und **wann** Doku aktualisiert wird. Gilt für Menschen **und** Agenten.
Ergänzt [arbeitssystem.md](arbeitssystem.md) und die eingefrorene
[build-spec.md](build-spec.md).

## 1. Grundsatz

Die verbindliche technische, architektonische, sicherheits-, test- und
betriebsrelevante Dokumentation wird als **Docs-as-Code im Repository** gepflegt.
Eine Person mit einem vollständigen Repo-Klon muss alle nicht vertraulichen
Informationen verstehen können, die für Entwicklung, Architektur, Test und
lokalen Betrieb nötig sind.

Externe Systeme (Notion, Confluence, SharePoint) dürfen später eine
veröffentlichte Ansicht, Managementdarstellungen, Besprechungsnotizen oder
private Betriebsinformationen ergänzen – sie sind **niemals eine zweite
technische Wahrheit**. MCP ist ausschließlich ein Zugriffs-/Suchweg, keine
Dokumentationsquelle.

**Nie im öffentlichen Repo:** Secrets, reale Zugangsdaten, interne Konten,
private Endpunkte, sensible Incident-Details.

## 2. Wahrheitshierarchie

Markdown darf maschinell ableitbare Details **erklären und verlinken**, aber
nicht als zweite manuelle Wahrheit **duplizieren**.

| Information | Verbindliche Quelle |
|---|---|
| HTTP-Endpunkte und Schemas | generiertes OpenAPI (`services/core` → `app/export_openapi.py`) |
| TypeScript-Verträge | `packages/contracts` |
| Datenbankschema | Alembic-Migrationen (`services/core/alembic/versions`) |
| Konfiguration | Settings-Code (`app/settings.py`) + `.env.example` |
| Architekturbegründung | ADR (`docs/platform/adrs/`) |
| tatsächlich implementierte Architektur | aktuelle Architekturdoku (`docs/platform/architecture/`, `current`) |
| Zukunft / Zielbild | [roadmap.md](roadmap.md) (`proposed`) |
| Produktanforderungen | aktives PRD / Release Charter |
| Arbeitsauftrag | GitHub Issue |
| Änderung und Diskussion | Pull Request |
| konkrete Testfälle | Testcode (`tests/`, `*.spec.ts`, `test_*.py`) |
| Abnahmenachweis | Testkonzept (`tests/issue-N/testkonzept.md`) + CI |
| Betriebsverfahren | Produktionshandbuch / Runbooks |
| Releaseänderungen | `CHANGELOG.md` + GitHub Release |

## 3. Frontmatter-Schema

Jede Datei unter `docs/` beginnt mit YAML-Frontmatter. **Pflichtfelder:**

```yaml
---
module: platform          # platform | core | pms | idp | leitstand | rag | flow
type: architecture        # siehe erlaubte Typen unten
status: current           # proposed | current | superseded | frozen
updated: 2026-07-19        # ISO-Datum der letzten inhaltlichen Änderung
---
```

**Optionale Felder:** `applies_to`, `owner`, `related_issues`, `related_adrs`,
`supersedes`, `superseded_by`, `last_verified_release`.

### Erlaubte `status`-Werte

| Wert | Bedeutung |
|---|---|
| `proposed` | Vorgeschlagen / Zielbild – **nicht** als Ist lesen |
| `current` | implementiert und geprüft (die aktuelle Wahrheit) |
| `superseded` | inhaltlich ersetzt (mit `superseded_by`) |
| `frozen` | historische Baseline, bleibt erhalten, wird nicht mehr geändert |

### Erlaubte `type`-Werte (mindestens)

`vision`, `roadmap`, `architecture`, `adr`, `policy`, `prd`,
`release-charter`, `guide`, `reference`, `runbook`, `test-strategy`,
`test-evidence`, `risk-register`.

## 4. Ist-Zustand vs. Zielbild

Architekturdokumentation beschreibt **ausschließlich den implementierten
Ist-Zustand** (`status: current`). Geplante Komponenten werden entweder in der
[roadmap.md](roadmap.md) geführt oder je Seite klar als `proposed`
gekennzeichnet. Nichts aus der Roadmap darf ungekennzeichnet als
Ist-Architektur erscheinen.

**Keine unbelegten Aussagen** wie „vollständig compliant",
„manipulationssicher", „revisionssicher" oder „produktionssicher". Stattdessen
die **nachweisbare Schutzgrenze** präzise benennen (z. B. „App-DB-Rolle ohne
UPDATE/DELETE, kein Schutz gegen privilegierte DBAs").

## 5. ADR-Regeln

ADRs liegen unter `docs/platform/adrs/` (plattformweit) bzw. – sobald nötig –
`docs/<modul>/adrs/`. Status: `proposed` → `accepted` → ggf. `superseded` /
`rejected`. Angenommene ADRs werden **nicht rückwirkend inhaltlich
umgeschrieben**; Änderungen erzeugen ein neues ADR mit `supersedes` /
`superseded_by`. Jedes ADR dokumentiert Kontext, Optionen, Entscheidung,
Konsequenzen und Nicht-Ziele. Vorlage: [templates/adr-template.md](../templates/adr-template.md).

## 6. Pflegeprozess (verbindliche Regel)

> **Wenn Code, Vertrag, Konfiguration, Datenmodell, Sicherheitsgrenze,
> Nutzerverhalten oder Betriebsverhalten geändert werden, wird die betroffene
> Dokumentation im selben PR aktualisiert.**

Diese Regel steht zusätzlich in [CLAUDE.md](../../CLAUDE.md),
[arbeitssystem.md](arbeitssystem.md), dem Issue-Template und dem PR-Template.
Der PR fragt die **Dokumentationsauswirkung** aktiv ab.

## 7. Traceability-Kette

```
Vision → strategisches Ziel → Roadmap-Meilenstein → Release Charter
  → PRD (bei großen Features) → GitHub Issue → ADR (bei tragender Entscheidung)
  → Pull Request → Code/Migration/Vertrag → Testnachweis
  → Betriebs-/Benutzerdoku → CHANGELOG + Release-Evidenz
```

Ein Dokument **referenziert** über Links; Inhalte werden nicht zwischen
mehreren Dokumenten kopiert.

## 8. Verzeichnisregeln

- Verzeichnisse/Dateien werden **nur** angelegt, wenn sie belegbaren Inhalt
  tragen oder als notwendiger Index/Template dienen.
- **Keine** leeren Zukunftsdokumente; **keine** Doku-Verzeichnisse für
  `idp`/`leitstand`/`rag`/`flow`, bevor deren Umsetzung beginnt.
- Bestehende Dokumente werden nur verschoben, wenn echter Nutzen entsteht und
  alle Links sicher aktualisiert werden – zunächst Indizes/Verlinkung statt
  großem Umbau.
- Historische Doku wird **nicht gelöscht**; sie wird `frozen` und bleibt
  nachvollziehbare Evidenz.
