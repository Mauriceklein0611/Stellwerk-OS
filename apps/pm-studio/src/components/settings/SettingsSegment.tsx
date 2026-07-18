"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

type SettingsSegmentProps<T extends string> = {
  /** Accessible group label (e.g. "Theme"). */
  label: string;
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
};

/**
 * Generic segmented control for settings (TASK-029). Same look as the board
 * view toggle, but reusable for theme / board view / motion. Implemented as an
 * ARIA radiogroup so keyboard and screen-reader users get a single control.
 */
export function SettingsSegment<T extends string>({
  label,
  value,
  options,
  onChange,
}: SettingsSegmentProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex items-center gap-1 rounded-lg border border-border p-0.5"
    >
      {options.map((option) => {
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
