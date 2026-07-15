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

test("admin backoffice flows and API validation hold up", async ({ page }) => {
  const suffix = Date.now().toString().slice(-6);
  const companyName = `Backoffice QA ${suffix}`;
  const financeEmail = `finance.qa.${suffix}@appathycrm.local`;
  const financePassword = `FinanceQA!${suffix}`;
  const uploadName = `customer-upload-${suffix}.txt`;

  await login(page, adminEmail, adminPassword);
  await page.waitForURL("**/dashboard");

  const existingRulesResponse = await page.context().request.get("/api/reminder-rules");
  expect(existingRulesResponse.ok()).toBeTruthy();
  const existingRulesPayload = await existingRulesResponse.json();
  const usedFailedPaymentOffsets = new Set(
    existingRulesPayload.data
      .filter((rule: { kind: string }) => rule.kind === "FAILED_PAYMENT")
      .map((rule: { daysOffset: number }) => rule.daysOffset)
  );
  let failedPaymentOffset = 5;
  while (usedFailedPaymentOffsets.has(failedPaymentOffset)) {
    failedPaymentOffset += 1;
  }

  await page.goto("/users");
  const createUserForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Create user" }) });
  await createUserForm.getByPlaceholder("First name").fill("Quinn");
  await createUserForm.getByPlaceholder("Last name").fill(`Finance${suffix}`);
  await createUserForm.getByPlaceholder("Email address").fill(financeEmail);
  await createUserForm.getByPlaceholder("Job title").fill("Finance Analyst");
  await createUserForm.locator("select[name='roleId']").selectOption({ label: "Finance" });
  await createUserForm.locator("select[name='status']").selectOption("ACTIVE");
  await createUserForm.getByPlaceholder("Temporary password").fill(financePassword);
  await createUserForm.getByRole("button", { name: "Create user" }).click();
  await page.waitForURL("**/users?saved=1");
  await expect(page.getByText(financeEmail)).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("**/login");
  await login(page, financeEmail, financePassword);
  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("link", { name: "Invoices" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Settings" })).toHaveCount(0);

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("**/login");
  await login(page, adminEmail, adminPassword);
  await page.waitForURL("**/dashboard");

  await page.goto("/users");
  const financeCard = page.locator("form").filter({ has: page.getByText(financeEmail) });
  await financeCard.locator("select[name='status']").selectOption("DISABLED");
  await financeCard.getByRole("button", { name: "Update access" }).click();
  await page.waitForURL("**/users?saved=1");

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("**/login");
  await login(page, financeEmail, financePassword);
  await page.waitForURL("**/login?error=invalid_credentials");
  await expect(page.getByText("We couldn't sign you in with those details.")).toBeVisible();

  await login(page, adminEmail, adminPassword);
  await page.waitForURL("**/dashboard");

  await page.goto("/settings");
  await page.locator("form").filter({ has: page.getByRole("button", { name: "Add reminder rule" }) }).locator("select[name='kind']").selectOption("FAILED_PAYMENT");
  await page.locator("form").filter({ has: page.getByRole("button", { name: "Add reminder rule" }) }).locator("input[name='daysOffset']").fill(String(failedPaymentOffset));
  await page.locator("form").filter({ has: page.getByRole("button", { name: "Add reminder rule" }) }).locator("select[name='templateKey']").selectOption("overdue_invoice");
  await page.getByRole("button", { name: "Add reminder rule" }).click();
  await page.waitForURL(/\/settings\?saved=1$/);

  const rulesResponse = await page.context().request.get("/api/reminder-rules");
  expect(rulesResponse.ok()).toBeTruthy();
  const rulesPayload = await rulesResponse.json();
  expect(
    rulesPayload.data.some(
      (rule: { kind: string; daysOffset: number; templateKey: string }) =>
        rule.kind === "FAILED_PAYMENT" && rule.daysOffset === failedPaymentOffset && rule.templateKey === "overdue_invoice"
    )
  ).toBeTruthy();

  await page.goto("/customers");
  await page.getByPlaceholder("Company name").fill(companyName);
  await page.getByPlaceholder("Legal name").fill(`${companyName} Ltd`);
  await page.getByPlaceholder("Billing email").fill(`accounts+${suffix}@example.com`);
  await page.getByPlaceholder("Billing phone").fill("+44 113 333 4444");
  await page.getByPlaceholder("Website URL").fill(`https://backoffice-${suffix}.example.com`);
  await page.getByPlaceholder("Tags, comma separated").fill("qa,backoffice");
  await page.getByPlaceholder("Notes summary").fill("Created during backoffice QA.");
  await page.getByRole("button", { name: "Create customer" }).click();
  await page.waitForURL(/\/customers\/.+/);
  const customerId = page.url().split("/").at(-1)!;
  await page.locator("input[type='file']").setInputFiles({
    name: uploadName,
    mimeType: "text/plain",
    buffer: Buffer.from(`Uploaded via customer detail UI ${suffix}`)
  });
  await page.getByRole("button", { name: "Upload document" }).click();
  await expect(page.getByText("Document uploaded.")).toBeVisible();
  await expect(page.getByText(uploadName)).toBeVisible();

  const badRule = await page.context().request.post("/api/reminder-rules", {
    data: {
      kind: "FAILED_PAYMENT",
      daysOffset: 999,
      templateKey: "overdue_invoice",
      isActive: true
    }
  });
  expect(badRule.status()).toBe(400);

  const missingCustomer = await page.context().request.patch("/api/customers/not-real", {
    data: {
      name: "Missing Customer"
    }
  });
  expect(missingCustomer.status()).toBe(404);

  const missingTask = await page.context().request.patch("/api/tasks/not-real", {
    data: {
      status: "DONE"
    }
  });
  expect(missingTask.status()).toBe(404);

  const missingSubscription = await page.context().request.patch("/api/subscriptions/not-real", {
    data: {
      status: "PAUSED"
    }
  });
  expect(missingSubscription.status()).toBe(404);

  const missingUser = await page.context().request.patch("/api/users/not-real", {
    data: {
      status: "DISABLED"
    }
  });
  expect(missingUser.status()).toBe(404);

  const missingFileUpload = await page.context().request.post("/api/documents", {
    multipart: {
      scope: "COMPANY",
      companyId: customerId
    }
  });
  expect(missingFileUpload.status()).toBe(400);
});
