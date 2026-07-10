import { test, expect } from "@playwright/test";

test.describe("Giveback Initiatives E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept waitlist post requests
    await page.route("**/rest/v1/waitlist*", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify([{ id: 1 }]),
      });
    });

    // Intercept tree commitments inserts
    await page.route("**/rest/v1/tree_commitments*", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify([{ id: 1, tree_id: "AUS-TREE-9999" }]),
      });
    });

    // Intercept travel commitments inserts
    await page.route("**/rest/v1/travel_commitments*", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify([{ id: 1, commitment_id: "AUS-TRAVEL-9999" }]),
      });
    });

    // Intercept partnership inquiries inserts
    await page.route("**/rest/v1/partnership_inquiries*", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify([{ id: 1 }]),
      });
    });
  });

  test("Tree Planting page loads, submits commitment and partner forms successfully", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/tree-planting", { timeout: 60000 });

    // Check headings
    await expect(page.getByText("Plant Trees, Grow Hope")).toBeVisible();

    // Fill partner form first
    await page.getByPlaceholder("e.g. Green Kenya NGO").fill("Eco Kenya Org");
    await page.getByPlaceholder("e.g. Jane Doe").fill("Jane Doe Partner");
    await page.getByPlaceholder("e.g. jane@greenkenya.org").fill("partner@greenkenya.org");
    await page.getByPlaceholder(/Describe your conservation initiative/i).fill("We do massive tree planting.");

    // Submit partner form
    await page.getByRole("button", { name: "Submit Partnership Application" }).click({ force: true });

    // Check success state text
    await expect(page.getByText("Thank you for reaching out!").first()).toBeVisible();

    // Fill in virtual tree commitment form
    await page.getByPlaceholder("Enter your name").first().fill("Green Activist");
    await page.getByPlaceholder("Enter your email").first().fill("activist@example.com");
    await page.getByPlaceholder("e.g. Acacia Sunrise").fill("Acasia Hope");
    await page.getByPlaceholder("e.g. In memory of loved ones").fill("Eco preservation");

    // Click Plant My Tree
    await page.getByRole("button", { name: "Plant My Tree" }).click({ force: true });

    // Verification screen redirect
    await expect(page).toHaveURL(/.*tree-planted/);
  });

  test("Mental Health support page loads, submits getaway commitment", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/mental-health", { timeout: 60000 });

    // Check headings
    await expect(page.getByText("Sponsor a Getaway").first()).toBeVisible();

    // Fill commitment details
    await page.getByPlaceholder("Enter your name").first().fill("Generous Donor");
    await page.getByPlaceholder("Enter your email").first().fill("donor@example.com");
    await page.getByPlaceholder("e.g. Dedicated to local guides in Masai Mara").fill("For Watamu beach guides");

    // Submit
    await page.getByRole("button", { name: "Commit to Sponsoring a Getaway" }).click({ force: true });

    // Verification screen redirect
    await expect(page).toHaveURL(/.*travel-commitment-thank-you/);
  });
});
