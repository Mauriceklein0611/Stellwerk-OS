"use client";

import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NO_TEAM,
  personFormDefaults,
  personFormSchema,
  personFromForm,
  type PersonFormValues,
} from "@/lib/people";
import type { Person, Team } from "@/types";

type PersonDialogProps = {
  open: boolean;
  /** null → create mode, otherwise edit mode. */
  person: Person | null;
  teams: Team[];
  onOpenChange: (open: boolean) => void;
  onCreate: (values: Omit<Person, "id">) => void;
  onUpdate: (id: string, patch: Omit<Person, "id">) => void;
  onDelete: (id: string) => void;
};

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-danger"> *</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type PersonFormProps = Omit<PersonDialogProps, "open" | "onOpenChange"> & {
  onClose: () => void;
};

/**
 * Validated person form (react-hook-form + zod). Keyed by person id in the
 * parent so it remounts and re-initializes whenever a different person opens.
 */
function PersonForm({
  person,
  teams,
  onCreate,
  onUpdate,
  onDelete,
  onClose,
}: PersonFormProps) {
  const isEdit = person !== null;
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PersonFormValues>({
    resolver: zodResolver(personFormSchema),
    defaultValues: personFormDefaults(person ?? undefined),
  });

  const onSubmit = (values: PersonFormValues) => {
    const fields = personFromForm(values);
    if (isEdit) onUpdate(person.id, fields);
    else onCreate(fields);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Person bearbeiten" : "Neue Person"}</DialogTitle>
        <DialogDescription>
          Name, Rolle, Kapazität (Personentage pro Sprint) und Team festlegen.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3 py-4">
        <Field id="person-name" label="Name" required error={errors.name?.message}>
          <Input
            id="person-name"
            aria-invalid={!!errors.name}
            placeholder="z. B. Lena Schmidt"
            {...register("name")}
          />
        </Field>

        <Field id="person-role" label="Rolle" required error={errors.role?.message}>
          <Input
            id="person-role"
            aria-invalid={!!errors.role}
            placeholder="z. B. Frontend, PO, QA"
            {...register("role")}
          />
        </Field>

        <Field id="person-email" label="E-Mail" error={errors.email?.message}>
          <Input
            id="person-email"
            type="email"
            aria-invalid={!!errors.email}
            placeholder="optional"
            {...register("email")}
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            id="person-capacity"
            label="Kapazität (PT/Sprint)"
            required
            error={errors.capacityPtPerSprint?.message}
          >
            <Input
              id="person-capacity"
              type="number"
              min={0}
              step="0.5"
              aria-invalid={!!errors.capacityPtPerSprint}
              {...register("capacityPtPerSprint", { valueAsNumber: true })}
            />
          </Field>

          <Field id="person-team" label="Team">
            <Controller
              control={control}
              name="teamId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="person-team" className="w-full">
                    <SelectValue>
                      {(value) =>
                        teams.find((team) => team.id === value)?.name ??
                        "Kein Team"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_TEAM}>Kein Team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>
      </div>

      <DialogFooter className="sm:justify-between">
        {isEdit ? (
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onDelete(person.id);
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

/** Create/edit dialog for a person (TASK-019). */
export function PersonDialog({ open, onOpenChange, ...rest }: PersonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <PersonForm
            key={rest.person?.id ?? "new"}
            onClose={() => onOpenChange(false)}
            {...rest}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
