import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const defaultPort = 3101;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${defaultPort}`;
const useExistingServer = Boolean(process.env.PLAYWRIGHT_BASE_URL);
const e2eDbUrl = `file:${path.join(process.cwd(), "prisma", "e2e.db")}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: useExistingServer
    ? undefined
    : {
        command: `npm run test:e2e:prepare && DATABASE_URL=${e2eDbUrl} npm run dev -- --hostname 127.0.0.1 --port ${defaultPort}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120000
      }
});
