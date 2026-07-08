import { expect, test } from "@playwright/test";

const BOARD_KEY = "pm-studio-board";
const PROJECTS_KEY = "pm-studio-projects";
const PEOPLE_KEY = "pm-studio-people";

const persons = [
  { id: "e2e-alice", name: "Alice Anders", role: "Dev", capacityPtPerSprint: 10 },
  { id: "e2e-bob", name: "Bob Bauer", role: "QA", capacityPtPerSprint: 8 },
];

const ideas = [{ id: "e2e-p1", name: "Apollo Mission" }];

const artifacts = {
  "e2e-p1": {
    backlog: {
      epics: [
        {
          id: "E-1",
          title: "Epic",
          stories: [
            {
              id: "US-1",
              title: "Apollo onboarding story",
              acceptance_criteria: [],
              estimate_pt: 3,
              priority: "hoch",
            },
          ],
        },
      ],
      sprint_suggestions: [],
    },
  },
};

const tasks = [
  {
    id: "mw-overdue",
    title: "Apollo Login bauen",
    column: "todo",
    order: 0,
    projectId: "e2e-p1",
    projectName: "Apollo Mission",
    priority: "hoch",
    assigneeId: "e2e-alice",
    dueDate: "2020-01-01", // past → overdue while open
  },
  {
    id: "mw-open",
    title: "Apollo Logout bauen",
    column: "in_progress",
    order: 0,
    projectId: "e2e-p1",
    projectName: "Apollo Mission",
    priority: "mittel",
    assigneeId: "e2e-alice",
    dueDate: "2999-12-31", // future → open but not overdue
  },
  {
    id: "mw-done",
    title: "Apollo Setup",
    column: "done",
    order: 0,
    projectId: "e2e-p1",
    projectName: "Apollo Mission",
    priority: "niedrig",
    assigneeId: "e2e-alice",
  },
  {
    id: "mw-bob",
    title: "Bobs Aufgabe",
    column: "todo",
    order: 1,
    projectId: "e2e-p1",
    projectName: "Apollo Mission",
    priority: "mittel",
    assigneeId: "e2e-bob",
  },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ([boardKey, tasksSeed, projectsKey, ideasSeed, artifactsSeed, peopleKey, personsSeed]) => {
      if (!window.localStorage.getItem(boardKey)) {
        window.localStorage.setItem(
          boardKey,
          JSON.stringify({ state: { tasks: tasksSeed }, version: 8 }),
        );
      }
      if (!window.localStorage.getItem(projectsKey)) {
        window.localStorage.setItem(
          projectsKey,
          JSON.stringify({ state: { ideas: ideasSeed, artifacts: artifactsSeed }, version: 1 }),
        );
      }
      if (!window.localStorage.getItem(peopleKey)) {
        window.localStorage.setItem(
          peopleKey,
          JSON.stringify({ state: { persons: personsSeed, teams: [] }, version: 1 }),
        );
      }
    },
    [BOARD_KEY, tasks, PROJECTS_KEY, ideas, artifacts, PEOPLE_KEY, persons] as const,
  );
});

test("my-work shows a person's open/overdue tasks and filters via the scope chips", async ({
  page,
}) => {
  await page.goto("/my-work");

  await expect(page.getByRole("heading", { name: "Meine Aufgaben" })).toBeVisible();

  // Defaults to the first person (Alice), scope "open": the two open tasks show,
  // the done one is hidden.
  await expect(page.getByTestId("board-row-mw-overdue")).toBeVisible();
  await expect(page.getByTestId("board-row-mw-open")).toBeVisible();
  await expect(page.getByTestId("board-row-mw-done")).toHaveCount(0);
  // Bob's task never belongs to Alice's work.
  await expect(page.getByTestId("board-row-mw-bob")).toHaveCount(0);

  // Overdue chip narrows to the single past-due task.
  await page.getByTestId("my-work-chip-überfällig").click();
  await expect(page.getByTestId("board-row-mw-overdue")).toBeVisible();
  await expect(page.getByTestId("board-row-mw-open")).toHaveCount(0);

  // "Zugewiesen" shows all three of Alice's tasks (incl. the done one).
  await page.getByTestId("my-work-chip-zugewiesen").click();
  await expect(page.getByTestId("board-row-mw-done")).toBeVisible();
  await expect(page.getByTestId("board-row-mw-overdue")).toBeVisible();
  await expect(page.getByTestId("board-row-mw-open")).toBeVisible();
});

test("my-work switches the person and shows only their tasks", async ({ page }) => {
  await page.goto("/my-work");

  await page.getByRole("combobox", { name: "Person" }).click();
  await page.getByRole("option", { name: "Bob Bauer" }).click();

  // Switch to "Zugewiesen" so Bob's single open task is unambiguous.
  await page.getByTestId("my-work-chip-zugewiesen").click();
  await expect(page.getByTestId("board-row-mw-bob")).toBeVisible();
  await expect(page.getByTestId("board-row-mw-overdue")).toHaveCount(0);
});

const PLACEHOLDER = "Suchen: Projekte, Tasks, Stories, Personen, Releases…";

test("command palette finds entities and navigates to them", async ({ page }) => {
  await page.goto("/board");

  await page.getByTestId("command-trigger").click();
  const input = page.getByPlaceholder(PLACEHOLDER);
  await expect(input).toBeVisible();
  await input.fill("Apollo");

  // Entities across kinds are found (project by its exact name, task by title).
  await expect(
    page.getByRole("option", { name: "Apollo Mission", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("option", { name: /Apollo Login bauen/ })).toBeVisible();

  // Selecting the project navigates to its detail route.
  await page.getByRole("option", { name: "Apollo Mission", exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/e2e-p1$/);
});

test("command palette offers a create action that opens the new-idea form", async ({
  page,
}) => {
  await page.goto("/board");

  await page.getByTestId("command-trigger").click();
  await page.getByPlaceholder(PLACEHOLDER).fill("Neue Idee");
  await page.getByRole("option", { name: "Neue Idee anlegen" }).click();

  await expect(page).toHaveURL(/\/ideas\/new$/);
});

test("command palette create action opens the new-person dialog on the team page", async ({
  page,
}) => {
  await page.goto("/board");

  await page.getByTestId("command-trigger").click();
  await page.getByPlaceholder(PLACEHOLDER).fill("Neue Person");
  await page.getByRole("option", { name: "Neue Person anlegen" }).click();

  await expect(page).toHaveURL(/\/team$/);
  // The person dialog opens straight away (declarative intent, no extra click).
  await expect(page.getByRole("dialog")).toBeVisible();
});
