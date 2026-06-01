import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.context().clearPermissions();
});

test("can open the website", async ({ page }) => {
    // 1. Open the homepage
    await page.goto('');

    // 2. Verify the page title
    await expect(page).toHaveTitle(/Automation Exercise/);

    // 3. Verify the page content
    const title = await page
        .locator('.features_items .title')
        .first()
        .textContent({ timeout: 3000 });

    await expect(title).toContain('Features Items');
});

test("can log into the website", async ({ page }) => {
    // 1. Navigate to the login page
    await page.goto('/login');

    // 2. Fill the email and password
    await page.locator('input[data-qa="login-email"]').fill(process.env.USER_EMAIL || '');
    await page.locator('input[data-qa="login-password"]').fill(process.env.USER_PASSWORD || '');

    // 3. Click the Login button
    await page.locator('button[data-qa="login-button"]').click();

    // 4. Verify the login success
    await expect(page.locator('a[href="/logout"]')).toBeVisible({ timeout: 5000 });
});
