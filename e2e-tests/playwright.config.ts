import { defineConfig, devices } from '@playwright/test';

/**
 * BASE_URL apunta al servicio "frontend-web-test" dentro de la red de Docker
 * (build dedicado a pruebas, con EXPO_PUBLIC_API_URL=http://backend:8080 --
 * distinto del frontend-web "de verdad" que usa localhost:8080 para el
 * navegador humano en la PC del host).
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: '/results/html-report' }]],
  outputDir: '/results/artifacts',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
