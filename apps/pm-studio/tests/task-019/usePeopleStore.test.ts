import { beforeEach, describe, expect, it } from "vitest";

import { usePeopleStore } from "@/store/usePeopleStore";
import type { Person, Team } from "@/types";

function reset() {
  usePeopleStore.setState({ persons: [], teams: [] });
}

function person(overrides: Partial<Person> = {}): Person {
  return {
    id: "p1",
    name: "Lena Schmidt",
    role: "Frontend",
    capacityPtPerSprint: 10,
    ...overrides,
  };
}

function team(overrides: Partial<Team> = {}): Team {
  return { id: "t1", name: "Plattform", ...overrides };
}

describe("usePeopleStore", () => {
  beforeEach(reset);

  it("addPerson appends a person", () => {
    usePeopleStore.getState().addPerson(person());
    expect(usePeopleStore.getState().persons).toHaveLength(1);
    expect(usePeopleStore.getState().persons[0].name).toBe("Lena Schmidt");
  });

  it("updatePerson patches fields and keeps the id", () => {
    const { addPerson, updatePerson } = usePeopleStore.getState();
    addPerson(person());

    updatePerson("p1", { role: "PO", capacityPtPerSprint: 8 });
    const updated = usePeopleStore.getState().persons.find((p) => p.id === "p1");
    expect(updated).toMatchObject({ id: "p1", role: "PO", capacityPtPerSprint: 8 });
  });

  it("removePerson deletes only the matching person", () => {
    const { addPerson, removePerson } = usePeopleStore.getState();
    addPerson(person({ id: "p1" }));
    addPerson(person({ id: "p2", name: "Tom" }));

    removePerson("p1");
    const persons = usePeopleStore.getState().persons;
    expect(persons).toHaveLength(1);
    expect(persons[0].id).toBe("p2");
  });

  it("addTeam / updateTeam manage teams", () => {
    const { addTeam, updateTeam } = usePeopleStore.getState();
    addTeam(team());
    updateTeam("t1", { name: "Core", description: "Kernteam" });

    const t = usePeopleStore.getState().teams.find((x) => x.id === "t1");
    expect(t).toMatchObject({ id: "t1", name: "Core", description: "Kernteam" });
  });

  it("removeTeam deletes the team and detaches its members", () => {
    const { addTeam, addPerson, removeTeam } = usePeopleStore.getState();
    addTeam(team({ id: "t1" }));
    addPerson(person({ id: "p1", teamId: "t1" }));
    addPerson(person({ id: "p2", name: "Tom", teamId: "t1" }));
    addPerson(person({ id: "p3", name: "Mara", teamId: "t2" }));

    removeTeam("t1");

    const { teams, persons } = usePeopleStore.getState();
    expect(teams).toHaveLength(0);
    // Members of t1 are detached, others untouched.
    expect(persons.find((p) => p.id === "p1")?.teamId).toBeUndefined();
    expect(persons.find((p) => p.id === "p2")?.teamId).toBeUndefined();
    expect(persons.find((p) => p.id === "p3")?.teamId).toBe("t2");
  });
});
