import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/agents/StatusBadge";
import type { StatusCheck } from "@/types";

/**
 * Health grid (Tests / CI-CD / Quality / Reviews). Each tile shows a label,
 * the central status badge and a short detail line.
 */
export function StatusGrid({ checks }: { checks: StatusCheck[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Status</CardTitle>
      </CardHeader>
      <CardContent>
        {checks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            Keine Statusdaten.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {checks.map((check) => (
              <div
                key={check.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {check.label}
                  </span>
                  <StatusBadge status={check.status} />
                </div>
                <span className="text-xs text-muted">{check.detail}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
