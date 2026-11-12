import { defineConfig, devices } from '@playwright/test'

// Smoke test against the production build, served with the fixture dataset (no live calls).
export default defineConfig({
  testDir: 'e2e',
  reporter: process.env.CI ? 'line' : 'list',
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview --port 4173 --strictPort',
    env: { DATA_DIR: 'e2e/fixtures/data' },
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
