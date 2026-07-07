import { expect, test } from "@playwright/test";

const NODE_LABELS = [
  "Projektidee",
  "Draft",
  "Requirements",
  "Scrum",
  "PO",
  "Risk",
  "Review",
  "Artefakte",
];

test("workflows page renders the full pipeline", async ({ page }) => {
  await page.goto("/workflows");

  await expect(
    page.getByRole("heading", { name: "Workflows" }),
  ).toBeVisible();

  // All pipeline node labels are present.
  for (const label of NODE_LABELS) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }

  // The simulation control exists.
  await expect(
    page.getByRole("button", { name: /Pipeline simulieren/ }),
  ).toBeVisible();
});
