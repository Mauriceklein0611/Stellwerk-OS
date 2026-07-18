"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Play, Sparkles, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfirmDelete } from "@/components/common/useConfirmDelete";
import { useBoardStore } from "@/store/useBoardStore";
import { useBacklogStore } from "@/store/useBacklogStore";
import { useRiskStore } from "@/store/useRiskStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PipelineStepper } from "@/components/project/PipelineStepper";
import { OverviewTab } from "@/components/project/OverviewTab";
import { IdeaTab } from "@/components/project/IdeaTab";
import { DraftView } from "@/components/project/DraftView";
import { RequirementsView } from "@/components/project/RequirementsView";
import { BacklogReferenceCard } from "@/components/project/BacklogReferenceCard";
import { RiskTable } from "@/components/project/RiskTable";
import { ActivityFeedPanel } from "@/components/activity/ActivityFeedPanel";
import { DecisionLogPanel } from "@/components/activity/DecisionLogPanel";
import { useProjectStore } from "@/store/useProjectStore";
import { useAgentStore } from "@/store/useAgentStore";
import { runPipelineForIdea } from "@/lib/agent-service";
import { useHydrated } from "@/lib/use-hydrated";
import { computeStepStatuses, type StepTab } from "@/lib/pipeline-steps";
import { APPROACH_LABELS } from "@/lib/idea-schema";
import { formatDate } from "@/lib/format";

function TabEmpty() {
  return (
    <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
      Noch keine Artefakte – führe oben die Pipeline aus.
    </div>
  );
}

export function ProjectDetail({ id }: { id: string }) {
  const hydrated = useHydrated();
  const idea = useProjectStore((state) => state.ideas.find((i) => i.id === id));
  const artifacts = useProjectStore((state) => state.artifacts[id]);
  const removeIdea = useProjectStore((state) => state.removeIdea);
  // Risks live in the risk store now (TASK-061), independent of a pipeline run.
  // Selecting the (stable) stored array or undefined avoids the zustand
  // getSnapshot loop; the `?? []` stays in render, not in the selector.
  const projectRisks = useRiskStore((state) => state.risks[id]) ?? [];
  const setRisks = useRiskStore((state) => state.setRisks);
  const restoreProject = useProjectStore((state) => state.restore);
  const restoreTasks = useBoardStore((state) => state.restore);
  const restoreBacklog = useBacklogStore((state) => state.restore);
  const restoreRisks = useRiskStore((state) => state.restore);
  const confirmDelete = useConfirmDelete();
  const router = useRouter();
  const runs = useAgentStore((state) => state.runs);
  const isRunning = useAgentStore((state) => state.isRunning);
  const status = useAgentStore((state) => state.status);

  const [tab, setTab] = useState("overview");
  const [descExpanded, setDescExpanded] = useState(false);

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-sm text-muted">
        Lädt …
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-10 text-center">
        <p className="text-sm text-muted">Projekt nicht gefunden.</p>
        <Button nativeButton={false} render={<Link href="/projects" />}>
          Zur Projektliste
        </Button>
      </div>
    );
  }

  const projectRuns = runs.filter((run) => run.project === idea.name);
  const stepStatuses = computeStepStatuses(projectRuns, isRunning, !!artifacts);

  // The Scrum/Backlog step is a status indicator that deep-links into the
  // backlog workspace; every other step jumps to its tab (TASK-061).
  function handleStepClick(nextTab: StepTab) {
    if (nextTab === "backlog") {
      router.push(`/backlog?project=${id}`);
    } else {
      setTab(nextTab);
    }
  }

  // "Planung starten" opens the backlog incl. the agent panel (TASK-060) via a
  // deep-link the backlog page reads on mount.
  function handleStartPlanning() {
    router.push(`/backlog?project=${id}&plan=1`);
  }

  function handleDelete() {
    if (!idea) return;
    // Snapshot ideas + artifacts, the board tasks (their story links are dropped
    // on delete), the backlog and the risk slices so Undo restores 1:1 (TASK-040).
    const { ideas: ideasBefore, artifacts: artifactsBefore } =
      useProjectStore.getState();
    const tasksBefore = useBoardStore.getState().tasks;
    const { epics: epicsBefore, stories: storiesBefore } =
      useBacklogStore.getState();
    const risksBefore = useRiskStore.getState().risks;
    void confirmDelete({
      confirm: {
        title: `Projekt „${idea.name}“ löschen?`,
        description:
          "Projekt samt Artefakten, Backlog und Risiken wird gelöscht; zugehörige Board-Tasks verlieren ihre Story-Zuordnung.",
      },
      toastMessage: `Projekt „${idea.name}“ gelöscht.`,
      perform: () => {
        removeIdea(idea.id);
        router.push("/projects");
      },
      undo: () => {
        restoreProject({ ideas: ideasBefore, artifacts: artifactsBefore });
        restoreTasks(tasksBefore);
        restoreBacklog({ epics: epicsBefore, stories: storiesBefore });
        restoreRisks({ risks: risksBefore });
      },
    });
  }

  const meta = [
    idea.timeframe,
    idea.budget,
    idea.teamSize ? `Team: ${idea.teamSize}` : undefined,
    `erstellt ${formatDate(idea.createdAt)}`,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/projects"
          className="inline-flex w-fit items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Projekte
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
              {idea.name}
            </h1>
            <Badge variant="secondary">Idee</Badge>
            <Badge variant="outline">{APPROACH_LABELS[idea.approach]}</Badge>
          </div>
          <div className="flex items-center gap-3">
            {isRunning && status ? (
              <span className="flex items-center gap-2 text-xs text-muted">
                <Loader2 className="size-4 animate-spin text-primary" />
                {status}
              </span>
            ) : null}
            <Button onClick={handleStartPlanning}>
              <Sparkles aria-hidden /> Planung starten
            </Button>
            <Button
              variant="outline"
              onClick={() => void runPipelineForIdea(idea)}
              disabled={isRunning}
            >
              <Play aria-hidden /> Pipeline ausführen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              aria-label="Projekt löschen"
            >
              <Trash2 aria-hidden /> Löschen
            </Button>
          </div>
        </div>

        <p className="text-[13px] text-muted">{meta.join(" · ")}</p>

        <div className="flex flex-col items-start gap-1">
          <p
            className={
              descExpanded ? "text-sm text-muted" : "line-clamp-1 text-sm text-muted"
            }
          >
            {idea.description}
          </p>
          <button
            type="button"
            onClick={() => setDescExpanded((value) => !value)}
            className="text-xs text-primary transition-opacity hover:opacity-80"
          >
            {descExpanded ? "Weniger" : "Mehr anzeigen"}
          </button>
        </div>
      </div>

      {/* Pipeline stepper */}
      <div className="rounded-xl border border-border bg-surface px-4 py-3">
        <PipelineStepper statuses={stepStatuses} onStepClick={handleStepClick} />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(value) => setTab(value as string)}>
        <TabsList
          variant="line"
          className="w-full flex-wrap justify-start gap-x-5 gap-y-1 border-b border-border [&_[data-slot=tabs-trigger]]:flex-none [&_[data-slot=tabs-trigger]]:px-0"
        >
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="idea">Idee</TabsTrigger>
          <TabsTrigger value="draft">Entwurf</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="backlog">Backlog</TabsTrigger>
          <TabsTrigger value="risks">Risiken</TabsTrigger>
          <TabsTrigger value="history">Verlauf</TabsTrigger>
        </TabsList>

        <div className="mx-auto mt-4 w-full max-w-[1200px]">
          <TabsContent value="overview">
            <OverviewTab
              artifacts={artifacts}
              projectId={idea.id}
              runs={projectRuns}
              onNavigate={setTab}
            />
          </TabsContent>
          <TabsContent value="idea">
            <IdeaTab idea={idea} />
          </TabsContent>
          <TabsContent value="draft">
            {artifacts ? <DraftView draft={artifacts.draft} /> : <TabEmpty />}
          </TabsContent>
          <TabsContent value="requirements">
            {artifacts ? (
              <RequirementsView requirements={artifacts.requirements} />
            ) : (
              <TabEmpty />
            )}
          </TabsContent>
          <TabsContent value="backlog">
            <BacklogReferenceCard projectId={idea.id} />
          </TabsContent>
          <TabsContent value="risks">
            <RiskTable
              risks={projectRisks}
              onChange={(risks) => setRisks(idea.id, risks)}
            />
          </TabsContent>
          <TabsContent value="history">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ActivityFeedPanel entityType="project" entityId={idea.id} />
              <DecisionLogPanel entityType="project" entityId={idea.id} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
