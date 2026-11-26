import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT || "3005";
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm run start --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 30000,
  },
});
