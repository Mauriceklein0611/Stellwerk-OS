"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { initials, teamName } from "@/lib/people";
import type { Person, Team } from "@/types";

type PersonCardProps = {
  person: Person;
  teams: Team[];
  onEdit: () => void;
};

/** Master-data card for a single person (initials avatar, role, team, capacity). */
export function PersonCard({ person, teams, onEdit }: PersonCardProps) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
        >
          {initials(person.name)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-medium text-foreground">{person.name}</p>
            <Button variant="ghost" size="xs" onClick={onEdit}>
              Bearbeiten
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{person.role}</Badge>
            <Badge variant="outline">{teamName(person, teams)}</Badge>
          </div>
          {person.email && (
            <p className="truncate text-xs text-muted">{person.email}</p>
          )}
          <p className="text-xs text-muted">
            Kapazität: {person.capacityPtPerSprint} PT/Sprint
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
