import { test, expect } from "@playwright/test";

test.describe("Events Page", () => {
  test("loads the events page", async ({ page }) => {
    await page.goto("/events");

    // Check page title
    await expect(page.locator("h1")).toContainText("Browse Events");

    // Check that the filter form is present
    await expect(page.locator("form")).toBeVisible();
  });

  test("displays search input", async ({ page }) => {
    await page.goto("/events");

    const searchInput = page.locator('input[name="query"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute("placeholder", "Search events...");
  });

  test("displays category filter", async ({ page }) => {
    await page.goto("/events");

    const categorySelect = page.locator('select[name="category"]');
    await expect(categorySelect).toBeVisible();

    // Check default option
    await expect(categorySelect.locator("option").first()).toContainText(
      "All Categories"
    );
  });

  test("displays state filter", async ({ page }) => {
    await page.goto("/events");

    const stateSelect = page.locator('select[name="state"]');
    await expect(stateSelect).toBeVisible();

    // Check default option
    await expect(stateSelect.locator("option").first()).toContainText(
      "All States"
    );
  });

  test("can search for events", async ({ page }) => {
    await page.goto("/events");

    // Fill in search query
    const searchInput = page.locator('input[name="query"]');
    await searchInput.fill("fair");

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL(/query=fair/);

    // URL should contain search param
    expect(page.url()).toContain("query=fair");
  });

  test("can filter by featured only", async ({ page }) => {
    await page.goto("/events");

    // Check the featured checkbox
    const featuredCheckbox = page.locator('input[name="featured"]');
    await featuredCheckbox.check();

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL(/featured=true/);

    // URL should contain featured param
    expect(page.url()).toContain("featured=true");
  });

  test("shows event count", async ({ page }) => {
    await page.goto("/events");

    // Check that the count display is present
    const countText = page.locator("text=Showing");
    await expect(countText).toBeVisible();
  });

  test("Apply Filters button is visible", async ({ page }) => {
    await page.goto("/events");

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText("Apply Filters");
  });
});

test.describe("Events Page - Navigation", () => {
  test("can navigate to events page from home", async ({ page }) => {
    await page.goto("/");

    // Look for a link to events
    const eventsLink = page.locator('a[href="/events"]').first();
    if (await eventsLink.isVisible()) {
      await eventsLink.click();
      await expect(page).toHaveURL("/events");
    }
  });
});

test.describe("Events Page - Mobile", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("is responsive on mobile", async ({ page }) => {
    await page.goto("/events");

    // Page should still load
    await expect(page.locator("h1")).toContainText("Browse Events");

    // Form should still be visible
    await expect(page.locator("form")).toBeVisible();
  });
});
