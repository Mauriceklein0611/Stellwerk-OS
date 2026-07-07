"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReviewForm } from "@/components/sprint/ReviewForm";
import { RetroForm } from "@/components/sprint/RetroForm";
import {
  CEREMONY_SCOPES,
  createRetro,
  createReview,
} from "@/lib/ceremonies";
import type {
  CeremonyScope,
  SprintRetro,
  SprintReview,
  Team,
} from "@/types";

/** A selectable sprint with its derived planned PT (for the review form). */
export type SprintOption = { id: string; label: string; plannedPt: number };

type CeremonyDialogProps = {
  open: boolean;
  /** Which ceremony is being created; null while closed. */
  kind: "review" | "retro" | null;
  sprints: SprintOption[];
  teams: Team[];
  onOpenChange: (open: boolean) => void;
  onSaveReview: (review: SprintReview) => void;
  onSaveRetro: (retro: SprintRetro) => void;
};

/**
 * "Neue Review / neue Retro"-Flow (TASK-054): pick a sprint + scope (+ team),
 * then fill the reused Review/Retro form. On save the caller receives a fully
 * built ceremony (content + metadata) to append to the history.
 */
export function CeremonyDialog({
  open,
  kind,
  sprints,
  teams,
  onOpenChange,
  onSaveReview,
  onSaveRetro,
}: CeremonyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {open && kind && sprints.length > 0 && (
          <CeremonyForm
            key={kind}
            kind={kind}
            sprints={sprints}
            teams={teams}
            onSaveReview={onSaveReview}
            onSaveRetro={onSaveRetro}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type CeremonyFormProps = {
  kind: "review" | "retro";
  sprints: SprintOption[];
  teams: Team[];
  onSaveReview: (review: SprintReview) => void;
  onSaveRetro: (retro: SprintRetro) => void;
  onClose: () => void;
};

function CeremonyForm({
  kind,
  sprints,
  teams,
  onSaveReview,
  onSaveRetro,
  onClose,
}: CeremonyFormProps) {
  const [sprintId, setSprintId] = useState(sprints[0]?.id ?? "");
  const [scope, setScope] = useState<CeremonyScope>("cross");
  const [teamId, setTeamId] = useState<string>("");

  const selected = sprints.find((s) => s.id === sprintId);
  // Team scope needs a chosen team before the form may be filled.
  const teamMissing = scope === "team" && !teamId;
  const canFill = Boolean(selected) && !teamMissing;

  const meta = { scope, teamId: scope === "team" ? teamId : undefined };

  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>
          {kind === "review" ? "Neue Review" : "Neue Retro"}
        </DialogTitle>
        <DialogDescription>
          Sprint und Bezug wählen, dann das Formular ausfüllen. Der Eintrag wird
          der Historie hinzugefügt.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Sprint</Label>
          <Select value={sprintId} onValueChange={(value) => setSprintId(value ?? "")}>
            <SelectTrigger className="w-full" data-testid="ceremony-sprint-trigger">
              <SelectValue>
                {(value) =>
                  sprints.find((s) => s.id === value)?.label ?? "Sprint wählen"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sprints.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  {sprint.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Bezug</Label>
          <Select
            value={scope}
            onValueChange={(value) => setScope((value as CeremonyScope) ?? "cross")}
          >
            <SelectTrigger className="w-full" data-testid="ceremony-scope-trigger">
              <SelectValue>
                {(value) =>
                  CEREMONY_SCOPES.find((s) => s.value === value)?.label ?? "Bezug"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CEREMONY_SCOPES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {scope === "team" && (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Team</Label>
            {teams.length > 0 ? (
              <Select value={teamId} onValueChange={(value) => setTeamId(value ?? "")}>
                <SelectTrigger className="w-full" data-testid="ceremony-team-trigger">
                  <SelectValue>
                    {(value) =>
                      teams.find((t) => t.id === value)?.name ?? "Team wählen"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-muted">
                Noch keine Teams angelegt – im Team-Bereich hinzufügen.
              </p>
            )}
          </div>
        )}
      </div>

      {canFill && selected ? (
        <div key={`${sprintId}-${scope}-${teamId}`} className="border-t border-border pt-4">
          {kind === "review" ? (
            <ReviewForm
              sprintId={selected.id}
              plannedPt={selected.plannedPt}
              onSave={(content) => {
                onSaveReview(createReview(content, meta));
                onClose();
              }}
            />
          ) : (
            <RetroForm
              sprintId={selected.id}
              onSave={(content) => {
                onSaveRetro(createRetro(content, meta));
                onClose();
              }}
            />
          )}
        </div>
      ) : (
        <p className="border-t border-border pt-4 text-sm text-muted">
          {teamMissing
            ? "Bitte ein Team wählen, um fortzufahren."
            : "Bitte einen Sprint wählen, um fortzufahren."}
        </p>
      )}
    </div>
  );
}
