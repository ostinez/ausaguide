import { test, expect } from "@playwright/test";

test.describe("Booking E2E Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept tour detail fetch
    await page.route("**/rest/v1/tours*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "tour-999",
            host_id: "host-999",
            title: "Safari Tour Masai Mara",
            price: 5000,
            currency: "KES",
            duration_hours: 4,
            max_guests: 5,
            location_name: "Masai Mara",
            category: "nature",
            tour_type: "in_person",
            is_published: true,
            status: "published",
          },
        ]),
      });
    });

    // Intercept booking creation
    await page.route("**/rest/v1/bookings*", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      } else {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: "booking-999",
            tour_id: "tour-999",
            host_id: "host-999",
            guest_name: "Alice Smith",
            guest_email: "alice@example.com",
            guest_phone: "+254700000000",
            booking_date: "2026-12-01",
            booking_time: "10:00",
            total_price: 5000,
            status: "confirmed",
          }),
        });
      }
    });

    // Intercept notifications insertion
    await page.route("**/rest/v1/notifications*", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: "notif-999" }),
      });
    });

    // Intercept profiles select
    await page.route("**/rest/v1/profiles*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "host-999",
          email: "host@example.com",
          full_name: "Local Host",
        }),
      });
    });

    // Intercept rate_limits select & insert
    await page.route("**/rest/v1/rate_limits*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
  });

  test("User can load checkout page and complete booking form successfully", async ({ page }) => {
    // Navigate with dates & slots parameters
    await page.goto("/checkout/tour-999?date=2026-12-01&time=10:00&guests=1");

    // Form inputs check
    await expect(page.getByText("Complete your booking")).toBeVisible();

    // Fill details
    await page.getByPlaceholder("Your full name").fill("Alice Smith");
    await page.getByPlaceholder("you@example.com").fill("alice@example.com");
    await page.getByPlaceholder("+254 700 000 000").fill("+254700000000");

    // Click confirm button
    await page.getByRole("button", { name: /confirm/i }).click({ force: true });

    // Check confirmation screen redirect
    await expect(page).toHaveURL(/.*confirmation/);
  });
});
