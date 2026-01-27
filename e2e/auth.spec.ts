import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("loads the login page", async ({ page }) => {
    await page.goto("/login");

    // Check page title
    await expect(page.locator("h1")).toContainText("Welcome Back");
  });

  test("displays email input", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("placeholder", "you@example.com");
  });

  test("displays password input", async ({ page }) => {
    await page.goto("/login");

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute(
      "placeholder",
      "Enter your password"
    );
  });

  test("displays sign in button", async ({ page }) => {
    await page.goto("/login");

    const signInButton = page.locator('button[type="submit"]');
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toContainText("Sign In");
  });

  test("displays Google sign in button", async ({ page }) => {
    await page.goto("/login");

    const googleButton = page.locator("text=Continue with Google");
    await expect(googleButton).toBeVisible();
  });

  test("displays link to register page", async ({ page }) => {
    await page.goto("/login");

    const registerLink = page.locator('a[href="/register"]');
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toContainText("Sign up");
  });

  test("can navigate to register page", async ({ page }) => {
    await page.goto("/login");

    const registerLink = page.locator('a[href="/register"]');
    await registerLink.click();

    await expect(page).toHaveURL("/register");
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill in invalid credentials
    await page.locator('input[type="email"]').fill("invalid@example.com");
    await page.locator('input[type="password"]').fill("wrongpassword");

    // Submit the form
    await page.locator('button[type="submit"]').click();

    // Wait for error message
    await expect(page.locator("text=Invalid email or password")).toBeVisible({
      timeout: 10000,
    });
  });

  test("requires email field", async ({ page }) => {
    await page.goto("/login");

    // Try to submit without email
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute("required", "");
  });

  test("requires password field", async ({ page }) => {
    await page.goto("/login");

    // Try to submit without password
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute("required", "");
  });
});

test.describe("Register Page", () => {
  test("loads the register page", async ({ page }) => {
    await page.goto("/register");

    // Check page title
    await expect(page.locator("h1")).toContainText(/register|sign up|create/i);
  });

  test("displays link to login page", async ({ page }) => {
    await page.goto("/register");

    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible();
  });

  test("can navigate to login page", async ({ page }) => {
    await page.goto("/register");

    const loginLink = page.locator('a[href="/login"]');
    await loginLink.click();

    await expect(page).toHaveURL("/login");
  });
});

test.describe("Auth Protection", () => {
  test("dashboard redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test("admin page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/admin");

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Login Page - Mobile", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("is responsive on mobile", async ({ page }) => {
    await page.goto("/login");

    // Page should still load
    await expect(page.locator("h1")).toContainText("Welcome Back");

    // Form inputs should still be visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
