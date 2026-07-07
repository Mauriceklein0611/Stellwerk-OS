"use client";

import { Columns3, Rows3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BoardView } from "@/lib/board";

type BoardViewToggleProps = {
  value: BoardView;
  onChange: (view: BoardView) => void;
};

const OPTIONS: { value: BoardView; label: string; icon: typeof Columns3 }[] = [
  { value: "kanban", label: "Kanban", icon: Columns3 },
  { value: "list", label: "Liste", icon: Rows3 },
];

/** Segmented control to switch between the Kanban board and the Scrum list. */
export function BoardViewToggle({ value, onChange }: BoardViewToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Board-Ansicht"
      className="inline-flex items-center gap-1 rounded-lg border border-border p-0.5"
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
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
            <Icon />
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
