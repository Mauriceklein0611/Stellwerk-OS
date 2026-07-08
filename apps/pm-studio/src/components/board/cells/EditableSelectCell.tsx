"use client";

import type { ReactNode } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SelectCellOption = {
  value: string;
  label: string;
  /** Optional rich rendering (e.g. a StatusBadge) for the trigger and the item. */
  node?: ReactNode;
};

type EditableSelectCellProps = {
  value: string;
  options: SelectCellOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  /** Render a static placeholder instead of a dropdown (e.g. sprint without a story). */
  disabled?: boolean;
  placeholder?: ReactNode;
};

/**
 * One inline-editable select cell (TASK-030): a borderless trigger shows the
 * current option, the dropdown changes it. Click propagation is stopped so
 * opening the dropdown never triggers the row's TaskDialog.
 */
export function EditableSelectCell({
  value,
  options,
  onChange,
  ariaLabel,
  disabled,
  placeholder,
}: EditableSelectCellProps) {
  if (disabled) {
    return <span className="text-muted">{placeholder ?? "–"}</span>;
  }

  const renderValue = (current: string) => {
    const option = options.find((item) => item.value === current);
    return option?.node ?? option?.label ?? null;
  };

  return (
    <span onClick={(event) => event.stopPropagation()}>
      <Select
        value={value}
        onValueChange={(next) => {
          if (next !== null) onChange(next);
        }}
      >
        <SelectTrigger
          aria-label={ariaLabel}
          className="h-auto gap-1 border-transparent bg-transparent px-1 py-0.5 shadow-none hover:bg-surface-hover"
        >
          <SelectValue>
            {(current) => renderValue(current as string)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.node ?? option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </span>
  );
}
