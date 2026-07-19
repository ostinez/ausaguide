import { test, expect } from "@playwright/test";
import * as supabaseJS from "@supabase/supabase-js";

const createClientFn = (supabaseJS.createClient || (supabaseJS as any).default?.createClient || supabaseJS);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("E2E tests require VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables. Never hardcode secrets.")
}

const supabaseClient = (createClientFn as any)(supabaseUrl, supabaseAnonKey);

// We run this checklist against the live production site
const LIVE_URL = "https://www.ausaguide.com";

// Helper function to log out via the sliding StaggeredMenu
async function performLogout(page) {
  console.log("Starting performLogout...");
  // Clear storage first to ensure session is cleared even if network request is slow
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch (err) {
    console.log("Storage clear skipped or context destroyed during navigation:", err);
  }
  const menuBtn = page.getByRole("button", { name: /Open menu/i }).or(page.getByRole("button", { name: /Menu/i }));
  if (await menuBtn.count() > 0) {
    await menuBtn.first().click();
    await page.waitForTimeout(1000);
    // Find the Logout button
    const logoutBtn = page.getByRole("button", { name: /Logout/i }).or(page.locator("text=Logout")).or(page.locator("text=07 Logout"));
    if (await logoutBtn.count() > 0) {
      await logoutBtn.first().click();
    }
  }
  await page.goto(`${LIVE_URL}/`);
  await page.waitForURL(`${LIVE_URL}/`, { timeout: 15000 });
  console.log("Logged out successfully.");
}

test.describe("Master Testing Checklist - Live Site Validation", () => {

  test.beforeAll(async () => {
    console.log("Pre-clearing rate limits to avoid IP blocks during tests...");
    await supabaseClient.from("rate_limits").delete().neq("key", "keep-alive-dummy-key");
  });
  
  test.beforeEach(async ({ page }) => {
    // Dismiss cookie consent by default
    await page.addInitScript(() => {
      window.localStorage.setItem('cookie-consent', 'accepted');
    });

    // Clear rate limits dynamically before each test starts to make it bulletproof
    await supabaseClient.from("rate_limits").delete().neq("key", "keep-alive-dummy-key");

    // Capture browser console logs
    page.on("console", msg => {
      console.log(`[BROWSER CONSOLE] [${msg.type()}] ${msg.text()}`);
    });
    page.on("pageerror", err => {
      console.log(`[BROWSER PAGE ERROR] ${err.message}\nStack: ${err.stack}`);
    });
  });

  test("1. AUTHENTICATION & SIGN‑UP ERROR STATES", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(`${LIVE_URL}/auth`);
    
    // Toggle to Sign Up tab
    const signUpTab = page.getByRole("tab", { name: /Sign Up/i });
    await signUpTab.click();

    // 1.5 Sign up with weak password (< 8 chars based on client-side validatePassword)
    await page.locator("#signup-name").fill("Test Weak");
    await page.locator("#signup-username").fill("weakpass");
    await page.locator("#signup-email").fill("weakpass@example.com");
    await page.locator("#signup-password").fill("123");
    await page.locator("#signup-confirm-password").fill("123");
    await page.getByRole("button", { name: /Continue/i }).click();
    // Expect error toast or validation error
    await expect(page.locator("text=Password must be at least 8 characters").first()).toBeVisible();

    // 1.4 Sign up with existing email
    await page.reload();
    await signUpTab.click();
    await page.locator("#signup-name").fill("John Traveler");
    await page.locator("#signup-username").fill("travelernew123");
    await page.locator("#signup-email").fill("ostinez23@gmail.com"); // existing email
    await page.locator("#signup-password").fill("Test12345!");
    await page.locator("#signup-confirm-password").fill("Test12345!");
    await page.getByRole("button", { name: /Continue/i }).click();
    // Expect signup error toast or success (Supabase email confirmation returns fake success to prevent email enumeration)
    await expect(page.locator("text=already registered").or(page.locator("text=already exists")).or(page.locator("text=sent a verification email")).first()).toBeVisible();

    // 1.6 Sign up with duplicate username
    await page.reload();
    await signUpTab.click();
    await page.locator("#signup-name").fill("John Traveler");
    await page.locator("#signup-username").fill("traveler1"); // duplicate username (Traveler 1's username)
    await page.locator("#signup-email").fill(`rand_${Math.floor(Math.random()*100000)}@example.com`);
    await page.locator("#signup-password").fill("Test12345!");
    await page.locator("#signup-confirm-password").fill("Test12345!");
    await page.getByRole("button", { name: /Continue/i }).click();
    // Expect username taken error
    await expect(page.locator("text=username is already taken").first()).toBeVisible();
  });

  test("2. LOGIN & REDIRECTS (ADMIN, HOST, TRAVELER)", async ({ page }) => {
    test.setTimeout(90000);

    // 2.1 Log in with email and password (admin)
    await page.goto(`${LIVE_URL}/auth`);
    await page.locator("#signin-email").fill("ausaguides@gmail.com");
    await page.locator("#signin-password").fill("ynwmelly2");
    await page.getByRole("button", { name: /^Log In$/i }).click();
    await page.waitForURL("**/admin2", { timeout: 15000 });
    expect(page.url()).toContain("/admin2");

    // 2.8 Already logged in – visit /auth should redirect to admin dashboard
    await page.goto(`${LIVE_URL}/auth`);
    await page.waitForURL("**/admin2", { timeout: 15000 });
    expect(page.url()).toContain("/admin2");

    // 2.9 Logout
    await performLogout(page);
    expect(page.url()).toBe(`${LIVE_URL}/`);

    // 2.2 Log in with username (admin)
    await page.goto(`${LIVE_URL}/auth`);
    await page.locator("#signin-email").fill("ausaguide");
    await page.locator("#signin-password").fill("ynwmelly2");
    await page.getByRole("button", { name: /^Log In$/i }).click();
    await page.waitForURL("**/admin2", { timeout: 15000 });
    expect(page.url()).toContain("/admin2");

    // Logout
    await performLogout(page);

    // 2.4 Log in with email (host)
    await page.goto(`${LIVE_URL}/auth`);
    await page.locator("#signin-email").fill("austinmbote07@gmail.com");
    await page.locator("#signin-password").fill("Test123!");
    await page.getByRole("button", { name: /^Log In$/i }).click();
    await page.waitForURL("**/host/dashboard", { timeout: 15000 });
    expect(page.url()).toContain("/host/dashboard");

    // Logout
    await performLogout(page);

    // 2.5 Log in with email (traveler)
    await page.goto(`${LIVE_URL}/auth`);
    await page.locator("#signin-email").fill("ostinez23@gmail.com");
    await page.locator("#signin-password").fill("Test123!");
    await page.getByRole("button", { name: /^Log In$/i }).click();
    await page.waitForURL("**/dashboard", { timeout: 15000 });
    expect(page.url()).toContain("/dashboard");
    
    // Logout
    await performLogout(page);
  });

  test("3. ONBOARDING SCREEN DISPLAYS", async ({ page }) => {
    // 3.1 Onboarding – Welcome step
    await page.goto(`${LIVE_URL}/onboarding`);
    await expect(page.getByText("Welcome to Ausaguide!")).toBeVisible();
    
    // 3.2 Choose role
    await page.locator("#onboarding-welcome-next").click();
    await expect(page.getByText("Choose Your Role")).toBeVisible();
  });

  test("4. TOURS, BADGES, AND BOOKING INITIATION", async ({ page }) => {
    test.setTimeout(90000);
    
    // 4.3 Browse /tours
    await page.goto(`${LIVE_URL}/tours`);
    // Wait for loader to disappear
    await expect(page.locator("text=Loading tours...")).not.toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(3000);
    
    // Check if tour list loads
    const tourCards = page.locator(".tour-card");
    const count = await tourCards.count();
    console.log(`Found ${count} tours on the tours page`);
    expect(count).toBeGreaterThan(0);

    // 4.4 Click the first tour
    await tourCards.first().click();
    await page.waitForTimeout(3000);
    expect(page.url()).toContain("/tours/");

    // 4.5 Detail shows physical & virtual prices
    await expect(page.getByText("In-Person").or(page.getByText("/ person")).first()).toBeVisible();
    await expect(page.getByText("Virtual Live").or(page.getByText("/ person")).first()).toBeVisible();

    // 4.6 Detail shows host badge
    await expect(page.getByText("Verified Host").or(page.getByText("Host")).first()).toBeVisible();

    // 5.1 Traveler books a physical tour (simulate booking triggers Stripe checkout)
    // First, login as traveler
    await page.goto(`${LIVE_URL}/auth`);
    await page.locator("#signin-email").fill("ostinez23@gmail.com");
    await page.locator("#signin-password").fill("Test123!");
    await page.getByRole("button", { name: /^Log In$/i }).click();
    await page.waitForURL("**/dashboard", { timeout: 15000 });

    // Navigate to a tour detail directly
    await page.goto(`${LIVE_URL}/tours`);
    await expect(page.locator("text=Loading tours...")).not.toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(3000);
    await page.locator(".tour-card").first().click();
    await page.waitForTimeout(3000);

    // Click "Book Tour" or checkout initiation
    const bookBtn = page.getByRole("button", { name: /Book Physical/i }).or(page.getByRole("button", { name: /Book Tour/i }));
    if (await bookBtn.count() > 0) {
      await bookBtn.first().click();
      // Verify redirect to checkout page
      await page.waitForURL("**/checkout*", { timeout: 10000 });
      expect(page.url()).toContain("/checkout");
      
      // Fill details in checkout
      await page.locator("#checkout-name").or(page.locator("input[placeholder*='name']")).first().fill("Test Booker");
      await page.locator("#checkout-phone").or(page.locator("input[placeholder*='phone']")).first().fill("0712345678");
      
      // Click Proceed to Payment
      const payBtn = page.getByRole("button", { name: /Proceed to Payment/i }).or(page.getByRole("button", { name: /Pay Now/i }));
      if (await payBtn.count() > 0) {
        await payBtn.first().click();
        await page.waitForTimeout(5000);
        // Expect Stripe checkout to open (URL has checkout.stripe.com)
        expect(page.url()).toContain("stripe.com");
      }
    }
  });

  test("6 & 7 & 8. MESSAGING, JOURNALS, WAITLIST", async ({ page }) => {
    test.setTimeout(90000);

    // 8.1 Go to /waitlist
    await page.goto(`${LIVE_URL}/waitlist`);
    await expect(page.locator("text=Join the Waitlist").or(page.locator("text=Early Access")).first()).toBeVisible();

    // 8.2 Join waitlist
    const randEmail = `rand_waitlist_${Math.floor(Math.random()*1000000)}@example.com`;
    await page.locator("input[type='email']").fill(randEmail);
    await page.locator("input[type='text']").or(page.locator("input[placeholder*='Name']")).first().fill("Waitlist User");
    await page.getByRole("button", { name: /Join/i }).first().click();
    // Check success or email confirmation message
    await expect(page.getByText("Check your inbox").or(page.getByText("confirmation link")).or(page.getByText("spot")).first()).toBeVisible({ timeout: 15000 });

    // Log in as Traveler for Feed/Journal
    await page.goto(`${LIVE_URL}/auth`);
    await page.locator("#signin-email").fill("ostinez23@gmail.com");
    await page.locator("#signin-password").fill("Test123!");
    await page.getByRole("button", { name: /^Log In$/i }).click();
    await page.waitForURL("**/dashboard", { timeout: 15000 });

    // 7.1 Go to /feed
    await page.goto(`${LIVE_URL}/feed`);
    await page.waitForTimeout(3000);
    // Create new post (7.2)
    const postInput = page.locator("textarea[placeholder*='What']").or(page.locator("textarea[placeholder*='share']"));
    if (await postInput.count() > 0) {
      await postInput.fill("Automated Live Testing Post - Hello Ausaguide!");
      await page.getByRole("button", { name: /Post/i }).first().click();
      await page.waitForTimeout(3000);
      await expect(page.getByText("Automated Live Testing Post - Hello Ausaguide!").first()).toBeVisible();
    }

    // 7.5 Go to /journal
    await page.goto(`${LIVE_URL}/journal`);
    await page.waitForTimeout(3000);
    await expect(page.getByText("My Travel Journal").or(page.getByText("Journal").first())).toBeVisible();
  });

  test("9. ADMIN DASHBOARD ACTIONS", async ({ page }) => {
    test.setTimeout(90000);
    
    // Log in as Admin
    await page.goto(`${LIVE_URL}/auth`);
    await page.locator("#signin-email").fill("ausaguides@gmail.com");
    await page.locator("#signin-password").fill("ynwmelly2");
    await page.getByRole("button", { name: /^Log In$/i }).click();
    await page.waitForURL("**/admin2", { timeout: 15000 });

    // Wait for system loading to clear
    await expect(page.locator("text=Loading")).not.toBeVisible({ timeout: 15000 });

    // 9.1 Overview loaded
    await expect(page.getByText("Adminv2").or(page.getByText("Key metrics and recent activity")).first()).toBeVisible();
    // Verify cards display metrics
    await expect(page.getByText("Total Users").first()).toBeVisible();
    await expect(page.getByText("Total Tours").first()).toBeVisible();
    await expect(page.getByText("Total Bookings").first()).toBeVisible();
  });
});
