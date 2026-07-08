"use client";

import { useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { PersonCard } from "@/components/team/PersonCard";
import { PersonDialog } from "@/components/team/PersonDialog";
import { TeamCard } from "@/components/team/TeamCard";
import { TeamDialog } from "@/components/team/TeamDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConfirmDelete } from "@/components/common/useConfirmDelete";
import { useBoardStore } from "@/store/useBoardStore";
import { useCommandActionStore } from "@/store/useCommandActionStore";
import { usePeopleStore } from "@/store/usePeopleStore";
import { useHydrated } from "@/lib/use-hydrated";
import type { Person, Team } from "@/types";

export default function TeamPage() {
  const hydrated = useHydrated();
  const persons = usePeopleStore((state) => state.persons);
  const teams = usePeopleStore((state) => state.teams);
  const addPerson = usePeopleStore((state) => state.addPerson);
  const updatePerson = usePeopleStore((state) => state.updatePerson);
  const removePerson = usePeopleStore((state) => state.removePerson);
  const addTeam = usePeopleStore((state) => state.addTeam);
  const updateTeam = usePeopleStore((state) => state.updateTeam);
  const removeTeam = usePeopleStore((state) => state.removeTeam);
  const restorePeople = usePeopleStore((state) => state.restore);
  const restoreTasks = useBoardStore((state) => state.restore);
  const confirmDelete = useConfirmDelete();
  // "Neue Person" raised from the CommandBar opens the dialog declaratively.
  const newPersonIntent = useCommandActionStore(
    (state) => state.intent === "new-person",
  );
  const clearIntent = useCommandActionStore((state) => state.clear);

  const [personOpen, setPersonOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [teamOpen, setTeamOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // Open when toggled locally or requested from the palette; closing clears both.
  const personDialogOpen = personOpen || newPersonIntent;
  function handlePersonOpenChange(open: boolean) {
    setPersonOpen(open);
    if (!open) clearIntent();
  }

  const memberCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const person of persons) {
      if (person.teamId)
        counts.set(person.teamId, (counts.get(person.teamId) ?? 0) + 1);
    }
    return counts;
  }, [persons]);

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-sm text-muted">
        Lädt …
      </div>
    );
  }

  function openNewPerson() {
    setEditingPerson(null);
    setPersonOpen(true);
  }

  function openNewTeam() {
    setEditingTeam(null);
    setTeamOpen(true);
  }

  /** Safe delete: snapshot people + board tasks for a 1:1 Undo (TASK-040). */
  function snapshotPeople() {
    const { persons: pers, teams: tms } = usePeopleStore.getState();
    const tasks = useBoardStore.getState().tasks;
    return () => {
      restorePeople({ persons: pers, teams: tms });
      restoreTasks(tasks);
    };
  }

  function handleDeletePerson(id: string) {
    const person = persons.find((p) => p.id === id);
    if (!person) return;
    const undo = snapshotPeople();
    void confirmDelete({
      confirm: {
        title: `„${person.name}“ löschen?`,
        description:
          "Die Person wird gelöscht und aus allen Task-Zuweisungen entfernt.",
      },
      toastMessage: `„${person.name}“ gelöscht.`,
      perform: () => removePerson(id),
      undo,
    });
  }

  function handleDeleteTeam(id: string) {
    const team = teams.find((t) => t.id === id);
    if (!team) return;
    const undo = snapshotPeople();
    void confirmDelete({
      confirm: {
        title: `Team „${team.name}“ löschen?`,
        description:
          "Das Team wird gelöscht; seine Mitglieder behalten ihre Daten, verlieren aber die Team-Zuordnung.",
      },
      toastMessage: `Team „${team.name}“ gelöscht.`,
      perform: () => removeTeam(id),
      undo,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Team"
        description="Personen und Teams als Stammdaten – Grundlage für Zuweisung und Auslastung."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={openNewTeam}>
              Neues Team
            </Button>
            <Button onClick={openNewPerson}>Neue Person</Button>
          </div>
        }
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Personen
        </h2>
        {persons.length === 0 ? (
          <EmptyCard
            text="Noch keine Personen angelegt. Lege das erste Teammitglied an, um Kapazitäten zu pflegen."
            ctaLabel="Erste Person anlegen"
            onCta={openNewPerson}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {persons.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                teams={teams}
                onEdit={() => {
                  setEditingPerson(person);
                  setPersonOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Teams
        </h2>
        {teams.length === 0 ? (
          <EmptyCard
            text="Noch keine Teams angelegt. Gruppiere Personen in Teams, um sie gemeinsam zu planen."
            ctaLabel="Erstes Team anlegen"
            onCta={openNewTeam}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                memberCount={memberCounts.get(team.id) ?? 0}
                onEdit={() => {
                  setEditingTeam(team);
                  setTeamOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </section>

      <PersonDialog
        open={personDialogOpen}
        person={newPersonIntent ? null : editingPerson}
        teams={teams}
        onOpenChange={handlePersonOpenChange}
        onCreate={(fields) =>
          addPerson({ id: crypto.randomUUID(), ...fields })
        }
        onUpdate={updatePerson}
        onDelete={handleDeletePerson}
      />

      <TeamDialog
        open={teamOpen}
        team={editingTeam}
        onOpenChange={setTeamOpen}
        onCreate={(fields) => addTeam({ id: crypto.randomUUID(), ...fields })}
        onUpdate={updateTeam}
        onDelete={handleDeleteTeam}
      />
    </div>
  );
}

function EmptyCard({
  text,
  ctaLabel,
  onCta,
}: {
  text: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="max-w-md text-sm text-muted">{text}</p>
        <Button onClick={onCta}>{ctaLabel}</Button>
      </CardContent>
    </Card>
  );
}
