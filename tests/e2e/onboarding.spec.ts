import { test, expect } from "@playwright/test";

test.describe("Onboarding E2E Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept Supabase check for host
    await page.route("**/rest/v1/hosts*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    // Intercept profile check / insert / update
    await page.route("**/rest/v1/profiles*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "new-user-789",
          email: "newuser@example.com",
          role: "traveler",
          full_name: "New traveler",
        }),
      });
    });
  });

  test("User can complete the onboarding walkthrough successfully as traveler", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/onboarding", { timeout: 60000 });

    // Welcome step
    await expect(page.getByText("Welcome to Ausaguide!")).toBeVisible();
    await page.locator("#onboarding-welcome-next").click();

    // Choose Role step
    await expect(page.getByText("Choose Your Role")).toBeVisible();
    await page.locator("#onboarding-role-traveler").click({ force: true });
    await page.locator("#onboarding-role-next").click();

    // Tell Us About You step
    await expect(page.getByText("Tell Us About You")).toBeVisible();
    await page.locator("#ob-name").fill("Jane Traveler");
    await page.locator("#ob-email").fill("newuser@example.com");
    await page.locator("#ob-password").fill("securePassword123");

    // Click submit
    await page.locator("#onboarding-profile-submit").click();

    // Confetti or success screen should show up
    await expect(page.getByText(/Welcome to Ausaguide/i).or(page.getByText(/adventure starts now/i)).first()).toBeVisible({ timeout: 5000 });
  });
});
