import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Requirements } from "@/types";

const SECTIONS: { key: keyof Requirements; label: string }[] = [
  { key: "functional", label: "Funktional" },
  { key: "non_functional", label: "Nicht-funktional" },
  { key: "technical", label: "Technisch" },
  { key: "dependencies", label: "Abhängigkeiten" },
  { key: "assumptions", label: "Annahmen" },
  { key: "budget_drivers", label: "Budgettreiber" },
  { key: "time_risks", label: "Zeitrisiken" },
  { key: "clarifications", label: "Klärungspunkte" },
];

/** Renders the Requirements artifact as bulleted sections. */
export function RequirementsView({ requirements }: { requirements: Requirements }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {SECTIONS.map(({ key, label }) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle className="text-sm">{label}</CardTitle>
          </CardHeader>
          <CardContent>
            {requirements[key].length === 0 ? (
              <p className="text-sm text-muted">—</p>
            ) : (
              <ul className="list-disc pl-5 text-sm text-foreground">
                {requirements[key].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
