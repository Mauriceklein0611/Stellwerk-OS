import { z } from "zod";

import type { Person } from "@/types";

/** Up-to-two-letter initials from a person's name (avatar placeholder). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Display label for a person's team, or a fallback. */
export function teamName(
  person: Person,
  teams: { id: string; name: string }[],
): string {
  return teams.find((team) => team.id === person.teamId)?.name ?? "Kein Team";
}

/**
 * Sentinel value for the "no team" option in the person form Select.
 * Radix/Base-UI selects can't hold an empty-string item value, so we map
 * this sentinel to `undefined` on submit.
 */
export const NO_TEAM = "none";

/** Validation schema for the person form (UI strings, German messages). */
export const personFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name ist erforderlich")
    .max(80, "Maximal 80 Zeichen"),
  role: z
    .string()
    .trim()
    .min(1, "Rolle ist erforderlich")
    .max(60, "Maximal 60 Zeichen"),
  email: z
    .string()
    .trim()
    .email("Ungültige E-Mail-Adresse")
    .optional()
    .or(z.literal("")),
  capacityPtPerSprint: z
    .number({ message: "Bitte eine Zahl eingeben" })
    .min(0, "Kapazität muss ≥ 0 sein")
    .max(1000, "Unrealistisch hoch"),
  /** Team id or the NO_TEAM sentinel; mapped to undefined on submit. */
  teamId: z.string(),
});

export type PersonFormValues = z.infer<typeof personFormSchema>;

/** Validation schema for the team form. */
export const teamFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name ist erforderlich")
    .max(60, "Maximal 60 Zeichen"),
  description: z
    .string()
    .trim()
    .max(200, "Maximal 200 Zeichen")
    .optional()
    .or(z.literal("")),
});

export type TeamFormValues = z.infer<typeof teamFormSchema>;

/** Form defaults for a new person (or pre-fill values from an existing one). */
export function personFormDefaults(person?: Person): PersonFormValues {
  return {
    name: person?.name ?? "",
    role: person?.role ?? "",
    email: person?.email ?? "",
    capacityPtPerSprint: person?.capacityPtPerSprint ?? 10,
    teamId: person?.teamId ?? NO_TEAM,
  };
}

/** Build the persisted person fields (sans id) from validated form values. */
export function personFromForm(values: PersonFormValues): Omit<Person, "id"> {
  return {
    name: values.name.trim(),
    role: values.role.trim(),
    email: values.email?.trim() || undefined,
    capacityPtPerSprint: values.capacityPtPerSprint,
    teamId: values.teamId === NO_TEAM ? undefined : values.teamId,
  };
}
