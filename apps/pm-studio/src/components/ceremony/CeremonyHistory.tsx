"use client";

import { ListPlus } from "lucide-react";

import { StatusBadge } from "@/components/agents/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  CeremonyEnrichment,
  type LinkableItem,
} from "@/components/ceremony/CeremonyEnrichment";
import { RETRO_COLUMNS } from "@/lib/sprint-review-schema";
import { scopeLabel, type CeremonyEntry } from "@/lib/ceremonies";
import { retroActionHasTask } from "@/lib/retro-actions";
import type {
  BoardTask,
  CeremonyComment,
  SprintRetro,
  SprintReview,
  Team,
} from "@/types";

/** Story/task lists of a sprint, used to power the link picker (TASK-055). */
export type SprintItems = { stories: LinkableItem[]; tasks: LinkableItem[] };

/** Which ceremony list an entry belongs to (TASK-055 callbacks). */
type CeremonyKind = "review" | "retro";

/** Epoch marks a legacy TASK-018 entry migrated without a real timestamp. */
const LEGACY_CREATED_AT = new Date(0).toISOString();

function formatDate(createdAt: string): string {
  if (createdAt === LEGACY_CREATED_AT) return "Datum unbekannt";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Datum unbekannt";
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type CeremonyHistoryProps = {
  entries: CeremonyEntry[];
  /** Resolve a sprint id to a display label (e.g. "Projekt · Sprint"). */
  sprintLabel: (sprintId: string) => string;
  teams: Team[];
  /**
   * Linkable stories/tasks of a sprint for the picker (TASK-055). Defaults to
   * empty lists ⇒ enrichment renders without a picker (keeps TASK-054 callers
   * that don't pass it working).
   */
  sprintItems?: (sprintId: string) => SprintItems;
  /**
   * All board tasks – used to detect which retro actions already spawned a task
   * (TASK-065). Defaults to empty ⇒ actions render as plain text without the
   * create button (keeps TASK-054 callers that don't pass it working).
   */
  boardTasks?: BoardTask[];
  /** Turn a single retro action into a board task (TASK-065). */
  onCreateActionTask?: (retro: SprintRetro, action: string) => void;
  onToggleStory?: (kind: CeremonyKind, entryId: string, storyId: string) => void;
  onToggleTask?: (kind: CeremonyKind, entryId: string, taskId: string) => void;
  onAddComment?: (
    kind: CeremonyKind,
    entryId: string,
    comment: CeremonyComment,
  ) => void;
  onRemoveComment?: (
    kind: CeremonyKind,
    entryId: string,
    commentId: string,
  ) => void;
};

const NO_ITEMS: SprintItems = { stories: [], tasks: [] };
const noop = () => {};

/** Chronological (newest first) list of reviews and retros (TASK-054/055). */
export function CeremonyHistory({
  entries,
  sprintLabel,
  teams,
  sprintItems,
  boardTasks = [],
  onCreateActionTask = noop,
  onToggleStory = noop,
  onToggleTask = noop,
  onAddComment = noop,
  onRemoveComment = noop,
}: CeremonyHistoryProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
        Noch keine Reviews oder Retros. Lege über die Buttons oben den ersten
        Eintrag an.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3" data-testid="ceremony-history">
      {entries.map((entry) => {
        const base = entry.kind === "review" ? entry.review : entry.retro;
        const items = sprintItems?.(base.sprintId) ?? NO_ITEMS;
        return (
          <li
            key={base.id}
            data-testid="ceremony-entry"
            data-kind={entry.kind}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                status={entry.kind === "review" ? "info" : "success"}
                label={entry.kind === "review" ? "Review" : "Retro"}
              />
              <span className="text-sm font-medium text-foreground">
                {sprintLabel(base.sprintId)}
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted">
                {scopeLabel(base.scope, base.teamId, teams)}
              </span>
              <span className="ml-auto text-xs text-muted">
                {formatDate(base.createdAt)}
              </span>
            </div>

            <div className="mt-3">
              {entry.kind === "review" ? (
                <ReviewBody review={entry.review} />
              ) : (
                <RetroBody
                  retro={entry.retro}
                  boardTasks={boardTasks}
                  onCreateActionTask={onCreateActionTask}
                />
              )}
            </div>

            <CeremonyEnrichment
              sprintId={base.sprintId}
              linkedStoryIds={base.linkedStoryIds}
              linkedTaskIds={base.linkedTaskIds}
              comments={base.comments}
              availableStories={items.stories}
              availableTasks={items.tasks}
              onToggleStory={(storyId) =>
                onToggleStory(entry.kind, base.id, storyId)
              }
              onToggleTask={(taskId) => onToggleTask(entry.kind, base.id, taskId)}
              onAddComment={(comment) =>
                onAddComment(entry.kind, base.id, comment)
              }
              onRemoveComment={(commentId) =>
                onRemoveComment(entry.kind, base.id, commentId)
              }
            />
          </li>
        );
      })}
    </ul>
  );
}

function ReviewBody({ review }: { review: SprintReview }) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <p className="whitespace-pre-wrap text-foreground">{review.delivered}</p>
      <p className="text-xs text-muted">Erreichte Story-Points: {review.achievedPt}</p>
      {review.notes && (
        <p className="whitespace-pre-wrap text-xs text-muted">{review.notes}</p>
      )}
    </div>
  );
}

function RetroBody({
  retro,
  boardTasks,
  onCreateActionTask,
}: {
  retro: SprintRetro;
  boardTasks: BoardTask[];
  onCreateActionTask: (retro: SprintRetro, action: string) => void;
}) {
  const lists: Record<string, string[]> = {
    good: retro.good,
    improve: retro.improve,
    actions: retro.actions,
  };
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {RETRO_COLUMNS.map((column) => (
        <div key={column.key} className="flex flex-col gap-1">
          <span className="text-xs font-medium text-foreground">{column.label}</span>
          {lists[column.key].length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {lists[column.key].map((item, index) =>
                column.key === "actions" ? (
                  <ActionItem
                    key={`${item}-${index}`}
                    action={item}
                    hasTask={retroActionHasTask(retro.id, item, boardTasks)}
                    onCreate={() => onCreateActionTask(retro, item)}
                  />
                ) : (
                  <li key={`${item}-${index}`} className="text-xs text-muted">
                    • {item}
                  </li>
                ),
              )}
            </ul>
          ) : (
            <span className="text-xs text-muted">–</span>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * One retro action row (TASK-065): text plus either a "→ Task" button or, once
 * a linked board task exists, a "Task erstellt" badge (dedup ⇒ no second task).
 */
function ActionItem({
  action,
  hasTask,
  onCreate,
}: {
  action: string;
  hasTask: boolean;
  onCreate: () => void;
}) {
  return (
    <li
      data-testid="retro-action"
      className="flex items-start justify-between gap-2 text-xs text-muted"
    >
      <span className="min-w-0 flex-1">• {action}</span>
      {hasTask ? (
        <span data-testid="retro-action-linked" className="shrink-0">
          <StatusBadge status="success" label="Task erstellt" />
        </span>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 shrink-0 px-1.5 text-[11px]"
          data-testid="retro-action-create-task"
          onClick={onCreate}
        >
          <ListPlus className="mr-1 size-3" />
          Task
        </Button>
      )}
    </li>
  );
}
