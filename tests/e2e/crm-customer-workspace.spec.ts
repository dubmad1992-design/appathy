import { expect, test, type Page } from "@playwright/test";

const adminEmail = process.env.CRM_ADMIN_EMAIL ?? "info@appathy.uk";
const adminPassword = process.env.CRM_ADMIN_PASSWORD ?? "Eminem123.";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe.configure({ mode: "serial" });

test("admin can manage customer workspace records from the customer page", async ({ page }) => {
  const suffix = Date.now().toString().slice(-6);
  const companyName = `Workspace QA ${suffix}`;

  await login(page, adminEmail, adminPassword);
  await page.waitForURL("**/dashboard");

  await page.goto("/customers");
  await page.getByPlaceholder("Company name").fill(companyName);
  await page.getByPlaceholder("Legal name").fill(`${companyName} Ltd`);
  await page.getByPlaceholder("Billing email").fill(`billing+${suffix}@example.com`);
  await page.getByPlaceholder("Billing phone").fill("+44 113 555 6666");
  await page.getByPlaceholder("Website URL or domain").fill(`workspace-${suffix}.example.com`);
  await page.getByPlaceholder("Tags, comma separated").fill("qa,customer-workspace");
  await page.getByPlaceholder("Notes summary").fill("Customer workspace QA record.");
  await page.getByRole("button", { name: "Create customer" }).click();
  await page.waitForURL(/\/customers\/.+/);

  const quoteForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Create quote" }) });
  await quoteForm.locator("input[name='itemDescription']").first().fill(`Quote line ${suffix}`);
  await quoteForm.locator("input[name='itemUnitPrice']").first().fill("275");
  await quoteForm.locator("textarea[name='notes']").fill("Quote created from customer workspace.");
  await quoteForm.getByRole("button", { name: "Create quote" }).click();
  await page.waitForURL(/quoteSaved=1/);
  await expect(page.getByText("Quote workspace updated.")).toBeVisible();
  await expect(page.getByText(/QUO-/)).toBeVisible();
  await expect(page.getByText("Manage quote")).toBeVisible();

  const invoiceForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Create invoice" }) });
  await invoiceForm.locator("input[name='itemDescription']").first().fill(`Invoice line ${suffix}`);
  await invoiceForm.locator("input[name='itemUnitPrice']").first().fill("325");
  await invoiceForm.locator("textarea[name='notes']").fill("Invoice created from customer workspace.");
  await invoiceForm.getByRole("button", { name: "Create invoice" }).click();
  await page.waitForURL(/invoiceSaved=1/);
  await expect(page.getByText("Invoice workspace updated.")).toBeVisible();
  await expect(page.getByRole("link", { name: /APP-/ }).first()).toBeVisible();

  const subscriptionForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Create subscription" }) });
  await subscriptionForm.locator("input[name='serviceName']").fill(`Managed plan ${suffix}`);
  await subscriptionForm.locator("textarea[name='description']").fill("Subscription created from customer workspace.");
  await subscriptionForm.locator("input[name='amount']").fill("49.99");
  await subscriptionForm.getByRole("button", { name: "Create subscription" }).click();
  await page.waitForURL(/subscriptionSaved=1/);
  await expect(page.getByText("Subscription workspace updated.")).toBeVisible();
  await expect(page.locator("#subscriptions").getByText(`Managed plan ${suffix}`).first()).toBeVisible();

  const noteForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Save note" }) }).first();
  await noteForm.locator("textarea[name='body']").fill(`Internal note ${suffix}`);
  await noteForm.getByRole("button", { name: "Save note" }).click();
  await page.waitForURL(/noteSaved=1/);
  await expect(page.getByText("Internal notes updated.")).toBeVisible();
  await expect(page.getByText(`Internal note ${suffix}`)).toBeVisible();

  await page.getByPlaceholder(`Type "${companyName}" to confirm deletion`).fill(companyName);
  await page.getByRole("button", { name: "Delete customer permanently" }).click();
  await page.waitForURL("**/customers?deleted=1");
  await expect(page.getByText(companyName)).toHaveCount(0);
});
