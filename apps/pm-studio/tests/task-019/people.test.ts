import { describe, expect, it } from "vitest";

import {
  NO_TEAM,
  initials,
  personFromForm,
  personFormSchema,
  teamName,
} from "@/lib/people";
import type { Person } from "@/types";

describe("initials", () => {
  it("uses first + last initial for multi-word names", () => {
    expect(initials("Lena Schmidt")).toBe("LS");
    expect(initials("Anna Maria Beck")).toBe("AB");
  });

  it("uses the first two letters for single-word names", () => {
    expect(initials("Tom")).toBe("TO");
  });

  it("falls back to ? for empty input", () => {
    expect(initials("   ")).toBe("?");
  });
});

describe("teamName", () => {
  const base: Person = {
    id: "p1",
    name: "Lena",
    role: "Frontend",
    capacityPtPerSprint: 10,
  };

  it("returns the matching team name", () => {
    expect(teamName({ ...base, teamId: "t1" }, [{ id: "t1", name: "Core" }])).toBe(
      "Core",
    );
  });

  it("falls back when the person has no (known) team", () => {
    expect(teamName(base, [{ id: "t1", name: "Core" }])).toBe("Kein Team");
  });
});

describe("personFormSchema", () => {
  const valid = {
    name: "Lena",
    role: "Frontend",
    email: "",
    capacityPtPerSprint: 10,
    teamId: NO_TEAM,
  };

  it("rejects a missing name", () => {
    expect(personFormSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("rejects a negative capacity", () => {
    expect(
      personFormSchema.safeParse({ ...valid, capacityPtPerSprint: -1 }).success,
    ).toBe(false);
  });

  it("accepts a numeric capacity and rejects a non-number (NaN from empty input)", () => {
    expect(
      personFormSchema.safeParse({ ...valid, capacityPtPerSprint: 7.5 }).success,
    ).toBe(true);
    expect(
      personFormSchema.safeParse({ ...valid, capacityPtPerSprint: NaN }).success,
    ).toBe(false);
  });

  it("rejects an invalid email but accepts empty", () => {
    expect(personFormSchema.safeParse({ ...valid, email: "nope" }).success).toBe(
      false,
    );
    expect(personFormSchema.safeParse({ ...valid, email: "" }).success).toBe(true);
  });
});

describe("personFromForm", () => {
  it("maps the NO_TEAM sentinel to undefined and trims optional email", () => {
    const fields = personFromForm({
      name: " Lena ",
      role: " PO ",
      email: "",
      capacityPtPerSprint: 5,
      teamId: NO_TEAM,
    });
    expect(fields).toEqual({
      name: "Lena",
      role: "PO",
      email: undefined,
      capacityPtPerSprint: 5,
      teamId: undefined,
    });
  });

  it("keeps a real team id", () => {
    const fields = personFromForm({
      name: "Tom",
      role: "QA",
      email: "tom@example.com",
      capacityPtPerSprint: 8,
      teamId: "t1",
    });
    expect(fields.teamId).toBe("t1");
    expect(fields.email).toBe("tom@example.com");
  });
});
