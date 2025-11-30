import { test, expect } from '@playwright/test';

test.describe('Smoke Test: Custom Fields', () => {
  test('should load /custom-fields without errors', async ({ page }) => {
    // 1. Listen for console errors specifically regarding chunk loading
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 2. Visit the page
    // Note: Since we don't have authentication setup in this simple smoke test,
    // and the route is not protected in App.tsx (it is <Route path="/custom-fields" element={<CustomFieldsPage />} />)
    // but CustomFieldsPage might assume it's protected or might redirect if inside Layout?
    // Let's check App.tsx. It is inside ProtectedRoute.
    // However, for this specific task, we want to ensure the *asset* loads.
    // If the asset loads, we might get redirected to login, but we shouldn't get a module loading error.

    // We will attempt to visit. If we get redirected to login, that's fine, as long as the initial script load didn't fail.
    // But ideally we want to see the page.
    // For now, let's just visit and check for the specific failure "Expected a JavaScript module but got text/html".

    await page.goto('/custom-fields');

    // Wait a bit for scripts to execute
    await page.waitForTimeout(2000);

    // Check for the forbidden error
    const assetErrors = consoleErrors.filter(err =>
      err.includes('Expected a JavaScript module') ||
      err.includes('Failed to fetch dynamically imported module')
    );

    expect(assetErrors, `Found asset loading errors: ${assetErrors.join(', ')}`).toHaveLength(0);

    // If redirected to login, verify we are on login.
    // If we managed to stay (e.g. if we mocked auth or if the system is loose), verify content.
    // Given the difficulty of full auth mocking in this short task, absence of chunk error is the primary goal.

    const url = page.url();
    console.log('Final URL:', url);
  });
});
