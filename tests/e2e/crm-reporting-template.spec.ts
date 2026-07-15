import { expect, test } from "@playwright/test";

const adminEmail = process.env.CRM_ADMIN_EMAIL ?? "admin@crm.appathy.uk";
const adminPassword = process.env.CRM_ADMIN_PASSWORD ?? "ChangeMe123!";

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe.configure({ mode: "serial" });

test("reporting surfaces payment-based metrics and email templates are editable", async ({ page }) => {
  const suffix = Date.now().toString().slice(-6);

  await login(page, adminEmail, adminPassword);
  await page.waitForURL("**/dashboard");

  await page.goto("/reports");
  await expect(page.getByText("12-month payment history")).toBeVisible();
  await expect(page.getByText("Average customer lifetime value")).toBeVisible();
  await expect(page.getByText("Overdue by customer")).toBeVisible();

  await page.goto("/settings");

  const templateForm = page.locator("#template-new_invoice");
  const subjectInput = templateForm.locator("input[name='subject']");
  const bodyTextInput = templateForm.locator("textarea[name='bodyText']");
  const originalSubject = await subjectInput.inputValue();
  const originalBodyText = await bodyTextInput.inputValue();
  const updatedSubject = `QA ${suffix} :: ${originalSubject}`;
  const updatedBodyText = `${originalBodyText}\nQA reference ${suffix}.`;

  await subjectInput.fill(updatedSubject);
  await bodyTextInput.fill(updatedBodyText);
  await templateForm.getByRole("button", { name: "Save template" }).click();
  await page.waitForURL(/\/settings\?saved=1$/);
  await page.goto("/settings#template-new_invoice");
  await expect(page.locator("#template-new_invoice input[name='subject']")).toHaveValue(updatedSubject);
  await expect(page.locator("#template-new_invoice")).toContainText(`QA reference ${suffix}.`);

  await page.locator("#template-new_invoice input[name='subject']").fill(originalSubject);
  await page.locator("#template-new_invoice textarea[name='bodyText']").fill(originalBodyText);
  await page.locator("#template-new_invoice").getByRole("button", { name: "Save template" }).click();
  await page.waitForURL(/\/settings\?saved=1$/);
  await page.goto("/settings#template-new_invoice");
  await expect(page.locator("#template-new_invoice input[name='subject']")).toHaveValue(originalSubject);
});
