---
module: pm-studio
type: doc
status: current
imported: 2026-07-08
source: projectmind-os
---

# Design-System

## Designrichtung

Dunkles, technisch-professionelles SaaS-Dashboard. Referenzen: Linear (Dichte, Geschwindigkeit), Vercel (Reduktion), Jira/ClickUp (Informationsarchitektur). Eigenständig durch konsequente Status-Farbcodierung der Agenten.

## Farbpalette (Tailwind-Tokens)

| Token | Wert | Verwendung |
|---|---|---|
| `background` | `#0a0a0f` | App-Hintergrund |
| `surface` | `#13131a` | Karten, Sidebar |
| `surface-hover` | `#1b1b24` | Hover |
| `border` | `#26262f` | Linien, Card-Borders |
| `foreground` | `#e7e7ea` | Primärtext |
| `muted` | `#8b8b96` | Sekundärtext |
| `primary` | `#6366f1` (Indigo 500) | Aktionen, aktive Navigation |
| `accent` | `#22d3ee` (Cyan) | Agenten-Highlights |

Status: `success #34d399`, `warning #fbbf24`, `danger #f87171`, `info #60a5fa`, `idle #6b7280`, `running #818cf8` (pulsierend).

### Theme-Strategie (Dark/Light/System, TASK-029)

Die App unterstützt **Dark (Default)**, **Light** und **System**. Tokens sind in
`globals.css` zweigeteilt: `:root` trägt die **Light-Palette**, `.dark` die
**Dark-Palette**. Die Klasse `.dark` an `<html>` wird zur Laufzeit gesetzt:

- **No-Flash:** ein Inline-Skript (`themeInitScript` aus `src/lib/theme.ts`) liest
  die Präferenz aus `localStorage` (`pm-studio-settings`) **vor** dem ersten Paint
  und setzt `.dark`. Default Dark.
- **Laufzeit:** `ThemeApplier` (in `layout.tsx`) hält die Klasse synchron und folgt
  bei `system` per `matchMedia` live der OS-Einstellung.
- **Store:** `useSettingsStore` (persist, keine neue Dependency) hält `theme`,
  `defaultBoardView` und `motion`.

Light-Palette (helle Gegenstücke, Status-Töne kräftiger für Kontrast auf hellem Grund):

| Token | Light | Dark |
|---|---|---|
| `background` | `#f7f7fa` | `#0a0a0f` |
| `surface` | `#ffffff` | `#13131a` |
| `surface-hover` | `#f0f0f4` | `#1b1b24` |
| `card` / `popover` | `#ffffff` | `#13131a` |
| `border` / `input` | `#e3e3ea` | `#26262f` |
| `foreground` | `#1a1a22` | `#e7e7ea` |
| `muted` | `#5f5f6b` | `#8b8b96` |
| `secondary` | `#ececf1` | `#1b1b24` |
| `primary` | `#6366f1` | `#6366f1` |
| `accent` | `#0891b2` | `#22d3ee` |
| `destructive` | `#dc2626` | `#f87171` |
| `success` | `#059669` | `#34d399` |
| `warning` | `#d97706` | `#fbbf24` |
| `danger` | `#dc2626` | `#f87171` |
| `info` | `#2563eb` | `#60a5fa` |
| `idle` | `#6b7280` | `#6b7280` |
| `running` | `#6366f1` | `#818cf8` |

## Typografie

- UI: **Inter** (via `next/font`), Basis 14px, Headlines 600
- Code/IDs/Metriken: **JetBrains Mono**
- Zahlen im Dashboard: `tabular-nums`

## Komponenten-Patterns

- **MetricCard**: Label (muted, 12px, uppercase) + Wert (28px, mono) + Trend-Badge
- **StatusBadge**: Punkt + Text, Farben aus Status-Map, eine zentrale Komponente
- **ProgressBar** (`src/components/ui/ProgressBar.tsx`): schmaler Balken (`value/max`,
  optional `status`), Spur `bg-secondary`, Füllung **ausschließlich** über die
  StatusBadge-Tokens (`STATUS_STYLES.dot`, single-sourced). Wert/`max` werden auf
  `[0, max]` geklemmt, `max <= 0` ⇒ leer (keine Division durch 0); Überlast klemmt
  optisch auf 100 % (Überlast über `danger`-Status + Caller-Label sichtbar).
  Barrierearm: `role="progressbar"` + `aria-valuenow/min/max` + `aria-label`.
  Eingesetzt für Sprint-Fortschritt (donePt/plannedPt) und Personen-Auslastung
  (assignedPt/capacityPt) in `SprintSection` (TASK-059; ersetzt `SprintColumn`).
- **TagChips** (`src/components/tags/TagChips.tsx`): kompakte Label-Pillen für
  Karten/Listenzeilen (TASK-031). Farben **ausschließlich** aus der festen
  Token-Palette in `src/lib/tags.ts` (`TAG_COLOR_STYLES`: `primary | accent |
  info | success | warning | danger` → `bg-<token>/10` + `text-<token>`, gleiches
  Rezept wie `<StatusBadge>`, **keine** Ad-hoc-Hex). Überlauf ab `max` (Karte 3,
  Liste 2) klappt in eine `+N`-Pille (`bg-secondary`). Verwaltung im `TagManager`
  (Dialog auf dem Board): anlegen/umbenennen/umfärben/löschen; Löschen entkoppelt
  den Tag aus allen Items (`useTagStore.removeTag` → `useBoardStore.detachTag`).
- **DueBadge** (`src/components/board/DueBadge.tsx`, TASK-034): kompakte Fälligkeits-
  Pille (`DD.MM.` mit Kalender-Icon) auf Karte und in der Listenspalte „Fällig". Die
  Klassifizierung ist reine Logik (`src/lib/due.ts`: `dueStatus`/`isOverdue`):
  **überfällig** (Termin < heute, offen) → `danger`-, **heute** → `warning`-Ton,
  alles andere bleibt neutral (`bg-secondary`). Erledigte Tasks sind nie überfällig.
  Farben kommen single-sourced aus `STATUS_STYLES` (gleiche Quelle wie `<StatusBadge>`),
  keine Ad-hoc-Hex. „Heute" wird erst clientseitig nach dem Hydration-Gate bestimmt
  (SSR-sicher, gleiches Muster wie `isActiveSprint`).
- **Inline-Edit-Zellen** (`src/components/board/cells/`, TASK-030): Muster für die
  Board-Listenansicht. `EditableTextCell` zeigt den Wert als Button und wird beim
  Klick zum Inline-`<Input>` (Enter/Blur **commit**, Esc **abbrechen**; der Caller
  trimmt/validiert den Rohstring – z. B. PT ≥ 0, leer = kein Wert).
  `EditableSelectCell` rendert einen randlosen `<Select>`-Trigger mit der aktuellen
  Option (StatusBadge für Status/Priorität) und ein Dropdown zum Ändern; `disabled`
  zeigt einen statischen Platzhalter (z. B. Sprint ohne Story). **Beide stoppen die
  Klick-Propagation**, damit Inline-Edit nicht den Zeilen-`TaskDialog` öffnet
  (Zellklick editiert, übrige Zeile öffnet den Dialog).
- **AgentCard**: Icon, Name, Rolle, Status-Badge, letzter Lauf, Mini-Sparkline optional
- **Sidebar**: 240px, Gruppen (Overview / Projects / Agents / Delivery), aktiver Punkt mit `primary`-Indikator links
- **Command-Bar**: ⌘K (shadcn Command), Suche + Navigation + Aktionen
- **Board (Kanban)**: Spalten teilen sich die Breite (`flex-1`, Min-Breite ~13rem),
  bei sehr schmalen Screens horizontaler Scroll-Fallback. Jede Spalte hat oben
  einen farbigen Status-Streifen (Akzent **ausschließlich** aus dem Status der
  Phase → StatusBadge-Tokens), einen schmalfesten Kopf (Titel kürzt mit „…") mit
  Count- und PT-Summen-Pille und einen intern scrollenden Körper (`ScrollArea`).
  Ruhige Pillen/Chips/Avatare: `bg-secondary` + lesbarer Text — **nie** `bg-muted`
  mit `text-muted-foreground` (gleiche Farbe → unsichtbar). Optionaler WIP-Hinweis
  aus dem `wipLimit` der Phase als `warning`-StatusBadge.
- **Phasen sind Daten (TASK-032):** Die Board-Spalten sind seit TASK-032 frei
  konfigurierbar und liegen als `BoardColumnDef { id, label, status, order,
  wipLimit?, isTerminal }` im `useBoardColumnsStore` (persist
  `pm-studio-board-columns`). **Einzige Quelle** für Reihenfolge, Label,
  Status-Akzent und WIP-Limit pro Phase – sie ersetzt die früheren drei
  Konstanten `BOARD_COLUMNS`/`BOARD_COLUMN_STATUS`/`BOARD_WIP_LIMITS`. Defaults in
  `src/lib/board.ts` (`DEFAULT_BOARD_COLUMNS`), CRUD über den `ColumnManager`
  („Spalten verwalten"). Genau eine Phase ist terminal (`done`); mind. eine
  terminale Phase ist erzwungen.

## Animationen

Dezent: 150–200 ms ease-out für Hover/Öffnen, Pulse nur für `running`-Status, keine Page-Transitions im MVP. `prefers-reduced-motion` respektieren – mit Override in den Einstellungen (`motion: system | full | reduced`, TASK-029). `useReducedMotion` kombiniert Media-Query und Override; `system` folgt dem OS, `full`/`reduced` erzwingen den Wert.

## Layoutraster

- Content max-width 1440px, Padding 24px
- Dashboard: 12-Spalten-Grid, Karten 3/4/6 Spalten
- Breakpoints: optimiert ≥1280px, brauchbar ≥768px (Sidebar → Sheet)

## UI-Sprache & Glossar (TASK-066)

Die Oberfläche ist **durchgängig deutsch** (Navigation, Seitenköpfe, Buttons, Empty-States, Labels). Doku deutsch, Code/Commits/Bezeichner englisch. Bewusste Abweichung von der ursprünglichen PRD-Empfehlung „UI englisch" – Begründung in `docs/product-requirements.md`.

**Etablierte Scrum-/Kanban-/PM-Fachbegriffe bleiben unübersetzt** (im Deutschen üblich, Übersetzung schafft eher Reibung):

| Begriff | Bleibt englisch, weil |
| --- | --- |
| Backlog, Epic, Story, Task | Scrum-/Kanban-Standardvokabular |
| Sprint(s), Board, Release(s) | Scrum-/Kanban-Standardvokabular |
| Ceremony/Ceremonies (Review, Retro) | Scrum-Zeremonien; Sammelbegriff in agilen Teams etabliert |
| Velocity | Scrum-Kennzahl |
| Workflow, Dashboard, Team | im Deutschen etablierte Lehnwörter |

**Übersetzt** wurde generisches UI-Chrome ohne Fachbegriff-Status, u. a.: Overview → Übersicht, Projects → Projekte, Agents → Agenten, Delivery → Umsetzung, New Idea → Neue Idee, Assignee → Zuständig, Owner → Verantwortlich, Close → Schließen.

Neue UI-Texte: **deutsch**; neue Fachbegriffe nur dann englisch belassen, wenn sie – wie oben – in agilen Teams als Anglizismus etabliert sind, und hier ergänzen.
