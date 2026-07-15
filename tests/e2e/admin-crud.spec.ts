import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("admin can create a user", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/users");

  await page.getByTestId("create-user-name").fill("E2E Viewer");
  await page.getByTestId("create-user-email").fill("e2e-viewer@appathy.dev");
  await page.getByTestId("create-user-password").fill("ChangeMe123!");
  await page.getByTestId("create-user-role").selectOption("VIEWER");
  await page.getByTestId("create-user-submit").click();

  await page.waitForLoadState("networkidle");
  await expect(page.locator('input[name="email"][value="e2e-viewer@appathy.dev"]').first()).toBeVisible();
});

test("admin can update homepage copy and the public site reflects it", async ({ page }) => {
  const heroTitle = `Appathy E2E Hero ${Date.now()}`;

  await loginAsAdmin(page);
  await page.goto("/admin/content");
  await page.getByTestId("homepage-heroTitle").fill(heroTitle);
  await page.getByTestId("homepage-save").click();
  await page.waitForLoadState("networkidle");

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: heroTitle })).toBeVisible();
});
