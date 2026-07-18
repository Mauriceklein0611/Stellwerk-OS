/**
 * Central domain types. UI never hard-codes data – it consumes these shapes
 * from src/data/*. Status colors are driven exclusively by StatusType via the
 * <StatusBadge> component (single source, see docs/design-system.md).
 */

/** Canonical status values. Each maps to one design-system color token. */
export type StatusType =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "idle"
  | "running";

/** Trend indicator for a metric card. */
export type Trend = {
  /** Human-readable delta, e.g. "+2" or "-1". */
  value: string;
  direction: "up" | "down" | "flat";
};

export type Project = {
  id: string;
  name: string;
  /** Completion in percent (0–100). */
  progress: number;
  status: StatusType;
};

export type Task = {
  id: string;
  title: string;
  status: StatusType;
};

export type Risk = {
  id: string;
  title: string;
  severity: StatusType;
};

export type Agent = {
  id: string;
  name: string;
  role: string;
  status: StatusType;
};

export type AgentRun = {
  id: string;
  /** Display name of the agent that ran. */
  agent: string;
  /** Project the run belongs to. */
  project: string;
  status: StatusType;
  /** ISO 8601 timestamp; rendered as relative time. */
  timestamp: string;
};

/**
 * Eine einzelne Nachricht im Agenten-Chat (TASK-060, siehe docs/agent-system.md).
 * Der Idee-Agent arbeitet dialogisch: Nutzer beschreibt, Agent stellt Rückfragen.
 */
export type AgentMessage = {
  role: "user" | "agent";
  text: string;
  /** ISO 8601 timestamp. */
  at: string;
};

/**
 * Eine dialogische Agenten-Konversation (TASK-060, docs/agent-system.md). Erst
 * auf explizite Bestätigung („Entwurf erstellen") entsteht das Artefakt.
 */
export type AgentConversation = {
  id: string;
  projectId: string;
  /** Welches Artefakt am Ende entstehen soll (z. B. „draft"). */
  targetArtifactType: string;
  messages: AgentMessage[];
};

/** One point of a metric's sparkline series. */
export type MetricSeriesPoint = {
  i: number;
  value: number;
};

/** A single metric card on the dashboard. */
export type Metric = {
  id: string;
  label: string;
  value: number;
  trend: Trend;
  /** Recent history rendered as a sparkline. */
  series: MetricSeriesPoint[];
};

/** A row in the status grid (Tests / CI/CD / Quality / Reviews). */
export type StatusCheck = {
  id: string;
  label: string;
  status: StatusType;
  detail: string;
};

/** Share of tasks in a given status (donut chart). */
export type TaskStatusSlice = {
  status: StatusType;
  label: string;
  count: number;
};

/** Velocity per sprint: completed vs. planned person-days (TASK-021). */
export type VelocityPoint = {
  sprint: string;
  /** Completed person-days (stories whose board task is done). */
  points: number;
  /** Planned person-days (all assigned stories). */
  planned: number;
};

/** Total run duration of one agent in seconds (horizontal bars). */
export type AgentDurationBar = {
  agent: string;
  seconds: number;
};

/** Delivery approach chosen for a project idea. */
export type ProjectApproach = "agil" | "klassisch" | "hybrid";

/**
 * A captured project idea – the entry point of the (later) agent pipeline.
 * Persisted in the project store (localStorage).
 */
export type ProjectIdea = {
  id: string;
  /** ISO 8601 creation timestamp. */
  createdAt: string;
  /** Lifecycle status; ideas start as "idea". */
  status: "idea";
  name: string;
  description: string;
  targetAudience?: string;
  problem: string;
  benefit?: string;
  features: string[];
  timeframe?: string;
  budget?: string;
  teamSize?: string;
  constraints?: string;
  approach: ProjectApproach;
};

/* ------------------------------------------------------------------ *
 * Agent pipeline artifacts.
 *
 * These mirror the JSON output schemas in docs/agent-system.md 1:1
 * (snake_case keys) so the real API client (M6+) can return them
 * unchanged. The UI consumes them only through the AgentService interface.
 * ------------------------------------------------------------------ */

export type Severity = "niedrig" | "mittel" | "hoch";
export type Priority = "niedrig" | "mittel" | "hoch";

/** Projektentwurfs-Agent output (see docs/agent-system.md). */
export type ProjectDraft = {
  summary: string;
  vision: string;
  value_proposition: string;
  target_group: string;
  mvp: { description: string; features: string[] };
  phases: { name: string; goal: string; duration_weeks: number }[];
  initial_risks: { title: string; note: string }[];
  open_questions: string[];
};

/** Requirements-Agent output. */
export type Requirements = {
  functional: string[];
  non_functional: string[];
  technical: string[];
  dependencies: string[];
  assumptions: string[];
  budget_drivers: string[];
  time_risks: string[];
  clarifications: string[];
};

/**
 * Eine User Story *im Scrum-Agenten-Artefakt* (Snapshot des Laufs). Seit
 * TASK-056 vom Store-Entity {@link UserStory} getrennt: das Artefakt bleibt der
 * unveränderte Agenten-Output (nested, snake_case), der Store hält dagegen flache,
 * editierbare Entitäten. `importBacklog` überführt diese Snapshot-Story in eine
 * Store-`UserStory`.
 */
export type BacklogStory = {
  id: string;
  title: string;
  acceptance_criteria: string[];
  estimate_pt: number;
  priority: Priority;
};

/** Ein Epic im Scrum-Agenten-Artefakt (nested Stories, Snapshot des Laufs). */
export type BacklogEpic = {
  id: string;
  title: string;
  stories: BacklogStory[];
};

export type SprintSuggestion = {
  name: string;
  goal: string;
  story_ids: string[];
};

/**
 * Scrum-Agent output. Bleibt als Artefakt-Snapshot erhalten (TASK-056); die UI
 * liest Backlog-Items aber aus dem {@link Epic}/{@link UserStory}-Store, nicht
 * mehr hier – `importBacklog` überführt diesen Snapshot einmalig/pro Lauf dorthin.
 */
export type Backlog = {
  epics: BacklogEpic[];
  sprint_suggestions: SprintSuggestion[];
};

/** Lifecycle of a risk in the (now editable) register (TASK-045). */
export type RiskStatus = "open" | "mitigating" | "monitoring" | "closed";

export type RiskEntry = {
  id: string;
  title: string;
  probability: Severity;
  impact: Severity;
  /** Optional since TASK-045 – a freshly added risk may not have one yet. */
  mitigation?: string;
  priority: Priority;
  /** Optional since TASK-045 – escalation path can be filled in later. */
  escalation?: string;
  /** Who owns the risk (TASK-045). */
  owner?: string;
  /** Lifecycle status (TASK-045); backfilled to "open" for legacy risks. */
  status: RiskStatus;
};

/** Risiko-Agent output. */
export type RiskRegister = {
  risks: RiskEntry[];
};

/** All artifacts produced for one idea by the pipeline. */
export type ProjectArtifacts = {
  draft: ProjectDraft;
  requirements: Requirements;
  backlog: Backlog;
  risks: RiskRegister;
};

/* ------------------------------------------------------------------ *
 * Backlog-Entitäten (ab TASK-056).
 *
 * Epics & Stories sind seit TASK-056 eigene, persistierte Store-Entitäten
 * (`useBacklogStore`) mit eigenem Lebenszyklus – nicht mehr nur Felder im
 * Agenten-Artefakt {@link Backlog}. Sie existieren ohne Pipeline, sind manuell
 * CRUD-bar, und ein erneuter Agentenlauf *ergänzt* nur (via `importBacklog`),
 * statt den Bestand zu ersetzen. Bewusst FLACH (Epic nicht mehr nested):
 * Stories referenzieren ihr Epic über `epicId`, damit Reihenfolge/CRUD einfach
 * bleiben. Die `id` einer Story bleibt identisch zur Artefakt-Story-Id, sodass
 * `storyId`-Referenzen in Board-/Sprint-Store gültig bleiben (keine Migration dort).
 * ------------------------------------------------------------------ */

/**
 * Herkunft eines Backlog-Items: vom Agenten erzeugt, vom Menschen angelegt oder
 * ein ursprünglich agentengeneriertes, danach editiertes Item. Grundlage für die
 * spätere Vorschlags-Inbox (TASK-060).
 */
export type BacklogProvenance = "agent" | "human" | "human_edited";

/** Ein Epic als Store-Entität (TASK-056); Stories hängen über `epicId` daran. */
export type Epic = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  /** Position innerhalb der Epics des Projekts; kleiner = weiter oben. */
  rank: number;
};

/**
 * Ein abhakbares Akzeptanzkriterium einer Story (TASK-058). Ersetzt die frühere
 * reine `string[]`-Aufzählung, damit AKs prüfbar (einzeln abhakbar) werden –
 * analog zu {@link ChecklistItem}, aber auf Story- statt Task-Ebene. Transforms
 * liegen in `src/lib/acceptance.ts`.
 */
export type AcceptanceCriterion = {
  id: string;
  text: string;
  done: boolean;
};

/**
 * Eine User Story als Store-Entität (TASK-056). Bestehende Felder (`id`, `title`,
 * `estimate_pt`, `priority`) sind identisch zur früheren (artefakt-nested) Story,
 * sodass `storyId`-Referenzen gültig bleiben. `acceptance_criteria` wurde in
 * TASK-058 von `string[]` auf abhakbare {@link AcceptanceCriterion}[] gehoben
 * (Persist-Migration v1→v2 im Backlog-Store); das Agenten-Artefakt
 * {@link BacklogStory} bleibt dagegen bei `string[]` (Snapshot), `importBacklog`
 * mappt die Strings beim Import.
 */
export type UserStory = {
  id: string;
  epicId: string;
  projectId: string;
  title: string;
  description?: string;
  acceptance_criteria: AcceptanceCriterion[];
  estimate_pt: number;
  priority: Priority;
  /** Position innerhalb des Epics; kleiner = weiter oben. */
  rank: number;
  /** Optionale Release-Zuordnung (Scope, TASK-062). */
  releaseId?: string;
  /** Requirements, aus denen die Story abgeleitet wurde (Rückverfolgbarkeit). */
  sourceRequirementIds?: string[];
  /** Herkunft (Agent/Mensch); default „agent" beim Import. */
  provenance: BacklogProvenance;
};

/** Progress callbacks for a pipeline run (status line + per-step run). */
export type PipelineHooks = {
  onStatus?: (message: string) => void;
  onRun?: (run: AgentRun) => void;
};

/** Result of a full pipeline run: artifacts plus the run history. */
export type PipelineResult = {
  artifacts: ProjectArtifacts;
  runs: AgentRun[];
};

/** Static definition of an agent role (see docs/agent-system.md). */
export type AgentDefinition = {
  id: string;
  name: string;
  /** Short role label. */
  role: string;
  description: string;
  /** What the agent consumes. */
  input: string;
  /** What the agent produces. */
  output: string;
};

/** A single (dummy) run of an agent, with a formatted JSON-ish output. */
export type AgentRunRecord = {
  id: string;
  agentId: string;
  status: StatusType;
  /** ISO 8601 timestamp. */
  timestamp: string;
  summary: string;
  output: Record<string, unknown>;
};

/* ------------------------------------------------------------------ *
 * Kanban board (ab TASK-008).
 * ------------------------------------------------------------------ */

/**
 * Id einer Board-Phase (Spalte). Seit TASK-032 frei definierbar – kein fester
 * Union mehr, sondern eine String-Id. Die Phasen selbst (Reihenfolge, Label,
 * Status-Akzent, WIP, „terminal") liegen als {@link BoardColumnDef} im
 * `useBoardColumnsStore`; die Defaults stehen in `src/lib/board.ts`.
 */
export type BoardColumn = string;

/**
 * Definition einer Board-Phase (TASK-032). Single Source für Label, Reihenfolge,
 * Status-Akzent und optionales WIP-Limit – ersetzt die früheren festen Konstanten
 * `BOARD_COLUMNS`/`BOARD_COLUMN_STATUS`/`BOARD_WIP_LIMITS`.
 */
export type BoardColumnDef = {
  id: BoardColumn;
  label: string;
  /** StatusBadge-Akzent der Spalte (eine Quelle für die Statusfarbe). */
  status: StatusType;
  /** Position von links nach rechts; kleiner = weiter links. */
  order: number;
  /** Optionales WIP-Limit; ohne Wert kein Limit. */
  wipLimit?: number;
  /**
   * Terminale Phase (≙ „abgeschlossen"). Ersetzt das literale `column === "done"`
   * als Quelle der Done-Semantik für Burndown/Velocity/`doneAt` (TASK-032b).
   * Mindestens eine Spalte ist immer terminal.
   */
  isTerminal: boolean;
};

/**
 * Ein Task auf dem Kanban-Board. Entsteht manuell oder über „In Board
 * übernehmen" aus einer Backlog-Story (storyId referenziert UserStory.id
 * und verhindert Duplikate).
 */
export type BoardTask = {
  id: string;
  title: string;
  description?: string;
  column: BoardColumn;
  /** Position innerhalb der Spalte; kleiner = weiter oben. */
  order: number;
  projectId: string;
  projectName: string;
  storyId?: string;
  estimate_pt?: number;
  priority: Priority;
  /** Zugewiesene Person (referenziert Person.id, TASK-020); leer = nicht zugewiesen. */
  assigneeId?: string;
  /**
   * ISO-8601-Zeitstempel, gesetzt beim Wechsel in die Spalte `done` und entfernt,
   * sobald der Task `done` wieder verlässt (TASK-026). Basis der echten
   * Burndown-Ist-Linie. Altbestand vor TASK-026 hat keinen Wert (additive
   * Migration) und wird in der Burndown als „bei Sprintstart erledigt" gewertet.
   */
  doneAt?: string;
  /**
   * Zugewiesene Tags (referenziert Tag.id, TASK-031); leer/undefiniert = keine.
   * Additive Migration: Altbestand ohne `tagIds` bleibt unverändert. Gelöschte
   * Tags werden überall entkoppelt (siehe useTagStore.removeTag).
   */
  tagIds?: string[];
  /**
   * Optionales Fälligkeitsdatum als ISO-Datum (`YYYY-MM-DD`, TASK-034); leer =
   * kein Termin. „Überfällig" = `dueDate < heute` und Task nicht erledigt (siehe
   * `src/lib/due.ts`). Additive Migration: Altbestand ohne `dueDate` bleibt
   * unverändert.
   */
  dueDate?: string;
  /**
   * Leichtgewichtige Checkliste *innerhalb* des Tasks (TASK-035); leer/undefiniert
   * = keine. Abzugrenzen von Story→Aufgaben (TASK-037, eigene Board-Tasks): das
   * hier sind reine Unterpunkte ohne eigenes Work-Item. Fortschritt „n/m" via
   * `checklistProgress` (`src/lib/checklist.ts`). Additive Migration: Altbestand
   * ohne `checklist` bleibt unverändert.
   */
  checklist?: ChecklistItem[];
  /**
   * Herkunft aus einer Retro-Maßnahme (TASK-065): Id der Retro
   * ({@link CeremonyMeta.id}), aus deren „Aktionen"-Liste dieser Task erzeugt
   * wurde. Zusammen mit {@link BoardTask.sourceRetroAction} identifiziert er die
   * einzelne Maßnahme (eine Retro hat mehrere Aktionen ⇒ die Retro-Id allein
   * genügt nicht) und sichert den Duplikat-Schutz („höchstens ein Task je
   * Maßnahme"). Additive Migration: Altbestand ohne Feld bleibt unverändert.
   */
  sourceRetroId?: string;
  /**
   * Ursprünglicher Wortlaut der Retro-Maßnahme (TASK-065), aus der dieser Task
   * entstand. Bewusst der Original-Text und nicht der (editierbare) Task-Titel:
   * so bleibt die Verknüpfung stabil, auch wenn der Titel später geändert wird.
   */
  sourceRetroAction?: string;
};

/** Ein abhakbarer Unterpunkt einer Task-Checkliste (TASK-035). */
export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

/* ------------------------------------------------------------------ *
 * Tags/Labels (ab TASK-031).
 * ------------------------------------------------------------------ */

/**
 * Feste Tag-Farbpalette aus den Design-Tokens (keine Ad-hoc-Hex). Bildet auf
 * `STATUS_STYLES`-Töne bzw. Brand-Tokens (primary/accent) ab – konkrete
 * Klassen liegen single-sourced in `src/lib/tags.ts`.
 */
export type TagColor =
  | "primary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "danger";

/** Ein frei vergebbares Label für Backlog-/Board-Items. */
export type Tag = {
  id: string;
  name: string;
  color: TagColor;
};

/* ------------------------------------------------------------------ *
 * Team & Personen (ab TASK-019).
 * ------------------------------------------------------------------ */

/** Ein Team, dem Personen angehören können. */
export type Team = {
  id: string;
  name: string;
  description?: string;
};

/**
 * Eine Person (Teammitglied) mit Kapazität für die Sprintplanung.
 * `capacityPtPerSprint` ist die verfügbare Leistung in Personentagen pro Sprint.
 */
export type Person = {
  id: string;
  name: string;
  role: string;
  email?: string;
  capacityPtPerSprint: number;
  teamId?: string;
};

/* ------------------------------------------------------------------ *
 * Sprint-Planung (ab TASK-017).
 * ------------------------------------------------------------------ */

export type SprintStatus = "planned" | "active" | "done";

/**
 * Ein geplanter Sprint eines Projekts. `storyIds` referenziert UserStory.id;
 * eine Story gehört zu höchstens einem Sprint. Persistiert im Sprint-Store.
 */
export type PlannedSprint = {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  status: SprintStatus;
  /** Zugeordnete User-Story-IDs. */
  storyIds: string[];
  /** Position innerhalb der Sprintliste des Projekts. */
  order: number;
  /** Timebox-Start als ISO-Datum (`YYYY-MM-DD`); optional. */
  startDate?: string;
  /** Timebox-Ende als ISO-Datum (`YYYY-MM-DD`); optional. */
  endDate?: string;
  /**
   * Release, aus dem dieser Sprint generiert wurde (TASK-025); leer = manuell
   * angelegt. Beim Löschen des Releases wird das Feld entkoppelt (→ undefined).
   */
  releaseId?: string;
};

/**
 * Sichtbarkeit/Bezug einer Ceremony (TASK-054): team-übergreifend, an ein
 * konkretes Team gebunden, oder auf ein Projekt bezogen.
 */
export type CeremonyScope = "cross" | "team" | "project";

/**
 * Ein Kommentar an einer Ceremony (TASK-055): macht Review/Retro diskutierbar.
 * Chronologisch (älteste zuerst) gerendert; hinzufügen/entfernen über den
 * Sprint-Store. Erzeugt über `createComment` (`src/lib/ceremonies.ts`).
 */
export type CeremonyComment = {
  id: string;
  /** Freitext-Autor (lokaler Single-User-Kontext, kein Person-Bezug nötig). */
  author: string;
  text: string;
  /** ISO-8601-Zeitstempel der Erstellung. */
  createdAt: string;
};

/**
 * Gemeinsame Metadaten jeder Ceremony (TASK-054). `id`/`createdAt` machen aus
 * dem ehemaligen „genau einer pro Sprint"-Upsert (TASK-018) eine historische
 * Liste; `teamId` ist nur bei `scope === "team"` gesetzt.
 */
export type CeremonyMeta = {
  /** Stabile Id des Eintrags. */
  id: string;
  /** Sichtbarkeit/Bezug (team | project | cross). */
  scope: CeremonyScope;
  /** Zugehöriges Team – nur bei `scope === "team"`. */
  teamId?: string;
  /** ISO-Zeitstempel der Erstellung (Historie „neueste zuerst"). */
  createdAt: string;
  /**
   * Verlinkte Backlog-Stories des Sprints (TASK-055; referenziert UserStory.id).
   * Additive Migration: Altbestand ohne Feld bleibt gültig. Verwaiste Ids
   * (gelöschtes Item) werden beim Rendern robust behandelt, nicht bereinigt.
   */
  linkedStoryIds?: string[];
  /** Verlinkte Board-Tasks des Sprints (TASK-055; referenziert BoardTask.id). */
  linkedTaskIds?: string[];
  /** Diskussion an der Ceremony (TASK-055); chronologisch, additive Migration. */
  comments?: CeremonyComment[];
};

/**
 * Inhaltliche Felder eines Sprint-Reviews (TASK-018). Ohne Metadaten – wird von
 * `reviewFromForm` erzeugt und in `SprintReview` mit `CeremonyMeta` kombiniert.
 * Die geplanten Story-Points werden aus der Sprint-Zuordnung abgeleitet und
 * nicht gespeichert – nur die erreichten.
 */
export type ReviewContent = {
  /** Sprint, zu dem dieser Review gehört. */
  sprintId: string;
  /** Freitext „Was wurde geliefert". */
  delivered: string;
  /** Erreichte Story-Points (≥ 0). */
  achievedPt: number;
  /** Optionale Notizen. */
  notes?: string;
};

/**
 * Sprint-Review (TASK-018 + TASK-054): Reflexion am Sprint-Ende. Seit TASK-054
 * eine historische Liste (mehrere je Sprint möglich); persistiert im
 * Sprint-Store.
 */
export type SprintReview = ReviewContent & CeremonyMeta;

/** Inhaltliche Felder einer Sprint-Retrospektive (TASK-018), ohne Metadaten. */
export type RetroContent = {
  /** Sprint, zu dem diese Retro gehört. */
  sprintId: string;
  /** „Lief gut". */
  good: string[];
  /** „Verbessern". */
  improve: string[];
  /** „Aktionen". */
  actions: string[];
};

/**
 * Sprint-Retrospektive (TASK-018 + TASK-054): drei Item-Listen. Seit TASK-054
 * eine historische Liste (mehrere je Sprint möglich); persistiert im
 * Sprint-Store.
 */
export type SprintRetro = RetroContent & CeremonyMeta;

/* ------------------------------------------------------------------ *
 * Releases & automatische Sprint-Generierung (ab TASK-025).
 * ------------------------------------------------------------------ */

/** Mögliche Sprint-Längen eines Releases in Wochen. */
export type SprintLengthWeeks = 1 | 2 | 3 | 4;

/**
 * Lebenszyklus eines Releases (TASK-041). Manuell gepflegt – der *Fortschritt*
 * wird dagegen rein aus den Release-Sprints/Stories berechnet (`releaseProgress`
 * in `src/lib/release.ts`), nicht aus dem Status abgeleitet. Farbe ausschließlich
 * über `<StatusBadge>` (eine Quelle, siehe `RELEASE_STATUS` in `release-meta.ts`).
 */
export type ReleaseStatus = "planned" | "active" | "done";

/**
 * Ein Release bündelt einen Lieferzeitraum eines Projekts und seine Sprint-Dauer.
 * Aus Zeitraum + Dauer werden datierte Sprints automatisch generiert
 * (siehe `src/lib/release.ts`). Persistiert im Release-Store.
 */
export type Release = {
  id: string;
  projectId: string;
  name: string;
  /**
   * Lebenszyklus-Status (TASK-041). Additive Migration (Store v1→v2): Altbestand
   * ohne Status wird auf `"planned"` gehoben.
   */
  status: ReleaseStatus;
  /** Release-Start als ISO-Datum (`YYYY-MM-DD`). */
  startDate: string;
  /** Release-Ende als ISO-Datum (`YYYY-MM-DD`); ≥ startDate. */
  endDate: string;
  sprintLengthWeeks: SprintLengthWeeks;
};

/* ------------------------------------------------------------------ *
 * Activity Feed & Decision Log (ab TASK-043).
 * ------------------------------------------------------------------ */

/** Wer eine Änderung/Entscheidung ausgelöst hat. Agenten ab M6. */
export type ActorKind = "human" | "agent";

/** Entitätstyp, auf den sich ein Activity-Event/eine Entscheidung bezieht. */
export type ActivityEntityType =
  | "project"
  | "task"
  | "sprint"
  | "release"
  | "story";

/**
 * Art eines Activity-Events. `create|update|delete` decken die heutigen
 * Lebenszyklus-Mutationen ab; `review|run` sind für spätere Agenten-/Review-
 * Läufe (HITL, TASK-012/013) reserviert.
 */
export type ActivityKind = "create" | "update" | "delete" | "review" | "run";

/**
 * Ein nachvollziehbares Ereignis an einer Entität (TASK-043). Append-only und
 * minimal/erweiterbar gehalten. Erzeugt zentral über `useActivityStore.log`
 * (reine Factory in `src/lib/activity.ts`), nie verstreut in Komponenten.
 */
export type ActivityEvent = {
  id: string;
  entityType: ActivityEntityType;
  /** Id der betroffenen Entität (ProjectIdea.id, BoardTask.id, …). */
  entityId: string;
  kind: ActivityKind;
  /** Menschlich lesbare Kurzbeschreibung, z. B. „Task „X" nach „Done" verschoben". */
  summary: string;
  actor: ActorKind;
  /** ISO-8601-Zeitstempel; relativ gerendert (`formatRelativeTime`). */
  createdAt: string;
};

/**
 * Eine festgehaltene menschliche Entscheidung (TASK-043): Freigaben und
 * Scope-Entscheidungen mit optionaler Begründung. Persistiert im Decision-Store.
 */
export type Decision = {
  id: string;
  /** Worum ging es / welche Frage stand an. */
  context: string;
  /** Die getroffene Wahl. */
  choice: string;
  /** Optionale Begründung. */
  rationale?: string;
  actor: ActorKind;
  /** ISO-8601-Zeitstempel. */
  createdAt: string;
  /** Optionaler Bezug zu einer Entität (für gefilterte Anzeige). */
  relatedEntity?: { type: ActivityEntityType; id: string };
};
