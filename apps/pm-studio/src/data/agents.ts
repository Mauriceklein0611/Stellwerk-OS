import {
  BadgeCheck,
  FileText,
  GitBranch,
  History,
  ListChecks,
  SearchCheck,
  ShieldAlert,
  Target,
  TestTube,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import type { AgentDefinition, AgentRunRecord, StatusType } from "@/types";

/**
 * The 10 agent roles (docs/agent-system.md). Static definitions; dynamic
 * status/runs live in useAgentStore (seeded from here). The UI consumes this
 * only as data so the real runner (M6/M7) can replace it without UI changes.
 */
export const agents: AgentDefinition[] = [
  { id: "draft", name: "Projektentwurfs-Agent", role: "Entwurf", description: "Formt aus einer Idee einen strukturierten Projektentwurf.", input: "ProjectIdea", output: "ProjectDraft (Zielbild, MVP, Phasen, Risiken)" },
  { id: "requirements", name: "Requirements-Agent", role: "Anforderungen", description: "Leitet funktionale und nicht-funktionale Anforderungen ab.", input: "ProjectDraft", output: "Requirements" },
  { id: "scrum", name: "Scrum-Agent", role: "Backlog", description: "Erzeugt Epics, User Stories und Schätzungen.", input: "Requirements", output: "Backlog (Epics, Stories, AKs)" },
  { id: "po", name: "Product-Owner-Agent", role: "Priorisierung", description: "Setzt MVP-Fokus, Nutzen je Feature und Sprintziele.", input: "Backlog", output: "Priorisierung, Scope-Empfehlung" },
  { id: "risk", name: "Risiko-Agent", role: "Risiken", description: "Bewertet Risiken nach Wahrscheinlichkeit und Auswirkung.", input: "Draft + Backlog", output: "Risikoregister" },
  { id: "review", name: "Review-Agent", role: "Qualitätsbefund", description: "Prüft Vollständigkeit und Widersprüche der Artefakte.", input: "Alle Artefakte", output: "Qualitätsbefund" },
  { id: "test", name: "Test-Agent", role: "Tests", description: "Schlägt Testfälle und Akzeptanztests vor.", input: "User Stories", output: "Testfälle, Abdeckung" },
  { id: "cicd", name: "CI/CD-Agent", role: "Delivery", description: "Erstellt Deployment-Schritte und Release-Checkliste.", input: "Repo-Kontext", output: "Deployment-Plan" },
  { id: "quality", name: "Qualitäts-Agent", role: "Qualität", description: "Bewertet Code-/Doku-Qualität und Tech Debt.", input: "Repo + Artefakte", output: "Qualitätsbewertung" },
  { id: "retro", name: "Retro-Agent", role: "Retro", description: "Erkennt Muster über Sprints und schlägt Maßnahmen vor.", input: "Retro-Daten", output: "Maßnahmenvorschläge" },
];

export const AGENT_ICONS: Record<string, LucideIcon> = {
  draft: FileText,
  requirements: ListChecks,
  scrum: Workflow,
  po: Target,
  risk: ShieldAlert,
  review: SearchCheck,
  test: TestTube,
  cicd: GitBranch,
  quality: BadgeCheck,
  retro: History,
};

/** Initial status per agent (idle / success / danger=error for variety). */
export const seedAgentStatuses: Record<string, StatusType> = {
  draft: "success",
  requirements: "success",
  scrum: "idle",
  po: "idle",
  risk: "success",
  review: "idle",
  test: "idle",
  cicd: "danger",
  quality: "idle",
  retro: "idle",
};

const minutesAgo = (minutes: number): string =>
  new Date(Date.now() - minutes * 60_000).toISOString();

export const seedAgentRuns: Record<string, AgentRunRecord[]> = {
  draft: [
    { id: "draft-1", agentId: "draft", status: "success", timestamp: minutesAgo(12), summary: "Entwurf für Onboarding Revamp erzeugt", output: { summary: "Onboarding Revamp: neuer Onboarding-Flow", mvp_features: ["Guided Tour", "Checkliste"], phases: 3 } },
    { id: "draft-2", agentId: "draft", status: "success", timestamp: minutesAgo(180), summary: "Entwurf für Billing Service erzeugt", output: { summary: "Billing Service: automatisierte Rechnungen", mvp_features: ["Auto-Invoice", "Mahnwesen"], phases: 3 } },
  ],
  requirements: [
    { id: "req-1", agentId: "requirements", status: "success", timestamp: minutesAgo(11), summary: "8 Anforderungen abgeleitet", output: { functional: 4, non_functional: 2, technical: 2, clarifications: 2 } },
  ],
  scrum: [
    { id: "scrum-1", agentId: "scrum", status: "idle", timestamp: minutesAgo(240), summary: "Backlog mit 3 Epics", output: { epics: 3, stories: 7, sum_pt: 28 } },
  ],
  po: [
    { id: "po-1", agentId: "po", status: "idle", timestamp: minutesAgo(300), summary: "MVP-Scope empfohlen", output: { mvp_stories: 5, deferred: 2, release_ready: false } },
  ],
  risk: [
    { id: "risk-1", agentId: "risk", status: "success", timestamp: minutesAgo(9), summary: "6 Risiken bewertet", output: { risks: 6, high: 2, top: "Scope-Creep" } },
  ],
  review: [
    { id: "review-1", agentId: "review", status: "idle", timestamp: minutesAgo(420), summary: "Qualitätsbefund erstellt", output: { findings: 3, missing_acs: 1, contradictions: 0 } },
  ],
  test: [
    { id: "test-1", agentId: "test", status: "idle", timestamp: minutesAgo(500), summary: "Testideen je Story", output: { test_cases: 14, acceptance_tests: 7, coverage_estimate: "72%" } },
  ],
  cicd: [
    { id: "cicd-1", agentId: "cicd", status: "danger", timestamp: minutesAgo(40), summary: "Deployment fehlgeschlagen (Schema-Fehler)", output: { step: "migrate", error: "invalid JSON schema", retries: 2 } },
  ],
  quality: [
    { id: "quality-1", agentId: "quality", status: "idle", timestamp: minutesAgo(600), summary: "Qualitätsbewertung", output: { code: "B", docs: "A", tech_debt: "niedrig" } },
  ],
  retro: [
    { id: "retro-1", agentId: "retro", status: "idle", timestamp: minutesAgo(720), summary: "Muster über 3 Sprints", output: { patterns: 2, actions: 3 } },
  ],
};
