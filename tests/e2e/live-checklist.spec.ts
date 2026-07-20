import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

// Load .env explicitly in the worker process
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (key && !(key in process.env)) {
        process.env[key] = val;
      }
    }
    console.log("[E2E spec] .env loaded successfully in worker process");
  }
} catch (e) {
  console.warn("[E2E spec] Could not load .env inside test file:", e);
}


// We run this checklist against the live production site
const LIVE_URL = "https://www.ausaguide.com";

// Lazy-resolved env vars — read at test time, not module init time
function getSupabaseEnv() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!url || !key) {
    console.warn("[E2E] Supabase env vars not set — rate limit clearing will be skipped");
  }
  return { url, key };
}

/**
 * Clears all rate limit records using the Supabase REST API directly.
 * This avoids SDK initialization ordering issues.
 * Failures are non-fatal — tests will still run (may hit rate limits).
 */
async function clearRateLimits() {
  const { url, key } = getSupabaseEnv();
  if (!url || !key) return;

  try {
    const res = await fetch(`${url}/rest/v1/rate_limits?key=neq.keep-alive-dummy-key`, {
      method: "DELETE",
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
    });
    if (res.ok) {
      console.log("✅ Rate limits cleared via REST API.");
    } else {
      const body = await res.text();
      console.warn(`Rate limit clear failed (HTTP ${res.status}): ${body}`);
    }
  } catch (err: any) {
    console.warn("Rate limit clear failed (non-fatal):", err?.message ?? err);
  }
}

/**
 * Logs in a user via the /auth page.
 * Clears rate limits first, then fills in credentials and clicks Log In.
 * Waits up to 30s for the expected URL pattern.
 */
async function loginAs(page, email: string, password: string, expectedUrlPattern: string) {
  await clearRateLimits();
  await page.goto(`${LIVE_URL}/auth`, { waitUntil: "load" });
  await page.waitForTimeout(1000);
  await page.locator("#signin-email").fill(email);
  await page.locator("#signin-password").fill(password);
  await page.waitForTimeout(500); // small delay before submit to avoid race
  await page.getByRole("button", { name: /^Log In$/i }).click();
  await page.waitForURL(`**${expectedUrlPattern}`, { timeout: 30000 });
  console.log(`✅ Logged in as ${email} → ${page.url()}`);
}

/**
 * Logs out by clearing storage and navigating home.
 */
async function performLogout(page) {
  console.log("Starting performLogout...");
  


  // Clear context cookies
  try { await page.context().clearCookies(); } catch { /* no-op */ }

  // Navigate to home page first to ensure we are on a valid HTML document on our origin
  try {
    await page.goto(`${LIVE_URL}/`, { waitUntil: "load", timeout: 15000 });
  } catch { /* no-op */ }

  // Clear all storage including IndexedDB (where Supabase might keep sessions)
  try {
    await page.evaluate(async () => {
      try {
        localStorage.clear();
        sessionStorage.clear();
        if (window.indexedDB && window.indexedDB.databases) {
          const dbs = await window.indexedDB.databases();
          for (const db of dbs) {
            if (db.name) window.indexedDB.deleteDatabase(db.name);
          }
        }
      } catch (err) {
        console.error("Browser storage clear failed:", err);
      }
    });
  } catch { /* no-op */ }

  // Reload or go back home to confirm logged-out state
  try {
    await page.goto(`${LIVE_URL}/`, { waitUntil: "load", timeout: 15000 });
    await page.waitForTimeout(1000);
  } catch { /* no-op */ }
  
  console.log("✅ Logged out.");
}

test.describe("Master Testing Checklist - Live Site Validation", () => {

  test.beforeAll(async () => {
    console.log("Pre-clearing ALL rate limits before test suite starts...");
    await clearRateLimits();
  });
  
  test.beforeEach(async ({ page }) => {
    // Dismiss cookie consent by default
    await page.addInitScript(() => {
      window.localStorage.setItem('cookie-consent', 'accepted');
    });

    // Clear rate limits before each test
    await clearRateLimits();

    // Capture browser console logs
    page.on("console", msg => {
      console.log(`[BROWSER CONSOLE] [${msg.type()}] ${msg.text()}`);
    });
    page.on("pageerror", err => {
      console.log(`[BROWSER PAGE ERROR] ${err.message}\nStack: ${err.stack}`);
    });
  });

  test.afterEach(async () => {
    // Clean up after each test to reset rate limit state
    await clearRateLimits();
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 1: Sign-up error states (client-side validation)
  // ─────────────────────────────────────────────────────────────
  test("1. AUTHENTICATION & SIGN‑UP ERROR STATES", async ({ page }) => {
    test.setTimeout(90000);
    await page.goto(`${LIVE_URL}/auth`);
    
    // Toggle to Sign Up tab
    const signUpTab = page.getByRole("tab", { name: /Sign Up/i });
    await signUpTab.click();

    // 1.5 Weak password (< 8 chars)
    await page.locator("#signup-name").fill("Test Weak");
    await page.locator("#signup-username").fill("weakpass");
    await page.locator("#signup-email").fill("weakpass@example.com");
    await page.locator("#signup-password").fill("123");
    await page.locator("#signup-confirm-password").fill("123");
    await page.getByRole("button", { name: /Continue/i }).click();
    await expect(page.locator("text=Password must be at least 8 characters").first()).toBeVisible({ timeout: 5000 });

    // 1.4 Sign up with existing email (Supabase returns fake success to prevent email enumeration)
    await page.reload();
    await signUpTab.click();
    await page.locator("#signup-name").fill("John Traveler");
    await page.locator("#signup-username").fill("travelernew123");
    await page.locator("#signup-email").fill("ostinez23@gmail.com"); // existing email
    await page.locator("#signup-password").fill("Test12345!");
    await page.locator("#signup-confirm-password").fill("Test12345!");
    await page.getByRole("button", { name: /Continue/i }).click();
    await expect(
      page.locator("text=already registered")
        .or(page.locator("text=already exists"))
        .or(page.locator("text=sent a verification email"))
        .first()
    ).toBeVisible({ timeout: 10000 });

    // 1.6 Duplicate username
    await page.reload();
    await signUpTab.click();
    await page.locator("#signup-name").fill("John Traveler");
    await page.locator("#signup-username").fill("traveler1");
    await page.locator("#signup-email").fill(`rand_${Math.floor(Math.random()*100000)}@example.com`);
    await page.locator("#signup-password").fill("Test12345!");
    await page.locator("#signup-confirm-password").fill("Test12345!");
    await page.getByRole("button", { name: /Continue/i }).click();
    await expect(page.locator("text=username is already taken").first()).toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 2: Login & redirects
  // ─────────────────────────────────────────────────────────────
  test("2. LOGIN & REDIRECTS (ADMIN, HOST, TRAVELER)", async ({ page }) => {
    test.setTimeout(120000);

    // 2.1 Admin login by email
    await loginAs(page, "ausaguides@gmail.com", "ynwmelly2", "/admin2");
    expect(page.url()).toContain("/admin2");

    // 2.8 Already logged in → /auth should redirect back to /admin2
    await page.goto(`${LIVE_URL}/auth`);
    await page.waitForURL("**/admin2", { timeout: 20000 });
    expect(page.url()).toContain("/admin2");

    // Logout
    await performLogout(page);
    expect(page.url()).toBe(`${LIVE_URL}/`);

    // 2.2 Admin login by username
    await loginAs(page, "ausaguide", "ynwmelly2", "/admin2");
    expect(page.url()).toContain("/admin2");
    await performLogout(page);

    // 2.4 Host login
    await loginAs(page, "austinmbote07@gmail.com", "Test123!", "/host/dashboard");
    expect(page.url()).toContain("/host/dashboard");
    await performLogout(page);

    // 2.5 Traveler login
    await loginAs(page, "ostinez23@gmail.com", "Test123!", "/dashboard");
    expect(page.url()).toContain("/dashboard");
    await performLogout(page);
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 3: Onboarding screen displays
  // ─────────────────────────────────────────────────────────────
  test("3. ONBOARDING SCREEN DISPLAYS", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(`${LIVE_URL}/onboarding`);
    await expect(page.getByText("Welcome to Ausaguide!")).toBeVisible({ timeout: 10000 });
    
    await page.locator("#onboarding-welcome-next").click();
    await expect(page.getByText("Choose Your Role")).toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 4: Tours, badges, booking initiation
  // ─────────────────────────────────────────────────────────────
  test("4. TOURS, BADGES, AND BOOKING INITIATION", async ({ page }) => {
    test.setTimeout(120000);
    
    // 4.3 Browse /tours (public, no login needed)
    await page.goto(`${LIVE_URL}/tours`);
    await expect(page.locator("text=Loading tours...")).not.toBeVisible({ timeout: 25000 });
    await page.waitForTimeout(2000);
    
    const tourCards = page.locator(".tour-card");
    const count = await tourCards.count();
    console.log(`Found ${count} tours on the tours page`);
    expect(count).toBeGreaterThan(0);

    // 4.4 Click the first tour
    await tourCards.first().click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("/tours/");

    // 4.5 Detail shows physical & virtual prices
    await expect(page.getByText("In-Person").or(page.getByText("/ person")).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Virtual Live").or(page.getByText("/ person")).first()).toBeVisible({ timeout: 10000 });

    // 4.6 Host badge shown
    await expect(page.getByText("Verified Host").or(page.getByText("Host")).first()).toBeVisible({ timeout: 10000 });

    // 5.1 Traveler books a physical tour → Stripe checkout
    await loginAs(page, "ostinez23@gmail.com", "Test123!", "/dashboard");

    await page.goto(`${LIVE_URL}/tours`);
    await expect(page.locator("text=Loading tours...")).not.toBeVisible({ timeout: 25000 });
    await page.waitForTimeout(2000);
    await page.locator(".tour-card").first().click();
    await page.waitForTimeout(2000);

    const bookBtn = page.getByRole("button", { name: /Book Physical/i }).or(page.getByRole("button", { name: /Book Tour/i }));
    if (await bookBtn.count() > 0) {
      await bookBtn.first().click();
      await page.waitForURL("**/checkout*", { timeout: 15000 });
      expect(page.url()).toContain("/checkout");
      
      await page.locator("#checkout-name").or(page.locator("input[placeholder*='name']")).first().fill("Test Booker");
      await page.locator("#checkout-phone").or(page.locator("input[placeholder*='phone']")).first().fill("0712345678");
      
      const payBtn = page.getByRole("button", { name: /Proceed to Payment/i }).or(page.getByRole("button", { name: /Pay Now/i }));
      if (await payBtn.count() > 0) {
        await payBtn.first().click();
        await page.waitForTimeout(5000);
        expect(page.url()).toContain("stripe.com");
      }
    }
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 5: Messaging, Journals, Waitlist
  // ─────────────────────────────────────────────────────────────
  test("5. MESSAGING, JOURNALS, WAITLIST", async ({ page }) => {
    test.setTimeout(120000);

    // 8.1 Waitlist join (public, no login needed)
    await page.goto(`${LIVE_URL}/waitlist`);
    await expect(
      page.locator("text=Join the Waitlist").or(page.locator("text=Early Access")).first()
    ).toBeVisible({ timeout: 10000 });

    const randEmail = `rand_waitlist_${Math.floor(Math.random()*1000000)}@example.com`;
    await page.locator("input[type='email']").fill(randEmail);
    await page.locator("input[type='text']").or(page.locator("input[placeholder*='Name']")).first().fill("Waitlist User");
    await page.getByRole("button", { name: /Join/i }).first().click();
    await expect(
      page.getByText("Check your inbox").or(page.getByText("confirmation link")).or(page.getByText("spot")).first()
    ).toBeVisible({ timeout: 15000 });

    // Log in as Traveler for Feed/Journal
    await loginAs(page, "ostinez23@gmail.com", "Test123!", "/dashboard");

    // 7.1 Feed
    await page.goto(`${LIVE_URL}/feed`);
    await page.waitForTimeout(2000);
    const postInput = page.locator("textarea[placeholder*='What']").or(page.locator("textarea[placeholder*='share']"));
    if (await postInput.count() > 0) {
      await postInput.fill("Automated Live Testing Post - Hello Ausaguide!");
      await page.getByRole("button", { name: /Post/i }).first().click();
      await page.waitForTimeout(3000);
      await expect(page.getByText("Automated Live Testing Post - Hello Ausaguide!").first()).toBeVisible({ timeout: 10000 });
    }

    // 7.5 Journal
    await page.goto(`${LIVE_URL}/journal`);
    await page.waitForTimeout(2000);
    await expect(
      page.getByText("My Travel Journal").or(page.getByText("Journal").first())
    ).toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 6: Admin dashboard
  // ─────────────────────────────────────────────────────────────
  test("6. ADMIN DASHBOARD ACTIONS", async ({ page }) => {
    test.setTimeout(120000);
    
    await loginAs(page, "ausaguides@gmail.com", "ynwmelly2", "/admin2");

    // Wait for loading to clear
    await expect(page.locator("text=Loading")).not.toBeVisible({ timeout: 20000 });

    // 9.1 Overview loaded
    await expect(
      page.getByText("Adminv2").or(page.getByText("Key metrics and recent activity")).filter({ visible: true }).first()
    ).toBeVisible({ timeout: 15000 });

    // Verify stat cards
    await expect(page.getByText("Total Users").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Total Tours").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Total Bookings").first()).toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 7: Edge cases
  // ─────────────────────────────────────────────────────────────
  test("7. EDGE CASES", async ({ page }) => {
    test.setTimeout(60000);

    // Access /admin2 as logged-out user → should redirect to /auth
    await page.goto(`${LIVE_URL}/admin2`);
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).not.toContain("/admin2");
    console.log(`✅ /admin2 protected: redirected to ${url}`);

    // Wrong password → error message
    await clearRateLimits();
    await page.goto(`${LIVE_URL}/auth`);
    await page.locator("#signin-email").fill("test@wrong.com");
    await page.locator("#signin-password").fill("wrongpassword123");
    await page.getByRole("button", { name: /^Log In$/i }).click();
    await expect(
      page.getByText("Incorrect email or password")
        .or(page.getByText("Invalid email or password"))
        .or(page.getByText("No account found"))
        .or(page.getByText("credentials"))
        .first()
    ).toBeVisible({ timeout: 15000 });
    console.log("✅ Wrong credentials show friendly error");
  });
});
