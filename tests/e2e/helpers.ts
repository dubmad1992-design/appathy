import { expect, type Page } from "@playwright/test";

export async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByTestId("admin-login-email").fill("admin@appathy.local");
  await page.getByTestId("admin-login-password").fill(process.env.SEED_ADMIN_PASSWORD ?? "e2e-local-admin-password");
  await page.getByTestId("admin-login-submit").click();
  await page.waitForURL("**/admin/dashboard");
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
}
