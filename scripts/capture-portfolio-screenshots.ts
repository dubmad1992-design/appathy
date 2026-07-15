import { chromium, type Page } from "@playwright/test";
import path from "node:path";

async function dismissCookieBanner(page: Page) {
  const acceptButton = page.getByRole("button", { name: /accept/i }).first();
  try {
    await acceptButton.click({ timeout: 3000 });
    await page.waitForTimeout(300);
  } catch {
    // no cookie banner present
  }
}

const targets = [
  { slug: "gaming", url: "https://appathy.uk/gaming/" },
  { slug: "linc", url: "https://appathy.uk/linc/" }
];

const outDir = path.join(__dirname, "..", "images");

async function main() {
  const browser = await chromium.launch();

  for (const target of targets) {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await desktop.goto(target.url, { waitUntil: "networkidle" });
    await dismissCookieBanner(desktop);
    await desktop.screenshot({ path: path.join(outDir, `${target.slug}-desktop.png`) });
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(target.url, { waitUntil: "networkidle" });
    await dismissCookieBanner(mobile);
    await mobile.screenshot({ path: path.join(outDir, `${target.slug}-mobile.png`) });
    await mobile.close();

    console.log(`Captured ${target.slug}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
