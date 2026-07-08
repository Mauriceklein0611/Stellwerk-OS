import type { RiskEntry, RiskStatus, StatusType } from "@/types";

/**
 * Risk lifecycle → <StatusBadge> props (TASK-045). Keeps risk-status colors
 * flowing through the single status-color source instead of ad-hoc colors,
 * mirroring SPRINT_STATUS/RELEASE_STATUS.
 */
export const RISK_STATUS: Record<
  RiskStatus,
  { status: StatusType; label: string }
> = {
  open: { status: "danger", label: "Offen" },
  mitigating: { status: "warning", label: "In Bearbeitung" },
  monitoring: { status: "info", label: "Beobachtung" },
  closed: { status: "success", label: "Geschlossen" },
};

/** Stable display/selection order for the status select. */
export const RISK_STATUS_ORDER: RiskStatus[] = [
  "open",
  "mitigating",
  "monitoring",
  "closed",
];

/** Default for new and legacy (un-migrated) risks. */
export const DEFAULT_RISK_STATUS: RiskStatus = "open";

/** <StatusBadge> props for a risk status. */
export function riskStatusBadge(status: RiskStatus): {
  status: StatusType;
  label: string;
} {
  return RISK_STATUS[status];
}

/**
 * Editable fields of a risk (everything but the id). The form binds to these;
 * transforms trim and drop empty optional text fields.
 */
export type RiskFormValues = {
  title: string;
  probability: RiskEntry["probability"];
  impact: RiskEntry["impact"];
  priority: RiskEntry["priority"];
  status: RiskStatus;
  owner: string;
  mitigation: string;
  escalation: string;
};

/** Sensible defaults for the "add risk" form. */
export const EMPTY_RISK_FORM: RiskFormValues = {
  title: "",
  probability: "mittel",
  impact: "mittel",
  priority: "mittel",
  status: "open",
  owner: "",
  mitigation: "",
  escalation: "",
};

/** Pre-fill the form from an existing risk for editing. */
export function riskFormValues(risk: RiskEntry): RiskFormValues {
  return {
    title: risk.title,
    probability: risk.probability,
    impact: risk.impact,
    priority: risk.priority,
    status: risk.status,
    owner: risk.owner ?? "",
    mitigation: risk.mitigation ?? "",
    escalation: risk.escalation ?? "",
  };
}

/** Trim text fields; empty optional strings become `undefined` (not persisted). */
function normalizeFields(
  values: RiskFormValues,
): Omit<RiskEntry, "id"> {
  const owner = values.owner.trim();
  const mitigation = values.mitigation.trim();
  const escalation = values.escalation.trim();
  return {
    title: values.title.trim(),
    probability: values.probability,
    impact: values.impact,
    priority: values.priority,
    status: values.status,
    owner: owner || undefined,
    mitigation: mitigation || undefined,
    escalation: escalation || undefined,
  };
}

/**
 * Build a new risk. The id is injectable so tests stay deterministic
 * (same pattern as createActivityEvent in TASK-043).
 */
export function createRisk(
  values: RiskFormValues,
  makeId: () => string = () => crypto.randomUUID(),
): RiskEntry {
  return { id: makeId(), ...normalizeFields(values) };
}

/**
 * Append a risk. A blank title is ignored (array returned unchanged), so the
 * dialog never persists an empty row.
 */
export function addRisk(
  risks: RiskEntry[],
  values: RiskFormValues,
  makeId: () => string = () => crypto.randomUUID(),
): RiskEntry[] {
  if (!values.title.trim()) return risks;
  return [...risks, createRisk(values, makeId)];
}

/** Replace the editable fields of one risk (id preserved). Unknown id = no-op. */
export function updateRisk(
  risks: RiskEntry[],
  id: string,
  values: RiskFormValues,
): RiskEntry[] {
  return risks.map((risk) =>
    risk.id === id ? { id: risk.id, ...normalizeFields(values) } : risk,
  );
}

/** Remove a risk by id. */
export function removeRisk(risks: RiskEntry[], id: string): RiskEntry[] {
  return risks.filter((risk) => risk.id !== id);
}

/**
 * Backfill a missing status to "open" – used by the persist migration so
 * legacy (agent-generated) risks stay valid and editable.
 */
export function withRiskStatus(risk: RiskEntry): RiskEntry {
  // Legacy persisted risks may lack `status` despite the type – backfill it.
  return { ...risk, status: risk.status ?? DEFAULT_RISK_STATUS };
}
