import { expect, test } from "@playwright/test";

test("contact submission works from the public site", async ({ page }) => {
  await page.goto("/contact");

  await page.getByTestId("contact-name").fill("E2E Contact");
  await page.getByTestId("contact-email").fill("e2e-contact@example.com");
  await page.getByTestId("contact-company").fill("Appathy QA");
  await page.getByTestId("contact-interest").selectOption("Website refresh");
  await page.getByTestId("contact-message").fill("This is an automated end-to-end verification of the public contact flow.");
  await page.getByTestId("contact-submit").click();

  await expect(page.getByText("Your project enquiry has been sent.")).toBeVisible();
  await expect(page.getByTestId("contact-name")).toHaveValue("");
  await expect(page.getByTestId("contact-email")).toHaveValue("");
});

test("honeypot submissions are silently dropped", async ({ request }) => {
  const response = await request.post("/api/contact", {
    data: {
      name: "Spam Bot",
      email: "bot@spam.example",
      company: "Botfarm",
      interestType: "Website refresh",
      message: "Automated spam message that should never be stored.",
      website: "https://spam.example"
    }
  });

  expect(response.status()).toBe(200);
  const payload = await response.json();
  expect(payload).toEqual({ success: true, data: null });
});
