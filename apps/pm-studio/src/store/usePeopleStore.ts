import { create } from "zustand";
import { persist } from "zustand/middleware";

import { useBoardStore } from "@/store/useBoardStore";
import type { Person, Team } from "@/types";

type PeopleState = {
  persons: Person[];
  teams: Team[];
  addPerson: (person: Person) => void;
  updatePerson: (id: string, patch: Partial<Omit<Person, "id">>) => void;
  /**
   * Remove a person and detach them from every board task (TASK-040): the
   * deleted id must not linger as a dangling `assigneeId`. Same cross-store
   * cleanup pattern as useTagStore.removeTag → useBoardStore.detachTag.
   */
  removePerson: (id: string) => void;
  addTeam: (team: Team) => void;
  updateTeam: (id: string, patch: Partial<Omit<Team, "id">>) => void;
  /** Remove a team and detach its members (teamId → undefined). */
  removeTeam: (id: string) => void;
  /** Restore persons + teams from a snapshot (TASK-040 safe-delete Undo). */
  restore: (snapshot: { persons: Person[]; teams: Team[] }) => void;
};

/**
 * Persons and teams as first-class master data (TASK-019). Persisted locally;
 * the basis for assignment and capacity load (TASK-020).
 */
export const usePeopleStore = create<PeopleState>()(
  persist(
    (set) => ({
      persons: [],
      teams: [],
      addPerson: (person) =>
        set((state) => ({ persons: [...state.persons, person] })),
      updatePerson: (id, patch) =>
        set((state) => ({
          persons: state.persons.map((person) =>
            person.id === id ? { ...person, ...patch } : person,
          ),
        })),
      removePerson: (id) => {
        set((state) => ({
          persons: state.persons.filter((person) => person.id !== id),
        }));
        // Clear the deleted person from any task they were assigned to.
        useBoardStore.getState().detachAssignee(id);
      },
      addTeam: (team) => set((state) => ({ teams: [...state.teams, team] })),
      updateTeam: (id, patch) =>
        set((state) => ({
          teams: state.teams.map((team) =>
            team.id === id ? { ...team, ...patch } : team,
          ),
        })),
      removeTeam: (id) =>
        set((state) => ({
          teams: state.teams.filter((team) => team.id !== id),
          persons: state.persons.map((person) =>
            person.teamId === id ? { ...person, teamId: undefined } : person,
          ),
        })),
      restore: ({ persons, teams }) => set({ persons, teams }),
    }),
    {
      name: "pm-studio-people",
      version: 1,
      partialize: (state) => ({ persons: state.persons, teams: state.teams }),
    },
  ),
);
