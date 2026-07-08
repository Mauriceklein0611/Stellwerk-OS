"use client";

import { useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { StatusGrid } from "@/components/dashboard/StatusGrid";
import { ProgressList } from "@/components/dashboard/ProgressList";
import { DashboardEmpty } from "@/components/dashboard/DashboardEmpty";
import { SprintBurndownChart } from "@/components/dashboard/charts/SprintBurndownChart";
import { TaskStatusDonut } from "@/components/dashboard/charts/TaskStatusDonut";
import { VelocityChart } from "@/components/dashboard/charts/VelocityChart";
import { AgentRunsChart } from "@/components/dashboard/charts/AgentRunsChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  selectMetrics,
  selectProjects,
  selectTaskStatusDistribution,
  selectVelocity,
} from "@/lib/dashboard-selectors";
import { sprintBurndown } from "@/lib/burndown";
import { terminalColumnIds } from "@/lib/board";
import { storiesForProject } from "@/lib/backlog";
import { formatSprintRange, isActiveSprint } from "@/lib/sprint";
import { useHydrated } from "@/lib/use-hydrated";
import { useProjectStore } from "@/store/useProjectStore";
import { useBacklogStore } from "@/store/useBacklogStore";
import { useRiskStore } from "@/store/useRiskStore";
import { useBoardStore } from "@/store/useBoardStore";
import { useBoardColumnsStore } from "@/store/useBoardColumnsStore";
import { useSprintStore } from "@/store/useSprintStore";
import { useAgentStore } from "@/store/useAgentStore";
// Seed/demo data: areas without a real source yet (CI status, run durations).
// Clearly marked as "Beispiel" until real data exists (M6+).
import { agentDurations, statusChecks } from "@/data/dashboard";

export default function DashboardPage() {
  const hydrated = useHydrated();
  const ideas = useProjectStore((state) => state.ideas);
  const artifacts = useProjectStore((state) => state.artifacts);
  const allStories = useBacklogStore((state) => state.stories);
  const risksMap = useRiskStore((state) => state.risks);
  const boardTasks = useBoardStore((state) => state.tasks);
  const boardColumns = useBoardColumnsStore((state) => state.columns);
  const sprints = useSprintStore((state) => state.sprints);
  const runs = useAgentStore((state) => state.runs);

  const [selectedSprintId, setSelectedSprintId] = useState("");

  const terminalColumns = useMemo(
    () => terminalColumnIds(boardColumns),
    [boardColumns],
  );

  const allRisks = useMemo(() => Object.values(risksMap).flat(), [risksMap]);
  const metrics = useMemo(
    () => selectMetrics(ideas, artifacts, allStories, allRisks),
    [ideas, artifacts, allStories, allRisks],
  );
  const projects = useMemo(
    () => selectProjects(ideas, boardTasks, terminalColumns),
    [ideas, boardTasks, terminalColumns],
  );
  const taskDistribution = useMemo(
    () => selectTaskStatusDistribution(boardTasks, boardColumns),
    [boardTasks, boardColumns],
  );
  const velocity = useMemo(
    () => selectVelocity(artifacts, allStories, boardTasks, terminalColumns),
    [artifacts, allStories, boardTasks, terminalColumns],
  );

  // Burndown candidates: only timeboxed sprints, newest first. The active
  // sprint (today within its box) is the default; the user can switch.
  const burndownSprints = useMemo(
    () =>
      sprints
        .filter((sprint) => sprint.startDate && sprint.endDate)
        .sort((a, b) => (a.startDate! < b.startDate! ? 1 : -1)),
    [sprints],
  );

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-sm text-muted">
        Lädt …
      </div>
    );
  }

  // Local "today" as ISO date – only computed past the hydration gate, so it
  // never runs during SSR and can't cause a hydration mismatch.
  const today = new Date().toLocaleDateString("sv-SE"); // sv-SE → YYYY-MM-DD

  const activeSprint = burndownSprints.find((sprint) =>
    isActiveSprint(sprint, today),
  );
  const selectedSprint =
    burndownSprints.find((sprint) => sprint.id === selectedSprintId) ??
    activeSprint ??
    burndownSprints[0];

  const burndownStories = selectedSprint
    ? storiesForProject(allStories, selectedSprint.projectId)
    : [];
  const burndownData = selectedSprint
    ? sprintBurndown(selectedSprint, burndownStories, boardTasks, today, terminalColumns)
    : [];
  const burndownSubtitle = selectedSprint
    ? [
        ideas.find((idea) => idea.id === selectedSprint.projectId)?.name,
        selectedSprint.name,
        formatSprintRange(selectedSprint),
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;

  const burndownSelector =
    burndownSprints.length > 0 ? (
      <Select
        value={selectedSprint?.id ?? ""}
        onValueChange={(value) => setSelectedSprintId(value ?? "")}
      >
        <SelectTrigger className="w-44">
          <SelectValue>
            {(value) =>
              burndownSprints.find((sprint) => sprint.id === value)?.name ??
              "Sprint wählen"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {burndownSprints.map((sprint) => (
            <SelectItem key={sprint.id} value={sprint.id}>
              {sprint.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Überblick über Projekte, Agentenläufe und Systemstatus – aus deinen lokalen Daten."
      />

      {ideas.length === 0 && <DashboardEmpty />}

      {/* Metric cards: 1 / 2 / 4 columns. */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      {/* Live panels: activity, progress and task distribution. */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ActivityFeed runs={runs} />
        <ProgressList projects={projects} />
        <TaskStatusDonut data={taskDistribution} />
      </section>

      {/* Velocity + real sprint burndown: derived from stores (no demo data). */}
      <section className="grid grid-cols-1 gap-4">
        <VelocityChart data={velocity} />
      </section>
      <section className="grid grid-cols-1 gap-4">
        <SprintBurndownChart
          data={burndownData}
          subtitle={burndownSubtitle}
          action={burndownSelector}
        />
      </section>

      {/* Demo visualisations: no real source yet (CI/test status, run
          durations). Marked as example. */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-muted">Beispiel-Visualisierungen</h2>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
            Demo · bis echte CI-Daten vorliegen
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <AgentRunsChart data={agentDurations} />
          </div>
          <StatusGrid checks={statusChecks} />
        </div>
      </section>
    </div>
  );
}
