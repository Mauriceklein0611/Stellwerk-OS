import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProjectDraft } from "@/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-foreground">{children}</CardContent>
    </Card>
  );
}

/** Renders the ProjectDraft artifact as titled sections. */
export function DraftView({ draft }: { draft: ProjectDraft }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Section title="Zusammenfassung">{draft.summary}</Section>
      <Section title="Zielbild">{draft.vision}</Section>
      <Section title="Nutzenversprechen">{draft.value_proposition}</Section>
      <Section title="Zielgruppe">{draft.target_group}</Section>

      <Section title="MVP">
        <p className="mb-2">{draft.mvp.description}</p>
        <ul className="list-disc pl-5 text-muted">
          {draft.mvp.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </Section>

      <Section title="Phasen">
        <ul className="flex flex-col gap-3">
          {draft.phases.map((phase) => (
            <li key={phase.name} className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{phase.name}</span>
                <Badge
                  variant="outline"
                  className="shrink-0 font-mono text-xs text-muted"
                >
                  {phase.duration_weeks} Wo.
                </Badge>
              </div>
              <span className="text-muted">{phase.goal}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Erste Risiken">
        <ul className="flex flex-col gap-2">
          {draft.initial_risks.map((risk) => (
            <li key={risk.title}>
              <span className="font-medium">{risk.title}: </span>
              <span className="text-muted">{risk.note}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Offene Fragen">
        <ul className="list-disc pl-5 text-muted">
          {draft.open_questions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
