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
