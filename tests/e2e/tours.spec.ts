import { test, expect } from '@playwright/test';

test.describe('Tour Browsing Flow', () => {
  test('should load the tours page and display tour cards', async ({ page }) => {
    // Go to the tours page
    await page.goto('/tours');
    
    // Check if the page title is visible
    await expect(page.getByText(/Explore Kenya Live/i)).toBeVisible();
    
    // Ensure that search/filter inputs are visible
    await expect(page.getByPlaceholder(/Search destinations/i)).toBeVisible();
  });
});
