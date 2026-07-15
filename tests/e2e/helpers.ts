import { expect, type Page } from "@playwright/test";

export async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByTestId("admin-login-email").fill("dubmad1992@gmail.com");
  await page.getByTestId("admin-login-password").fill("d6aa43881ef7e171f8e7955254c30661");
  await page.getByTestId("admin-login-submit").click();
  await page.waitForURL("**/admin/dashboard");
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
}
