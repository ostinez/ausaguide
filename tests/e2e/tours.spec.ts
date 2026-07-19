import { test, expect } from "@playwright/test";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, Authorization, Content-Type, Accept, X-Client-Info, Prefer",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
};

const MOCK_TOUR_LIST = [
  {
    id: "tour-1",
    host_id: "host-1",
    title: "Masai Mara Wilderness Safari",
    description: "An authentic safari experience.",
    short_description: "Amazing safari experience",
    price: 5000,
    physical_price: 5000,
    virtual_price: 2000,
    currency: "KES",
    duration_hours: 24,
    max_guests: 6,
    location_name: "Masai Mara",
    category: "nature",
    tour_type: "in_person",
    images: [],
    highlights: [],
    is_published: true,
    rating: 5,
    review_count: 3,
    status: "published",
    host: { full_name: "Local Host", avatar_url: null },
  },
];

test.describe("Tours Browsing E2E Tests", () => {
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

    // Intercept Supabase fetchTours requests
    await page.route(/.*\/rest\/v1\/tours.*/, async (route) => {
      const url = route.request().url();
      const body = url.includes("id=eq.") ? MOCK_TOUR_LIST[0] : MOCK_TOUR_LIST;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: CORS_HEADERS,
        body: JSON.stringify(body),
      });
    });

    // Mock wishlist (may be fetched for authenticated users)
    await page.route(/.*\/rest\/v1\/wishlist.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: CORS_HEADERS,
        body: JSON.stringify([]),
      });
    });
  });

  test("User can load the tours page, search, and view tour card details", async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto("/tours");

    // Wait for the h1 heading which contains GradientText "Explore Tours"
    await page.waitForSelector("h1", { timeout: 10_000 });

    // Check page title is rendered — target the h1 to avoid strict-mode issues
    // with GradientText's inner .text-content having color:transparent
    await expect(
      page.locator("h1").filter({ hasText: /Explore Tours/i })
    ).toBeVisible({ timeout: 10_000 });

    // Verify search input is present
    const searchInput = page.getByPlaceholder(/Search tours or destinations/i);
    await expect(searchInput).toBeVisible({ timeout: 5_000 });

    // Enter a search term
    await searchInput.fill("Masai");
    await expect(searchInput).toHaveValue("Masai");

    // Confirm that the mock tour card renders
    const tourCard = page.getByText("Masai Mara Wilderness Safari");
    await expect(tourCard).toBeVisible({ timeout: 10_000 });
  });
});
