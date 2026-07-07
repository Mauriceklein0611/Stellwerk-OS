---
module: platform
type: guide
status: current
updated: 2026-07-07
---

# Stellwerk Arbeitssystem v2 – Tickets, Doku und Wissensfluss

> Ergänzt `vision-stellwerk.md`. Regelt, wie das bewährte Task-/Doku-System aus
> PM Studio für das modulare Monorepo umgebaut wird: Tickets statt Task-Dateien,
> Doku als Code je Modul, und ein Wissensfluss, der später direkt ins RAG-Modul
> mündet.

---

## 1. Grundprinzip: drei Ströme, drei Orte

Das heutige System vermischt drei Dinge in Markdown-Dateien: **Arbeit**
(tasks/TASK-XXX.md), **Wissen** (docs/) und **Historie** (tasks-archive.md,
task-index-Verlauf). Der Umbau trennt sie sauber:

| Strom | Wesen | Ort (neu) | Lebensdauer |
|---|---|---|---|
| **Arbeit** | Workflow-Zustand: was ist zu tun, wer, wie weit | Ticketsystem (Issues + Board) | vergänglich – nach Done nur noch Referenz |
| **Wissen** | Dauerhaft Gültiges: Architektur, Entscheidungen, Verträge, Anleitungen | `docs/` im Repo (Docs as Code, versioniert, PR-Review) | gepflegt, solange wahr |
| **Historie** | Was wann geliefert wurde | `CHANGELOG.md` + GitHub Releases + geschlossene Tickets | append-only, für immer |

Die Regel dahinter: **Ein Ticket beschreibt eine Änderung; ein Dokument
beschreibt einen Zustand.** Alles, was nach dem Merge noch stimmt, gehört in die
Doku – alles, was nur den Weg dorthin beschreibt, bleibt im Ticket.

---

## 2. ADR-002: Wahl des Ticketsystems

**Kontext.** Das Task-Repo wächst mit der Plattform auf hunderte Aufgaben über
sechs Module. Markdown-Dateien in `tasks/` skalieren dafür nicht (kein Board,
keine Filter über Module, Statuspflege von Hand, Merge-Konflikte am Index).
Gewünscht: eine Ticketplattform mit API, aus der Claude Code Tickets zieht,
bearbeitet und aktualisiert – kostenlos für eine Einzelperson.

**Geprüfte Optionen.**

| Option | Kosten/API | Stärken | Schwächen für diesen Fall |
|---|---|---|---|
| **GitHub Issues + Projects v2** | kostenlos, unbegrenzte Issues; `gh` CLI + GraphQL-API; Issue-Formulare, Labels, Milestones, Board mit Custom Fields | Tickets leben **neben dem Code**: `Closes #123` schließt automatisch beim Merge, Branch/PR/CI/Ticket eine Kette; `gh` ist in deinem Claude-Code-Workflow bereits erlaubt und erprobt; keine zweite Identität, kein Sync | Kein „echtes" Enterprise-PM-Tool im Lebenslauf-Sinne; Sprint-Funktionen rudimentär (über Iterations-Feld lösbar) |
| **Jira Cloud Free** | kostenlos bis 10 Nutzer; REST-API in allen Plänen enthalten (Free mit engeren Rate-Limits – für eine Person irrelevant); Atlassian bietet einen offiziellen Remote-MCP-Server, den Claude direkt ansprechen kann | Echte Jira-Erfahrung (CV-relevant, Deka-Anschluss); Boards/Sprints/JQL vollwertig | **Medienbruch**: Tickets weit weg vom Code, kein natives `Closes`-Verhalten, PR-Verlinkung nur über Marketplace-App; zweite Auth für jede Automatisierung; Free-Plan-Automatisierungen stark limitiert; Atlassian stellt die API-Limits 2026 gerade auf ein Punktemodell um – beweglicher Untergrund |
| Linear Free | kostenlos, ~250 aktive Issues, gute API + MCP | Schnellste UX | Issue-Deckel; wieder ein Fremdsystem; wenig Enterprise-Erzählwert |
| OpenProject/Redmine (self-hosted) | kostenlos, volle API | Passt zum Self-Host-Ethos | Betriebsaufwand für ein Werkzeug, das dich nicht lehrt, was du lernen willst |
| **PM Studio selbst** | eigenes Produkt | Maximales Dogfooding | Heute noch ohne API/Persistenz-Backend – als *Endzustand* richtig, als Start falsch |

**Entscheidung.** **GitHub Issues + Projects v2 als führendes System** (Single
Source of Truth für Arbeit), mit zwei bewussten Ergänzungen:

1. **Jira Free als optionaler Spiegel, nicht als Quelle.** Wenn du
   Jira-Praxis fürs Profil willst, wird Jira als *unidirektionales Sync-Ziel*
   angebunden (GitHub → Jira via Action/Script über die REST-API). Das ist
   gleichzeitig der erste **echte** Konnektor des Flow-Moduls – aus
   `fake_jira_api` wird ein realer Integrationsfall. Zwei führende Systeme
   („mal hier gepflegt, mal da") sind das einzige echte Risiko dieses Setups
   und bleiben verboten.
2. **Dogfooding als Endzustand (Phase 3):** Sobald der Kern eine API hat,
   bekommt PM Studio einen GitHub-Issues-Konnektor und wird selbst zur
   Arbeitsoberfläche über den Tickets – die Plattform verwaltet sich dann
   sichtbar selbst, GitHub bleibt darunter das Speichersystem.

**Begründung der Kernentscheidung.** Der Wert deines heutigen Systems liegt in
der *ununterbrochenen Kette*: Task → Branch → Commits → Gate → PR → Merge →
Archiv. GitHub Issues erhält diese Kette und automatisiert sie sogar
(`Closes #123`), Jira zerschneidet sie. Und: Claude Code arbeitet mit `gh`
heute schon; es gibt schlicht keinen Reibungsgewinn, der den Medienbruch
rechtfertigt.

---

## 3. Ticket-Anatomie: dein Task-Format wird zum Issue-Formular

Das bewährte Task-Format zieht 1:1 in **GitHub Issue Forms**
(`.github/ISSUE_TEMPLATE/task.yml`) um – damit erzwingt das System die
Struktur, die bisher Disziplin erforderte:

- **Titel:** `[PMS] Backlog-Entities – Epic & Story als Store-Entitäten`
  (Modul-Kürzel vorn, weil Issue-Nummern global je Repo sind)
- **Formularfelder:** Ziel · Kontext · Betroffene Dateien · Technische
  Anforderungen · Akzeptanzkriterien (Checkboxen) · Testkonzept-Hinweis ·
  Abhängigkeiten (Issue-Referenzen `#123`)
- **Pflicht-Metadaten** (Dropdowns im Formular → Labels):
  - `module:` `platform` · `core` · `pms` · `idp` · `leitstand` · `rag` · `flow`
  - `type:` `feat` · `fix` · `docs` · `chore` · `refactor` · `test`
  - `prio:` `p0` … `p3` — `size:` `S` · `M` · `L`
- **Milestone** = Plattform-Release (`v0.1 Foundation`, `v0.2 Erster Agent` …)

**Das Projects-v2-Board „Stellwerk"** ist der Ersatz für `task-index.md`:
Status-Feld (Backlog → Ready → In Progress → In Review → Done), Iteration-Feld
(deine persönlichen Wochen-Sprints), gespeicherte Views je Modul und eine
„Ready"-View als Claude-Code-Einstieg. Eine kleine Action fügt neue Issues
automatisch dem Board hinzu und setzt Status aus Ereignissen (PR verlinkt →
In Review; PR gemergt → Done).

**Nummern & Referenzen.** Die Issue-Nummer ist die neue Task-ID – global im
Monorepo, das Modul steckt im Label/Titel. Branch-Schema:
`feat/123-pms-backlog-entities`; Commits `feat(backlog): … (#123)`; PR-Text
`Closes #123`. Die historischen TASK-001–066 bleiben unverändert in der
PM-Studio-Doku; offene Alt-Tasks werden beim Umzug als Issues neu angelegt mit
Herkunftszeile („migriert aus TASK-05x, Originaltext im Anhang").

---

## 4. Claude-Code-Workflow v2 (die neue CLAUDE.md-Schleife)

Der Arbeitszyklus bleibt identisch – nur die Quelle wechselt von Dateien zu
Tickets. Konkrete Kommandos, damit die CLAUDE.md sie verbindlich machen kann:

1. **Ticket ziehen:** `gh issue list --label "module:pms" --label "prio:p0" --state open`
   bzw. die „Ready"-View; bei explizitem Auftrag direkt `gh issue view 123 --comments`
   (Kommentare mitlesen – dort stehen Hand-offs und Entscheidungen).
2. **Start markieren:** `gh issue edit 123 --add-assignee @me` + Status
   „In Progress" (Board-Automation oder `gh project item-edit`).
3. **Branch + Umsetzung + Qualitäts-Gate:** unverändert (Lint, tsc/ruff,
   Tests, Build; Testkonzept in `tests/issue-123/`).
4. **Akzeptanzkriterien abhaken:** direkt im Issue-Body (Checkboxen) via
   `gh issue edit 123 --body-file …` oder Web – der Fortschritt ist damit
   öffentlich sichtbar statt lokal.
5. **PR:** `gh pr create --base dev` mit `Closes #123`; CI abwarten, mergen –
   das Issue schließt sich selbst.
6. **Abschlusskommentar statt tasks-archive:** Der bisherige, wertvolle
   „Umsetzung (Ist-Stand)"-Block wird zum **letzten Kommentar auf dem Issue**
   (gleiches Format: was gebaut, welche Dateien, Entscheidungen, Tests,
   Nebenbefunde). Damit bleibt die Detailhistorie durchsuchbar am Ticket –
   `tasks-archive.md` wird eingefroren und nicht fortgeschrieben.
7. **Hand-off zwischen Chatfenstern:** Die TODO.md-Routine wird durch einen
   **„Stand"-Kommentar am Issue** ersetzt (exakte nächste Schritte, offene
   Edge-Cases). Eine schlanke TODO.md darf als reiner Zeiger bleiben
   („aktuell: #123, siehe letzter Stand-Kommentar") – Inhalte werden nicht
   dupliziert.
8. **Nebenbefunde:** nicht mehr als Notiz im Chat, sondern sofort
   `gh issue create` mit Label `triage` – das „übelst große Task-Repo" füllt
   sich dadurch von selbst, ohne den aktuellen Scope zu verletzen.

Unverändert gelten: ein Ticket pro Branch, nie direkt auf `dev`/`main`, keine
AK-Änderung um „grün zu werden", Meilenstein-Check nach Merge.

---

## 5. Doku-System: Docs as Code, je Modul geschnitten

### Baumstruktur

```
docs/
├── platform/                  ← gilt für alles
│   ├── vision.md              (vision-stellwerk.md)
│   ├── arbeitssystem.md       (dieses Dokument)
│   ├── modul-vertrag.md
│   ├── engineering-standards.md   (Docker/CI/Tests/Security/Observability)
│   ├── glossar.md             (Stellwerk-Begriffe: Signal, Fahrstraße, Leitstand …)
│   └── adr/                   ← plattformweite ADRs: ADR-001 Name, ADR-002 Tickets, …
├── core/
│   ├── architecture.md        (Dienste, Datenmodell, API-Überblick)
│   ├── api/                   (generierte OpenAPI-Referenz)
│   └── adr/                   (CORE-ADR-001 …)
├── pm-studio/                 ← bestehende /docs ziehen hierher um
│   ├── product-requirements.md, architecture.md, agent-system.md, …
│   ├── task-index.md          (eingefroren, Kopf-Hinweis „historisch, ersetzt durch Board")
│   └── tasks-archive.md       (eingefroren)
├── idp/ · leitstand/ · rag/ · flow/   ← gleiche Grundausstattung je Modul
└── runbooks/                  ← Betrieb: Installation, Backup/Restore, Troubleshooting
```

### Dokumenttypen-Matrix (was lebt wo)

| Typ | Ebene | Regel |
|---|---|---|
| Vision, Modul-Vertrag, Engineering-Standards, Glossar | platform | ändern nur per PR mit Begründung |
| ADR | platform **und** je Modul | Plattform-ADRs für Querschnitt (Name, Ticketsystem, Auth-Modell); Modul-ADRs für Lokales (z. B. „PMS: Stories als Entities"). Nummernkreise getrennt: `ADR-###` vs. `PMS-ADR-###` |
| PRD + Architektur | je Modul | Pflichtausstattung laut Modul-Vertrag |
| API-Referenz | core (+ Module mit API) | generiert aus OpenAPI, nie von Hand |
| Testkonzepte | `tests/issue-###/` im Modulcode | bleibt beim Code, nicht in docs/ |
| Runbooks | platform | eine Anleitung pro Betriebsfall |
| Design-System | `packages/ui/docs/` | wandert zum geteilten UI-Paket |
| CHANGELOG | Repo-Wurzel | Keep-a-Changelog, ein Block je Plattform-Release, gruppiert nach Modul |

### Frontmatter-Konvention (die RAG-Vorbereitung)

Jede Doku-Datei beginnt ab dem Umzug mit YAML-Frontmatter:

```yaml
---
module: pm-studio        # platform | core | pm-studio | idp | …
type: architecture       # vision | prd | architecture | adr | runbook | guide
status: current          # current | superseded | frozen
updated: 2026-07-05
---
```

Das kostet beim Schreiben nichts und ist später die Metadaten-Grundlage des
RAG-Moduls: Filterung nach Modul, Ausblenden von `superseded`, Frische-Ranking
über `updated`.

---

## 6. Wissensfluss ins RAG-Modul (Dogfooding)

Wenn das Knowledge-/RAG-Modul kommt, ist die eigene Plattform ihr erster
Anwendungsfall – der Index speist sich aus genau definierten Quellen:

**Indexiert wird:** `docs/**` (mit Frontmatter-Metadaten), alle ADRs,
`CHANGELOG.md`, Modul-READMEs, `tests/**/testkonzept.md`, sowie **geschlossene
Issues samt Abschlusskommentar** (nächtlicher Export über `gh api` nach
`data/knowledge/issues/*.json` – damit wird die Arbeitshistorie durchsuchbar:
„Warum wurde das Backlog auf Entities umgestellt?" findet Ticket + ADR).

**Nicht indexiert wird:** Quellcode (später eigener Code-Index mit anderem
Chunking), `.env`/Secrets, offene Issues (Workflow-Rauschen), eingefrorene
Alt-Dokumente nur mit `status: frozen`-Abwertung.

**Chunking-Regel:** entlang der Markdown-Überschriften, Frontmatter als
Metadaten je Chunk, Quellenangabe = Dateipfad + Überschrift bzw. Issue-URL.
Damit beantwortet das RAG-Modul Fragen über die Plattform **mit zitierfähigen
Quellen** – die Demo schlechthin für Bewerbungsgespräche.

---

## 7. Automatisierung (klein, aber echt)

Vier GitHub-Actions genügen – mehr wäre Selbstzweck:

1. **Board-Sync:** neues Issue → Projekt „Stellwerk", Status Backlog; PR
   verlinkt → In Review; Merge → Done.
2. **Label-Wächter:** Issue ohne `module:`-Label bekommt `triage` und einen
   Hinweis-Kommentar.
3. **Changelog-Gate:** PR nach `main` (Release) prüft, ob `CHANGELOG.md`
   angefasst wurde.
4. **Issue-Export:** nightly `gh api`-Dump geschlossener Issues für den
   späteren RAG-Index (bis dahin einfach als Artefakt gespeichert).

Optional als Flow-Modul-Lernprojekt (siehe ADR-002): **Jira-Spiegel-Action** –
bei Issue-Änderung REST-Call an die Jira-Cloud-Free-Instanz (Projekt „STW"),
Felder gemappt, Richtung strikt GitHub → Jira. Aufwand ~1 Tag, Ertrag: echte
Jira-API-Erfahrung + demonstrierter Enterprise-Konnektor.

---

## 8. Migrationsplan

**Phase 0 – jetzt (kein Umbau):** Welle TASK-056–066 wird im bestehenden
System fertig gebaut. Ein laufendes Rennen wechselt nicht das Pferd.

**Phase 1 – mit dem Monorepo (CORE-Start):** Issue-Formulare + Labels +
Milestones + Projekt-Board anlegen; offene Alt-Tasks als Issues migrieren;
`docs/` in die Modulstruktur umziehen (git mv, Links fixen, Frontmatter
ergänzen); `task-index.md`/`tasks-archive.md` einfrieren; CLAUDE.md auf den
Workflow v2 umschreiben (Abschnitt 4 ist die Vorlage). Umfang: ein Wochenende.

**Phase 2 – Automatisierung:** die vier Actions aus Abschnitt 7; optional
Jira-Spiegel.

**Phase 3 – Dogfooding:** PM Studio erhält über den Kern einen
GitHub-Issues-Konnektor (Issues ↔ Backlog-Items gemappt, Provenienz `github`);
die Plattform wird zur Oberfläche ihrer eigenen Entwicklung. GitHub bleibt
Speicher- und Wahrheitsschicht – PM Studio wird Sicht- und Agentenschicht
(der PO-Agent schlägt dann z. B. Ticket-Zuschnitte direkt als Issues vor).

---

## 9. Was dieses Setup dir erzählt (Bewerbungs-Blick)

Auch der Arbeitssystem-Umbau selbst ist ein Baustein: Du kannst begründen,
warum Arbeit und Wissen getrennte Systeme brauchen (Issues vs. Docs as Code),
warum Tickets beim Code liegen sollten (Traceability-Kette bis in die CI),
wie man ein Fremdsystem richtig anbindet (unidirektionaler Spiegel statt
zweiter Wahrheit) – und am Ende zeigst du ein Produkt, das seine eigene
Entwicklung verwaltet. Das ist dieselbe Diskussion, die Unternehmen bei
„Octane vs. Jira vs. GitHub" real führen, nur dass du sie mit einer
funktionierenden Antwort beendest.

---

## 10. So sieht es live aus (Ist-Stand, verbindliche Kommandos)

Dieser Abschnitt dokumentiert das real eingerichtete System (Issue #2).

### Labels, Milestone, Issues

Angelegt per `scripts/bootstrap-github.sh` (idempotent):

- **Module:** `module:platform|core|pms|idp|leitstand|rag|flow`
- **Typen:** `type:feat|fix|docs|chore|refactor|test`
- **Priorität:** `prio:p0|p1|p2|p3` · **Größe:** `size:S|M|L` · **`triage`**
- **Milestone:** `v0.1 Foundation` mit den zwölf Start-Issues.

```bash
gh issue list --milestone "v0.1 Foundation"      # Backlog des Releases
gh issue list --label "module:core" --state open # je Modul
gh issue view 3 --comments                        # Stand/Hand-off IMMER mitlesen
```

### Issue-Formular erzwingt das Task-Format

`.github/ISSUE_TEMPLATE/task.yml` verlangt Modul/Typ/Priorität/Größe/Ziel/
Anforderungen/AK als Pflichtfelder; `config.yml` setzt
`blank_issues_enabled: false` – leere Issues sind damit deaktiviert, jedes neue
Issue folgt dem Stellwerk-Format.

### Label-Wächter (Automation)

`.github/workflows/label-guard.yml` prüft bei jedem Issue-Event: fehlt ein
`module:*`-Label, wird automatisch `triage` gesetzt und ein Hinweis-Kommentar
angelegt. Sobald ein Modul-Label vergeben wird, entfernt sich `triage` wieder.

### Projects-v2-Board (manueller UI-Schritt)

Das Board „Stellwerk" mit Status-Feld **Backlog → Ready → In Progress → In
Review → Done** wird einmalig in der GitHub-UI angelegt (Projects-v2-Workflows
sind nicht per API/CLI setzbar). Zu aktivierende Built-in-Workflows:

- **Auto-add to project** – neues Issue landet automatisch im Board (Backlog).
- **Item added → Status: Backlog** (Startspalte).
- **Pull request linked/merged → In Review bzw. Done.**
- **Item closed → Done.**

Verifikation (AK Issue #2): Test-Issue über das Formular anlegen → erscheint mit
korrekten Labels in *Backlog*; PR mit `Closes #N` schiebt es nach *In Review*
und schließt es beim Merge (→ *Done*).
