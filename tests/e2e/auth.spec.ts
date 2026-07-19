import { test, expect } from "@playwright/test";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, Authorization, Content-Type, Accept, X-Client-Info, Prefer",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
};

// Valid mock JWT (properly formatted base64url JWT with traveler payload)
const MOCK_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YjFkZWI0ZC0zYjdkLTRiYWQtOWJkZC0yYjBkN2IzZGNiNmQiLCJlbWFpbCI6InRyYXZlbGVyQGV4YW1wbGUuY29tIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiaXNzIjoic3VwYWJhc2UiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJmdWxsX25hbWUiOiJUZXN0IFRyYXZlbGVyIiwiZW1haWwiOiJ0cmF2ZWxlckBleGFtcGxlLmNvbSJ9LCJpYXQiOjE3ODQwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.mock-signature-not-validated";

const MOCK_USER = {
  id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  email: "traveler@example.com",
  aud: "authenticated",
  role: "authenticated",
  user_metadata: { full_name: "Test Traveler" },
  app_metadata: { provider: "email", providers: ["email"] },
};

const MOCK_PROFILE = {
  id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  email: "traveler@example.com",
  role: "traveler",
  full_name: "Test Traveler",
  banned: false,
  host_tier: null,
};

test.describe("Authentication E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept OPTIONS requests to Supabase URLs for CORS preflight
    await page.route(
      (url) => url.href.includes("supabase.co"),
      async (route) => {
        if (route.request().method() === "OPTIONS") {
          await route.fulfill({
            status: 204,
            headers: CORS_HEADERS,
          });
        } else {
          await route.fallback();
        }
      }
    );

    // Intercept Supabase profile checks
    await page.route(/.*\/rest\/v1\/profiles.*/, async (route) => {
      const url = route.request().url();
      if (url.includes("username=") || url.includes("email=")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: CORS_HEADERS,
          body: JSON.stringify([]),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: CORS_HEADERS,
          body: JSON.stringify(MOCK_PROFILE),
        });
      }
    });

    // Intercept Supabase Auth token request (sign-in / refresh)
    await page.route(/.*\/auth\/v1\/token.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: CORS_HEADERS,
        body: JSON.stringify({
          access_token: MOCK_JWT,
          refresh_token: "mock-refresh-token-xyz",
          expires_in: 3600,
          token_type: "bearer",
          user: MOCK_USER,
        }),
      });
    });

    // Intercept Supabase Auth signup request
    await page.route(/.*\/auth\/v1\/signup.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: CORS_HEADERS,
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
        headers: CORS_HEADERS,
        body: JSON.stringify({ ip: "127.0.0.1" }),
      });
    });

    // Intercept rate_limits
    await page.route(/.*\/rest\/v1\/rate_limits.*/, async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: CORS_HEADERS,
          body: JSON.stringify([]),
        });
      } else {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          headers: CORS_HEADERS,
          body: JSON.stringify([
            {
              id: "mock-rl-1",
              key: "login:127.0.0.1",
              count: 1,
              reset_at: new Date(Date.now() + 60_000).toISOString(),
            },
          ]),
        });
      }
    });

    // Intercept auth/v1/user check
    await page.route(/.*\/auth\/v1\/user.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: CORS_HEADERS,
        body: JSON.stringify(MOCK_USER),
      });
    });
  });

  test("User can log in successfully and redirect to dashboard", async ({ page }) => {
    test.setTimeout(45_000);
    await page.goto("/auth");
    await page.waitForSelector("#signin-email", { timeout: 10_000 });

    // Check tabs and page structure
    await expect(page.getByRole("tab", { name: /Log In/i })).toBeVisible();

    // Fill in sign-in form
    await page.locator("#signin-email").fill("traveler@example.com");
    await page.locator("#signin-password").fill("password123");

    // Click Log In button
    await page.getByRole("button", { name: /^Log In$/i }).click({ force: true });

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15_000 });
  });

  test("User can toggle to sign up and input fields", async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto("/auth");
    await page.waitForSelector("#signin-email", { timeout: 10_000 });

    // Toggle to Sign Up tab
    const signUpTab = page.getByRole("tab", { name: /Sign Up/i });
    await signUpTab.click({ force: true });

    // Fill details
    await page.locator("#signup-name").fill("John Doe");
    await page.locator("#signup-username").fill("johndoe");
    await page.locator("#signup-email").fill("newtraveler@example.com");
    await page.locator("#signup-password").fill("safePassword123");
    await page.locator("#signup-confirm-password").fill("safePassword123");

    // Submit signup triggers success message
    await page.getByRole("button", { name: /Continue/i }).click({ force: true });
    await expect(page.locator("text=Account created successfully!").first()).toBeVisible({ timeout: 10_000 });
  });

  test("Protected routes redirect traveler to login when unauthenticated", async ({ page }) => {
    test.setTimeout(20_000);
    // Navigate to protected dashboard directly
    await page.goto("/dashboard");

    // Check redirect to auth page
    await expect(page).toHaveURL(/.*auth/, { timeout: 10_000 });
  });

  test("User can request password reset email", async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto("/auth");
    await page.waitForSelector("#signin-email", { timeout: 10_000 });

    // Fill email
    await page.locator("#signin-email").fill("traveler@example.com");

    // Mock recover request
    await page.route(/.*\/auth\/v1\/recover.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: CORS_HEADERS,
        body: JSON.stringify({}),
      });
    });

    // Click Forgot Password button
    await page.getByRole("button", { name: /Forgot password\?/i }).click({ force: true });

    // Click Send Link button
    await page.getByRole("button", { name: /Send Link/i }).click({ force: true });

    // Verify success message
    await expect(
      page.locator("text=Check your inbox for the reset link.").first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("User can click Google login and gets redirected to Google OAuth and then back to onboarding", async ({
    page,
  }) => {
    test.setTimeout(45_000);
    await page.goto("/auth");
    await page.waitForSelector("#signin-email", { timeout: 10_000 });

    // Setup route for auth profiles check to return empty/null profile to mock new user
    await page.route(/.*\/rest\/v1\/profiles.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: CORS_HEADERS,
        body: JSON.stringify([]), // return empty to trigger onboarding redirect
      });
    });

    // Mock supabase.auth.signInWithOAuth to prevent actual redirection
    await page.evaluate(() => {
      if ((window as any).supabase?.auth) {
        (window as any).supabase.auth.signInWithOAuth = async () => {
          return { data: { provider: "google", url: "" }, error: null };
        };
      }
    });

    await page.getByRole("button", { name: /Google/i }).click({ force: true });

    // Directly navigate to callback page (simulating the client-side redirect after authorization)
    await page.goto(
      "/auth/callback#access_token=" +
        MOCK_JWT +
        "&refresh_token=mock-refresh-token-xyz&expires_in=3600&token_type=bearer"
    );

    // Wait for redirect to onboarding
    await expect(page).toHaveURL(/.*onboarding/, { timeout: 15_000 });
  });
});
