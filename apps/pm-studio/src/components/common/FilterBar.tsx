"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FilterOption = { value: string; label: string };

export type FilterControl = {
  id: string;
  /** Accessible name for the select (also the fallback trigger text). */
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
};

type FilterBarProps = {
  controls: FilterControl[];
  /** True when any control deviates from its default → shows "Zurücksetzen". */
  active: boolean;
  onReset: () => void;
};

/**
 * Generic, typed filter bar: one Select per criterion plus a reset action
 * (TASK-022). The filter state itself lives in the consuming page (useState),
 * so the bar stays presentational and reusable across Board and Sprint views.
 */
export function FilterBar({ controls, active, onReset }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {controls.map((control) => (
        <Select
          key={control.id}
          value={control.value}
          onValueChange={(value) =>
            control.onChange(value ?? control.options[0]?.value)
          }
        >
          <SelectTrigger aria-label={control.label} className="w-auto min-w-40">
            <SelectValue>
              {(value) =>
                control.options.find((option) => option.value === value)?.label ??
                control.label
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {control.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {active && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          Filter zurücksetzen
        </Button>
      )}
    </div>
  );
}
