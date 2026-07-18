import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APPROACH_LABELS } from "@/lib/idea-schema";
import type { ProjectIdea } from "@/types";

function TextCard({ title, value }: { title: string; value?: string }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-foreground">
        {value?.trim() ? value : <span className="text-muted">—</span>}
      </CardContent>
    </Card>
  );
}

function Meta({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wider text-muted">{label}</span>
      <span className="text-sm text-foreground">
        {value?.trim() ? value : "—"}
      </span>
    </div>
  );
}

/**
 * Read-only view of the captured project idea. Later the place to "edit idea +
 * re-run pipeline" (not implemented yet).
 */
export function IdeaTab({ idea }: { idea: ProjectIdea }) {
  const constraints = (idea.constraints ?? "")
    .split(/[,\n]/)
    .map((c) => c.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TextCard title="Problem" value={idea.problem} />
        <TextCard title="Zielgruppe" value={idea.targetAudience} />
        <TextCard title="Gewünschter Nutzen" value={idea.benefit} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Gewünschte Features</CardTitle>
        </CardHeader>
        <CardContent>
          {idea.features.length === 0 ? (
            <span className="text-sm text-muted">—</span>
          ) : (
            <ul className="list-disc pl-5 text-sm text-foreground">
              {idea.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Technische Einschränkungen</CardTitle>
        </CardHeader>
        <CardContent>
          {constraints.length === 0 ? (
            <span className="text-sm text-muted">—</span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {constraints.map((constraint) => (
                <Badge key={constraint} variant="outline">
                  {constraint}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Rahmen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Meta label="Vorgehen" value={APPROACH_LABELS[idea.approach]} />
            <Meta label="Zeitraum" value={idea.timeframe} />
            <Meta label="Budget" value={idea.budget} />
            <Meta label="Teamgröße" value={idea.teamSize} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
