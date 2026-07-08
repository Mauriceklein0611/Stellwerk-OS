import { StatusBadge } from "@/components/agents/StatusBadge";
import { PROVENANCE_META } from "@/lib/provenance";
import type { BacklogProvenance } from "@/types";

/**
 * Small provenance mark on a backlog story (TASK-060). Renders nothing for
 * manually created stories (`human`); shows "Agent" / "bearbeitet" for
 * agent-provided items so their origin stays visible after acceptance (AC).
 * Color is single-sourced through `<StatusBadge>` (see PROVENANCE_META).
 */
export function ProvenanceBadge({
  provenance,
  className,
}: {
  provenance: BacklogProvenance;
  className?: string;
}) {
  const meta = PROVENANCE_META[provenance];
  if (!meta) return null;
  return (
    <StatusBadge
      status={meta.status}
      label={meta.label}
      className={className}
    />
  );
}
