import type {
  Backlog,
  BacklogEpic,
  BacklogStory,
  Priority,
  ProjectDraft,
  ProjectIdea,
  Requirements,
  RiskEntry,
  RiskRegister,
} from "@/types";

/**
 * Deterministic building blocks for the mock pipeline. Content is derived from
 * the input (project name, problem, features …) so different ideas produce
 * visibly different artifacts – but the same idea always yields the same output.
 */

const DEFAULT_FEATURES = ["Kernfunktion", "Benutzerverwaltung", "Reporting"];

const featuresOf = (idea: ProjectIdea): string[] => {
  // Guard against ideas persisted before `features` existed / malformed input:
  // an undefined array would crash the whole pipeline on `.length`.
  const features = idea.features ?? [];
  return features.length > 0 ? features : DEFAULT_FEATURES;
};

const priorityFor = (index: number): Priority =>
  index === 0 ? "hoch" : index < 3 ? "mittel" : "niedrig";

export function buildDraft(idea: ProjectIdea): ProjectDraft {
  const features = featuresOf(idea);
  const audience = idea.targetAudience ?? "die definierte Zielgruppe";

  return {
    summary: `${idea.name}: ${idea.description}`,
    vision: `${idea.name} löst „${idea.problem}" für ${audience}.`,
    value_proposition: idea.benefit ?? `Spürbarer Mehrwert durch ${features[0]}.`,
    target_group: idea.targetAudience ?? "Noch zu schärfen",
    mvp: {
      description: `Schlanker erster Wurf von ${idea.name} mit den wichtigsten Funktionen.`,
      features,
    },
    phases: [
      { name: "Discovery", goal: "Anforderungen & Scope schärfen", duration_weeks: 2 },
      { name: "MVP", goal: `${features[0]} und Kernfluss umsetzen`, duration_weeks: 6 },
      { name: "Rollout", goal: "Stabilisierung und Einführung", duration_weeks: 4 },
    ],
    initial_risks: [
      { title: "Scope-Unschärfe", note: `Problem „${idea.problem}" könnte breiter sein als angenommen.` },
      { title: "Adoption", note: `Akzeptanz bei ${audience} ist noch ungewiss.` },
    ],
    open_questions: [
      idea.budget ? `Reicht das Budget (${idea.budget}) für den Scope?` : "Wie hoch ist das Budget?",
      idea.timeframe ? `Ist der Zeitraum (${idea.timeframe}) realistisch?` : "Welcher Zeitrahmen gilt?",
    ],
  };
}

export function buildRequirements(draft: ProjectDraft): Requirements {
  return {
    functional: draft.mvp.features.map((feature) => `Das System unterstützt: ${feature}.`),
    non_functional: [
      "Antwortzeiten unter 2s bei Standardlast.",
      "Barrierearme, responsive Oberfläche (≥ 768px).",
    ],
    technical: [
      "Web-Stack (Next.js / TypeScript) im MVP, lokale Persistenz.",
      "Klare Service-Schnittstellen für späteren Backend-Tausch.",
    ],
    dependencies: ["Designsystem/Tokens", "Mock-Datenquellen bis das Backend steht"],
    assumptions: [`Zielbild: ${draft.vision}`],
    budget_drivers: ["Anzahl Features im MVP", "Integrationsaufwand"],
    time_risks: ["Unklare Anforderungen verzögern den MVP."],
    clarifications: draft.open_questions,
  };
}

function storyFromRequirement(requirement: string, index: number): BacklogStory {
  const title = requirement
    .replace("Das System unterstützt: ", "")
    .replace(/\.$/, "");

  return {
    id: `US-${index + 1}`,
    title,
    acceptance_criteria: [
      `Bei gültiger Eingabe stellt das System „${title}" bereit.`,
      "Fehlerfälle werden mit einer klaren Meldung abgefangen.",
    ],
    estimate_pt: ((index % 3) + 1) * 2,
    priority: priorityFor(index),
  };
}

export function buildBacklog(requirements: Requirements): Backlog {
  const featureStories = requirements.functional.map(storyFromRequirement);

  const qualityStories: BacklogStory[] = [
    {
      id: "US-Q1",
      title: "Automatisierte Tests",
      acceptance_criteria: [
        "Kernlogik ist durch Unit-Tests abgedeckt.",
        "Die Test-Suite läuft in CI grün.",
      ],
      estimate_pt: 4,
      priority: "mittel",
    },
    {
      id: "US-Q2",
      title: "Konsistente Fehlerbehandlung",
      acceptance_criteria: [
        "Fehler werden zentral und einheitlich dargestellt.",
        "Leere und Ladezustände sind abgedeckt.",
      ],
      estimate_pt: 2,
      priority: "mittel",
    },
  ];

  const rolloutStories: BacklogStory[] = [
    {
      id: "US-R1",
      title: "Deployment-Pipeline",
      acceptance_criteria: [
        "Ein Build ist reproduzierbar erzeugbar.",
        "Ein Rollback ist dokumentiert.",
      ],
      estimate_pt: 4,
      priority: "niedrig",
    },
    {
      id: "US-R2",
      title: "Onboarding der Nutzer",
      acceptance_criteria: [
        "Neue Nutzer finden ohne Schulung in den Kernfluss.",
        "Eine Kurz-Doku liegt vor.",
      ],
      estimate_pt: 2,
      priority: "niedrig",
    },
  ];

  const epics: BacklogEpic[] = [
    { id: "E-1", title: "Kern-Features", stories: featureStories },
    { id: "E-2", title: "Qualität & Tests", stories: qualityStories },
    { id: "E-3", title: "Betrieb & Rollout", stories: rolloutStories },
  ];

  return {
    epics,
    sprint_suggestions: [
      {
        name: "Sprint 1",
        goal: "Kernfluss lauffähig",
        story_ids: featureStories.slice(0, 3).map((s) => s.id),
      },
      {
        name: "Sprint 2",
        goal: "Qualität & Rollout vorbereiten",
        story_ids: [...qualityStories, ...rolloutStories].map((s) => s.id),
      },
    ],
  };
}

export function buildRiskRegister(
  draft: ProjectDraft,
  backlog: Backlog,
): RiskRegister {
  const storyCount = backlog.epics.reduce((n, epic) => n + epic.stories.length, 0);

  const base: RiskEntry[] = [
    {
      id: "R-1",
      title: "Scope-Creep",
      probability: "mittel",
      impact: "hoch",
      mitigation: "MVP klar abgrenzen, Backlog konsequent priorisieren.",
      priority: "hoch",
      escalation: "Product Owner",
      status: "open",
    },
    {
      id: "R-2",
      title: "Technische Schulden",
      probability: "mittel",
      impact: "mittel",
      mitigation: "Code-Reviews, Tests und klare Schnittstellen.",
      priority: "mittel",
      escalation: "Tech Lead",
      status: "open",
    },
    {
      id: "R-3",
      title: "Geringe Adoption",
      probability: "mittel",
      impact: "hoch",
      mitigation: "Frühes Nutzerfeedback und gutes Onboarding.",
      priority: "hoch",
      escalation: "Stakeholder",
      status: "open",
    },
    {
      id: "R-4",
      title: storyCount > 8 ? "Hoher Umfang" : "Ressourcenengpass",
      probability: storyCount > 8 ? "hoch" : "mittel",
      impact: "mittel",
      mitigation: "Sprints sauber schneiden und Kapazität einplanen.",
      priority: "mittel",
      escalation: "Scrum Master",
      status: "open",
    },
  ];

  const fromDraft: RiskEntry[] = draft.initial_risks.map((risk, i) => ({
    id: `R-${base.length + i + 1}`,
    title: risk.title,
    probability: "mittel",
    impact: "mittel",
    mitigation: risk.note,
    priority: "mittel",
    escalation: "Product Owner",
    status: "open",
  }));

  return { risks: [...base, ...fromDraft] };
}
