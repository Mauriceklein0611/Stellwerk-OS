"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { teamFormSchema, type TeamFormValues } from "@/lib/people";
import type { Team } from "@/types";

type TeamFields = { name: string; description?: string };

type TeamDialogProps = {
  open: boolean;
  /** null → create mode, otherwise edit mode. */
  team: Team | null;
  onOpenChange: (open: boolean) => void;
  onCreate: (values: TeamFields) => void;
  onUpdate: (id: string, patch: TeamFields) => void;
  onDelete: (id: string) => void;
};

type TeamFormProps = Omit<TeamDialogProps, "open" | "onOpenChange"> & {
  onClose: () => void;
};

function toFields(values: TeamFormValues): TeamFields {
  return {
    name: values.name.trim(),
    description: values.description?.trim() || undefined,
  };
}

/**
 * Validated team form (react-hook-form + zod). Keyed by team id in the parent
 * so it remounts whenever a different team opens.
 */
function TeamForm({ team, onCreate, onUpdate, onDelete, onClose }: TeamFormProps) {
  const isEdit = team !== null;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: { name: team?.name ?? "", description: team?.description ?? "" },
  });

  const onSubmit = (values: TeamFormValues) => {
    const fields = toFields(values);
    if (isEdit) onUpdate(team.id, fields);
    else onCreate(fields);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Team bearbeiten" : "Neues Team"}</DialogTitle>
        <DialogDescription>
          Name und optionale Beschreibung des Teams festlegen.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3 py-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="team-name">
            Name<span className="text-danger"> *</span>
          </Label>
          <Input
            id="team-name"
            aria-invalid={!!errors.name}
            placeholder="z. B. Plattform-Team"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-danger">{errors.name.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="team-description">Beschreibung</Label>
          <Textarea
            id="team-description"
            rows={2}
            aria-invalid={!!errors.description}
            placeholder="optional"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-xs text-danger">{errors.description.message}</p>
          )}
        </div>
      </div>

      <DialogFooter className="sm:justify-between">
        {isEdit ? (
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onDelete(team.id);
              onClose();
            }}
          >
            Löschen
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Speichern
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

/** Create/edit dialog for a team (TASK-019). */
export function TeamDialog({ open, onOpenChange, ...rest }: TeamDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <TeamForm
            key={rest.team?.id ?? "new"}
            onClose={() => onOpenChange(false)}
            {...rest}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
