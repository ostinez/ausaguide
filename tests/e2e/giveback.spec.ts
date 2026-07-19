import { test, expect } from "@playwright/test";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, Authorization, Content-Type, Accept, X-Client-Info, Prefer",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
};

test.describe("Giveback Initiatives E2E Tests", () => {
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

    // Intercept waitlist post requests
    await page.route(/.*\/rest\/v1\/waitlist.*/, async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        headers: CORS_HEADERS,
        body: JSON.stringify([{ id: 1 }]),
      });
    });

    // Intercept tree commitments inserts
    await page.route(/.*\/rest\/v1\/tree_commitments.*/, async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        headers: CORS_HEADERS,
        body: JSON.stringify([{ id: 1, tree_id: "AUS-TREE-9999" }]),
      });
    });

    // Intercept travel commitments
    await page.route(/.*\/rest\/v1\/travel_commitments.*/, async (route) => {
      const method = route.request().method();
      const body = method === "GET" ? [] : [{ id: 1, commitment_id: "AUS-TRAVEL-9999" }];
      await route.fulfill({
        status: method === "GET" ? 200 : 201,
        contentType: "application/json",
        headers: {
          ...CORS_HEADERS,
          ...(method === "GET" ? { "content-range": "0-0/0" } : {}),
        },
        body: JSON.stringify(body),
      });
    });

    // Intercept partnership inquiries inserts
    await page.route(/.*\/rest\/v1\/partnership_inquiries.*/, async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        headers: CORS_HEADERS,
        body: JSON.stringify([{ id: 1 }]),
      });
    });
  });

  test("Tree Planting page loads, submits commitment and partner forms successfully", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/tree-planting", { timeout: 30_000 });

    // Wait for the page content to render
    await page.waitForSelector("h1, h2", { timeout: 15_000 });

    // Check headings
    await expect(
      page.locator("h1, h2").filter({ hasText: /Plant Trees, Grow Hope/i }).first()
    ).toBeVisible({ timeout: 10_000 });

    // Fill partner form first
    await page.getByPlaceholder("e.g. Green Kenya NGO").fill("Eco Kenya Org");
    await page.getByPlaceholder("e.g. Jane Doe").fill("Jane Doe Partner");
    await page.getByPlaceholder("e.g. jane@greenkenya.org").fill("partner@greenkenya.org");
    await page
      .getByPlaceholder(/Describe your conservation initiative/i)
      .fill("We do massive tree planting.");

    // Submit partner form
    await page.getByRole("button", { name: "Submit Partnership Application" }).click({ force: true });

    // Check success state text
    await expect(page.getByText("Thank you for reaching out!").first()).toBeVisible({ timeout: 10_000 });

    // Fill in virtual tree commitment form
    await page.getByPlaceholder("Enter your name").first().fill("Green Activist");
    await page.getByPlaceholder("Enter your email").first().fill("activist@example.com");
    await page.getByPlaceholder("e.g. Acacia Sunrise").fill("Acasia Hope");
    await page.getByPlaceholder("e.g. In memory of loved ones").fill("Eco preservation");

    // Click Plant My Tree
    await page.getByRole("button", { name: "Plant My Tree" }).click({ force: true });

    // Verification screen redirect
    await expect(page).toHaveURL(/.*tree-planted/, { timeout: 15_000 });
  });

  test("Mental Health support page loads, submits getaway commitment", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/mental-health", { timeout: 30_000 });

    // Wait for the page content to render
    await page.waitForSelector("h1, h2", { timeout: 15_000 });

    // Check headings
    await expect(
      page.locator("h1, h2, h3, button, span").filter({ hasText: /Sponsor a Getaway/i }).first()
    ).toBeVisible({ timeout: 10_000 });

    // Fill commitment details
    await page.getByPlaceholder("Enter your name").first().fill("Generous Donor");
    await page.getByPlaceholder("Enter your email").first().fill("donor@example.com");
    await page
      .getByPlaceholder("e.g. Dedicated to local guides in Masai Mara")
      .fill("For Watamu beach guides");

    // Submit
    await page.getByRole("button", { name: "Commit to Sponsoring a Getaway" }).click({ force: true });

    // Verification screen redirect
    await expect(page).toHaveURL(/.*travel-commitment-thank-you/, { timeout: 15_000 });
  });
});
