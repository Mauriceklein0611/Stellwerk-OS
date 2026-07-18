import type { AgentDurationBar, StatusCheck } from "@/types";

/**
 * Seed/demo data for dashboard areas that have no real source yet: the CI/test
 * status grid and per-agent run durations. These are rendered under a
 * clearly-marked "Beispiel" section in the dashboard and get replaced once the
 * backend provides real telemetry (M6+). The live areas (metrics, activity
 * feed, progress, task distribution, velocity, sprint burndown) are derived
 * from the stores via src/lib/dashboard-selectors.ts and src/lib/burndown.ts.
 */

export const statusChecks: StatusCheck[] = [
  { id: "tests", label: "Tests", status: "success", detail: "128 / 128 grün" },
  { id: "cicd", label: "CI/CD", status: "running", detail: "Build #341 läuft" },
  { id: "quality", label: "Qualität", status: "warning", detail: "3 Findings offen" },
  { id: "reviews", label: "Reviews", status: "info", detail: "2 PRs warten" },
];

/** Total agent run duration in seconds (horizontal bars). */
export const agentDurations: AgentDurationBar[] = [
  { agent: "Draft-Agent", seconds: 42 },
  { agent: "Requirements-Agent", seconds: 88 },
  { agent: "Scrum-Agent", seconds: 35 },
  { agent: "PO-Agent", seconds: 51 },
  { agent: "Risk-Agent", seconds: 67 },
  { agent: "Review-Agent", seconds: 73 },
];
