import { expect, test, type Page } from "@playwright/test";

const adminEmail = process.env.CRM_ADMIN_EMAIL ?? "admin@crm.appathy.uk";
const adminPassword = process.env.CRM_ADMIN_PASSWORD ?? "ChangeMe123!";
const readonlyEmail = process.env.CRM_READONLY_EMAIL;
const readonlyPassword = process.env.CRM_READONLY_PASSWORD;

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe.configure({ mode: "serial" });

test("admin can complete the core CRM workflow", async ({ page, request }) => {
  const suffix = Date.now().toString().slice(-6);
  const companyName = `QA Service ${suffix}`;
  const subscriptionName = `QA Maintenance ${suffix}`;
  const taskTitle = `QA Follow-up ${suffix}`;
  const settingsName = `Appathy CRM QA ${suffix}`;

  await login(page, adminEmail, adminPassword);
  await page.waitForURL("**/dashboard");
  await expect(page.getByText("Collections trend")).toBeVisible();
  await expect(page.getByText("Upcoming renewals")).toBeVisible();

  await page.getByRole("link", { name: "Customers" }).click();
  await page.waitForURL("**/customers");
  await page.getByPlaceholder("Company name").fill(companyName);
  await page.getByPlaceholder("Legal name").fill(`${companyName} Ltd`);
  await page.getByPlaceholder("Billing email").fill(`accounts+${suffix}@example.com`);
  await page.getByPlaceholder("Billing phone").fill("+44 113 000 1234");
  await page.getByPlaceholder("Website URL").fill(`https://qa-${suffix}.example.com`);
  await page.getByPlaceholder("Tags, comma separated").fill("qa,playwright");
  await page.getByPlaceholder("Notes summary").fill("Created by live QA automation.");
  await page.getByRole("button", { name: "Create customer" }).click();
  await page.waitForURL(/\/customers\/.+/);
  const companyUrl = page.url();
  const companyId = companyUrl.split("/").at(-1)!;
  await expect(page.getByText(companyName)).toBeVisible();

  const documentName = `qa-${suffix}.txt`;
  const documentUpload = await page.context().request.post("/api/documents", {
    multipart: {
      scope: "COMPANY",
      companyId,
      file: {
        name: documentName,
        mimeType: "text/plain",
        buffer: Buffer.from(`QA document for ${companyName}`)
      }
    }
  });
  expect(documentUpload.ok()).toBeTruthy();
  await page.goto(companyUrl);
  await expect(page.getByText(documentName)).toBeVisible();

  await page.getByRole("link", { name: "Subscriptions" }).click();
  await page.waitForURL("**/subscriptions");
  await page.locator("select[name='companyId']").selectOption({ label: companyName });
  await page.getByPlaceholder("Service name").fill(subscriptionName);
  await page.getByPlaceholder("Description").fill("Quarterly managed support plan.");
  await page.locator("select[name='frequency']").selectOption("QUARTERLY");
  await page.locator("input[name='intervalCount']").fill("1");
  await page.locator("input[name='amount']").fill("149.99");
  await page.locator("input[name='taxRate']").fill("20");
  await page.getByRole("button", { name: "Create subscription" }).click();
  await page.waitForURL(/\/subscriptions\/.+/);
  await expect(page.getByText(subscriptionName)).toBeVisible();

  await page.getByRole("link", { name: "Tasks" }).click();
  await page.waitForURL("**/tasks");
  await page.getByPlaceholder("Task title").fill(taskTitle);
  await page.getByPlaceholder("Task details").fill("Call customer to confirm renewal details.");
  await page.locator("select[name='priority']").selectOption("HIGH");
  await page.locator("input[name='dueAt']").fill("2026-04-01");
  await page.locator("select[name='companyId']").selectOption({ label: companyName });
  await page.locator("select[name='assignedToUserId']").selectOption({ label: "Ava Patel" });
  await page.getByRole("button", { name: "Create task" }).click();
  await page.waitForURL("**/tasks");
  await expect(page.getByText(taskTitle)).toBeVisible();

  await page.getByRole("link", { name: "Invoices" }).click();
  await page.waitForURL("**/invoices");
  await page.getByRole("link", { name: "Create invoice" }).click();
  await page.waitForURL("**/invoices/new");
  await page.locator("select[name='companyId']").selectOption({ label: companyName });
  await page.locator("input[name='itemDescription']").fill(`Invoice for ${companyName}`);
  await page.locator("input[name='itemUnitPrice']").fill("240");
  await page.locator("textarea[name='notes']").fill("QA invoice note.");
  await page.locator("textarea[name='terms']").fill("Payment due within 14 days.");
  await page.getByRole("button", { name: "Save draft invoice" }).click();
  await page.waitForURL(/\/invoices\/.+/);
  await expect(page.getByText("Balance due")).toBeVisible();
  const invoiceUrl = page.url();

  await page.locator("input[name='amount']").fill("288");
  await page.locator("input[name='method']").fill("Bank transfer");
  await page.locator("input[name='reference']").fill(`QA-${suffix}`);
  await page.locator("textarea[name='reconciliationNote']").fill("Paid during automated QA.");
  await page.getByRole("button", { name: "Save payment" }).click();
  await page.waitForURL(invoiceUrl);
  await expect(page.getByText("£0.00")).toBeVisible();

  const invoicePdfResponse = await page.context().request.get(`${invoiceUrl}/pdf`.replace("/invoices/", "/api/invoices/"));
  expect(invoicePdfResponse.ok()).toBeTruthy();
  expect(invoicePdfResponse.headers()["content-type"]).toContain("application/pdf");

  await page.goto(invoiceUrl);
  await page.getByRole("button", { name: "Send invoice" }).click();
  await page.waitForURL(/\/invoices\/.+\?sent=1$/);
  await expect(page.getByText("Invoice email sent successfully.")).toBeVisible();
  await expect(page.getByText(/Sent invoice email to/i)).toBeVisible();

  await page.goto("/settings");
  await page.getByPlaceholder("Business name").fill(settingsName);
  await page.getByPlaceholder("Billing email").fill(`billing+${suffix}@appathy.uk`);
  await page.getByPlaceholder("Phone").fill("+44 113 222 3333");
  await page.getByPlaceholder("Address").fill("77 Billing Lane, Leeds");
  await page.getByRole("button", { name: "Save settings" }).click();
  await page.waitForURL("**/settings?saved=1");
  await expect(page.getByPlaceholder("Business name")).toHaveValue(settingsName);

  await page.getByRole("link", { name: "Reports" }).click();
  await page.waitForURL("**/reports");
  await expect(page.getByText("Invoice status breakdown")).toBeVisible();

  await page.getByRole("link", { name: "Notifications" }).click();
  await page.waitForURL("**/notifications");
  await expect(page.getByText("In-app alerts for renewals")).toBeVisible();

  await page.goto("/forgot-password");
  await page.getByLabel("Work email").fill(adminEmail);
  await page.getByRole("button", { name: /send reset|reset/i }).click();
  await page.waitForURL("**/forgot-password?sent=1");
});

test("read-only user cannot access admin-only areas", async ({ page }) => {
  if (readonlyEmail && readonlyPassword) {
    await login(page, readonlyEmail, readonlyPassword);
  } else {
    const suffix = Date.now().toString().slice(-6);
    const generatedReadonlyEmail = `readonly.qa.${suffix}@crm.appathy.uk`;
    const generatedReadonlyPassword = `ReadonlyQA!${suffix}`;

    await login(page, adminEmail, adminPassword);
    await page.waitForURL("**/dashboard");
    await page.goto("/users");
    const createUserForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Create user" }) });
    await createUserForm.getByPlaceholder("First name").fill("Riley");
    await createUserForm.getByPlaceholder("Last name").fill(`Readonly${suffix}`);
    await createUserForm.getByPlaceholder("Email address").fill(generatedReadonlyEmail);
    await createUserForm.getByPlaceholder("Job title").fill("Observer");
    await createUserForm.locator("select[name='roleId']").selectOption({ label: "Read-only" });
    await createUserForm.locator("select[name='status']").selectOption("ACTIVE");
    await createUserForm.getByPlaceholder("Temporary password").fill(generatedReadonlyPassword);
    await createUserForm.getByRole("button", { name: "Create user" }).click();
    await page.waitForURL("**/users?saved=1");
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL("**/login");
    await login(page, generatedReadonlyEmail, generatedReadonlyPassword);
  }

  await page.waitForURL("**/dashboard");

  await expect(page.getByRole("link", { name: "Settings" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);

  await page.goto("/settings");
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/users");
  await expect(page).toHaveURL(/\/dashboard$/);
});
