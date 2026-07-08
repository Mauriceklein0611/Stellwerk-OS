import type { StatusType } from "@/types";

/** Human labels for agent statuses (error = danger). */
const LABELS: Record<StatusType, string> = {
  idle: "Inaktiv",
  running: "Läuft",
  success: "Erfolg",
  danger: "Fehler",
  warning: "Warnung",
  info: "Info",
};

export function agentStatusLabel(status: StatusType): string {
  return LABELS[status];
}
