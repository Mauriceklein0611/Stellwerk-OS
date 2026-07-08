"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Team } from "@/types";

type TeamCardProps = {
  team: Team;
  /** Number of persons currently assigned to this team. */
  memberCount: number;
  onEdit: () => void;
};

/** Master-data card for a single team (name, description, member count). */
export function TeamCard({ team, memberCount, onEdit }: TeamCardProps) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-medium text-foreground">{team.name}</p>
          <Button variant="ghost" size="xs" onClick={onEdit}>
            Bearbeiten
          </Button>
        </div>
        {team.description && (
          <p className="text-xs text-muted">{team.description}</p>
        )}
        <Badge variant="outline" className="w-fit">
          {memberCount} {memberCount === 1 ? "Mitglied" : "Mitglieder"}
        </Badge>
      </CardContent>
    </Card>
  );
}
