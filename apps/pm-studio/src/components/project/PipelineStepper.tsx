"use client";

import { Check, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  PIPELINE_STEPS,
  type StepStatus,
  type StepTab,
  type StepKey,
} from "@/lib/pipeline-steps";

const CIRCLE: Record<StepStatus, string> = {
  done: "border-success/40 bg-success/10 text-success",
  running: "border-primary bg-primary/10 text-primary",
  awaiting_review: "border-warning/50 bg-warning/10 text-warning",
  pending: "border-border text-muted",
};

/**
 * Always-visible horizontal pipeline stepper. done = check (success),
 * running = pulsing primary, pending = outline. Clicking a done step jumps to
 * its tab. Status comes from computeStepStatuses (see pipeline-steps).
 */
export function PipelineStepper({
  statuses,
  onStepClick,
}: {
  statuses: Record<StepKey, StepStatus>;
  onStepClick: (tab: StepTab) => void;
}) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto pb-1">
      {PIPELINE_STEPS.map((step, index) => {
        const status = statuses[step.key];
        const clickable = status === "done";

        return (
          <li key={step.key} className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(step.tab)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1 transition-colors",
                clickable ? "hover:bg-surface-hover" : "cursor-default",
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border",
                  CIRCLE[status],
                )}
              >
                {status === "done" ? (
                  <Check className="size-3.5" />
                ) : status === "running" ? (
                  <span className="size-1.5 rounded-full bg-primary motion-safe:animate-pulse" />
                ) : status === "awaiting_review" ? (
                  <Clock className="size-3.5" />
                ) : (
                  <span className="size-1.5 rounded-full bg-muted" />
                )}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  status === "pending" ? "text-muted" : "text-foreground",
                )}
              >
                {step.label}
              </span>
            </button>
            {index < PIPELINE_STEPS.length - 1 ? (
              <span className="h-px w-5 shrink-0 bg-border" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
