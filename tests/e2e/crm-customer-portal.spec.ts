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

test("admin can edit and delete a customer, and run quote-to-portal-to-invoice flows", async ({ page, context, request }) => {
  const suffix = Date.now().toString().slice(-6);
  const companyName = `Portal QA ${suffix}`;
  const updatedBillingEmail = `updated+${suffix}@example.com`;

  await login(page, adminEmail, adminPassword);
  await page.waitForURL("**/dashboard");

  await page.goto("/customers");
  await page.getByPlaceholder("Company name").fill(companyName);
  await page.getByPlaceholder("Legal name").fill(`${companyName} Ltd`);
  await page.getByPlaceholder("Billing email").fill(`billing+${suffix}@example.com`);
  await page.getByPlaceholder("Billing phone").fill("+44 113 444 5555");
  await page.getByPlaceholder("Website URL").fill(`https://portal-qa-${suffix}.example.com`);
  await page.getByPlaceholder("Tags, comma separated").fill("qa,portal");
  await page.getByPlaceholder("Notes summary").fill("Portal and quote conversion QA.");
  await page.getByRole("button", { name: "Create customer" }).click();
  await page.waitForURL(/\/customers\/.+/);

  await page.getByPlaceholder("Billing email").fill(updatedBillingEmail);
  await page.getByPlaceholder("Flags, comma separated").fill("VIP,PORTAL_QA");
  await page.getByRole("button", { name: "Save customer" }).click();
  await page.waitForURL(/\/customers\/.+\?saved=1$/);
  await expect(page.getByPlaceholder("Billing email")).toHaveValue(updatedBillingEmail);
  await expect(page.getByText("PORTAL_QA")).toBeVisible();

  await page.goto("/quotes");
  await page.locator("select[name='companyId']").selectOption({ label: companyName });
  await page.locator("input[name='itemDescription']").fill(`Quote for ${companyName}`);
  await page.locator("input[name='itemUnitPrice']").fill("450");
  await page.locator("textarea[name='notes']").fill("QA quote note.");
  await page.locator("textarea[name='terms']").fill("QA quote terms.");
  await page.getByRole("button", { name: "Save draft quote" }).click();
  await page.waitForURL("**/quotes?saved=1");

  const quoteCard = page.locator("div.rounded-3xl").filter({ hasText: companyName }).first();
  await expect(quoteCard).toContainText("Quote for");
  await quoteCard.getByRole("button", { name: "Create portal link" }).click();
  await page.waitForURL(/\/quotes\?portal=/);

  const quotePortalUrl = await page.locator("input[readonly]").first().inputValue();
  const portalPage = await context.newPage();
  await portalPage.goto(quotePortalUrl);
  await expect(portalPage.getByRole("heading", { name: /Quote / })).toBeVisible();
  await portalPage.getByRole("button", { name: "Accept quote" }).click();
  await portalPage.waitForURL(/accepted=1$/);
  await expect(portalPage.getByText("Quote accepted successfully.")).toBeVisible();

  await page.goto("/quotes");
  const acceptedQuoteCard = page.locator("div.rounded-3xl").filter({ hasText: companyName }).first();
  await expect(acceptedQuoteCard).toContainText("ACCEPTED");
  await acceptedQuoteCard.getByRole("button", { name: "Convert to invoice" }).click();
  await page.waitForURL(/\/invoices\/.+/);
  await expect(page.getByText(/Converted from quote/i)).toBeVisible();

  await page.getByRole("button", { name: "Create portal link" }).click();
  await page.waitForURL(/\/invoices\/.+\?portal=/);
  const invoicePortalUrl = await page.locator("input[readonly]").first().inputValue();

  const invoicePortalPage = await context.newPage();
  await invoicePortalPage.goto(invoicePortalUrl);
  await expect(invoicePortalPage.getByText(/Balance due/i)).toBeVisible();

  const invoiceToken = invoicePortalUrl.split("/portal/")[1];
  const invoicePdf = await request.get(`/api/portal/${invoiceToken}/pdf`);
  expect(invoicePdf.ok()).toBeTruthy();
  expect(invoicePdf.headers()["content-type"]).toContain("application/pdf");

  await page.goto("/customers");
  await page.getByRole("link", { name: companyName }).click();
  await page.waitForURL(/\/customers\/.+/);
  await page.getByPlaceholder(`Type "${companyName}" to confirm deletion`).fill(companyName);
  await page.getByRole("button", { name: "Delete customer permanently" }).click();
  await page.waitForURL("**/customers?deleted=1");
  await expect(page.getByText(companyName)).toHaveCount(0);
});
