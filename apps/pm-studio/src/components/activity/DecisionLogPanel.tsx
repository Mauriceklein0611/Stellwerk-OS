"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { decisionsForEntity } from "@/lib/decision";
import { formatDate } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";
import { useDecisionStore } from "@/store/useDecisionStore";
import type { ActivityEntityType } from "@/types";

type DecisionLogPanelProps = {
  entityType: ActivityEntityType;
  entityId: string;
  title?: string;
};

/**
 * Decision Log for one entity (TASK-043): human approvals and scope decisions
 * with an optional rationale. Append-only via the inline form; reading is the
 * pure `decisionsForEntity` selector. Like the feed, the store array is
 * selected as-is and the slice derived via useMemo (avoids the zustand
 * getSnapshot loop, see TASK-031).
 */
export function DecisionLogPanel({
  entityType,
  entityId,
  title = "Entscheidungen",
}: DecisionLogPanelProps) {
  const hydrated = useHydrated();
  const allDecisions = useDecisionStore((state) => state.decisions);
  const addDecision = useDecisionStore((state) => state.addDecision);

  const [context, setContext] = useState("");
  const [choice, setChoice] = useState("");
  const [rationale, setRationale] = useState("");

  const decisions = useMemo(
    () => decisionsForEntity(allDecisions, entityType, entityId),
    [allDecisions, entityType, entityId],
  );

  const canAdd = context.trim().length > 0 && choice.trim().length > 0;

  function handleAdd() {
    if (!canAdd) return;
    addDecision({
      context,
      choice,
      rationale,
      relatedEntity: { type: entityType, id: entityId },
    });
    setContext("");
    setChoice("");
    setRationale("");
  }

  return (
    <section
      data-testid="decision-log"
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <h3 className="text-sm font-medium text-foreground">{title}</h3>

      {/* Inline add form */}
      <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="decision-context">Kontext</Label>
          <Input
            id="decision-context"
            value={context}
            placeholder="Worum ging es?"
            onChange={(event) => setContext(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="decision-choice">Entscheidung</Label>
          <Input
            id="decision-choice"
            value={choice}
            placeholder="Was wurde entschieden?"
            onChange={(event) => setChoice(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="decision-rationale">Begründung (optional)</Label>
          <Textarea
            id="decision-rationale"
            rows={2}
            value={rationale}
            onChange={(event) => setRationale(event.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Button size="sm" disabled={!canAdd} onClick={handleAdd}>
            <Plus className="size-4" aria-hidden />
            Festhalten
          </Button>
        </div>
      </div>

      {/* Log */}
      {!hydrated ? (
        <p className="text-sm text-muted">Lädt …</p>
      ) : decisions.length === 0 ? (
        <p className="text-sm text-muted" data-testid="decision-log-empty">
          Noch keine Entscheidungen festgehalten.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {decisions.map((decision) => (
            <li
              key={decision.id}
              data-testid="decision-entry"
              className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium text-foreground">
                  {decision.choice}
                </span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                  {formatDate(decision.createdAt)}
                </span>
              </div>
              <span className="text-xs text-muted">{decision.context}</span>
              {decision.rationale && (
                <span className="text-xs text-foreground/80">
                  Begründung: {decision.rationale}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
