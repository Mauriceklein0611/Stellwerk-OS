"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SWIMLANE_MODES, type SwimlaneMode } from "@/lib/swimlanes";

type SwimlaneSelectProps = {
  value: SwimlaneMode;
  onChange: (mode: SwimlaneMode) => void;
};

/** Segmented control to pick the board's swimlane grouping dimension (TASK-036). */
export function SwimlaneSelect({ value, onChange }: SwimlaneSelectProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Gruppieren nach"
      className="inline-flex items-center gap-1 rounded-lg border border-border p-0.5"
    >
      {SWIMLANE_MODES.map((option) => {
        const active = value === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            variant={active ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onChange(option.value)}
            className={cn(!active && "text-muted")}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
