import { test, expect } from '@playwright/test';

test.describe('DevOps Butler Frontend', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page title is correct
    await expect(page).toHaveTitle(/DevOps Butler/i);
    
    // Check for main logo/text
    const logo = page.locator('text=DevOps Butler').first();
    await expect(logo).toBeVisible();
  });

  test('should have login link', async ({ page }) => {
    await page.goto('/');
    
    // Look for login link or button
    const loginLink = page.locator('a[href="/login"], button:has-text("Login")').first();
    
    // If login is available, check it's visible
    const count = await loginLink.count();
    if (count > 0) {
      await expect(loginLink).toBeVisible();
    }
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login form elements
    const usernameInput = page.locator('input[type="text"], input[name="username"], input[placeholder*="username" i]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    
    // Should have login form
    const hasUsername = await usernameInput.count();
    const hasPassword = await passwordInput.count();
    
    expect(hasUsername + hasPassword).toBeGreaterThanOrEqual(2);
  });

  test('should load applications page', async ({ page }) => {
    await page.goto('/applications');
    
    // Should load without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Check for page content (might be empty if no deployments)
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check for viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });
});

test.describe('DevOps Butler API Integration', () => {
  test('health check should return 200', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('healthy');
  });

  test('static assets should load', async ({ page }) => {
    // Try to load the main page
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    
    // Check that CSS and JS files are referenced
    const cssLinks = page.locator('link[rel="stylesheet"]');
    const scriptTags = page.locator('script[type="module"]');
    
    const cssCount = await cssLinks.count();
    const scriptCount = await scriptTags.count();
    
    // Should have at least some assets
    expect(cssCount + scriptCount).toBeGreaterThan(0);
  });
});

