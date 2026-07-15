import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test("login fields accept typed input", async ({ page }) => {
  await page.goto("/admin/login");
  const email = page.getByTestId("admin-login-email");
  const password = page.getByTestId("admin-login-password");

  await email.fill("admin@example.com");
  await password.fill("test-password");

  await expect(email).toHaveValue("admin@example.com");
  await expect(password).toHaveValue("test-password");
});

test("admin login sends the user to the dashboard", async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page.getByText("A focused backend for the apps running on this VPS.")).toBeVisible();
});

test("protected admin routes redirect anonymous users to login", async ({ page }) => {
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/admin\/login$/);
});
