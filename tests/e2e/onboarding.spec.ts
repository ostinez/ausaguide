import { test, expect } from "@playwright/test";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, Authorization, Content-Type, Accept, X-Client-Info, Prefer",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
};

test.describe("Onboarding E2E Flow", () => {
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

    // Intercept Supabase check for host
    await page.route(/.*\/rest\/v1\/hosts.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: CORS_HEADERS,
        body: JSON.stringify([]),
      });
    });

    // Intercept profile check / insert / update
    await page.route(/.*\/rest\/v1\/profiles.*/, async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      let body: any = {
        id: "new-user-789",
        email: "newuser@example.com",
        role: "traveler",
        full_name: "New traveler",
      };

      if (url.includes("username=")) {
        body = [];
      }

      await route.fulfill({
        status: method === "POST" || method === "PATCH" ? 200 : 200,
        contentType: "application/json",
        headers: CORS_HEADERS,
        body: JSON.stringify(body),
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
            email: "newuser@example.com",
            user_metadata: { full_name: "Jane Traveler" },
          },
        }),
      });
    });

    // Intercept auth/v1/user check
    await page.route(/.*\/auth\/v1\/user.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: CORS_HEADERS,
        body: JSON.stringify({
          id: "new-user-789",
          email: "newuser@example.com",
          user_metadata: { full_name: "Jane Traveler" },
        }),
      });
    });

    // Intercept rate_limits
    await page.route(/.*\/rest\/v1\/rate_limits.*/, async (route) => {
      const method = route.request().method();
      const body = method === "GET" ? [] : [{ id: "rl-ob-1", key: "onboarding:127.0.0.1", count: 1, reset_at: new Date(Date.now() + 60_000).toISOString() }];
      await route.fulfill({
        status: method === "GET" ? 200 : 201,
        contentType: "application/json",
        headers: CORS_HEADERS,
        body: JSON.stringify(body),
      });
    });
  });

  test("User can complete the onboarding walkthrough successfully as traveler", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/onboarding", { timeout: 30_000 });

    // Wait for the welcome step heading to appear
    await page.waitForSelector("h1", { timeout: 15_000 });

    // Welcome step
    await expect(
      page.locator("h1").filter({ hasText: /Welcome to Ausaguide/i })
    ).toBeVisible({ timeout: 10_000 });
    await page.locator("#onboarding-welcome-next").click();

    // Choose Role step
    await expect(
      page.locator("h1, h2, h3").filter({ hasText: /Choose Your Role/i }).first()
    ).toBeVisible({ timeout: 10_000 });
    await page.locator("#onboarding-role-traveler").click({ force: true });
    await page.locator("#onboarding-role-next").click();

    // Tell Us About You step
    await expect(
      page.locator("h1, h2, h3").filter({ hasText: /Tell Us About You/i }).first()
    ).toBeVisible({ timeout: 10_000 });
    await page.locator("#ob-name").fill("Jane Traveler");
    await page.locator("#ob-username").fill("janetraveler");

    // Click submit
    await page.locator("#onboarding-profile-submit").click();

    // Confetti or success screen should show up
    await expect(
      page
        .getByText(/Welcome to Ausaguide/i)
        .or(page.getByText(/adventure starts now/i))
        .first()
    ).toBeVisible({ timeout: 15_000 });
  });
});
