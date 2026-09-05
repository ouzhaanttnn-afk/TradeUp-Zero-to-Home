import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  workers: 1,
  timeout: 60_000,
  use: {
    channel: "chrome",
    baseURL: "http://127.0.0.1:4193",
    viewport: { width: 390, height: 844 },
    serviceWorkers: "allow",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm preview --host 127.0.0.1 --port 4193 --strictPort",
    url: "http://127.0.0.1:4193",
    reuseExistingServer: false,
  },
});
