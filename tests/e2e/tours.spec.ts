import { test, expect } from "@playwright/test";

test.describe("Tours Browsing E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept Supabase fetchTours requests
    await page.route("**/rest/v1/tours*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "tour-1",
            host_id: "host-1",
            title: "Masai Mara Wilderness Safari",
            description: "An authentic safari experience.",
            short_description: "Amazing safari experience",
            price: 5000,
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
          },
        ]),
      });
    });
  });

  test("User can load the tours page, search, and view tour card details", async ({ page }) => {
    await page.goto("/tours");

    // Check page title is rendered
    await expect(page.getByText(/Explore Tours/i)).toBeVisible();

    // Verify search input is present
    const searchInput = page.getByPlaceholder(/Search tours or destinations/i);
    await expect(searchInput).toBeVisible();

    // Enter a search term
    await searchInput.fill("Masai");
    await expect(searchInput).toHaveValue("Masai");

    // Confirm that the mock tour card renders
    const tourCard = page.getByText("Masai Mara Wilderness Safari");
    await expect(tourCard).toBeVisible();
  });
});
