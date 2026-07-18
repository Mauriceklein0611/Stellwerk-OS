"use client";

import { useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  EMPTY_RISK_FORM,
  RISK_STATUS,
  RISK_STATUS_ORDER,
  riskFormValues,
  type RiskFormValues,
} from "@/lib/risk";
import { severityBadge } from "@/lib/severity";
import type { RiskEntry, Severity } from "@/types";

const LEVELS: Severity[] = ["hoch", "mittel", "niedrig"];

/**
 * Discriminator for the dialog: editing an existing risk vs. adding a new one.
 * `null` keeps the dialog closed.
 */
export type RiskDialogTarget =
  | { mode: "edit"; risk: RiskEntry }
  | { mode: "add" }
  | null;

type RiskDialogProps = {
  target: RiskDialogTarget;
  onOpenChange: (open: boolean) => void;
  /** Commit the form: the parent maps it to add/update on the risks array. */
  onSubmit: (values: RiskFormValues) => void;
};

type RiskFormProps = {
  initial: RiskFormValues;
  isEdit: boolean;
  onSubmit: (values: RiskFormValues) => void;
  onCancel: () => void;
};

function LevelSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Severity;
  onChange: (value: Severity) => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(next) => onChange(next as Severity)}>
        <SelectTrigger className="w-full">
          <SelectValue>{(v) => severityBadge(v as Severity).label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {LEVELS.map((level) => (
            <SelectItem key={level} value={level}>
              {severityBadge(level).label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function RiskForm({ initial, isEdit, onSubmit, onCancel }: RiskFormProps) {
  const [values, setValues] = useState<RiskFormValues>(initial);
  const set = <K extends keyof RiskFormValues>(key: K, value: RiskFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Risiko bearbeiten" : "Risiko hinzufügen"}</DialogTitle>
        <DialogDescription>
          Verantwortlich, Status, Wahrscheinlichkeit, Auswirkung und Maßnahmen pflegen.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="risk-title">Risiko</Label>
          <Input
            id="risk-title"
            value={values.title}
            onChange={(event) => set("title", event.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <LevelSelect
            label="Wahrscheinlichkeit"
            value={values.probability}
            onChange={(value) => set("probability", value)}
          />
          <LevelSelect
            label="Auswirkung"
            value={values.impact}
            onChange={(value) => set("impact", value)}
          />
        </div>

        <div className="flex gap-3">
          <LevelSelect
            label="Priorität"
            value={values.priority}
            onChange={(value) => set("priority", value)}
          />
          <div className="flex flex-1 flex-col gap-1.5">
            <Label>Status</Label>
            <Select
              value={values.status}
              onValueChange={(next) =>
                set("status", (next ?? "open") as RiskFormValues["status"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v) => RISK_STATUS[v as RiskFormValues["status"]].label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {RISK_STATUS_ORDER.map((status) => (
                  <SelectItem key={status} value={status}>
                    {RISK_STATUS[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="risk-owner">Verantwortlich</Label>
          <Input
            id="risk-owner"
            value={values.owner}
            placeholder="z. B. Product Owner"
            onChange={(event) => set("owner", event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="risk-mitigation">Maßnahme</Label>
          <Textarea
            id="risk-mitigation"
            rows={2}
            value={values.mitigation}
            onChange={(event) => set("mitigation", event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="risk-escalation">Eskalation</Label>
          <Input
            id="risk-escalation"
            value={values.escalation}
            placeholder="Eskalationspfad / Ansprechpartner"
            onChange={(event) => set("escalation", event.target.value)}
          />
        </div>
      </div>

      <DialogFooter className="sm:justify-end">
        <Button variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button onClick={() => onSubmit(values)} disabled={!values.title.trim()}>
          Speichern
        </Button>
      </DialogFooter>
    </>
  );
}

/** Add/edit dialog for a single risk (TASK-045); transactional via onSubmit. */
export function RiskDialog({ target, onOpenChange, onSubmit }: RiskDialogProps) {
  const isEdit = target?.mode === "edit";
  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent>
        {target && (
          <RiskForm
            key={target.mode === "edit" ? target.risk.id : "add"}
            initial={
              target.mode === "edit"
                ? riskFormValues(target.risk)
                : EMPTY_RISK_FORM
            }
            isEdit={isEdit}
            onSubmit={(values) => {
              onSubmit(values);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
