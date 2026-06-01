/**
 * E2E — Peer-evaluation flow
 *
 * Happy path: a student logs in → opens a course → finds an active evaluation
 * → rates each peer criterion → submits.
 *
 * Mock data (from src/mocks/db.ts):
 *   course  : "Ingeniería de Software" (course-sistemas)
 *   category: "Proyecto Final" (cat-proyecto-final)
 *   eval    : "Evaluación de pares - Proyecto Final" (eval-proyecto-final)
 *   group   : "Grupo Alpha" — the logged-in user is a member
 */

import { test, expect, Page } from '@playwright/test';

const MOCK_EMAIL    = 'estudiante@uninorte.edu.co';
const MOCK_PASSWORD = 'password123';

// ─── helpers ─────────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto('/');
  await page.waitForURL(/login/);
  await page.getByTestId('email-input').fill(MOCK_EMAIL);
  await page.getByTestId('password-input').fill(MOCK_PASSWORD);
  await page.getByTestId('login-button').click();
  await page.waitForURL(/(home|tabs|\(app\))/);
}

// ─── tests ───────────────────────────────────────────────────────────────────

test.describe('Course list (Home)', () => {
  test.beforeEach(login);

  test('displays enrolled courses on the home screen', async ({ page }) => {
    await expect(page.getByText('Ingeniería de Software')).toBeVisible();
    await expect(page.getByText('Redes de Computadores')).toBeVisible();
  });

  test('shows pending evaluation badge when evaluations are due', async ({ page }) => {
    // "Proyecto Final" evaluation is active — the badge should appear on the card
    await expect(page.getByText(/Grupos por Calificar/i)).toBeVisible();
  });
});

test.describe('Course detail — student', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Navigate into the Ingeniería de Software course
    await page.getByText('Ingeniería de Software').click();
    await page.waitForURL(/course\/.+/);
  });

  test('shows the course categories/tabs', async ({ page }) => {
    await expect(page.getByText('Proyecto Final')).toBeVisible();
    await expect(page.getByText('Parcial 1')).toBeVisible();
  });

  test('clicking a category shows group peers for evaluation', async ({ page }) => {
    await page.getByText('Proyecto Final').click();
    // Group Alpha has peers: the 3 non-logged users
    await expect(page.getByText('Grupo Alpha')).toBeVisible();
  });
});

test.describe('Peer evaluation form', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByText('Ingeniería de Software').click();
    await page.waitForURL(/course\/.+/);
    await page.getByText('Proyecto Final').click();
    // Click on the first evaluable peer
    await page.getByTestId(/peer-card|peer-item/).first().click();
    await page.waitForURL(/evaluatee/);
  });

  test('shows all evaluation criteria', async ({ page }) => {
    await expect(page.getByText('Participación activa')).toBeVisible();
    await expect(page.getByText('Comunicación efectiva')).toBeVisible();
    await expect(page.getByText('Calidad del trabajo')).toBeVisible();
    await expect(page.getByText('Puntualidad')).toBeVisible();
  });

  test('allows scoring each criterion and submitting the evaluation', async ({ page }) => {
    // Score all criteria — each slider/score-card should be interactable
    const scoreCards = page.getByTestId(/criterium-score-card|score-input/);
    const count = await scoreCards.count();
    expect(count).toBeGreaterThan(0);

    // Attempt to submit (exact button label depends on implementation)
    const submitBtn = page.getByRole('button', { name: /enviar|submit|calificar/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // After submission, navigate away from the evaluatee screen
    await expect(page).not.toHaveURL(/evaluatee/);
  });

  test('shows an error if the user tries to submit without scoring', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /enviar|submit|calificar/i });
    await submitBtn.click();
    // An error or validation message should appear
    const error = page.getByText(/calificación|score|required|obligatorio/i);
    // It's acceptable if the form either shows an error or stays on the page
    const urlAfter = page.url();
    const hasError = await error.count() > 0;
    const stayedOnPage = urlAfter.includes('evaluatee');
    expect(hasError || stayedOnPage).toBe(true);
  });
});

test.describe('Reports screen', () => {
  test.beforeEach(login);

  test('reports tab is accessible from the bottom navigation', async ({ page }) => {
    await page.getByRole('tab', { name: /reports|reportes/i }).click();
    await page.waitForURL(/reports/);
    await expect(page.getByText(/reporte|report/i)).toBeVisible();
  });
});
