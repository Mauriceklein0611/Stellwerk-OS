/**
 * Format an ISO timestamp as a short German relative time ("vor 5 min").
 * `now` is injectable so the logic is deterministic in tests.
 */
export function formatRelativeTime(
  timestamp: string,
  now: Date = new Date(),
): string {
  const diffMs = now.getTime() - new Date(timestamp).getTime();
  const diffMin = Math.max(0, Math.round(diffMs / 60_000));

  if (diffMin < 1) return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin} min`;

  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} h`;

  const diffD = Math.round(diffH / 24);
  return `vor ${diffD} d`;
}

/** Format an ISO timestamp as a short German date (e.g. "12.06.2026"). */
export function formatDate(timestamp: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp));
}
