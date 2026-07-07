"use client";

import { Check, ListChecks, Pencil, X } from "lucide-react";

import { StatusBadge } from "@/components/agents/StatusBadge";
import { Button } from "@/components/ui/button";
import { severityBadge } from "@/lib/severity";
import type { BacklogStory } from "@/types";

type ProposalCardProps = {
  story: BacklogStory;
  epicTitle: string;
  onAccept: () => void;
  onEdit: () => void;
  onDiscard: () => void;
};

/**
 * One suggestion card in the agent proposal inbox (TASK-060). Shows the proposed
 * story with its epic, priority and points, plus the three per-card actions:
 * Übernehmen (→ backlog, provenance "agent"), Bearbeiten (→ story dialog,
 * provenance "human_edited") and Verwerfen (drops it, leaves nothing behind).
 */
export function ProposalCard({
  story,
  epicTitle,
  onAccept,
  onEdit,
  onDiscard,
}: ProposalCardProps) {
  const priority = severityBadge(story.priority);

  return (
    <div
      data-testid={`proposal-card-${story.id}`}
      className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted">{epicTitle}</p>
          <p className="text-sm font-medium text-foreground">{story.title}</p>
        </div>
        <StatusBadge status={priority.status} label={priority.label} />
      </div>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="font-mono">{story.estimate_pt} PT</span>
        {story.acceptance_criteria.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <ListChecks className="size-3.5" aria-hidden />
            {story.acceptance_criteria.length} AK
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          data-testid={`proposal-accept-${story.id}`}
          onClick={onAccept}
        >
          <Check className="size-4" aria-hidden />
          Übernehmen
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-testid={`proposal-edit-${story.id}`}
          onClick={onEdit}
        >
          <Pencil className="size-4" aria-hidden />
          Bearbeiten
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          data-testid={`proposal-discard-${story.id}`}
          onClick={onDiscard}
          className="text-muted hover:text-danger"
        >
          <X className="size-4" aria-hidden />
          Verwerfen
        </Button>
      </div>
    </div>
  );
}
