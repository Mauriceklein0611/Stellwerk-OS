/** Shared empty state for charts with no data. */
export function ChartEmpty({ message = "Keine Daten." }: { message?: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center text-sm text-muted">
      {message}
    </div>
  );
}
