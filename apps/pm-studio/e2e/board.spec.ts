import { expect, test } from "@playwright/test";

const BOARD_KEY = "pm-studio-board";
const PROJECTS_KEY = "pm-studio-projects";

const seedTasks = [
  {
    id: "e2e-task-1",
    title: "E2E Task A",
    column: "backlog",
    order: 0,
    projectId: "e2e-project-1",
    projectName: "E2E Projekt Eins",
    priority: "hoch",
    // Far in the past → always overdue relative to the test run.
    dueDate: "2020-01-01",
  },
  {
    id: "e2e-task-2",
    title: "E2E Task B",
    column: "todo",
    order: 0,
    projectId: "e2e-project-1",
    projectName: "E2E Projekt Eins",
    priority: "mittel",
    // Far in the future → never overdue.
    dueDate: "2999-12-31",
  },
  {
    id: "e2e-task-3",
    title: "E2E Task C",
    column: "backlog",
    order: 1,
    projectId: "e2e-project-2",
    projectName: "E2E Projekt Zwei",
    priority: "niedrig",
  },
];

const seedIdeas = [
  { id: "e2e-project-1", name: "E2E Projekt Eins" },
  { id: "e2e-project-2", name: "E2E Projekt Zwei" },
];

test.beforeEach(async ({ page }) => {
  // Runs before every navigation (incl. reload) – only seed if not already
  // present, so a reload after a drag keeps the persisted (moved) state.
  await page.addInitScript(
    ([boardKey, tasks, projectsKey, ideas]) => {
      if (!window.localStorage.getItem(boardKey)) {
        window.localStorage.setItem(boardKey, JSON.stringify({ state: { tasks }, version: 1 }));
      }
      if (!window.localStorage.getItem(projectsKey)) {
        window.localStorage.setItem(
          projectsKey,
          JSON.stringify({ state: { ideas, artifacts: {} }, version: 1 }),
        );
      }
    },
    [BOARD_KEY, seedTasks, PROJECTS_KEY, seedIdeas] as const,
  );
});

test("board renders seeded tasks with column counters", async ({ page }) => {
  await page.goto("/board");

  await expect(page.getByRole("heading", { name: "Board" })).toBeVisible();

  await expect(page.getByTestId("board-column-backlog").getByTestId("board-task-e2e-task-1")).toBeVisible();
  await expect(page.getByTestId("board-column-backlog").getByTestId("board-task-e2e-task-3")).toBeVisible();
  await expect(page.getByTestId("board-column-todo").getByTestId("board-task-e2e-task-2")).toBeVisible();

  await expect(page.getByTestId("board-column-backlog-count")).toHaveText("2");
  await expect(page.getByTestId("board-column-todo-count")).toHaveText("1");
  await expect(page.getByTestId("board-column-done-count")).toHaveText("0");
});

test("drag&drop moves a task to another column and the move survives a reload", async ({ page }) => {
  await page.goto("/board");

  const card = page.getByTestId("board-task-e2e-task-1");
  const targetColumn = page.getByTestId("board-column-todo");

  const cardBox = await card.boundingBox();
  const targetBox = await targetColumn.boundingBox();
  if (!cardBox || !targetBox) throw new Error("Bounding boxes not available");

  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height - 10, {
    steps: 10,
  });
  await page.mouse.up();

  await expect(page.getByTestId("board-column-todo").getByTestId("board-task-e2e-task-1")).toBeVisible();
  await expect(page.getByTestId("board-column-backlog-count")).toHaveText("1");
  await expect(page.getByTestId("board-column-todo-count")).toHaveText("2");

  await page.reload();

  await expect(page.getByTestId("board-column-todo").getByTestId("board-task-e2e-task-1")).toBeVisible();
  await expect(page.getByTestId("board-column-backlog").getByTestId("board-task-e2e-task-1")).toHaveCount(0);
  await expect(page.getByTestId("board-column-backlog-count")).toHaveText("1");
  await expect(page.getByTestId("board-column-todo-count")).toHaveText("2");
});

test("view toggle switches to the Scrum list and survives a reload", async ({ page }) => {
  await page.goto("/board");

  await page.getByRole("radio", { name: "Liste" }).click();

  // The list view renders rows; a seeded task is visible as a table row.
  await expect(page.getByTestId("board-row-e2e-task-1")).toBeVisible();
  await expect(page.getByTestId("board-column-backlog")).toHaveCount(0);

  await page.reload();

  // The chosen view is persisted: still the list after reload.
  await expect(page.getByTestId("board-row-e2e-task-1")).toBeVisible();
  await expect(page.getByRole("radio", { name: "Liste" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("inline-edits a task title in the list view and persists it", async ({ page }) => {
  await page.goto("/board");

  await page.getByRole("radio", { name: "Liste" }).click();

  const row = page.getByTestId("board-row-e2e-task-1");
  await row.getByRole("button", { name: "Titel von E2E Task A" }).click();
  const input = row.getByRole("textbox", { name: "Titel von E2E Task A" });
  await input.fill("E2E Task A bearbeitet");
  await input.press("Enter");

  await expect(row.getByText("E2E Task A bearbeitet")).toBeVisible();

  await page.reload();

  // Both the list view and the edited title survive a reload (store persist).
  await expect(
    page.getByTestId("board-row-e2e-task-1").getByText("E2E Task A bearbeitet"),
  ).toBeVisible();
});

test("quick-add creates a task in a column once a project is selected and it persists", async ({
  page,
}) => {
  await page.goto("/board");

  // Without a single project selected, quick-add is disabled with a hint.
  await expect(page.getByTestId("quick-add-disabled-todo")).toBeVisible();
  await expect(page.getByTestId("quick-add-trigger-todo")).toHaveCount(0);

  await page.getByRole("combobox", { name: "Projekt" }).click();
  await page.getByRole("option", { name: "E2E Projekt Eins" }).click();

  // To Do has one seeded task for this project.
  await expect(page.getByTestId("board-column-todo-count")).toHaveText("1");

  await page.getByTestId("quick-add-trigger-todo").click();
  const input = page.getByTestId("quick-add-input-todo");
  await input.fill("Schnell erfasst");
  await input.press("Enter");

  await expect(
    page.getByTestId("board-column-todo").getByText("Schnell erfasst"),
  ).toBeVisible();
  await expect(page.getByTestId("board-column-todo-count")).toHaveText("2");
  // Field stays open and clears for the next entry.
  await expect(page.getByTestId("quick-add-input-todo")).toHaveValue("");

  await page.reload();
  await page.getByRole("combobox", { name: "Projekt" }).click();
  await page.getByRole("option", { name: "E2E Projekt Eins" }).click();

  await expect(
    page.getByTestId("board-column-todo").getByText("Schnell erfasst"),
  ).toBeVisible();
  await expect(page.getByTestId("board-column-todo-count")).toHaveText("2");
});

test("shows an overdue badge and the due filter keeps only overdue tasks", async ({
  page,
}) => {
  await page.goto("/board");

  // The past-dated task is flagged overdue; the future-dated one is neutral.
  await expect(
    page.getByTestId("board-task-e2e-task-1").getByTestId("task-due"),
  ).toHaveAttribute("data-due-status", "overdue");
  await expect(
    page.getByTestId("board-task-e2e-task-2").getByTestId("task-due"),
  ).toHaveAttribute("data-due-status", "upcoming");

  await page.getByRole("combobox", { name: "Fälligkeit" }).click();
  await page.getByRole("option", { name: "Überfällig" }).click();

  // Only the overdue task remains; future-dated and undated tasks are filtered.
  await expect(page.getByTestId("board-task-e2e-task-1")).toBeVisible();
  await expect(page.getByTestId("board-task-e2e-task-2")).toHaveCount(0);
  await expect(page.getByTestId("board-task-e2e-task-3")).toHaveCount(0);
  await expect(page.getByTestId("board-column-backlog-count")).toHaveText("1");
  await expect(page.getByTestId("board-column-todo-count")).toHaveText("0");
});

test("creates a board phase via the column manager and it survives a reload", async ({
  page,
}) => {
  await page.goto("/board");

  // Six default phases, none labelled "QA" yet.
  await expect(page.getByRole("heading", { name: "QA", exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Spalten verwalten" }).click();
  await page.getByLabel("Neue Phase").fill("QA");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Hinzufügen" })
    .click();
  await page.keyboard.press("Escape");

  // The new phase shows up as a column on the board…
  await expect(page.getByRole("heading", { name: "QA", exact: true })).toBeVisible();

  await page.reload();

  // …and the configurable phases persist (own store).
  await expect(page.getByRole("heading", { name: "QA", exact: true })).toBeVisible();
});

test("adds a board phase via the + Spalte tile and it survives a reload", async ({
  page,
}) => {
  await page.goto("/board");

  // No column labelled "Klärung" yet; the inline tile sits right of the columns.
  await expect(page.getByRole("heading", { name: "Klärung", exact: true })).toHaveCount(0);

  await page.getByTestId("add-column-trigger").click();
  const input = page.getByTestId("add-column-input");
  await input.fill("Klärung");
  await input.press("Enter");

  // The new phase shows up immediately as a board column…
  await expect(page.getByRole("heading", { name: "Klärung", exact: true })).toBeVisible();
  // …and the field stays open and clears for the next entry (like quick-add).
  await expect(page.getByTestId("add-column-input")).toHaveValue("");

  await page.reload();

  // …and the configurable phase persists (own store).
  await expect(page.getByRole("heading", { name: "Klärung", exact: true })).toBeVisible();
});

test("groups the board into swimlanes and the grouping survives a reload", async ({
  page,
}) => {
  await page.goto("/board");

  // Flat view by default: bare column ids, no swimlanes.
  await expect(page.getByTestId("board-column-backlog")).toBeVisible();
  await expect(page.getByTestId("swimlane-__ungrouped__")).toHaveCount(0);

  await page.getByRole("radio", { name: "Zuständig" }).click();

  // No persons seeded → every task lands in the "Nicht zugewiesen" lane, whose
  // columns are namespaced per lane. The two backlog tasks show up there.
  await expect(
    page.getByRole("heading", { name: "Nicht zugewiesen" }),
  ).toBeVisible();
  await expect(
    page
      .getByTestId("board-column-__ungrouped__-backlog")
      .getByTestId("board-task-e2e-task-1"),
  ).toBeVisible();
  await expect(
    page.getByTestId("board-column-__ungrouped__-backlog-count"),
  ).toHaveText("2");
  // The flat (bare-id) columns are gone in swimlane mode.
  await expect(page.getByTestId("board-column-backlog")).toHaveCount(0);

  await page.reload();

  // The grouping choice is persisted (board store): still swimlanes after reload.
  await expect(page.getByRole("radio", { name: "Zuständig" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.getByTestId("swimlane-__ungrouped__")).toBeVisible();
});

test("groups the list view into sections with an aggregate footer that survives a reload", async ({
  page,
}) => {
  await page.goto("/board");

  await page.getByRole("radio", { name: "Liste" }).click();

  // The aggregate footer is always present in the list view.
  await expect(page.getByTestId("board-list-footer")).toBeVisible();
  await expect(page.getByTestId("board-list-footer")).toContainText("Tasks");

  // Grouping is shared with the Kanban view (same persisted groupBy, TASK-063).
  await page.getByRole("radio", { name: "Zuständig" }).click();

  // No persons seeded → all tasks land in the "Nicht zugewiesen" section.
  const section = page.getByTestId("board-group-__ungrouped__");
  await expect(section).toBeVisible();
  await expect(section).toContainText("Nicht zugewiesen");
  // All seeded tasks stay visible as rows within the grouped list.
  await expect(page.getByTestId("board-row-e2e-task-1")).toBeVisible();
  await expect(page.getByTestId("board-row-e2e-task-2")).toBeVisible();
  await expect(page.getByTestId("board-row-e2e-task-3")).toBeVisible();

  await page.reload();

  // View + grouping persist (board store); still a grouped list after reload.
  await expect(page.getByRole("radio", { name: "Zuständig" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.getByTestId("board-group-__ungrouped__")).toBeVisible();
  await expect(page.getByTestId("board-list-footer")).toBeVisible();
});

test("project filter limits all columns to the selected project", async ({ page }) => {
  await page.goto("/board");

  await page.getByRole("combobox", { name: "Projekt" }).click();
  await page.getByRole("option", { name: "E2E Projekt Eins" }).click();

  await expect(page.getByTestId("board-column-backlog").getByTestId("board-task-e2e-task-1")).toBeVisible();
  await expect(page.getByTestId("board-column-backlog").getByTestId("board-task-e2e-task-3")).toHaveCount(0);
  await expect(page.getByTestId("board-column-backlog-count")).toHaveText("1");
});

test("deletes a task via confirm and restores it via the undo toast", async ({
  page,
}) => {
  await page.goto("/board");

  // Open the task dialog and trigger delete – the confirm gates the removal.
  await page.getByTestId("board-task-e2e-task-3").click();
  await page.getByRole("button", { name: "Löschen" }).click();
  await page.getByRole("button", { name: "Löschen" }).click();

  await expect(page.getByTestId("board-task-e2e-task-3")).toHaveCount(0);

  // The undo toast restores the deleted task 1:1.
  await expect(page.getByTestId("toast")).toContainText("gelöscht");
  await page.getByRole("button", { name: "Rückgängig" }).click();

  await expect(
    page.getByTestId("board-column-backlog").getByTestId("board-task-e2e-task-3"),
  ).toBeVisible();
});
