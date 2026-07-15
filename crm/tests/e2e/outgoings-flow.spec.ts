import { expect, test } from "@playwright/test";
import {
  cleanupOutgoingsQaArtifacts,
  disconnectOutgoingsE2EPrisma,
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
  E2E_SERVICE_PREFIX,
  E2E_VENDOR_PREFIX
} from "./support/outgoings-e2e";

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test.afterEach(async () => {
  await cleanupOutgoingsQaArtifacts();
});

test.afterAll(async () => {
  await disconnectOutgoingsE2EPrisma();
});

test("tracks a new outgoing through reminders, dashboard activity, and reporting", async ({ page, request }) => {
  const runId = Date.now().toString();
  const vendorName = `${E2E_VENDOR_PREFIX} ${runId}`;
  const serviceName = `${E2E_SERVICE_PREFIX} ${runId}`;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  await page.goto("/login");
  await page.getByLabel("Email").fill(E2E_ADMIN_EMAIL);
  await page.getByLabel("Password").fill(E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/outgoings");
  const newOutgoingForm = page.getByTestId("new-outgoing-form");
  await newOutgoingForm.getByPlaceholder("Vendor").fill(vendorName);
  await newOutgoingForm.getByPlaceholder("Service").fill(serviceName);
  await newOutgoingForm.getByPlaceholder("Category").fill("QA Automation");
  await newOutgoingForm.getByPlaceholder("Support email").fill("qa-billing@appathy.uk");
  await newOutgoingForm.getByPlaceholder("Account number").fill(`QA-${runId}`);
  await newOutgoingForm.locator('select[name="frequency"]').selectOption("MONTHLY");
  await newOutgoingForm.getByPlaceholder("Amount").fill("123.45");
  await newOutgoingForm.getByPlaceholder("Currency").fill("GBP");
  await newOutgoingForm.locator('input[name="nextPaymentDate"]').fill(formatDateInput(dueDate));
  await newOutgoingForm.getByPlaceholder("Payment method").fill("Company card");
  await newOutgoingForm.getByPlaceholder("Reference / account ID").fill(`qa-${runId}`);
  await newOutgoingForm.getByPlaceholder("Website or portal URL").fill("qa.example.com/billing");
  await newOutgoingForm.getByPlaceholder("Reminder days before, comma separated").fill("7, 3, 0");
  await newOutgoingForm.getByPlaceholder("Notes").fill("Automated QA subscription used to prove the outgoing workflow.");
  await newOutgoingForm.getByRole("button", { name: "Save outgoing subscription" }).click();

  await expect(page).toHaveURL(/\/outgoings\?saved=1$/);
  const outgoingCard = page.locator('[data-testid="outgoing-card"]').filter({ hasText: vendorName }).first();
  await expect(outgoingCard).toContainText(serviceName);
  await expect(outgoingCard).toContainText("QA Automation");

  await page.goto("/dashboard");
  await expect(page.getByText(`Created outgoing subscription ${vendorName} - ${serviceName}`)).toBeVisible();

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    throw new Error("CRON_SECRET must be set to run the outgoings end-to-end test.");
  }

  const reminderResponse = await request.post("/api/reminders/run", {
    headers: { "x-cron-secret": cronSecret }
  });
  expect(reminderResponse.ok()).toBeTruthy();

  const expectedNotificationTitle = `Payment due in 7 days: ${vendorName}`;
  await page.goto("/notifications");
  await expect(page.getByText(expectedNotificationTitle).first()).toBeVisible();
  await expect(page.getByText(new RegExp(`${escapeRegex(serviceName)} costs £123\\.45`, "i")).first()).toBeVisible();

  await page.goto("/outgoings");
  const refreshedCard = page.locator('[data-testid="outgoing-card"]').filter({ hasText: vendorName }).first();
  const paymentForm = refreshedCard.getByTestId("record-outgoing-payment-form");
  await paymentForm.locator('input[name="amount"]').fill("123.45");
  await paymentForm.locator('input[name="reference"]').fill(`payment-${runId}`);
  await paymentForm.locator('textarea[name="note"]').fill("QA payment capture");
  await paymentForm.getByRole("button", { name: "Record payment" }).click();

  await expect(page).toHaveURL(/\/outgoings\?paymentSaved=1$/);
  const paidCard = page.locator('[data-testid="outgoing-card"]').filter({ hasText: vendorName }).first();
  await expect(paidCard).toContainText("COMPLETED on");
  await expect(paidCard).toContainText("QA payment capture");

  await page.goto("/reports");
  await expect(page.getByText(vendorName)).toBeVisible();
  await expect(page.getByText(serviceName)).toBeVisible();
  await expect(page.getByText(/£123\.45 on/i)).toBeVisible();
});
