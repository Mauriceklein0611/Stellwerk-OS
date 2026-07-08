"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Pencil,
} from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { SprintStoryCard } from "@/components/sprint/SprintStoryCard";
import { StatusBadge } from "@/components/agents/StatusBadge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SPRINT_STATUS, formatSprintRange, isActiveSprint } from "@/lib/sprint";
import { isStoryDone, sprintProgress } from "@/lib/sprint-progress";
import { sprintCommitment, sprintWorkload } from "@/lib/capacity";
import { DEFAULT_TERMINAL_COLUMN_IDS } from "@/lib/board";
import { cn } from "@/lib/utils";
import type { BoardColumn, BoardTask, Person, PlannedSprint, UserStory } from "@/types";

type SprintSectionProps = {
  /** Droppable id: a sprint id or the literal "unassigned". */
  id: string;
  label: string;
  goal?: string;
  /** Sprint meta; omitted for the "unassigned" (backlog) section. */
  sprint?: PlannedSprint;
  stories: UserStory[];
  /** Board tasks – used to derive each story's done state (TASK-021). */
  boardTasks: BoardTask[];
  /** People – workload per person + combined team capacity (TASK-020/059). */
  persons: Person[];
  /** Terminal phase ids (≙ done) for the story done-state (TASK-032b). */
  terminalColumns?: Set<BoardColumn>;
  /** Today as ISO date (`YYYY-MM-DD`), client-derived for SSR safety (TASK-024). */
  today?: string;
  /** Link to the sprint detail page (TASK-053); only set for real sprints. */
  detailHref?: string;
  onEdit?: () => void;
  /** Open the review/retro dialog (TASK-018); only set for active/done sprints. */
  onReview?: () => void;
  /** Open a story's detail dialog (TASK-058) when its row is clicked. */
  onStoryClick?: (story: UserStory) => void;
};

/**
 * One vertically stacked section of the sprint planning view (TASK-059):
 * collapsible header (status, timebox, goal, progress, commitment warning,
 * edit/review/open actions) over a droppable list of compact story rows and a
 * collapsible per-person workload block. Replaces the horizontal `SprintColumn`.
 */
export function SprintSection({
  id,
  label,
  goal,
  sprint,
  stories,
  boardTasks,
  persons,
  terminalColumns = DEFAULT_TERMINAL_COLUMN_IDS,
  today,
  detailHref,
  onEdit,
  onReview,
  onStoryClick,
}: SprintSectionProps) {
  const [open, setOpen] = useState(true);
  const [showLoad, setShowLoad] = useState(false);
  const { setNodeRef } = useDroppable({ id });

  const plannedPt = stories.reduce((sum, story) => sum + story.estimate_pt, 0);
  // For real sprints, show completed vs. planned; the backlog section has none.
  const progress = sprint
    ? sprintProgress(sprint, stories, boardTasks, terminalColumns)
    : null;
  const range = sprint ? formatSprintRange(sprint) : "";
  // "Active" is derived purely from the timebox, independent of the set status.
  const active = sprint && today ? isActiveSprint(sprint, today) : false;
  const workload = sprint
    ? sprintWorkload(sprint, stories, boardTasks, persons)
    : [];
  // Commitment warning: planned PT vs. combined team capacity (only real sprints).
  const commitment = sprint ? sprintCommitment(plannedPt, persons) : null;

  return (
    <section
      data-testid={`sprint-section-${id}`}
      className="flex flex-col rounded-xl border border-border bg-surface/50"
    >
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            aria-expanded={open}
            aria-label={`Sektion ${label} ${open ? "einklappen" : "ausklappen"}`}
            data-testid={`sprint-section-toggle-${id}`}
            onClick={() => setOpen((value) => !value)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            {open ? (
              <ChevronDown className="size-4 shrink-0 text-muted" />
            ) : (
              <ChevronRight className="size-4 shrink-0 text-muted" />
            )}
            <h3 className="truncate text-sm font-medium text-foreground">{label}</h3>
            <span className="shrink-0 font-mono text-xs text-muted">
              {stories.length}
            </span>
          </button>
          <div className="flex shrink-0 items-center gap-1.5">
            {active && <StatusBadge status="running" label="Aktiv" />}
            {sprint && (
              <StatusBadge
                status={SPRINT_STATUS[sprint.status].status}
                label={SPRINT_STATUS[sprint.status].label}
              />
            )}
            {commitment?.overcommitted && (
              <span
                data-testid={`sprint-commitment-${id}`}
                title={`Geplant ${commitment.plannedPt} PT über Kapazität ${commitment.capacityPt} PT`}
              >
                <StatusBadge status="warning" label="Überplant" />
              </span>
            )}
            {detailHref && (
              <Button
                variant="ghost"
                size="icon-xs"
                nativeButton={false}
                aria-label={`Sprint ${label} öffnen`}
                data-testid={`sprint-detail-link-${id}`}
                render={<Link href={detailHref} />}
              >
                <ArrowUpRight />
              </Button>
            )}
            {onReview && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Sprint ${label}: Review & Retro`}
                onClick={onReview}
              >
                <ClipboardList />
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Sprint ${label} bearbeiten`}
                onClick={onEdit}
              >
                <Pencil />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pl-6">
          <div className="flex min-w-0 flex-col gap-0.5">
            {range && (
              <p
                data-testid={`sprint-section-${id}-range`}
                className="font-mono text-xs text-muted"
              >
                {range}
              </p>
            )}
            {goal && <p className="truncate text-xs text-muted">{goal}</p>}
          </div>
          <span
            data-testid={`sprint-section-${id}-points`}
            className="shrink-0 font-mono text-xs text-muted"
          >
            {progress
              ? `erledigt ${progress.donePt} / geplant ${progress.plannedPt} PT · ${progress.doneCount}/${progress.total}`
              : `${plannedPt} PT · ${stories.length}`}
          </span>
        </div>

        {/* Progress as a bar (donePt/plannedPt) instead of text only (TASK-028). */}
        {progress && progress.plannedPt > 0 && (
          <div className="pl-6">
            <ProgressBar
              value={progress.donePt}
              max={progress.plannedPt}
              status="success"
              label={`Sprint-Fortschritt ${label}: ${progress.donePt} von ${progress.plannedPt} PT erledigt`}
            />
          </div>
        )}
      </div>

      {open && (
        <div className="flex flex-col gap-3 border-t border-border p-3">
          <SortableContext
            items={stories.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div ref={setNodeRef} className="flex min-h-16 flex-col gap-2">
              {stories.map((story) => (
                <SprintStoryCard
                  key={story.id}
                  story={story}
                  variant="row"
                  done={isStoryDone(story.id, boardTasks, terminalColumns)}
                  onOpen={onStoryClick}
                />
              ))}
              {stories.length === 0 && (
                <div className="flex min-h-16 items-center justify-center rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted">
                  Keine Stories
                </div>
              )}
            </div>
          </SortableContext>

          {workload.length > 0 && (
            <div
              data-testid={`sprint-section-${id}-workload`}
              className="flex flex-col gap-1.5 border-t border-border pt-2"
            >
              <button
                type="button"
                aria-expanded={showLoad}
                data-testid={`sprint-load-toggle-${id}`}
                onClick={() => setShowLoad((value) => !value)}
                className="flex items-center gap-1.5 px-1 text-xs font-medium text-muted hover:text-foreground"
              >
                <ChevronRight
                  className={cn("size-3.5 transition-transform", showLoad && "rotate-90")}
                />
                Auslastung ({workload.length})
              </button>
              {showLoad &&
                workload.map((load) => {
                  const overloaded =
                    load.capacityPt > 0 && load.assignedPt > load.capacityPt;
                  const pct =
                    load.capacityPt > 0
                      ? Math.round((load.assignedPt / load.capacityPt) * 100)
                      : null;
                  return (
                    <div
                      key={load.personId}
                      data-testid={`sprint-load-${load.personId}`}
                      className="flex flex-col gap-1 px-1"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-foreground">{load.name}</span>
                        <span className="shrink-0 font-mono text-muted">
                          {load.assignedPt} / {load.capacityPt} PT
                          {overloaded && (
                            <span className="ml-1 text-danger">({pct}%)</span>
                          )}
                        </span>
                      </div>
                      <ProgressBar
                        value={load.assignedPt}
                        max={load.capacityPt}
                        status={load.status}
                        label={`Auslastung ${load.name}: ${load.assignedPt} von ${load.capacityPt} PT`}
                      />
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
