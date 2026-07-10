import { test, expect } from "@playwright/test";

test.describe("Authentication E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept Supabase profile checks
    await page.route("**/rest/v1/profiles*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "mock-user-123",
          email: "traveler@example.com",
          role: "traveler",
          full_name: "Test Traveler",
        }),
      });
    });

    // Intercept Supabase Auth token request
    await page.route("**/auth/v1/token*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          expires_in: 3600,
          token_type: "bearer",
          user: {
            id: "mock-user-123",
            email: "traveler@example.com",
            aud: "authenticated",
            role: "authenticated",
            user_metadata: { full_name: "Test Traveler" },
          },
        }),
      });
    });

    // Intercept Supabase Auth signup request
    await page.route("**/auth/v1/signup*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "new-user-789",
            email: "newtraveler@example.com",
            user_metadata: { full_name: "John Doe" },
          },
        }),
      });
    });

    // Intercept ipify IP check
    await page.route("https://api.ipify.org*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ip: "127.0.0.1" }),
      });
    });

    // Intercept rate_limits check
    await page.route("**/rest/v1/rate_limits*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    // Intercept auth/v1/user check
    await page.route("**/auth/v1/user*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "mock-user-123",
          email: "traveler@example.com",
          aud: "authenticated",
          role: "authenticated",
          user_metadata: { full_name: "Test Traveler" },
        }),
      });
    });
  });

  test("User can log in successfully and redirect to dashboard", async ({ page }) => {
    await page.goto("/auth");

    // Check tabs and page structure
    await expect(page.getByRole("tab", { name: /Log In/i })).toBeVisible();

    // Fill in sign-in form
    await page.locator("#signin-email").fill("traveler@example.com");
    await page.locator("#signin-password").fill("password123");

    // Click Log In button
    await page.getByRole("button", { name: /^Log In$/i }).click({ force: true });

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("User can toggle to sign up and input fields", async ({ page }) => {
    await page.goto("/auth");

    // Toggle to Sign Up tab
    const signUpTab = page.getByRole("tab", { name: /Sign Up/i });
    await signUpTab.click({ force: true });

    // Fill details
    await page.locator("#signup-name").fill("John Doe");
    await page.locator("#signup-email").fill("newtraveler@example.com");
    await page.locator("#signup-password").fill("safePassword123");
    await page.locator("#signup-confirm-password").fill("safePassword123");

    // Submit signup triggers onboarding redirect
    await page.getByRole("button", { name: /Get Started/i }).click({ force: true });
    await expect(page).toHaveURL(/.*onboarding/);
  });

  test("Protected routes redirect traveler to login when unauthenticated", async ({ page }) => {
    // Navigate to protected dashboard directly
    await page.goto("/dashboard");

    // Check redirect to auth page
    await expect(page).toHaveURL(/.*auth/);
  });
});
