/** Renders an agent run's output as formatted, readable JSON (mono). */
export function AgentOutputView({ output }: { output: Record<string, unknown> }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-background p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">
      {JSON.stringify(output, null, 2)}
    </pre>
  );
}
