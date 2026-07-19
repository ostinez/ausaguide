import { test, expect } from "@playwright/test";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, Authorization, Content-Type, Accept, X-Client-Info, Prefer",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
};

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

const MOCK_HOST_PROFILE = {
  id: "host-999",
  email: "host@example.com",
  role: "host",
  full_name: "Local Host Guide",
  banned: false,
  host_tier: "certified",
  avatar_url: null,
};

test.describe("Real-time Proximity Host Matching E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Mock Geolocation API to instantly return Nairobi coordinates
    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = (success) => {
        success({
          coords: {
            latitude: -1.2921,
            longitude: 36.8219,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      };
    });

    // Capture browser console logs
    page.on("console", (msg) => {
      console.log(`[BROWSER CONSOLE] [${msg.type()}] ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      console.log(`[BROWSER PAGE ERROR] ${err.message}\nStack: ${err.stack}`);
    });

    // Unified Supabase Router to handle all API endpoints reliably
    await page.route(
      (url) => url.href.includes("supabase.co"),
      async (route) => {
        const req = route.request();
        const method = req.method();
        const urlStr = req.url();

        // 1. Handle OPTIONS preflight request
        if (method === "OPTIONS") {
          await route.fulfill({
            status: 204,
            headers: CORS_HEADERS,
          });
          return;
        }

        // 2. Handle profiles endpoint
        if (urlStr.includes("/rest/v1/profiles")) {
          let body = MOCK_PROFILE;
          if (urlStr.includes("id=eq.host-999")) {
            body = MOCK_HOST_PROFILE;
          } else if (urlStr.includes("username=") || urlStr.includes("email=")) {
            body = [] as any;
          }
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: CORS_HEADERS,
            body: JSON.stringify(body),
          });
          return;
        }

        // 3. Handle auth token endpoint
        if (urlStr.includes("/auth/v1/token")) {
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
          return;
        }

        // 4. Handle auth user endpoint
        if (urlStr.includes("/auth/v1/user")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: CORS_HEADERS,
            body: JSON.stringify(MOCK_USER),
          });
          return;
        }

        // 5. Handle find-urgent-host Edge Function
        if (urlStr.includes("/functions/v1/find-urgent-host")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: CORS_HEADERS,
            body: JSON.stringify({
              success: true,
              request: {
                id: "req-999",
                traveler_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
                location: "POINT(36.8219 -1.2921)",
                budget: 3000,
                experience_type: ["culture"],
                status: "pending",
                expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
              },
              hostsFound: 2,
            }),
          });
          return;
        }

        // 6. Handle rate_limits
        if (urlStr.includes("/rest/v1/rate_limits")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: CORS_HEADERS,
            body: JSON.stringify([]),
          });
          return;
        }

        // 7. Handle tours
        if (urlStr.includes("/rest/v1/tours")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: CORS_HEADERS,
            body: JSON.stringify([]),
          });
          return;
        }

        // 8. Safe default response for all other unmocked requests
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: CORS_HEADERS,
          body: JSON.stringify([]),
        });
      }
    );
  });

  test("Traveler can request an urgent host and successfully get matched in real-time", async ({ page }) => {
    test.setTimeout(45_000);

    // Navigate to callback to set authenticated session
    await page.goto(
      "/auth/callback#access_token=" +
        MOCK_JWT +
        "&refresh_token=mock-refresh-token-xyz&expires_in=3600&token_type=bearer"
    );

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15_000 });

    // Reload homepage to pick up the logged-in traveler session
    await page.goto("/");

    // Wait for the Find a Host Now CTA button to render in Hero
    const findHostCTA = page.getByRole("button", { name: /Find a Host Now/i }).first();
    await expect(findHostCTA).toBeVisible({ timeout: 10_000 });
    await findHostCTA.click();

    // Verify UrgentMatchModal is visible
    const modalTitle = page.locator("h2").filter({ hasText: /Find a Host Now/i }).first();
    await expect(modalTitle).toBeVisible({ timeout: 10_000 });

    // Verify GPS auto-detection succeeded
    const gpsStatus = page.locator("text=Auto-detected GPS Location").first();
    await expect(gpsStatus).toBeVisible({ timeout: 5_000 });

    // Stub the Supabase realtime channel to simulate host acceptance event
    await page.evaluate(() => {
      if ((window as any).supabase) {
        const callbacks: any[] = [];
        (window as any).supabase.channel = function(name: string) {
          return {
            on: function(event: string, filter: any, callback: any) {
              callbacks.push(callback);
              return this;
            },
            subscribe: function() {
              // Asynchronously simulate host accept match trigger after 1.5 seconds
              setTimeout(() => {
                callbacks.forEach((cb) => {
                  cb({
                    new: {
                      id: "req-999",
                      status: "accepted",
                      matched_host_id: "host-999",
                    },
                  });
                });
              }, 1500);
              return this;
            },
            unsubscribe: function() {
              return this;
            },
          };
        };
      }
    });

    // Click matching request button
    const searchBtn = page.getByRole("button", { name: /Match Me Now/i });
    await searchBtn.click({ force: true });

    // Radar screen should show up
    await expect(page.getByText(/Paging Available Hosts.../i)).toBeVisible({ timeout: 10_000 });

    // Confetti / Success screen should display host details
    await expect(page.getByText(/Guide Match Confirmed!/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Local Host Guide/i)).toBeVisible({ timeout: 5_000 });

    // Close the dashboard button
    const dbBtn = page.getByRole("button", { name: /Go to Dashboard/i });
    await dbBtn.click();

    // Verify redirected to user dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15_000 });
  });
});
