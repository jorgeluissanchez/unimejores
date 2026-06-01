/**
 * E2E — Authentication flows
 *
 * Uses the MSW mock server that starts automatically when the Expo web app
 * boots (src/mocks/index.web.ts initialises the Service Worker).
 *
 * Credentials come from the mock DB:
 *   email:    estudiante@uninorte.edu.co
 *   password: password123
 */

import { test, expect, Page } from '@playwright/test';

const MOCK_EMAIL    = 'estudiante@uninorte.edu.co';
const MOCK_PASSWORD = 'password123';

// ─── helpers ─────────────────────────────────────────────────────────────────

async function fillLoginForm(page: Page, email: string, password: string) {
  await page.getByTestId('email-input').fill(email);
  await page.getByTestId('password-input').fill(password);
}

async function submitLogin(page: Page) {
  await page.getByTestId('login-button').click();
}

// ─── tests ───────────────────────────────────────────────────────────────────

test.describe('Login screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Expo Router redirects unauthenticated users to /(auth)/login
    await page.waitForURL(/login/);
  });

  test('shows login form with email, password and submit button', async ({ page }) => {
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('login-button')).toBeVisible();
  });

  test('shows inline validation errors when submitted empty', async ({ page }) => {
    await submitLogin(page);
    await expect(page.getByText('Ingresa tu correo')).toBeVisible();
  });

  test('shows invalid-email error for missing @ symbol', async ({ page }) => {
    await page.getByTestId('email-input').fill('notanemail');
    await submitLogin(page);
    await expect(page.getByText('Ingresa un correo válido')).toBeVisible();
  });

  test('shows short-password error for < 6 chars', async ({ page }) => {
    await fillLoginForm(page, MOCK_EMAIL, '123');
    await submitLogin(page);
    await expect(page.getByText('Mínimo 6 caracteres')).toBeVisible();
  });

  test('shows server error banner on wrong credentials', async ({ page }) => {
    await fillLoginForm(page, 'wrong@test.com', 'wrongpassword');
    await submitLogin(page);
    await expect(page.getByText(/Credenciales inválidas/i)).toBeVisible();
  });

  test('navigates to home screen after successful login', async ({ page }) => {
    await fillLoginForm(page, MOCK_EMAIL, MOCK_PASSWORD);
    await submitLogin(page);
    // Expo Router should navigate away from /login to the home tab
    await page.waitForURL(/(home|tabs|\(app\))/);
    await expect(page).not.toHaveURL(/login/);
  });
});

test.describe('Session persistence', () => {
  test('stays logged in on page refresh after a successful login', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/login/);
    await fillLoginForm(page, MOCK_EMAIL, MOCK_PASSWORD);
    await submitLogin(page);
    await page.waitForURL(/(home|tabs|\(app\))/);

    await page.reload();
    // Should not bounce back to login
    await expect(page).not.toHaveURL(/login/);
  });
});

test.describe('Logout', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.waitForURL(/login/);
    await fillLoginForm(page, MOCK_EMAIL, MOCK_PASSWORD);
    await submitLogin(page);
    await page.waitForURL(/(home|tabs|\(app\))/);
  });

  test('returns to login screen after logout', async ({ page }) => {
    // The logout button is rendered inside the settings tab
    await page.getByRole('tab', { name: /settings|ajustes/i }).click();
    await page.getByTestId('logout-button').click();
    await page.waitForURL(/login/);
    await expect(page.getByTestId('login-button')).toBeVisible();
  });
});
